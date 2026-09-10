import React, { useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ─── Google Identity Services type declaration ────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
          prompt: (notification?: unknown) => void;
        };
      };
    };
  }
}

// ─── Deterministic init state machine ────────────────────────────────────────
type GsiState = 'loading' | 'ready' | 'failed' | 'timeout';

// Module-level singleton so multiple <GoogleAuthButton> instances share state
// and the GIS SDK is only loaded once per page.
let gsiState: GsiState = 'loading';
let gsiListeners: Array<() => void> = [];
let gsiInitialised = false;
let gsiTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

const GIS_INIT_TIMEOUT_MS = 10_000; // Hard 10-second limit — never infinite

function notifyListeners() {
  gsiListeners.forEach((fn) => fn());
}

function setGsiState(next: GsiState) {
  if (gsiState === next) return;
  gsiState = next;
  notifyListeners();
}

function pollForGoogleAccounts(attempts = 30, interval = 100): void {
  if (typeof window === 'undefined') return;
  if (window.google?.accounts?.id) {
    if (gsiTimeoutHandle) {
      clearTimeout(gsiTimeoutHandle);
      gsiTimeoutHandle = null;
    }
    setGsiState('ready');
    return;
  }
  if (attempts > 0) {
    setTimeout(() => pollForGoogleAccounts(attempts - 1, interval), interval);
  }
}

function loadGsiSdk(): void {
  if (gsiInitialised) {
    // If already marked initialized, verify if google.accounts.id became available in the meantime
    if (window.google?.accounts?.id) {
      setGsiState('ready');
    }
    return;
  }
  gsiInitialised = true;

  // 1. Already available (e.g. loaded via index.html or cache)
  if (window.google?.accounts?.id) {
    setGsiState('ready');
    return;
  }

  // 2. Start polling in case script is loading in background via index.html
  pollForGoogleAccounts(40, 100);

  // 3. Set a hard timeout — if SDK hasn't loaded in 10s, declare timeout
  gsiTimeoutHandle = setTimeout(() => {
    if (gsiState === 'loading') {
      if (window.google?.accounts?.id) {
        setGsiState('ready');
      } else {
        setGsiState('timeout');
      }
    }
  }, GIS_INIT_TIMEOUT_MS);

  // 4. Check if script tag exists anywhere in DOM
  const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (existing) {
    existing.addEventListener('load', () => pollForGoogleAccounts(20, 50));
    existing.addEventListener('error', () => {
      if (gsiTimeoutHandle) clearTimeout(gsiTimeoutHandle);
      setGsiState('failed');
    });
    return;
  }

  // 5. Fallback: dynamically inject script if not found in index.html
  const script = document.createElement('script');
  script.id = 'google-gsi-client';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    pollForGoogleAccounts(20, 50);
  };

  script.onerror = () => {
    if (gsiTimeoutHandle) clearTimeout(gsiTimeoutHandle);
    console.warn('[GoogleAuth] Failed to load Google Identity Services SDK. Possible causes: network error, ad-blocker, Brave Shields, or CSP.');
    setGsiState('failed');
  };

  document.head.appendChild(script);
}

