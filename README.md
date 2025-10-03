# BJJ AI Coach

BJJ AI Coach is an innovative, web-based training assistant designed to help Brazilian Jiu-Jitsu practitioners improve their technique through real-time feedback. Using live pose detection from your webcam, the application analyzes your stance and posture during drills, providing actionable KPIs and AI-powered coaching advice from Google's Gemini model.

This project is designed to run entirely in the browser without requiring a complex, server-based build process.

---

## Features

-   **Real-time Pose Detection:** Uses MediaPipe to analyze your movements directly on your device.
-   **14+ Advanced BJJ KPIs:** Get detailed metrics on your balance, posture, explosiveness, flow, and more.
-   **AI-Powered Coaching:** Receives contextual, actionable feedback from the Gemini API based on your performance.
-   **Session History & Tracking:** Saves your sessions to your browser's local storage for progress review.
-   **Configurable Settings:** Adjust model complexity, visual settings, and your personal focus areas.
-   **Privacy-Focused:** Pose data is processed on-device. Only key metrics are sent for AI analysis.

## How It Works

The application follows a modern, on-device-first architecture to ensure privacy and performance:

1.  **Capture:** Your webcam video is processed locally in your browser.
2.  **Analyze (On-Device):** Google's MediaPipe PoseLandmarker runs on your machine to detect your body landmarks in real-time.
3.  **Calculate (On-Device):** The `BjjAnalyticsEngine` takes these landmarks and calculates a suite of 14+ advanced BJJ-specific KPIs.
4.  **Coach (Cloud):** A small packet of anonymized KPI data is sent to the Google Gemini API, which generates expert coaching feedback.
5.  **Display:** The feedback and KPIs are displayed back to you in the UI.

## Tech Stack

This project uses a "no-build-step" approach, meaning it can be run directly in the browser by serving the static files. This is made possible by the following technologies:

-   **React (via CDN):** The core UI library for building the application's component-based interface. Instead of a local installation, it's loaded directly from a high-performance CDN.

-   **TypeScript & JSX (via Babel Standalone):** The application is written in TypeScript and JSX for type safety and a modern developer experience. Since browsers cannot run this code natively, the **Babel Standalone** script is included in `index.html`. It transpiles the `.tsx` code into standard JavaScript in real-time, right in the browser, eliminating the need for a server-side build tool like Vite or Webpack.

-   **Tailwind CSS (via CDN):** A utility-first CSS framework for rapid UI development. The CDN version provides all of Tailwind's classes without needing a local installation or PostCSS compilation step.

-   **MediaPipe (`@mediapipe/tasks-vision`):** Google's library for on-device machine learning. It's used here for real-time, high-performance pose estimation directly in the browser, ensuring user video data remains private.

-   **Google Gemini (`@google/genai`):** The SDK for Google's Gemini family of models. It's used to send the calculated KPI data to the cloud to receive intelligent, context-aware coaching feedback.

-   **ES Modules with Import Maps:** The `index.html` file contains an `importmap`, which tells the browser where to find the CDN-hosted versions of libraries like React and MediaPipe. This allows us to use standard `import` statements in our code as if we were in a Node.js environment.

---

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   A modern web browser that supports WebGL and WebRTC (e.g., Chrome, Firefox, Edge).
-   A code editor (e.g., VS Code).
-   Git for cloning the repository.
-   Python 3 (or any other simple local web server).

### 1. Clone the Repository

First, clone the project to your local machine using Git.

```bash
git clone <repository-url>
cd bjj-ai-coach
```

### 2. Set Up Your Gemini API Key

The application is coded to use an environment variable (`process.env.API_KEY`) for the Gemini API key. Since this project has no build step to inject environment variables, you must add it manually for local development.

1.  **Get a Key:** Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

2.  **Add the Key to `index.html`:** Open the `index.html` file in your code editor. Find the `<head>` section and add the following `<script>` tag, replacing `"YOUR_GEMINI_API_KEY_HERE"` with the key you just generated. Place it before any other script tags.

    ```html
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>BJJ AI Coach</title>

      <!-- ADD THIS SCRIPT FOR LOCAL DEVELOPMENT -->
      <script>
        // In a real hosting environment, this would be a secure environment variable.
        if (!window.process) window.process = {};
        if (!window.process.env) window.process.env = {};
        window.process.env.API_KEY = "YOUR_GEMINI_API_KEY_HERE";
      </script>
      <!-- END OF SCRIPT TO ADD -->

      <script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500" rel="stylesheet"/>
    ```

    > **⚠️ Security Warning:** This method is for **local development only**. Do not commit the `index.html` file with your API key to a public Git repository.

### 3. Running the Application

Because this project uses modern JavaScript modules, you must serve the files from a local web server. You cannot simply open the `index.html` file directly from your file system.

**1. Start the Local Server**

Open a terminal in the root directory of the project and run the following command. This uses Python's simple built-in web server.

```bash
python3 -m http.server
```

You should see a message in your terminal indicating that the server is running, usually on port 8000.

```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

**2. Open the App in Your Browser**

Now, open your web browser and navigate to the following URL:

[http://localhost:8000](http://localhost:8000)

The BJJ AI Coach application should now load. When you start a drill, your browser will ask for permission to access your webcam. You must **allow** this for the application to function.
