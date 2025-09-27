
# BJJ AI Coach

BJJ AI Coach is an innovative, web-based training assistant designed to help Brazilian Jiu-Jitsu practitioners improve their technique through real-time feedback. Using live pose detection from a webcam, the application analyzes your stance and posture during drills, providing actionable KPIs and AI-powered coaching advice.

This project runs entirely in the browser for pose detection, with AI feedback generated via the Google Gemini API.

## Tech Stack

- **Frontend Framework:** React with TypeScript
- **Styling:** Tailwind CSS
- **AI & Machine Learning:**
  - **Pose Detection:** MediaPipe PoseLandmarker (`@mediapipe/tasks-vision`)
  - **AI Coaching:** Google Gemini API (`@google/genai`)
- **Module System:** ES Modules with Import Maps (no build step required)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- A modern web browser that supports WebGL and WebRTC (e.g., Chrome, Firefox, Edge).
- A code editor (e.g., VS Code).
- Git for cloning the repository.
- Python 3 (for the simple local server).

### Installation & Setup

**1. Clone the Repository**

First, clone the project to your local machine using Git.

```bash
git clone https://github.com/your-username/bjj-ai-coach.git
cd bjj-ai-coach
```

**2. Set Up Environment Variables**

The application requires an API key for the Google Gemini API to provide coaching feedback.

- In the root of the project, create a new file named `.env`.
- Open the `exampleenv.md` file to see the required format.
- Copy the content into your new `.env` file and add your actual API key.

Your `.env` file should look like this:

```
API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

Because this project uses ES modules directly in the browser and does not have a build step, you cannot simply open the `index.html` file in your browser due to security restrictions (CORS policy). You need to serve the files from a local web server.

The easiest way to do this is with Python's built-in HTTP server.

**1. Start the Local Server**

Open a terminal in the root directory of the project and run the following command:

```bash
python3 -m http.server
```

If you have an older version of Python, you might need to use:

```bash
python -m SimpleHTTPServer
```

You should see a message in your terminal indicating that the server is running, usually on port 8000.

```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

**2. Open the App in Your Browser**

Now, open your web browser and navigate to the following URL:

[http://localhost:8000](http://localhost:8000)

The BJJ AI Coach application should now be running locally! The first time you navigate to the "Drill" page, your browser will ask for permission to access your webcam. You must allow this for the application to function.
