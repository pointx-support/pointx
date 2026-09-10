import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

export interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
}) => {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim() ||
    ''; // Empty if not yet configured in production env

  // Load Google Identity Services SDK script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setIsGsiLoaded(true);
      return;
    }

    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGsiLoaded(true);
      };
      script.onerror = () => {
        console.warn('[GoogleAuth] Could not load Google Identity Services SDK.');
      };
      document.head.appendChild(script);
    } else {
      setIsGsiLoaded(true);
    }
  }, []);

  // Initialize GIS and render hidden button for fallback trigger
  useEffect(() => {
    if (!isGsiLoaded || !window.google?.accounts?.id || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setIsProcessing(true);
            const res = await loginWithGoogle(response.credential);
            setIsProcessing(false);
            if (res.success) {
              onSuccess?.();
            } else {
              onError?.(res.error || 'Google authentication failed.');
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (hiddenBtnRef.current) {
        window.google.accounts.id.renderButton(hiddenBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text,
          shape: 'pill',
        });
      }
    } catch (err) {
      console.warn('[GoogleAuth] Init error:', err);
    }
  }, [isGsiLoaded, googleClientId, text, loginWithGoogle, onSuccess, onError]);

  const handleCustomClick = () => {
    if (isLoading || isProcessing) return;

    if (!googleClientId) {
      // In dev or until organizer configures OAuth credentials in Google Cloud Console
      const msg =
        'Google OAuth client ID is not configured yet. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.';
      onError?.(msg);
      return;
    }

    if (window.google?.accounts?.id) {
      // If native GIS button was rendered, simulate click or call prompt
      if (hiddenBtnRef.current) {
        const nativeBtn = hiddenBtnRef.current.querySelector('div[role="button"]') as HTMLElement;
        if (nativeBtn) {
          nativeBtn.click();
          return;
        }
      }
      window.google.accounts.id.prompt();
    } else {
      onError?.('Google authentication service is still initializing. Please wait a second.');
    }
  };

  const displayText =
    text === 'signin_with'
      ? 'Sign in with Google'
      : text === 'signup_with'
      ? 'Sign up with Google'
      : 'Continue with Google';

  return (
    <div className="relative w-full">
      {/* Hidden real Google button for accurate GIS event binding */}
      <div ref={hiddenBtnRef} className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden" />

      {/* Bespoke Styled PointX Esports Google Button */}
      <button
        type="button"
        onClick={handleCustomClick}
        disabled={isLoading || isProcessing}
        className={`w-full h-11 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 border cursor-pointer select-none bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover,rgba(255,255,255,0.06))] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong,rgba(255,255,255,0.2))] shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span className="font-semibold">{isProcessing ? 'Verifying with Google...' : displayText}</span>
      </button>
    </div>
  );
};
