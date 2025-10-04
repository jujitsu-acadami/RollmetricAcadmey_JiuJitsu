# Local Deployment Notes

## Overview

This document captures the exact changes required to make the BJJ AI Coach webapp run on `localhost` using the Vite toolchain. Prior to these updates the project relied on in-browser transpilation with Babel Standalone and CDN import maps, which prevented `npm run dev` / `npm run build` from working.

## What was broken

| Problem | Impact |
| --- | --- |
| `index.html` loaded the app via `<script type="text/babel">` and an import map. | Vite could not bundle the entry point, causing builds to fail with `"/index.html" can't be bundled without type="module" attribute` and preventing the dev server from starting. |
| Stylesheet referenced with a raw `<link rel="stylesheet" href="/src/app/main.css">`. | The CSS was never emitted in production builds and Vite warned about unresolved assets. |
| `useSpeechSynthesis` hook lived outside `src/`, imported via `../../hooks/useSpeechSynthesis`. | Vite could not resolve the module during production builds (`Could not resolve "../../hooks/useSpeechSynthesis"`). |
| No documented way to supply the Gemini API key. | Sessions couldn’t start—`GoogleGenAI` was constructed with an undefined key, but errors were swallowed, making the app look stuck. |

## Fixes applied

1. **Adopt a proper ES module entry point**
   - Removed the Babel Standalone + import-map setup from `index.html`.
   - Switched the root script tag to `<script type="module" src="/src/app/index.tsx"></script>` so Vite owns the bundling pipeline.

2. **Bundle CSS through Vite**
   - Imported `./main.css` directly inside `src/app/index.tsx` instead of linking it from HTML. This lets Vite handle hashing and injection.

3. **Relocate shared hooks into `src`**
   - Moved `useSpeechSynthesis` to `src/hooks/useSpeechSynthesis.ts` to align with Vite’s module resolution and eliminated the duplicate root-level file.

4. **Harden Gemini configuration**
   - Added a runtime guard in `src/lib/geminiService.ts` (and the legacy `services/geminiService.ts`) that throws a friendly error if `process.env.API_KEY` / `GEMINI_API_KEY` is missing.
   - Updated `vite.config.ts` so `GEMINI_API_KEY` is exposed to the client bundle as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.
   - Added `.env.example` to document the required variable and keep secrets out of source control.

5. **Refresh onboarding docs**
   - Rewrote `README.md` with accurate Vite-based setup steps: `npm install`, create a `.env`, run `npm run dev`, etc.

## Running locally now

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure the Gemini API key:
   ```bash
   cp .env.example .env
   # edit .env and set GEMINI_API_KEY=your-real-key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the printed URL (default `http://localhost:3000`), grant camera access, choose a drill, and start the session.

## Verification

- `npm run build` now succeeds, producing assets under `dist/`.
- With a valid `GEMINI_API_KEY`, starting a drill session initializes the Gemini chat and streams feedback instead of hanging.

## Remaining considerations

- Bundle size is still large (~400 kB gzipped for the main chunk); investigate code-splitting in the future.
- The repository contains legacy duplicates (`App.tsx`, `components/`, etc.) outside `src/`; consolidating those would reduce confusion but wasn’t required for local deployment.
