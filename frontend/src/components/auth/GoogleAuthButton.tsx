import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ─── Google Identity Services Types ───────────────────────────────────────────
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

type GsiState = 'loading' | 'ready' | 'failed' | 'timeout';

// Module-level singleton state to coordinate between multiple button instances
let gsiState: GsiState = 'loading';
let gsiListeners: Array<() => void> = [];
let gsiInitialized = false;
let gsiPollHandle: ReturnType<typeof setInterval> | null = null;
let gsiTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function notifyListeners() {
  gsiListeners.forEach((fn) => fn());
}

function setGsiState(next: GsiState) {
  if (gsiState === next) return;
  gsiState = next;
  notifyListeners();
}

function stopTimers() {
  if (gsiPollHandle) {
    clearInterval(gsiPollHandle);
    gsiPollHandle = null;
  }
  if (gsiTimeoutHandle) {
    clearTimeout(gsiTimeoutHandle);
    gsiTimeoutHandle = null;
  }
}

function initGsiSdk(): void {
  if (typeof window === 'undefined') return;

  // 1. If already available on window, mark ready immediately
  if (window.google?.accounts?.id) {
    stopTimers();
    setGsiState('ready');
    return;
  }

  if (gsiInitialized) return;
  gsiInitialized = true;

  // 2. Poll every 100ms for up to 10 seconds
  const startTime = Date.now();
  gsiPollHandle = setInterval(() => {
    if (window.google?.accounts?.id) {
      stopTimers();
      setGsiState('ready');
      return;
    }
    if (Date.now() - startTime >= 10_000) {
      stopTimers();
      if (gsiState === 'loading') {
        setGsiState('timeout');
      }
    }
  }, 100);

  // 3. Check if script tag is already in DOM (e.g. from index.html)
  const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (existing) {
    // Script is already in the document — let the browser load it naturally
    return;
  }

  // 4. If script is somehow not in DOM, inject it safely
  const script = document.createElement('script');
  script.id = 'google-gsi-client';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (window.google?.accounts?.id) {
      stopTimers();
      setGsiState('ready');
    }
  };

  script.onerror = () => {
    stopTimers();
    console.warn('[GoogleAuth] Could not load Google Identity Services SDK.');
    setGsiState('failed');
  };

  document.head.appendChild(script);
}

function useGsiState(): GsiState {
  const [state, setState] = useState<GsiState>(gsiState);

  useEffect(() => {
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
  const { loginWithGoogle } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gsiRenderedRef = useRef(false);
  const gsiState = useGsiState();

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

  // Stable callback ref to prevent GIS re-initialization loops
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
    initGsiSdk();
  }, []);

  // When GSI state is ready and container is mounted, render Google's official button
  useEffect(() => {
    if (gsiState !== 'ready') return;
    if (!googleClientId) return;
    if (!window.google?.accounts?.id) return;
    if (!containerRef.current) return;
    if (gsiRenderedRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          callbackRef.current?.(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text,
        shape: 'pill',
        logo_alignment: 'left',
        width: Math.min(Math.max(containerRef.current.offsetWidth || 300, 240), 380),
      });

      gsiRenderedRef.current = true;
    } catch (err) {
      console.warn('[GoogleAuth] GIS render error:', err);
    }
  }, [gsiState, googleClientId, text]);

  const handleRetry = useCallback(() => {
    stopTimers();
    gsiInitialized = false;
    gsiRenderedRef.current = false;
    setGsiState('loading');
    initGsiSdk();
  }, []);

  // ─── 1. Processing state ────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className={`w-full h-11 px-4 rounded-xl flex items-center justify-center gap-3 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs font-semibold ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
        <span>Verifying Google account…</span>
      </div>
    );
  }

  // ─── 2. Failed / Timeout state ──────────────────────────────────────────────
  if (gsiState === 'failed' || gsiState === 'timeout') {
    return (
      <div className={`w-full flex flex-col items-center gap-1.5 ${className}`}>
        <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium text-center">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          <span>Google Sign-In is currently unavailable.</span>
        </div>
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

  // ─── 3. Missing Client ID state ─────────────────────────────────────────────
  if (!googleClientId && gsiState === 'ready') {
    return (
      <div className={`w-full h-11 px-4 rounded-xl flex items-center justify-center gap-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs font-medium ${className}`}>
        <span>Google Sign-In not configured. Use email/password above.</span>
      </div>
    );
  }

  // ─── 4. Ready / Loading state ───────────────────────────────────────────────
  return (
    <div className={`w-full flex justify-center items-center min-h-[44px] ${className}`}>
      {/* Container where Google Identity Services injects the official button */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center items-center ${gsiState === 'loading' ? 'hidden' : ''}`}
      />

      {/* Loading placeholder while SDK evaluates */}
      {gsiState === 'loading' && (
        <div className="w-full h-11 px-4 rounded-xl flex items-center justify-center gap-3 border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs font-medium animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
          <span>Loading Google Sign-In…</span>
        </div>
      )}
    </div>
  );
};
