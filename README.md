# BJJ AI Coach 🥋

A real-time AI-powered Brazilian Jiu-Jitsu training assistant that combines computer vision pose tracking with advanced AI coaching. Train smarter with instant feedback, comprehensive analytics, and personalized voice guidance.

---

## ✨ Features

### Core Training System
- **🎥 Live Pose Tracking:** Browser-based MediaPipe PoseLandmarker analyzes your movement in real-time
- **📊 Advanced Analytics:** 14+ KPIs including balance, posture, explosiveness, flow rhythm, and intensity
- **🤖 AI Coaching:** Google Gemini 1.5 Flash streams context-aware feedback tailored to your drill
- **🔊 Voice Guidance:** Browser-native Text-to-Speech with customizable styles and timing
- **📈 Session Reports:** Detailed post-training analysis with peak metrics and AI insights
- **🔐 Google Authentication:** Secure sign-in with profile management

### Drill System
- **Multiple Focus Areas:** Closed Guard, Mount Escapes, Side Control, Back Control, Takedowns, Submissions
- **Intelligent Feedback:** Position-aware coaching that adapts to your movement
- **Session History:** Review past training sessions with full metrics and AI feedback
- **Customizable Settings:** Two layout modes (Immersive/Dashboard), skeleton overlays, and model complexity

### Voice Cue System (Fully Functional)
- **Smart Mode:** Context-aware feedback triggered intelligently during training
- **Timed Intervals:** Automatic cues every 30 seconds
- **Position-Based:** Feedback when changing positions (mount → side control)
- **Voice Styles:** Choose between Neutral Instructor or Encouraging Coach
- **Cue Types:** Positional prompts, motivational coaching, or technical guidance

## 🧰 Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6.0
- **Styling:** Tailwind CSS (CDN) + Custom CSS
- **Pose Detection:** `@mediapipe/tasks-vision` PoseLandmarker
- **AI/LLM:** `@google/generative-ai` Gemini SDK
- **Authentication:** `@react-oauth/google` OAuth 2.0
- **State Management:** React Context API
- **Storage:** localStorage for session persistence

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node)
- **Modern Browser** with WebGL/WebRTC support (Chrome/Edge recommended)
- **Webcam** access (localhost or HTTPS required)
- **API Keys:**
  - [Gemini API Key](https://aistudio.google.com/app/apikey) from Google AI Studio
  - [Google OAuth Client ID](https://console.cloud.google.com/apis/credentials) (see `docs/google-auth-setup.md`)

### 1. Clone & Install

```bash
git clone https://github.com/maheshsharma-18/bjj_jiu_jitsu_black_yellow-theme.git
cd bjj_jiu_jitsu_black_yellow-theme
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your-gemini-api-key-here
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

> ⚠️ **Security:** Never commit `.env` to version control. It's already in `.gitignore`.

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` (or the printed URL). Grant camera permissions, sign in with Google, and start training!

### 4. Production Build

```bash
npm run build
npm run preview  # Test the production build locally
```

Build output: `dist/`

---

## 🔐 Environment Variables

| Variable                  | Required | Description                                          |
|---------------------------|----------|------------------------------------------------------|
| `GEMINI_API_KEY`          | ✔️       | Google AI Studio API key for Gemini coaching         |
| `VITE_GOOGLE_CLIENT_ID`   | ✔️       | OAuth 2.0 client ID for Google Sign-In               |

**Setup Instructions:** See `docs/google-auth-setup.md` for OAuth configuration.

---

## 📁 Project Structure

```
src/
├── app/                    # App entry point & root styles
├── assets/                 # Logo components & images
├── components/             # Reusable UI components
│   ├── forms/             # RadioGroup, SwitchToggle
│   ├── layout/            # Header, LoadingOverlay, PageTitle
│   └── ui/                # FeedbackPanel, InfoModal, KpiPanel
├── config/                # Drill definitions & constants
├── contexts/              # AuthContext, SettingsContext
├── features/              # Feature-based modules
│   ├── account/           # Profile, settings, session history
│   ├── auth/              # Login page
│   ├── drill/             # Main drill training interface
│   └── home/              # Home page
├── hooks/                 # Custom React hooks (useSpeechSynthesis)
├── lib/                   # Core services
│   ├── BjjAnalyticsEngine.ts  # Pose analytics & KPI calculation
│   └── geminiService.ts       # Gemini AI integration
└── types/                 # TypeScript type definitions
```

---

## 🎯 Key Features Explained

### Analytics Engine (`BjjAnalyticsEngine.ts`)
- **Real-time KPIs:** Balance, posture, intensity, flow, explosiveness
- **Movement Tracking:** Velocity & acceleration-based analysis
- **Position Detection:** Identifies Guard, Top Control, Neutral positions
- **Scramble Detection:** High-acceleration movements
- **Session Reports:** Comprehensive metrics with duration, effort, and technique quality

### Voice Cue System
All settings are **fully functional**:
- ✅ **Enabled Toggle:** Master on/off control
- ✅ **Cue Type:** Changes AI feedback style (positional/motivational/technical)
- ✅ **Frequency:** Smart/30s/Position Change/End Only
- ✅ **Voice Style:** Affects TTS pitch, rate, and voice selection

### Settings That Work
- ✅ Drill Focus Area (filters available drills)
- ✅ Drill Layout (Immersive vs Dashboard)
- ✅ Show Skeleton & Visual Settings
- ✅ Model Complexity (affects pose detection)
- ✅ Voice Cues (all 4 settings functional)

### Settings Planned for Future
- ⏳ Skill Level (UI only, not yet passed to AI)
- ⏳ Training Goals (stored but not used in feedback)
- ⏳ Self Defense Toggle (placeholder)

---

## � Troubleshooting

### API & Authentication Issues
- **"Could not get AI feedback"** → Check `GEMINI_API_KEY` in `.env`, restart dev server
- **Google Sign-In fails** → Verify `VITE_GOOGLE_CLIENT_ID` and OAuth settings (see `docs/google-auth-setup.md`)
- **"API key not found"** → Environment variables must start with `VITE_` to be exposed to browser

### Camera & Pose Detection
- **No camera feed** → Ensure site runs on `localhost` or HTTPS, grant webcam permission
- **Slow pose detection** → Lower Model Complexity in settings (Lite model)
- **Skeleton not showing** → Enable "Show Skeleton" in Drill Settings

### Performance Issues
- **Slow Gemini responses** → Check network connection, reduce voice cue frequency
- **High CPU usage** → Use Lite model complexity, close other tabs
- **Voice not working** → Check browser TTS support (Chrome/Edge recommended)

**Debug Mode:** Open browser DevTools Console for detailed logs.

---

## 🔧 Recent Fixes

### Peak Intensity Issue (Fixed)
**Problem:** Peak intensity exceeded 100% in session reports  
**Solution:** Added proper clamping to ensure all KPIs stay within 0-100 range
```typescript
const intensity = Math.min(100, Math.max(0, kinematics.velocity.magnitude * 25));
```

### Cleanup (Completed)
- ✅ Removed duplicate components and services
- ✅ Consolidated codebase to `src/` directory
- ✅ Cleaned up unused types and interfaces

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

---

## 📚 Documentation

- **[Deployment Guide](docs/deployment.md)** - Local setup and build process
- **[Google Auth Setup](docs/google-auth-setup.md)** - OAuth configuration steps

---

**Built with ❤️ for the BJJ community**
