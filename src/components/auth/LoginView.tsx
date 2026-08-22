import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, Mail, Lock, User, Sparkles, Sun, Moon, Zap, Swords, CheckCircle2 } from 'lucide-react';
import { PointXLogo } from '../ui/PointXLogo';
import './LoginView.css';

export const LoginView: React.FC = () => {
  const { theme, toggleTheme, login, signup } = useAuthStore();

  // Mode toggled state: false = Sign In active, true = Sign Up active (adds .toggled)
  const [isToggled, setIsToggled] = useState(false);

  // Sign In form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up form fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToUse = loginEmail.includes('@') ? loginEmail : `${loginEmail.trim()}@pointx.gg`;
    const res = login(emailToUse, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailToUse = signupEmail.includes('@') ? signupEmail : `${signupEmail.trim()}@pointx.gg`;
    const res = signup(signupUsername, emailToUse, signupPassword, 'Independent Esports Organizer');
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      // Switch form to login
      setLoginEmail(emailToUse);
      setLoginPassword('');
      setSignupPassword('');
      setSignupUsername('');
      setIsToggled(false);
      setSuccessMessage('🎉 Signup successful! Please enter your password to sign in.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'organizer') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'admin') {
      login('shakti@strikzesports.com', 'admin123');
    } else {
      login('organizer@apexleague.gg', 'org123');
    }
  };

  return (
    <div className="auth-page font-sans transition-colors duration-200">
      {/* Top Header Row with Clean Brand Badge and Theme Toggle */}
      <div className="w-full max-w-[860px] flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center shrink-0">
            <PointXLogo className="h-8 sm:h-9 w-auto max-w-[110px] object-contain select-none" />
          </div>
          <div className="flex flex-col border-l border-[var(--border-subtle)] pl-3">
            <span className="font-bold text-xs font-mono text-[var(--accent-primary)] uppercase tracking-wider">
              By Strikz Esports
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase -mt-0.5">
              Tournament Operating System
            </span>
          </div>
        </div>

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
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-[var(--accent-primary)]" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
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
                setIsToggled(false);
                setErrorMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mobile-switch-btn ${isToggled ? 'active' : ''}`}
              onClick={() => {
                setIsToggled(true);
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
            <div className="auth-error-banner slide-element">{errorMessage}</div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="field-wrapper slide-element">
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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

            <div className="field-wrapper slide-element" style={{ marginTop: '22px' }}>
              <button className="submit-button font-display" type="submit">
                Sign In
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="register-trigger"
                  onClick={() => {
                    setIsToggled(true);
                    setErrorMessage(null);
                  }}
                >
                  Register Now
                </button>
              </p>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="demo-access-panel slide-element">
              <div className="demo-title">QUICK ACCESS DEMO</div>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="demo-btn"
                >
                  <div className="btn-header">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>Lead Admin</span>
                  </div>
                  <div className="btn-role">Full Access</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('organizer')}
                  className="demo-btn"
                >
                  <div className="btn-header">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    <span>Organizer</span>
                  </div>
                  <div className="btn-role">Tournaments & OBS</div>
                </button>
              </div>
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
          <h2 className="slide-element font-display">Register</h2>

          {errorMessage && isToggled && (
            <div className="auth-error-banner slide-element">{errorMessage}</div>
          )}

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
              <button className="submit-button font-display" type="submit">
                Register
              </button>
            </div>

            <div className="switch-link slide-element">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="login-trigger"
                  onClick={() => {
                    setIsToggled(false);
                    setErrorMessage(null);
                  }}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
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
    </div>
  );
};

export default LoginView;