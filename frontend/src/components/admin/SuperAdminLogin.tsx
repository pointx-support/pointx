import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, Key, Cpu, Sun, Moon } from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { adminApi, setStoredToken } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export interface SuperAdminLoginProps {
  onLoginSuccess?: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Force Password Change Modal State
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both Super Admin username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminApi.login(username.trim(), password.trim());
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        await useAuthStore.getState().checkAuth();

        if (res.mustChangePassword) {
          setShowPasswordChangeModal(true);
        } else {
          if (onLoginSuccess) onLoginSuccess();
          if (typeof window !== 'undefined') {
            window.location.href = '/super-admin';
          }
        }
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error. Unable to authenticate Super Admin session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === 'sudo-pointx') {
      setChangeError('Cannot reuse default bootstrap password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setChangeError(null);

    try {
      const res = await adminApi.changePassword(password, newPassword);
      if (res.success) {
        setShowPasswordChangeModal(false);
        if (onLoginSuccess) onLoginSuccess();
        if (typeof window !== 'undefined') {
          window.location.href = '/super-admin';
        }
      } else {
        setChangeError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setChangeError(err.message || 'Network error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col justify-between items-center p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex justify-between items-center z-10 py-3">
        <a href="/" className="flex items-center gap-3 group">
          <PointXLogo className="h-7 w-auto object-contain" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--accent-primary)] uppercase border-l border-[var(--border-subtle)] pl-3">
            Governance Console
          </span>
        </a>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700" />}
          </button>

          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-mono shadow-xs">
            <Cpu className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>PointX v2.4 Enterprise</span>
          </div>
        </div>
      </header>

      {/* Login Card Container (Reference-Inspired Large Rounded Surface) */}
      <div className="w-full max-w-md my-auto z-10 py-6">
        <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors">
          
          {/* Top Subtle Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--accent-primary)] via-amber-400 to-amber-500" />

          {/* Shield Badge */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)] shadow-md">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>

          <div className="text-center mb-6 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[var(--text-primary)] uppercase">
              Super Admin Control
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Authenticate with server-side governance credentials
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-sans">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-2xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                Super Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-2xl py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 px-5 rounded-2xl bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-primary-text)] font-black text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <span>Authenticating Session...</span>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-[11px] font-mono text-[var(--text-muted)] space-y-1">
            <p>Protected by HTTP-only session tokens & rate-limited brute-force guards.</p>
          </div>
        </div>
      </div>

      {/* Force Password Change Modal */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-raised)] border border-[var(--accent-primary)]/40 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-3">
              <Key className="h-6 w-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-display uppercase">Password Reset Required</h3>
                <p className="text-xs text-[var(--text-secondary)]">Default bootstrap credentials detected. Set a custom password to proceed.</p>
              </div>
            </div>

            {changeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForceChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl py-2.5 px-3 text-sm text-[var(--text-primary)] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-2 py-3 bg-[var(--accent-primary)] hover:brightness-110 text-[var(--accent-primary-text)] font-black text-xs font-display uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isChangingPassword ? 'Updating Password...' : 'Save New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center text-xs text-[var(--text-muted)] font-mono z-10 py-3">
        &copy; {new Date().getFullYear()} PointX Esports Studio &bull; Central Governance Subsystem
      </footer>
    </div>
  );
};

export default SuperAdminLogin;
