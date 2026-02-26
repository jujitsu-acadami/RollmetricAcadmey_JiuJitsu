# Deployment Guide

## Overview

This guide covers the complete deployment process for the BJJ AI Coach web application, including local development setup, environment configuration, and production deployment strategies.

---

## 🛠️ Local Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (bundled with Node.js)
- **Modern Browser:** Chrome/Edge (best WebGL/WebRTC support)
- **Webcam:** Required for pose detection
- **API Credentials:**
  - Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
  - Google OAuth Client ID (see `google-auth-setup.md`)

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ```

   > ⚠️ **Security Note:** The `.env` file is in `.gitignore` to prevent committing secrets. Never push API keys to version control.

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Vite will start the dev server (typically `http://localhost:5173`)

4. **Grant Permissions**
   - Allow webcam access when prompted
   - Sign in with Google (requires OAuth setup)

---

## ��️ Build Process

### Development Build

The Vite dev server provides:
- Hot Module Replacement (HMR)
- Fast TypeScript compilation
- Source maps for debugging
- Environment variable injection

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

**Output:** `dist/` directory with optimized assets
- Minified JavaScript bundles
- Optimized CSS
- Asset hashing for cache busting
- Tree-shaken dependencies

### Preview Production Build

Test the production build locally:
```bash
npm run preview
```

---

## 🔑 Environment Variables

### Required Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `GEMINI_API_KEY` | Server/Build | Gemini AI API key (exposed as `process.env.API_KEY`) |
| `VITE_GOOGLE_CLIENT_ID` | Client | Google OAuth 2.0 Client ID |

### Vite Environment Variable Rules

- **Client-side access:** Variables must be prefixed with `VITE_`
- **Build-time injection:** Defined in `vite.config.ts`:
  ```typescript
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  }
  ```

### Runtime Validation

The app validates API keys at runtime:
```typescript
// src/lib/geminiService.ts
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured...');
}
```

---

## 📦 Architecture & Build System

### Entry Point Migration

**Old System (Broken):**
- Used Babel Standalone with `<script type="text/babel">`
- Import maps for module resolution
- No proper bundling → Vite couldn't build

**Current System (Working):**
- ES module entry: `<script type="module" src="/src/app/index.tsx">`
- Vite handles all transpilation and bundling
- CSS imported in TypeScript: `import './main.css'`

### Module Resolution

All source code lives in `src/`:
```
src/
├── app/           # Entry point (index.tsx)
├── lib/           # Core services (BjjAnalyticsEngine, geminiService)
├── features/      # Feature modules (drill, account, auth)
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks (useSpeechSynthesis)
├── contexts/      # React Context providers
└── types/         # TypeScript definitions
```

### Key Configuration Files

#### `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
})
```

#### `tsconfig.json`
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- React JSX support

---

## 🚀 Production Deployment

### Platform Options

#### 1. **Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# GEMINI_API_KEY
# VITE_GOOGLE_CLIENT_ID
```

**Configuration:** `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "VITE_GOOGLE_CLIENT_ID": "@google-client-id"
  }
}
```

#### 2. **Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Configure build settings
# Build command: npm run build
# Publish directory: dist
```

Add environment variables in Netlify dashboard.

#### 3. **GitHub Pages**

Not recommended for this project due to:
- Requires client-side routing workaround
- No server-side environment variable injection
- API keys would be exposed in build

#### 4. **Self-Hosted (Docker)**

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG GEMINI_API_KEY
ARG VITE_GOOGLE_CLIENT_ID
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build \
  --build-arg GEMINI_API_KEY=your-key \
  --build-arg VITE_GOOGLE_CLIENT_ID=your-client-id \
  -t bjj-ai-coach .

docker run -p 80:80 bjj-ai-coach
```

---

## 🔒 Security Considerations

### API Key Protection

1. **Never commit `.env` files**
   - Verify `.gitignore` includes `.env`
   - Use `.env.example` as template

