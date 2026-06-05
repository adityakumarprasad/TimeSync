import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/optimize', async (req, res) => {
  try {
    const { taskInput } = req.body;

    if (!taskInput?.trim()) {
      return res.status(400).json({
        message: 'Task input is required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: 'GEMINI_API_KEY not found'
      });
    }

    const prompt = `
Optimize the following task into a professional task title and description.

Rules:
- Return ONLY valid JSON.
- Description must be between 15 and 20 words.
- JSON must contain exactly two keys:
{
  "title": "",
  "description": ""
}

Task: "${taskInput}"
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('Gemini Error:', response.status, errorText);

      return res.status(response.status).json({
        message: 'Failed to get response from Gemini'
      });
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini returned empty content');
    }

    const suggestion = JSON.parse(text);

    return res.json({
      suggestion,
      isMock: false
    });

  } catch (error) {
    console.error('Optimize Error:', error);

    return res.status(500).json({
      message: error.message || 'Internal server error'
    });
  }
});

export default router;