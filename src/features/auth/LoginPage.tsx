import React, { useContext, useEffect } from 'react';
import { GlowingCircle } from '../../assets/GlowingCircle';
import { AuthContext } from '../../contexts/AuthContext';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const authContext = useContext(AuthContext);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 280,
          }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (!authContext) return;

    try {
      await authContext.login(response.credential);
      onLoginSuccess();
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-dd-bg">
      <div className="flex flex-col items-center text-center px-4">
        <GlowingCircle />
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-dd-text mt-8 mb-4 tracking-tight">
          Welcome to Roll Metrics
        </h1>
        
        <p className="text-dd-muted text-lg mb-8 max-w-md">
          Your intelligent BJJ training companion powered by AI
        </p>

        <div id="google-signin-button" className="mt-4"></div>
        
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm max-w-md">
            <p className="font-semibold">⚠️ Google Client ID Missing</p>
            <p className="mt-1">Please set VITE_GOOGLE_CLIENT_ID in your .env file</p>
          </div>
        )}
      </div>
    </div>
  );
}
