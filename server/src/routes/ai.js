import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/optimize', async (req, res) => {
  const { taskInput } = req.body;

  if (!taskInput || !taskInput.trim()) {
    return res.status(400).json({ message: 'Task input is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback heuristic generator if no API key is provided
  const getLocalFallback = (input) => {
    const trimmedInput = input.trim();
    let title = trimmedInput;
    let description = `Created from natural language input: "${trimmedInput}"`;

    const lowerInput = trimmedInput.toLowerCase();

    if (lowerInput.startsWith('follow up with')) {
      const target = trimmedInput.slice(14).trim();
      title = `Follow up with ${target.charAt(0).toUpperCase() + target.slice(1)}`;
      description = `Send a message to ${target} to check status and confirm delivery details.`;
    } else if (lowerInput.startsWith('call')) {
      const target = trimmedInput.slice(4).trim();
      title = `Call ${target.charAt(0).toUpperCase() + target.slice(1)}`;
      description = `Initiate a phone call with ${target} to discuss project progress.`;
    } else if (lowerInput.startsWith('email')) {
      const target = trimmedInput.slice(5).trim();
      title = `Email ${target.charAt(0).toUpperCase() + target.slice(1)}`;
      description = `Draft and send an email to ${target} regarding the latest updates.`;
    } else if (lowerInput.startsWith('fix')) {
      const target = trimmedInput.slice(3).trim();
      title = `Fix ${target.charAt(0).toUpperCase() + target.slice(1)}`;
      description = `Troubleshoot, write tests, and resolve the issue with: ${target}.`;
    } else if (lowerInput.startsWith('buy') || lowerInput.startsWith('purchase')) {
      const item = trimmedInput.replace(/^(buy|purchase)\s+/, '');
      title = `Purchase ${item.charAt(0).toUpperCase() + item.slice(1)}`;
      description = `Place an order for ${item} and log the receipt.`;
    } else if (lowerInput.startsWith('design')) {
      const item = trimmedInput.slice(6).trim();
      title = `Design ${item.charAt(0).toUpperCase() + item.slice(1)}`;
      description = `Create low-fidelity wireframes and user-experience prototypes for ${item}.`;
    } else {
      // General capitalization
      title = trimmedInput.charAt(0).toUpperCase() + trimmedInput.slice(1);
    }

    return { title, description };
  };

  if (!apiKey) {
    const suggestion = getLocalFallback(taskInput);
    return res.json({
      suggestion,
      isMock: true,
      message: 'Suggestions generated locally. Add GEMINI_API_KEY in server/.env for AI optimization.'
    });
  }

  try {
    const prompt = `Optimize the following natural language task input into a clearer professional task title and a structured description.
Return the output strictly in valid JSON format. Do not put it in a markdown code block, just output the raw JSON. The JSON must have exactly two keys: "title" and "description".

User input: "${taskInput}"`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API returned error status:', response.status, errBody);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('Invalid response structure from Gemini API');
    }

    // Clean up Markdown backticks if present
    let cleanedText = textResponse.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedText);
    if (!parsedJson.title || !parsedJson.description) {
      throw new Error('JSON response does not contain title or description');
    }

    res.json({
      suggestion: parsedJson,
      isMock: false
    });

  } catch (error) {
    console.error('Error optimizing task with Gemini:', error.message);
    const suggestion = getLocalFallback(taskInput);
    res.json({
      suggestion,
      isMock: true,
      message: 'Failed to connect to Gemini API. Fell back to local suggestion.'
    });
  }
});

export default router;