2. **Rotate exposed keys immediately**
   - If keys are committed, revoke them in:
     - [Google AI Studio](https://aistudio.google.com/app/apikey)
     - [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

3. **Use environment variables**
   - Production: Set in hosting platform dashboard
   - Development: Use `.env` file (gitignored)

### OAuth Configuration

- **Authorized JavaScript origins:**
  - `http://localhost:5173` (dev)
  - `https://yourdomain.com` (prod)
  
- **Authorized redirect URIs:**
  - `http://localhost:5173` (dev)
  - `https://yourdomain.com` (prod)

See `google-auth-setup.md` for full OAuth setup.

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] `.env` added to `.gitignore`
- [ ] Production build succeeds (`npm run build`)
- [ ] Preview build works locally (`npm run preview`)
- [ ] OAuth origins/redirects updated for production domain
- [ ] API keys rotated if previously exposed
- [ ] HTTPS enabled (required for webcam access)
- [ ] Browser compatibility tested (Chrome/Edge)

---

## 🐛 Common Deployment Issues

### Build Failures

**Error:** `Could not resolve "../../hooks/useSpeechSynthesis"`
- **Cause:** Module outside `src/` directory
- **Solution:** All shared code must be in `src/`

**Error:** `index.html can't be bundled without type="module"`
- **Cause:** Script tag missing `type="module"`
- **Solution:** Entry script must be `<script type="module" src="/src/app/index.tsx">`

### Runtime Issues

**Error:** `GEMINI_API_KEY is not configured`
- **Cause:** Environment variable not injected
- **Solution:** Check `vite.config.ts` and hosting platform env vars

**Error:** `GoogleAuthProvider is not defined`
- **Cause:** Missing OAuth Client ID
- **Solution:** Set `VITE_GOOGLE_CLIENT_ID` in environment

**Error:** Webcam not working in production
- **Cause:** Site not using HTTPS
- **Solution:** Enable HTTPS on hosting platform

---

## 📊 Performance Optimization

### Bundle Size Analysis

```bash
npm run build -- --mode production
npx vite-bundle-visualizer
```

Current bundle size: ~400 kB gzipped (main chunk)

### Future Optimizations

1. **Code Splitting:** Dynamic imports for routes
2. **Lazy Loading:** Defer MediaPipe models until drill starts
3. **CDN Optimization:** Host large assets separately
4. **Service Worker:** Cache pose models for offline use

---

## 🔄 Recent Changes & Fixes

### 2024-10 Updates

#### ✅ Peak Intensity Fix
- **Issue:** Intensity KPIs exceeded 100% in session reports
- **Fix:** Added proper clamping in `BjjAnalyticsEngine.ts`:
  ```typescript
  const intensity = Math.min(100, Math.max(0, kinematics.velocity.magnitude * 25));
  const flow = Math.max(0, Math.min(100, 100 - (_magnitude(kinematics.acceleration) / 9.8) * 20));
  const explosiveness = Math.min(100, (this.currentMovement?.peakAcceleration || 0) * 10);
  ```

#### ✅ Code Cleanup
- Removed duplicate components (`components/`, `services/`)
- Consolidated all code to `src/` directory
- Cleaned up unused types and interfaces
- Removed legacy Babel/import-map setup

#### ✅ Voice Cue Validation
All voice cue settings confirmed functional:
- Enabled toggle ✅
- Cue type (positional/motivational/technical) ✅
- Frequency (Smart/30s/Position/End) ✅
- Voice style (pitch/rate/gender) ✅

---

## 📝 Migration History

### From Babel Standalone to Vite

| Aspect | Before | After |
|--------|--------|-------|
| **Entry Point** | `<script type="text/babel">` | `<script type="module">` |
| **Module Resolution** | Import maps | Vite bundler |
| **CSS Loading** | `<link>` in HTML | Import in TypeScript |
| **Build Tool** | None (browser transpilation) | Vite |
| **Bundle Output** | N/A | `dist/` with optimizations |

### Breaking Changes Fixed

1. ✅ Module paths corrected (`../../hooks` → `src/hooks`)
2. ✅ CSS bundled through Vite
3. ✅ Environment variables properly injected
4. ✅ TypeScript compilation integrated
5. ✅ Production builds working

---

## 📚 Additional Resources

- **[README.md](../README.md)** - Project overview & features
- **[google-auth-setup.md](./google-auth-setup.md)** - OAuth configuration
- **[Vite Documentation](https://vitejs.dev/)** - Build tool reference
- **[MediaPipe Docs](https://developers.google.com/mediapipe)** - Pose detection API

---

**Questions or issues?** Check browser console for detailed error logs.
