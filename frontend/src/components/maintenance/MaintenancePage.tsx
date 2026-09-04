import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Clock,
  RefreshCw,
  Lock,
  Mail,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { usePlatformStore } from '../../store/platformStore';
import { useAuthStore } from '../../store/authStore';
import { PointXLogo } from '../ui/PointXLogo';

interface MaintenancePageProps {
  onAdminLoginClick?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onAdminLoginClick }) => {
  const {
    maintenanceReason,
    customMessage,
    estimatedReturnTime,
    fetchPlatformStatus,
    isLoading
  } = usePlatformStore();

  const { login } = useAuthStore();

  const [lastCheckTime, setLastCheckTime] = useState<string>('Just now');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastCheckTime('Just now');
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = async () => {
    await fetchPlatformStatus();
    setLastCheckTime('Just now');
  };

  const handleCopyEmail = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('support@pointx.gg');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = 'support@pointx.gg';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setIsContactModalOpen(false);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    }, 2000);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await login(adminEmail.trim().toLowerCase(), adminPassword);
      if (res && res.success) {
        setIsAdminLoginModalOpen(false);
        if (onAdminLoginClick) {
          onAdminLoginClick();
        } else {
          window.location.href = '/admin';
        }
      } else {
        setLoginError(res?.error || 'Authentication failed. Only Super Administrators can log in during maintenance.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Access Denied: Only Super Administrators can log in during maintenance.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#080A10] text-slate-100 flex flex-col items-center justify-between overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Ambient Glows & Esports Arena Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Dynamic Warm Ambient Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[420px] bg-gradient-to-b from-amber-500/15 via-orange-600/10 to-transparent blur-[130px] rounded-full" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[380px] bg-gradient-to-t from-red-600/10 via-amber-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,10,16,0.85)_100%)]" />
      </div>

      {/* Top Header / Branding Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PointXLogo className="h-8 w-auto" forceTheme="dark" />
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase hidden sm:inline-block">
            Esports Arena Platform
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-mono font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
            <span>Contact Us</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdminLoginModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-xs"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin Login</span>
          </button>
        </div>
      </header>

      {/* Central Clean Maintenance Card */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center text-center my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col items-center"
        >
          {/* Animated Server / Shield Centerpiece */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full border border-amber-500/20 animate-[spin_12s_linear_infinite]" />
            <div className="absolute w-40 h-40 rounded-full border border-dashed border-amber-500/15 animate-[spin_20s_linear_infinite_reverse]" />

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-slate-900 border border-amber-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <Server className="w-9 h-9 text-amber-400 animate-pulse" />
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-3 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Platform Maintenance</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase mb-2 font-display">
            Website Under Maintenance
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400 uppercase tracking-widest mb-6">
            PointX Esports Arena
          </p>

          {/* Dynamic Reason & Custom Message Card */}
          <div className="w-full bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-7 backdrop-blur-md shadow-2xl text-left space-y-4 mb-6">
            {maintenanceReason && (
              <div className="pb-3 border-b border-slate-800/80 flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{maintenanceReason}</span>
              </div>
            )}

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              {customMessage ||
                "PointX is currently undergoing scheduled platform upgrades and server calibrations. All tournament portals and live scoring feeds will resume normal operations shortly."}
            </p>

            {/* Estimated Reopening Time */}
            {estimatedReturnTime && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2.5 text-xs sm:text-sm font-mono text-amber-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Estimated Reopening:{' '}
                  <strong className="text-white font-bold">{estimatedReturnTime}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span>Contact Support</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-md hover:scale-[1.02]"
            >
              <Lock className="h-3.5 w-3.5 text-black" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Live Auto-reconnect Pulse */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Auto-checking platform status ({lastCheckTime})</span>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Check now</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <div>
          <span>&copy; 2026 PointX Esports Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Need Help?
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsAdminLoginModalOpen(true)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Administrator Console
          </button>
        </div>
      </footer>

      {/* CONTACT US MODAL */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-slate-800 p-6 shadow-2xl text-left font-sans relative"
            >
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-white font-display">Contact PointX Support</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5 font-mono">
                Our operations team is available during scheduled maintenance.
              </p>

              {/* Direct Support Channels */}
              <div className="space-y-2.5 mb-5">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Support Email</div>
                      <div className="text-xs font-bold text-white">support@pointx.gg</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-[10px] font-mono">{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-4 w-4 text-sky-400" />
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Official Telegram</div>
                      <div className="text-xs font-bold text-white">@Darklordx69</div>
                    </div>
                  </div>
                  <a
                    href="https://t.me/Darklordx69"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-colors text-xs flex items-center gap-1 font-mono"
                  >
                    <span>Open</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Quick Inquiry Form */}
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name or organizer tag"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@organization.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Message / Query</label>
                  <textarea
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Briefly describe your tournament query..."
                    rows={3}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSent}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-emerald-600 text-black font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {contactSent ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span className="text-white">Message Sent Successfully</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPER ADMIN LOGIN MODAL */}
      <AnimatePresence>
        {isAdminLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-slate-800 p-6 sm:p-7 shadow-2xl text-left font-sans relative"
            >
              <button
                type="button"
                onClick={() => {
                  setIsAdminLoginModalOpen(false);
                  setLoginError(null);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Super Administrator Sign In</h3>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Emergency Control Access</span>
                </div>
              </div>

              {/* Security Wall Notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 my-4 flex items-start gap-2 text-xs leading-relaxed text-amber-300">
                <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Strict Security Wall:</strong> Non-admin accounts (organizers and general users) are strictly restricted from logging in while the platform is under maintenance.
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs mb-4 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@pointx.gg"
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-md"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Verifying Super Admin Access...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-black" />
                      <span>Sign In as Super Admin</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
