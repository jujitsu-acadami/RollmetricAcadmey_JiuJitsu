# BJJ AI Coach - Technical Dossier

This document provides a complete, self-contained technical overview of the BJJ AI Coach repository for engineering purposes.

## 1) Executive summary

-   **Purpose:** BJJ AI Coach is a single-page web application that acts as a real-time training assistant for Brazilian Jiu-Jitsu practitioners. It uses a device's webcam to perform on-device pose estimation, calculates a suite of 14 advanced Key Performance Indicators (KPIs) based on the user's movements, and leverages the Google Gemini API to provide qualitative, text-based coaching feedback. The core value is providing immediate, data-driven insights during solo drills.
-   **Architecture:** The system is a client-side-only React application with a no-build-step architecture. It loads dependencies like React, MediaPipe, and Google GenAI via an `importmap` in `index.html`. The architecture consists of three main components:
    1.  **UI Layer (`components/`):** React components for rendering the user interface, including the main drill view, KPI panels, and account/settings pages.
    2.  **MediaPipe Integration (`hooks/useMediaPipe.ts`):** A custom React hook that encapsulates all interaction with the MediaPipe PoseLandmarker library, including camera setup, the real-time prediction loop, and skeleton rendering.
    3.  **Analytics Engine (`services/BjjAnalyticsEngine.ts`):** A stateful class that consumes 3D world landmarks from MediaPipe on each frame and computes the 14 advanced KPIs. It handles smoothing, normalization, and state segmentation.
    4.  **AI Feedback Service (`services/geminiService.ts`):** A module that communicates with the external Google Gemini API to generate qualitative feedback based on pose data and the selected drill.