function useGsiState(): GsiState {
  const [state, setState] = React.useState<GsiState>(gsiState);

  useEffect(() => {
    // Sync in case state changed between render and effect
    if (state !== gsiState) setState(gsiState);

    const listener = () => setState(gsiState);
    gsiListeners.push(listener);

    return () => {
      gsiListeners = gsiListeners.filter((l) => l !== listener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
}) => {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const hiddenBtnRef = useRef<HTMLDivElement>(null);
  const gsiInitRef = useRef(false); // prevent double-init inside this instance
  const gsiState = useGsiState();

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

  // Stable callback stored in a ref so it never triggers re-initialization
  const callbackRef = useRef<((response: { credential?: string }) => Promise<void>) | undefined>(undefined);
  callbackRef.current = async (response) => {
    if (!response?.credential) return;
    setIsProcessing(true);
    try {
      const res = await loginWithGoogle(response.credential);
      if (res.success) {
        onSuccess?.();
      } else {
        onError?.(res.error || 'Google authentication failed. Please try again.');
      }
    } catch {
      onError?.('Google authentication failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Kick off SDK loading once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadGsiSdk();
  }, []);

  // Initialize GIS once SDK is ready — runs only when gsiState transitions to 'ready'
  useEffect(() => {
    if (gsiState !== 'ready') return;
    if (!googleClientId) return;
    if (!window.google?.accounts?.id) return;
    if (gsiInitRef.current) return; // idempotent — only init once per component instance
    gsiInitRef.current = true;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          callbackRef.current?.(response);
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
      console.warn('[GoogleAuth] GIS initialize() error:', err);
    }
  }, [gsiState, googleClientId, text]);

  const handleCustomClick = useCallback(() => {
    if (isLoading || isProcessing) return;

    if (!googleClientId) {
      onError?.(
        'Google Sign-In is not configured. Please contact support or use email/password login.'
      );
      return;
    }

    if (gsiState === 'loading') {
      // Still loading — tell the user to wait, but this will resolve within 10s
      onError?.('Google Sign-In is loading. Please try again in a moment.');
      return;
    }

    if (gsiState === 'timeout' || gsiState === 'failed') {
      onError?.(
        'Google Sign-In could not be initialized. Please try again or use email/password login.'
      );
      return;
    }

    // gsiState === 'ready'
    if (!window.google?.accounts?.id) {
      onError?.('Google Sign-In is currently unavailable. Please use email/password login.');
      return;
    }

    // Try to click the native GIS button (most reliable popup trigger)
    if (hiddenBtnRef.current) {
      const nativeBtn = hiddenBtnRef.current.querySelector(
        'div[role="button"]'
      ) as HTMLElement | null;
      if (nativeBtn) {
        nativeBtn.click();
        return;
      }
    }

    // Fall back to prompt()
    window.google.accounts.id.prompt();
  }, [isLoading, isProcessing, googleClientId, gsiState, onError]);

  const handleRetry = useCallback(() => {
    // Reset module-level singleton state and reload the SDK
    setGsiState('loading');
    gsiInitialised = false;
    gsiInitRef.current = false;
    if (gsiTimeoutHandle) clearTimeout(gsiTimeoutHandle);
    const oldScript = document.getElementById('google-gsi-client');
    if (oldScript) oldScript.remove();
    loadGsiSdk();
  }, []);

  // ─── Derived display labels ─────────────────────────────────────────────────
  const buttonLabel =
    isProcessing
      ? 'Verifying with Google…'
      : gsiState === 'loading'
      ? 'Loading Google Sign-In…'
      : gsiState === 'timeout'
      ? "Google Sign-In couldn't be initialized. Try again."
      : gsiState === 'failed'
      ? 'Google Sign-In is currently unavailable.'
      : text === 'signin_with'
      ? 'Sign in with Google'
      : text === 'signup_with'
      ? 'Sign up with Google'
      : 'Continue with Google';

  const isDisabled = isLoading || isProcessing || gsiState === 'loading';

  // ─── Failed / Timeout state — show retry UI ─────────────────────────────────
  if (gsiState === 'failed' || gsiState === 'timeout') {
    return (
      <div className={`w-full flex flex-col items-center gap-1.5 ${className}`}>
        <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium text-center">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          <span>
            {gsiState === 'timeout'
              ? "Google Sign-In initialization timed out."
              : 'Google Sign-In blocked or unavailable.'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] text-center px-1">
          If using Brave Shields or an ad blocker, disable it for this site, or sign in with email/password above.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer pt-0.5"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Try Again
        </button>
      </div>
    );
  }

  // ─── Normal / Loading / Ready state ─────────────────────────────────────────
  return (
    <div className="relative w-full">
      {/* Hidden real Google button for accurate GIS event binding */}
      <div
        ref={hiddenBtnRef}
        className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={handleCustomClick}
        disabled={isDisabled}
        aria-label={buttonLabel}
        className={`w-full h-11 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 border cursor-pointer select-none bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover,rgba(255,255,255,0.06))] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong,rgba(255,255,255,0.2))] shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing || gsiState === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" aria-hidden="true" />
        ) : (
          /* Google logo SVG */
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        )}
        <span className="font-semibold">{buttonLabel}</span>
      </button>
    </div>
  );
};
