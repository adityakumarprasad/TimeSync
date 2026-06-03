# TaskSync - MERN Task & Time Tracker

A premium, full-stack Task and Time Tracking web application. Users can manage tasks with natural language processing, track active time spent using a page-refresh resilient real-time timer, and view daily productivity summaries.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS v4, Framer Motion, shadcn/ui (Radix Primitives)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **AI Integration:** Google Gemini Developer API (1.5 Flash)

---

## Key Features
1. **Secure Authentication:** JSON Web Token (JWT) header-based auth, keeping user directories completely isolated.
2. **AI Task Optimization:** Natural language task creator optimized by the Gemini API (with a smart local fallback helper if no API key is specified).
3. **Resilient Real-Time Timer:** Store active timer status in the database to prevent losing tracking state during page refreshes or tab closures.
4. **Daily Productivity Metrics:** Includes status tracking cards, worked-hours calculators, and an animated SVG radial progress ring for task completion ratios.

---

## Environment Configuration

Create a file named `.env` inside the `server/` directory and populate it with the following:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/task-ai
JWT_SECRET=super_secret_jwt_key_123456
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: If no `GEMINI_API_KEY` is provided, the application will automatically fall back to a local suggestion engine so you can still test the AI Optimize flow out of the box!*

---

## Local Development Setup

Follow these steps to run the project on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/) running locally.

### 1. Install Dependencies
Run the installation command in the root folder. This script automatically triggers npm installs in the root, client, and server directories:
```bash
npm run install:all
```

### 2. Configure Env
Ensure you have created `server/.env` with your preferred configurations.

### 3. Run the Application
Start the concurrent development runner from the root folder:
```bash
npm run dev
```

This starts both:
- **Express Backend:** [http://localhost:5000](http://localhost:5000)
- **Vite React Frontend:** [http://localhost:5173](http://localhost:5173)

---

## Testing Credentials
Feel free to register a new account on the signup screen, or use the following pre-configured user credential:
- **Username:** `testuser`
- **Email:** `test@example.com`
- **Password:** `password123`