-   **Tech Stack:**
    -   **Frontend:** React (v19.1.1), TypeScript (as supported in `.tsx` files).
    -   **Styling:** Tailwind CSS (via CDN).
    -   **Pose Estimation:** MediaPipe Tasks-Vision (`@mediapipe/tasks-vision@0.10.22-rc.20250304`).
    -   **AI Coaching:** Google GenAI (`@google/genai@1.21.0`).
    -   **Runtime:** Modern web browser supporting ES Modules, WebGL, and WebRTC.
    -   **Deployment:** Any static web server (e.g., Python's `http.server`).

## 2) Repository structure map

The repository contains a flat structure typical of a single-page application without a complex build system. All source code is at the root level.

```
repo-root/
├── assets/                 - Static assets, primarily React components for icons and logos.
├── components/             - All React UI components.
│   ├── DrillPage.tsx       - Core application screen for running a drill session. (Primary Entry Point)
│   ├── HomePage.tsx        - Application landing page. (Initial Entry Point)
│   ├── AccountPage.tsx     - User settings and session history view.
│   ├── KpiPanel.tsx        - Displays the 14 advanced KPIs.
│   └── Header.tsx          - Global navigation header.
├── hooks/                  - Custom React hooks.
│   └── useMediaPipe.ts     - (Currently missing) Encapsulates MediaPipe logic.
├── services/               - Business logic and external service integrations.
│   ├── BjjAnalyticsEngine.ts - The core engine for calculating KPIs from pose data.
│   └── geminiService.ts    - Handles communication with the Google Gemini API.
├── App.tsx                 - Root React component, handles routing and global state.
├── DrillData.ts            - Static data defining all available BJJ drills.
├── index.html              - The main HTML file, entry point for the browser.
├── index.tsx               - Mounts the React application to the DOM.
├── types.ts                - Centralized TypeScript type definitions for the entire application.
└── README.md               - Project documentation.
```

## 3) Languages, frameworks, and dependencies

-   **Languages:** TypeScript (for type safety in `.ts`/`.tsx` files), JavaScript (ES Modules).
-   **Frameworks:** React (`19.1.1`).
-   **Dependencies:** The project uses a buildless setup, loading dependencies directly in the browser via an `importmap` in `index.html`.
    -   `react@^19.1.1`: Frontend UI library.
    -   `react-dom@^19.1.1`: React's DOM renderer.
    -   `@google/genai@^1.21.0`: SDK for the Google Gemini API.
    -   `@mediapipe/tasks-vision@^0.10.22-rc.20250304`: Google MediaPipe for on-device pose estimation.
    -   `tailwindcss` (via CDN script): Utility-first CSS framework.

## 4) Build, run, and developer workflow

-   **Prerequisites:** A modern browser and a local web server (Python 3 is recommended in the `README.md`).
-   **Configuration:**
    -   **Gemini API Key:** A crucial configuration. The developer must create a file named `.env` at the project root and add their key. The `geminiService.ts` file expects this key to be available as `process.env.API_KEY`. **Note:** In this client-side setup, this environment variable must be injected or replaced by the serving environment; it will not work out-of-the-box with a simple static server.
    -   **Application Settings:** User-configurable settings (model complexity, skeleton visibility, etc.) are managed in `App.tsx` and stored in `localStorage` under the key `bjjAiCoachSettings`.
-   **Build:** There is **no build step**. Files are served as-is.
-   **Run (Dev):** As per `README.md`, start a local static server from the project root.
    ```bash
    python3 -m http.server
    ```
    Then, navigate to `http://localhost:8000` in a browser.
-   **Hot Reload:** No hot reload is configured. Manual browser refresh is required after changes.

## 5) Configuration and environment management

-   **Application Config:** Managed via the `AppSettings` interface in `types.ts` and the `SettingsContext`. The root `App.tsx` component handles loading from and saving to `localStorage`.
-   **Environment Variables:**
    -   `API_KEY`:
        -   **Purpose:** The API key for authenticating with the Google Gemini API.
        -   **Default:** None. The application will fail to get AI feedback without it.
        -   **Used By:** `services/geminiService.ts`.
        -   **Note:** This is the only environment variable.

## 6) Application architecture and module boundaries

The application follows a standard component-based architecture.

-   **`App.tsx` (Orchestrator):** The root component. It manages page navigation (routing), global state like session history, and provides the `SettingsContext` to all children.
-   **Page Components (`HomePage`, `DrillPage`, `AccountPage`):** Top-level components representing the main views of the application. `DrillPage` is the most complex, orchestrating the camera feed, ML model, analytics engine, and UI updates.
-   **Service Modules (`services/`):**
    -   `BjjAnalyticsEngine.ts`: A self-contained, stateful class. It receives raw landmark data and a timestamp, and outputs computed KPIs. It has no dependencies on React or the UI.
    -   `geminiService.ts`: A stateless module containing the `getPoseFeedback` function. It depends on `@google/genai` and is responsible for constructing prompts and handling API communication.
-   **Hook Modules (`hooks/`):**
    -   `useMediaPipe.ts` (Missing): This is a critical architectural component intended to encapsulate the lifecycle and state management of MediaPipe, isolating the `DrillPage` from the complexities of the ML library.
-   **Cross-Cutting Concerns:**
    -   **State Management:** Primarily managed with React's `useState`, `useRef`, and `useContext`. There is no external state management library.
    -   **Error Handling:** Handled locally within components. The `DrillPage` has state for loading and error conditions, which are displayed via the `LoadingOverlay` component.

## 7) Data architecture

The application's data storage is entirely client-side, using the browser's `localStorage`.

-   **Datastore:** `localStorage`.
-   **Schemas:**
    -   `bjjAiCoachSettings`: Stores an `AppSettings` object.
        ```typescript
        // From types.ts
        export interface AppSettings {
          modelComplexity: 'lite' | 'full' | 'heavy';
          showSkeleton: boolean;
          skeletonColor: string;
          skeletonThickness: 2 | 5 | 8;
          drillLayout: 'immersive' | 'dashboard';
          focusArea: Drill[];
        }
        ```
    -   `bjjAiCoachSessionHistory`: Stores an array of `Session` objects.
        ```typescript
        // From types.ts
        export interface Session {
          startTime: Date;
          duration: number; // in seconds
          drill: Drill | 'all';
          kpiAverages: AdvancedKpiType;
          feedbackLog: string[];
        }
        ```
-   **Data Privacy:** All pose data is processed on-device and is ephemeral. Only computed, aggregated KPI data and AI feedback logs are persisted in `localStorage`. Pose landmarks are sent to the Google Gemini API for feedback generation.

## 8) API surface and contracts

-   **Internal APIs:** None. This is a single frontend application.
-   **External APIs:**
    -   **Google Gemini API:**
        -   **Endpoint:** Accessed via the `@google/genai` SDK.
        -   **Handler:** `services/geminiService.ts -> getPoseFeedback()`.
        -   **Request Shape:** The request includes a system instruction (prompt), the current pose landmarks as a JSON string, and a temperature setting.
        -   **Auth:** Requires the `API_KEY`.
        -   **Rate Limits:** The `DrillPage` implements a simple time-based throttle, waiting at least 3 seconds between requests to avoid exceeding Gemini's rate limits.

## 9) Frontend/UI

-   **Framework:** React (CSR - Client-Side Rendering).
-   **State Management:** A combination of local component state (`useState`, `useRef`) and shared settings state via React Context (`SettingsContext`).
-   **Component Structure:** The UI is broken down into logical components (e.g., `Header`, `KpiPanel`, `LiveView`). The `DrillPage` is the most complex component, composing many smaller pieces to build the interactive training view.
-   **Styling:** Tailwind CSS, loaded via a CDN script in `index.html`.
-   **Performance:** The core real-time loop in `DrillPage` is driven by `requestAnimationFrame` for optimal rendering performance. An FPS counter is included for on-device performance monitoring.

## 10) Background processing and asynchronous flows

-   All processing happens in the main browser thread. The `requestAnimationFrame` loop in `DrillPage` (`predict` function) constitutes the primary asynchronous flow for real-time analysis.
-   API calls to the Gemini service are asynchronous `fetch` requests handled with `async/await`.

## 11) Security model

-   **Authentication/Authorization:** None. The application is designed for single-user, local use and has no user accounts or login system.
-   **Secrets Management:** The `API_KEY` for the Gemini API is a critical secret. The current implementation, which relies on `process.env.API_KEY` in a client-side context, is insecure. A static server cannot securely inject this. This key would be exposed to anyone inspecting the browser's network traffic or source code. **A backend proxy or a server-side rendering setup would be required to properly secure this key.**
-   **Input Validation:** The application performs basic checks (e.g., landmark array length) but does not have extensive input validation.

## 12) Observability and reliability

-   **Logging:** Limited to `console.error` and `console.log` for debugging purposes. No structured logging is in place.
-   **Metrics:** An FPS counter is implemented in `DrillPage.tsx` for basic performance monitoring.
-   **Health Checks:** None.
-   **Error Handling:** The `DrillPage` catches errors during MediaPipe initialization and prediction, displaying a user-friendly message via the `LoadingOverlay`. Gemini API call errors are caught and logged to the console, returning a fallback message to the UI.

## 13) Performance characteristics

-   **Hot Path:** The `predict` function in `DrillPage.tsx`, which runs on every animation frame. This function calls `poseLandmarker.detectForVideo`, runs the `BjjAnalyticsEngine.update` method, draws the skeleton, and updates React state.
-   **Bottlenecks:** The primary performance bottleneck will be the `poseLandmarker.detectForVideo` call, which is computationally expensive. The complexity of the chosen model (`lite`, `full`, `heavy`) will directly impact this.
-   **Concurrency:** All work is done on the main thread.

## 14) Infrastructure and deployment

-   **Infrastructure:** The application is designed to be hosted on any static web hosting service.
-   **Deployment:** The deployment process consists of copying the project files to a static host. There is no build or compilation step.

## 15) Testing strategy and coverage

-   **Testing:** There are **no test files** in the repository. The application lacks unit, integration, and end-to-end tests. This is a significant gap.

## 16) Domain model and invariants

-   **Core Entities:**
    -   `Drill`: A specific BJJ technique or position being practiced.
    -   `Session`: A record of a single training session, including its duration, KPIs, and feedback.
    -   `AppSettings`: The user's personalized configuration for the app.
    -   `AdvancedKpiType`: A flat object containing the 14 computed performance metrics.

## 17) Third-party integrations

-   **MediaPipe:** Used for real-time pose estimation. Tightly integrated via the (missing) `useMediaPipe` hook.
-   **Google Gemini:** Used for generating qualitative coaching feedback. Integrated via `services/geminiService.ts`.
-   **Tailwind CSS:** Used for styling. Integrated via a CDN link.

## 18) Licensing, docs, and governance

-   **License:** Not specified.
-   **Documentation:** A `README.md` file provides setup and run instructions. Code comments are present but there are no formal design documents.

## 19) Known issues and technical debt

-   **Security Vulnerability:** The handling of the Gemini `API_KEY` is insecure for a public-facing deployment.
-   **Missing Tests:** The complete lack of an automated test suite is a major source of technical debt and risk.
-   **Missing `useMediaPipe` Hook:** A critical piece of the intended architecture is missing, leading to an error on load.
-   **Hardcoded Thresholds:** The `BjjAnalyticsEngine` contains many hardcoded thresholds for its calculations. These may not be optimal for all users or conditions and should be configurable or adaptive.

## 20) Runbook: how to operate and debug

-   **Start/Stop:** Run `python3 -m http.server` in the project root to start. Stop with `Ctrl+C`.
-   **Health Checks:** Manually load `http://localhost:8000` and check the browser's developer console for errors.
-   **Debugging:** Use the browser's developer tools for debugging, setting breakpoints in the `.tsx` files, and inspecting console logs. The FPS counter provides a basic performance indicator.

## 21) Appendices

### Key Configuration Snippet (`AppSettings`)

```typescript
// file: types.ts
export interface AppSettings {
  modelComplexity: 'lite' | 'full' | 'heavy';
  showSkeleton: boolean;
  skeletonColor: string;
  skeletonThickness: 2 | 5 | 8;
  drillLayout: 'immersive' | 'dashboard';
  focusArea: Drill[];
}
```

### Representative Schema Snippet (`Session`)

```typescript
// file: types.ts
export interface Session {
  startTime: Date;
  duration: number; // in seconds
  drill: Drill | 'all';
  kpiAverages: AdvancedKpiType;
  feedbackLog: string[];
}
```

## 22) JSON index

```json
{
  "project": {
    "name": "BJJ AI Coach",
    "monorepo": false,
    "languages": [
      {
        "name": "TypeScript",
        "version": "N/A"
      }
    ],
    "frameworks": [
      "React"
    ],
    "packages": [
      {
        "name": "bjj-ai-coach",
        "path": "/",
        "type": "frontend",
        "entryPoints": [
          "index.html",
          "index.tsx"
        ],
        "dependsOn": [],
        "envVars": [
          "API_KEY"
        ],
        "ports": [
          8000
        ],
        "externalIntegrations": [
          "Google MediaPipe",
          "Google Gemini"
        ]
      }
    ],
    "datastores": [
      {
        "type": "localStorage",
        "purpose": "User settings and session history",
        "connectionEnv": [],
        "schemasOrCollections": [
          "bjjAiCoachSettings",
          "bjjAiCoachSessionHistory"
        ],
        "primaryKeys": [],
        "indexes": []
      }
    ],
    "apis": {
      "rest": [],
      "graphql": [],
      "grpc": []
    },
    "ciCd": {
      "systems": [],
      "pipelines": []
    },
    "infrastructure": {
      "docker": false,
      "kubernetes": false,
      "terraform": false
    },
    "tests": {
      "frameworks": [],
      "coverage": {
        "overall": 0.0
      }
    },
    "observability": {
      "logging": "console",
      "metrics": "Manual FPS counter",
      "tracing": "None"
    },
    "security": {
      "authn": "None",
      "authz": "None",
      "secrets": "API_KEY (insecurely handled)"
    },
    "license": "Not specified",
    "knownIssues": [
      "Insecure API key handling",
      "Missing test suite",
      "Core `useMediaPipe` hook is missing"
    ]
  }
}
```
---
- [x] Repo tree with purposes and entry points.
- [x] Full config/env inventory (values redacted).
- [x] Data models with schema/index details and migrations.
- [x] API surface with handlers and auth behaviors.
- [x] Build/run/test/CI/CD with exact commands.
- [x] Infra/deploy topology and environment differences.
- [x] Logging/metrics/tracing and reliability features.
- [x] Security model and mitigations.
- [x] Performance notes and caching/concurrency.
- [x] Known issues and runbook.
