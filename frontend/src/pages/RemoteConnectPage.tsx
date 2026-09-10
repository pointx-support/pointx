import React, { useEffect, useState } from 'react';
import { Shield, Smartphone, AlertTriangle, CheckCircle2, Loader2, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getStoredToken } from '../services/api';

export const RemoteConnectPage: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [status, setStatus] = useState<'checking' | 'claiming' | 'success' | 'denied' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [redirectCountdown, setRedirectCountdown] = useState<number>(2);

  // Extract pairing token from URL path: /remote/connect/:token or query param ?token=...
  const getPairingToken = (): string => {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname;
    const parts = path.split('/remote/connect/');
    if (parts.length > 1 && parts[1].trim()) {
      return parts[1].split('/')[0].split('?')[0].trim();
    }
    const search = new URLSearchParams(window.location.search);
    return search.get('token') || search.get('pairingToken') || '';
  };

  const token = getPairingToken();

  useEffect(() => {
    // If no token in URL
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing pairing token. Please scan a valid PointX remote QR code.');
      return;
    }

    // If not authenticated, redirect to sign in with returnTo
    if (!isAuthenticated) {
      const returnPath = window.location.pathname + window.location.search;
      const redirectTimer = setTimeout(() => {
        window.location.href = `/login?returnTo=${encodeURIComponent(returnPath)}`;
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }

    // If authenticated, claim pairing session
    let isMounted = true;

    async function claim() {
      setStatus('claiming');
      try {
        const storedJwt = getStoredToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (storedJwt) {
          headers['Authorization'] = `Bearer ${storedJwt}`;
        }

        const res = await fetch('/api/broadcast/remote-pairing/claim', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus('success');
          // Cache session tokens in localStorage for the remote deck
          if (data.data?.tournamentId && data.data?.token) {
            window.localStorage.setItem(`pointx_remote_token_${data.data.tournamentId}`, data.data.token);
            window.localStorage.setItem(`pointx_broadcast_token_${data.data.tournamentId}`, data.data.token);
          }

          const targetUrl = data.data?.redirectUrl || `/remote?session=${data.data.sessionId}&tournamentId=${data.data.tournamentId}&token=${data.data.token}`;
          
          let count = 2;
          const interval = setInterval(() => {
            count -= 1;
            setRedirectCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              window.location.href = targetUrl;
            }
          }, 1000);
        } else if (res.status === 403) {
          setStatus('denied');
          setErrorMessage(data.error || 'ACCESS DENIED: You do not belong to the organization hosting this tournament.');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'This pairing QR code is invalid, expired, or has already been used.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Network error while attempting to claim remote pairing session.');
      }
    }

    claim();

    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#0a0710] text-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#ffd000]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#ef4444]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#13101d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#ffd000] flex items-center justify-center text-black font-black font-display text-base shadow-md">
              P
            </div>
            <div>
              <span className="text-base font-black tracking-wider uppercase font-display text-white">POINTX</span>
              <span className="text-[10px] block font-mono text-[#ffd000] uppercase tracking-widest font-bold">
                SECURE REMOTE PAIRING
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>

        {/* State: Not Authenticated / Redirecting to Login */}
        {!isAuthenticated && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#ffd000]/15 border border-[#ffd000]/30 flex items-center justify-center text-[#ffd000]">
              <Shield className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Authentication Required</h2>
              <p className="text-xs text-white/60">
                Please sign in to verify your organization credentials before claiming remote control.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-[#ffd000] font-mono animate-pulse pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to sign-in...
            </div>
            <button
              onClick={() => {
                const returnPath = window.location.pathname + window.location.search;
                window.location.href = `/login?returnTo=${encodeURIComponent(returnPath)}`;
              }}
              className="w-full py-3 rounded-xl bg-[#ffd000] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#ffe252] transition-colors"
            >
              Sign In Now →
            </button>
          </div>
        )}

        {/* State: Checking / Claiming */}
        {isAuthenticated && (status === 'checking' || status === 'claiming') && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#ffd000]/15 border border-[#ffd000]/30 flex items-center justify-center text-[#ffd000] animate-pulse">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Verifying Authorization...</h2>
              <p className="text-xs text-white/60">
                Validating ephemeral pairing token and checking organization permissions for{' '}
                <strong className="text-white">{user?.email}</strong>.
              </p>
            </div>
            <div className="text-[11px] font-mono text-white/40 pt-2">
              Session Security: Single-Use Cryptographic Grant
            </div>
          </div>
        )}

        {/* State: Success */}
        {isAuthenticated && status === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Device Authorized!</h2>
              <p className="text-xs text-white/70">
                Pairing verified successfully. Loading live match remote control deck...
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[11px] font-mono text-[#10b981] flex items-center justify-center gap-2">
              <span>Entering match controller in {redirectCountdown}s</span>
              <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* State: ACCESS DENIED (Org Mismatch) */}
        {isAuthenticated && status === 'denied' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
              <Shield className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-rose-500/30">
                ACCESS DENIED
              </div>
              <h2 className="text-lg font-bold text-white">Unauthorized Organization</h2>
              <p className="text-xs text-rose-300/80 leading-relaxed max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-left text-xs space-y-1">
              <div className="text-[11px] text-white/50 uppercase font-mono font-semibold">Current Account</div>
              <div className="text-white font-medium">{user?.email}</div>
              <div className="text-white/60 text-[11px]">
                Org: {user?.organizationName || 'Individual Account'}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  await logout();
                  const returnPath = window.location.pathname + window.location.search;
                  window.location.href = `/login?returnTo=${encodeURIComponent(returnPath)}`;
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign In with Authorized Account
              </button>
              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* State: Generic Error / Expired */}
        {isAuthenticated && status === 'error' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
                PAIRING FAILED
              </div>
              <h2 className="text-lg font-bold text-white">QR Code Expired or Invalid</h2>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>

            <p className="text-[11px] text-white/40 leading-normal">
              For security, PointX QR codes are single-use and expire in 10 minutes. Please open the broadcast control view on your desktop and click <strong>"Generate New QR"</strong>.
            </p>

            <button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 text-center border-t border-white/5">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            PointX Secure Broadcast Pairing Protocol v2.6
          </p>
        </div>
      </div>
    </div>
  );
};
