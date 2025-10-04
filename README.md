# BJJ AI Coach

BJJ AI Coach is a React + TypeScript web application that delivers real-time pose analytics and AI-powered coaching for Brazilian Jiu-Jitsu drills. Pose tracking happens on-device with MediaPipe, while coaching tips stream from Google’s Gemini models.

---

## ✨ Features

- **Live Pose Tracking:** MediaPipe PoseLandmarker runs in the browser to analyze your movement.
- **Advanced KPIs:** Monitor balance, posture, explosiveness, flow, and more in real time.
- **Gemini Coaching:** Streams short, actionable cues tailored to your current drill.
- **Session History:** Stores sessions locally so you can review past training.
- **Custom Settings:** Adjust drill focus, overlay styles, model complexity, and voice cues.

## 🧰 Tech Stack

- **Frontend:** React 19 + TypeScript, bundled with Vite.
- **Styling:** Tailwind CSS (via CDN) and custom CSS.
- **Pose AI:** `@mediapipe/tasks-vision` PoseLandmarker.
- **LLM:** `@google/genai` Gemini SDK.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (or another runtime compatible with the latest Vite).
- npm 9+ (ships with recent Node versions).
- Modern browser with WebGL/WebRTC support (Chrome or Edge recommended).
- Webcam access (the site must run from `http://localhost` or HTTPS for camera permissions).
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

1. Copy the sample file and add your Gemini key:

  ```bash
  cp .env.example .env
  ```

2. Open `.env` and replace the placeholder value:

  ```env
  GEMINI_API_KEY=your-gemini-api-key
  ```

> ℹ️ The build step injects `GEMINI_API_KEY` into `process.env.API_KEY`. If the variable is missing the AI session will fail to start and the console will show a helpful error.

### 3. Run the development server

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:3000`). Allow camera permissions when prompted, pick a drill, and start the session.

### 4. Create a production build (optional)

```bash
npm run build
```

The compiled assets are output to `dist/`.

---

## 🔐 Environment Variables

| Variable         | Required | Description                                   |
|------------------|----------|-----------------------------------------------|
| `GEMINI_API_KEY` | ✔        | API key used by `@google/genai` to stream feedback.

If you deploy the app, make sure the key is injected securely—never commit a real key.

---

## 💡 Troubleshooting

- **“Could not get AI feedback. Check your API key.”** — Ensure `GEMINI_API_KEY` is set, restart the dev server, and refresh the page. The browser console will show the exact error if the key is missing or invalid.
- **No camera feed** — Verify the site is loaded from `http://localhost` (or HTTPS) and that you granted webcam permission.
- **Slow feedback** — Gemini requests depend on network latency; check your connection or lower the voice cue frequency in settings.

For deeper debugging, open the browser console; detailed logs are printed when the pose pipeline or Gemini integration encounters an issue.
