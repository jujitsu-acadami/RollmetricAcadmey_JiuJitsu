# Google Authentication Setup Guide

## Overview
Roll Metrics uses Google OAuth 2.0 for user authentication. Users sign in with their Google account, and their name, email, and profile picture are used throughout the app.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (required for profile data)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields:
   - App name: "Roll Metrics"
   - User support email: your email
   - Developer contact: your email
4. Add scopes (optional, default scopes are sufficient)
5. Add test users if in testing mode

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Roll Metrics Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for Vite dev server)
     - `http://localhost:3000` (for custom port)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**: (leave empty for Google Sign-In button)
5. Click **Create**
6. Copy the **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Important**: Never commit `.env` to version control!

### 5. Update for Production

When deploying to production (e.g., Netlify):

1. Add production domain to **Authorized JavaScript origins** in Google Cloud Console
2. Set `VITE_GOOGLE_CLIENT_ID` in your hosting platform's environment variables
3. Ensure your domain uses HTTPS (required by Google)

## How It Works

### Login Flow
1. User lands on LoginPage (visible to all)
2. Clicks "Sign in with Google"
3. Google popup authenticates user
4. JWT token is decoded client-side
5. User data (name, email, picture URL) stored in localStorage & AuthContext
6. User redirected to HomePage

### Protected Routes
- App checks `AuthContext.isAuthenticated` on load
- If `false` → show LoginPage (public)
- If `true` → show Home/Drill/Account pages (protected)

### User Data Storage
- **What's stored**: Name, email, profile picture URL
- **Where**: `localStorage` key `rollmetrics_user`
- **Profile picture**: Only the URL is stored, image loaded from Google's CDN
- **Sessions**: Stored in `localStorage` key `rollmetrics_sessions`
- **Settings**: Stored in `localStorage` key `rollmetrics_settings`

### Logout Flow
1. User clicks "Sign Out" in Account page
2. Clears `localStorage` (user data only, keeps settings)
3. Resets AuthContext
4. Returns to LoginPage

## Security Notes

- JWT tokens are decoded **client-side** (they're signed by Google, so safe to parse)
- User data persists in localStorage (cleared on logout)
- Profile picture is NOT downloaded - only URL stored, image fetched from Google CDN
- No sensitive data stored except user profile info
- All main app pages protected - only LoginPage is public

## Data Privacy

- **No server-side storage**: Everything stored locally in browser
- **No image downloads**: Profile pictures loaded directly from Google
- **User control**: All data cleared on logout
- **Offline sessions**: Training sessions work offline, synced to localStorage

## Troubleshooting

### "Invalid Client" error
- Check that your Client ID is correct in `.env`
- Verify authorized origins match your domain exactly (including port)
- Ensure you're using `VITE_` prefix for Vite environment variables

### Sign-In button not appearing
- Check browser console for script loading errors
- Ensure `VITE_GOOGLE_CLIENT_ID` is set correctly
- Try clearing cache and hard refresh (Ctrl+Shift+R)
- Verify `.env` file is in project root

### Popup blocked
- User must allow popups for Google authentication
- Some browsers block popups by default
- Check browser popup settings

### "Client ID Missing" warning on LoginPage
- Your `.env` file is missing `VITE_GOOGLE_CLIENT_ID`
- Make sure to restart dev server after adding environment variables
- Check that `.env` is in the project root directory

## Testing Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173` (or the port shown)

3. You should see the LoginPage with:
   - Glowing logo circle
   - "Welcome to Roll Metrics" title
   - Google Sign-In button

4. Click "Sign in with Google"

5. Authenticate with your Google account

6. Verify:
   - Redirected to HomePage
   - Profile in Account page shows your name, email, and picture
   - Sign Out button works and returns to LoginPage

## Production Deployment

### Netlify Example

1. Add to Netlify environment variables:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GEMINI_API_KEY=your-gemini-api-key
   ```

2. Update Google Cloud Console authorized origins:
   ```
   https://your-app.netlify.app
   ```

3. Deploy and test authentication

### Important for Production

- HTTPS is **required** by Google OAuth
- Add all production domains to authorized origins
- Consider adding multiple test domains (staging, preview branches)
- Never expose Client ID is okay to be public (it's designed for client-side use)
- Keep GEMINI_API_KEY secret (use serverless functions for production)

## FAQ

**Q: Is the Google Client ID secret?**  
A: No, it's safe to expose client-side. It's designed for public use and protected by authorized origins.

**Q: Where is user data stored?**  
A: Locally in browser's localStorage under `rollmetrics_user`. No server-side storage.

**Q: What happens to sessions on logout?**  
A: User data is cleared, but app settings are preserved. Sessions are cleared only on explicit logout.

**Q: Can users use the app without Google login?**  
A: No, authentication is required to access all app features (Home, Drill, Account).

**Q: Does this work offline?**  
A: Once authenticated, drill sessions work offline. Auth requires internet for initial login only.
