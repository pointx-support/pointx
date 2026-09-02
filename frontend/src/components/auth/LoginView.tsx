import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Mail,
  Lock,
  User,
  Sun,
  Moon,
  Zap,
  Swords,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import { cn } from '../../lib/utils';
import './LoginView.css';

export interface LoginViewProps {
  initialMode?: 'signin' | 'signup';
  onBackToHome?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
  onAuthSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  initialMode = 'signin',
  onBackToHome,
  onModeChange,
  onAuthSuccess,
}) => {
  const {
    theme,
    toggleTheme,
    login,
    signup,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    isLoading,
  } = useAuthStore();

  // Mode toggled state: false = Sign In active, true = Sign Up active
  const [isToggled, setIsToggled] = useState(initialMode === 'signup');

  useEffect(() => {
    setIsToggled(initialMode === 'signup');
  }, [initialMode]);

  const handleToggleMode = (signUpActive: boolean) => {
    setIsToggled(signUpActive);
    onModeChange?.(signUpActive ? 'signup' : 'signin');
    if (typeof window !== 'undefined') {
      const targetPath = signUpActive ? '/signup' : '/login';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  // Sign In form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up form fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // OTP Verification State (during signup)
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password Modal/Flow State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp_reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUnregisteredEmail, setIsUnregisteredEmail] = useState(false);

  const isDark = theme === 'dark';

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUnregisteredEmail(false);

    const emailToUse = loginEmail.includes('@') ? loginEmail.trim() : `${loginEmail.trim()}@pointx.gg`;
    const res = await login(emailToUse, loginPassword);

    if (res.success) {
      onAuthSuccess?.();
    } else {
      if (res.requiresVerification) {
        setPendingEmail(emailToUse);
        setIsOtpStep(true);
        handleToggleMode(true);
        setSuccessMessage('Please verify your email with the 6-digit OTP code.');
      } else if (res.notRegistered || res.error?.toLowerCase().includes('not registered') || res.error?.toLowerCase().includes('register first')) {
        setIsUnregisteredEmail(true);
        setSignupEmail(emailToUse);
        setErrorMessage('This email is not registered yet. Please register first to access PointX.');
      } else {
        setErrorMessage(res.error || 'Login failed. Please verify your credentials.');
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToUse = signupEmail.includes('@') ? signupEmail.trim() : `${signupEmail.trim()}@pointx.gg`;
    const res = await signup(signupUsername, emailToUse, signupPassword, 'Independent Esports Organizer');

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      setPendingEmail(emailToUse);
      setIsOtpStep(true);
      setResendCooldown(60);
      setSuccessMessage(res.message || `🔐 6-digit verification code sent to ${emailToUse}`);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    const res = await verifyOtp(pendingEmail.trim().toLowerCase(), cleanOtp, 'signup');
    if (!res.success) {
      setErrorMessage(res.error || 'OTP verification failed.');
    } else {
      setSuccessMessage('🎉 Account activated successfully! Welcome to PointX Arena.');
      onAuthSuccess?.();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await resendOtp(pendingEmail, 'signup');
    if (res.success) {
      setResendCooldown(60);
      setSuccessMessage(res.message || 'Fresh 6-digit OTP sent to your email.');
    } else {
      setErrorMessage(res.error || 'Failed to resend code.');
    }
  };

  // Forgot password handlers
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToUse = forgotEmail.includes('@') ? forgotEmail.trim() : `${forgotEmail.trim()}@pointx.gg`;
    const res = await forgotPassword(emailToUse);

    if (res.success) {
      setForgotStep('otp_reset');
      setResendCooldown(60);
      setSuccessMessage(res.message || 'Password reset instructions sent.');
    } else {
      setErrorMessage(res.error || 'Failed to process password reset request.');
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const emailToUse = forgotEmail.includes('@') ? forgotEmail.trim() : `${forgotEmail.trim()}@pointx.gg`;
    const res = await resetPassword(emailToUse, forgotOtp, newPassword);

    if (res.success) {
      setIsForgotPasswordOpen(false);
      setForgotStep('email');
      setLoginEmail(emailToUse);
      setLoginPassword('');
      setSuccessMessage('🎉 Password reset successfully! Please sign in with your new password.');
    } else {
      setErrorMessage(res.error || 'Password reset failed.');
    }
  };

  return (
    <div className="auth-page font-sans transition-colors duration-200">
      {/* Top Header Row with Clean Brand Badge and Theme Toggle */}
      <div className="w-full max-w-[860px] flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            onClick={onBackToHome}
            className={cn('flex items-center shrink-0', onBackToHome ? 'cursor-pointer group' : '')}
            title={onBackToHome ? 'Return to Home' : undefined}
          >
            <PointXLogo className="h-8 sm:h-9 w-auto max-w-[110px] object-contain select-none group-hover:scale-105 transition-transform" />
          </div>
          <div className="flex flex-col border-l border-[var(--border-subtle)] pl-3">
            <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
              PointX Esports
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
              Tournament Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer font-sans"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </button>
          )}

          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="glass-nav-item flex items-center gap-2 p-2.5 px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs sm:text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm cursor-pointer"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              <>
                <Sun className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Animated Auth Wrapper */}
      <div className={`auth-wrapper ${isToggled ? 'toggled' : ''}`}>
        {/* Animated Background Shapes */}
        <div className="background-shape"></div>
        <div className="secondary-shape"></div>

        {/* Mobile Animated Segment Switcher (Exclusive to mobile view) */}
        <div className="mobile-auth-switch-wrapper">
          <div className="mobile-auth-switch">
            <button
              type="button"
              className={`mobile-switch-btn ${!isToggled ? 'active' : ''}`}
              onClick={() => {
                handleToggleMode(false);
                setIsOtpStep(false);
                setErrorMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mobile-switch-btn ${isToggled ? 'active' : ''}`}
              onClick={() => {
                handleToggleMode(true);
                setErrorMessage(null);
              }}
            >
              Register
            </button>
            <div className={`mobile-switch-glider ${isToggled ? 'toggled' : ''}`} />
          </div>
        </div>

        {/* ================= SIGN IN PANEL (LEFT) ================= */}
        <div className="credentials-panel signin">
          <h2 className="slide-element font-display">Sign In</h2>

          {successMessage && !isToggled && (
            <div className="slide-element p-3 mb-3 rounded-xl bg-[var(--status-live)]/15 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && !isToggled && (
            <div className="auth-error-banner slide-element space-y-2">
              <div className="flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
              {isUnregisteredEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setSignupEmail(loginEmail.trim());
                    handleToggleMode(true);
                    setIsOtpStep(false);
                    setErrorMessage(null);
                    setIsUnregisteredEmail(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--accent-primary)] text-black text-xs font-black hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer font-display mt-1 shadow-md"
                >
                  <span>Click Here to Register First</span>
                  <Zap className="h-3.5 w-3.5 fill-black" />
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="field-wrapper slide-element">
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (isUnregisteredEmail) setIsUnregisteredEmail(false);
                }}
                className={loginEmail ? 'has-value' : ''}
              />
              <label>Username / Email</label>
              <User className="field-icon w-4 h-4" />
            </div>

            <div className="field-wrapper slide-element">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={loginPassword ? 'has-value' : ''}
              />
              <label>Password</label>
              <Lock className="field-icon w-4 h-4" />
            </div>

            <div className="flex justify-end mt-1 mb-2 slide-element">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(true);
                  setForgotStep('email');
                  setForgotEmail(loginEmail);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[11px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <div className="field-wrapper slide-element" style={{ marginTop: '12px' }}>
              <button
                className="submit-button font-display flex items-center justify-center gap-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Sign In</span>
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="register-trigger"
                  onClick={() => {
                    if (loginEmail && !signupEmail) {
                      setSignupEmail(loginEmail.trim());
                    }
                    handleToggleMode(true);
                    setIsOtpStep(false);
                    setErrorMessage(null);
                    setIsUnregisteredEmail(false);
                  }}
                >
                  Register Now
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* ================= SIGN IN WELCOME (RIGHT) ================= */}
        <div className="welcome-section signin">
          <div className="welcome-badge slide-element">
            <Zap className="h-3.5 w-3.5" />
            <span>ESPORTS HUB</span>
          </div>
          <h2 className="slide-element font-display welcome-title">
            WELCOME BACK!
          </h2>
          <p className="slide-element welcome-desc">
            Free Fire Tournament Point Table & OBS Broadcast Engine
          </p>
          <div className="welcome-perks slide-element">
            <span className="perk-item"><CheckCircle2 className="h-3 w-3" /> Auto Scoring</span>
            <span className="perk-item"><CheckCircle2 className="h-3 w-3" /> 4K Posters</span>
            <span className="perk-item"><CheckCircle2 className="h-3 w-3" /> OBS Studio</span>
          </div>
        </div>

        {/* ================= SIGN UP PANEL (RIGHT) ================= */}
        <div className="credentials-panel signup">
          <h2 className="slide-element font-display">
            {isOtpStep ? 'Verify Code' : 'Register'}
          </h2>

          {successMessage && isToggled && (
            <div className="slide-element p-3 mb-3 rounded-xl bg-[var(--status-live)]/15 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && isToggled && (
            <div className="auth-error-banner slide-element">{errorMessage}</div>
          )}

          {isOtpStep ? (
            /* OTP Verification Form */
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
              <p className="text-xs text-[var(--text-secondary)] font-mono slide-element">
                Enter the 6-digit verification code sent to <strong className="text-[var(--accent-primary)]">{pendingEmail}</strong>:
              </p>

              <div className="field-wrapper slide-element">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className={otpCode ? 'has-value' : ''}
                  placeholder="000000"
                  style={{ letterSpacing: '6px', fontSize: '18px', textAlign: 'center' }}
                />
                <label>6-Digit OTP</label>
                <KeyRound className="field-icon w-4 h-4" />
              </div>

              <div className="flex items-center justify-between text-xs font-mono slide-element pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Edit Email</span>
                </button>
              </div>

              <div className="field-wrapper slide-element" style={{ marginTop: '20px' }}>
                <button
                  className="submit-button font-display flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Verify & Activate</span>
                </button>
              </div>
            </form>
          ) : (
            /* Standard Registration Form */
            <form onSubmit={handleSignupSubmit}>
              <div className="field-wrapper slide-element">
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className={signupUsername ? 'has-value' : ''}
                />
                <label>Username</label>
                <User className="field-icon w-4 h-4" />
              </div>

              <div className="field-wrapper slide-element">
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className={signupEmail ? 'has-value' : ''}
                />
                <label>Email</label>
                <Mail className="field-icon w-4 h-4" />
              </div>

              <div className="field-wrapper slide-element">
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className={signupPassword ? 'has-value' : ''}
                />
                <label>Password</label>
                <Lock className="field-icon w-4 h-4" />
              </div>

              <div className="field-wrapper slide-element" style={{ marginTop: '22px' }}>
                <button
                  className="submit-button font-display flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Register</span>
                </button>
              </div>

              <div className="switch-link slide-element">
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-trigger"
                    onClick={() => {
                      handleToggleMode(false);
                      setIsOtpStep(false);
                      setErrorMessage(null);
                    }}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* ================= SIGN UP WELCOME (LEFT) ================= */}
        <div className="welcome-section signup">
          <div className="welcome-badge slide-element">
            <Swords className="h-3.5 w-3.5" />
            <span>JOIN ARENA</span>
          </div>
          <h2 className="slide-element font-display welcome-title">
            WELCOME!
          </h2>
          <p className="slide-element welcome-desc">
            Create tournaments, calculate live matrices & stream overlay graphics.
          </p>
          <div className="welcome-perks slide-element">
            <span className="perk-item"><CheckCircle2 className="h-3 w-3" /> 12 Teams Matrix</span>
            <span className="perk-item"><CheckCircle2 className="h-3 w-3" /> Live Overlays</span>
          </div>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-base text-[var(--text-primary)] font-display flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[var(--accent-primary)]" />
                Reset Account Password
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMessage && <div className="auth-error-banner">{errorMessage}</div>}
            {successMessage && (
              <div className="p-3 rounded-xl bg-[var(--status-live)]/15 border border-[var(--status-live)]/30 text-[var(--status-live)] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <p className="text-xs text-[var(--text-secondary)]">
                  Enter your registered account email to receive a 6-digit password reset OTP code.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                    Account Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-black shadow-md hover:brightness-110 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Send Reset OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotResetSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                    6-Digit OTP Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full p-2.5 text-center tracking-widest font-mono text-sm rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                    New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-black shadow-md hover:brightness-110 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;