import { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { TournamentWorkspace } from './components/workspace/TournamentWorkspace';
import { BroadcastContainer } from './components/broadcast/BroadcastContainer';
import { BroadcastRemoteControl } from './components/broadcast/BroadcastRemoteControl';
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { ToastProvider } from './components/ui/Toast';
import { useTournamentStore } from './store/tournamentStore';
import { useAuthStore } from './store/authStore';
import { preloadAndCacheFonts } from './engine/fontEmbedder';
import type { Tournament } from './types/tournament';

export function App() {
  const { currentTournament, setTournament, setActiveTab } = useTournamentStore();
  const { user, isAuthenticated, theme } = useAuthStore();
  const [viewMode, setViewMode] = useState<'command-center' | 'workspace' | 'admin-dashboard'>('command-center');

  // Preload and cache all font binary Base64 streams in the background
  useEffect(() => {
    preloadAndCacheFonts();
  }, []);

  // Theme Syncing Effect (Supports 'dark' and 'light' mode)
  const currentTheme = theme || user?.preferences?.theme || 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  // Check if running in dedicated OBS Broadcast mode (via query param ?mode=broadcast or /obs /live path)
  const isBroadcastMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get('mode') === 'broadcast' ||
      window.location.pathname.startsWith('/obs') ||
      window.location.pathname.startsWith('/live')
    );
  }, []);

  // Check if running in Remote Operator Controller mode (via query param ?mode=remote or /remote path)
  const isRemoteMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get('mode') === 'remote' ||
      window.location.pathname.startsWith('/remote')
    );
  }, []);

  // 1. Dedicated OBS Browser Source: Zero Admin Chrome Transparent Overlay
  if (isBroadcastMode) {
    return <BroadcastContainer />;
  }

  // 2. Live Match Remote Control Room: Mobile / 2nd-Screen Operator Deck
  if (isRemoteMode) {
    return (
      <ToastProvider>
        <BroadcastRemoteControl />
      </ToastProvider>
    );
  }

  // 3. Protected Organizer & Admin Control Center (Authentication Guard)
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginView />
      </ToastProvider>
    );
  }

  // 4. Dedicated SaaS Platform Admin Dashboard (Strictly Role Gated to Admins)
  if (viewMode === 'admin-dashboard' && user?.role === 'admin') {
    return (
      <ToastProvider>
        <AdminLayout
          onExitAdmin={() => setViewMode('command-center')}
          onOpenTemplateStudio={() => {
            setViewMode('workspace');
            setActiveTab('template-studio');
          }}
        />
        {isAuthenticated && user && !user.isOnboarded && <OnboardingModal />}
      </ToastProvider>
    );
  }

  const handleSelectTournament = (tour: Tournament, targetTab: any = 'overview') => {
    setTournament(tour);
    setActiveTab(targetTab);
    setViewMode('workspace');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] font-sans">
        {/* Top Bar */}
        <Navbar
          viewMode={viewMode}
          onBackToDashboard={() => setViewMode('command-center')}
          onOpenAdminDashboard={() => setViewMode('admin-dashboard')}
        />

        {/* Main Body Container with balanced widescreen proportions */}
        <div className="flex-1 flex w-full">
          {/* Desktop Sidebar (Rendered on Dashboard and Workspace) */}
          <Sidebar
            viewMode={viewMode}
            onSelectDashboard={() => setViewMode('command-center')}
            onSelectWorkspaceTab={(targetTab) => {
              setActiveTab(targetTab);
              setViewMode('workspace');
            }}
            onSelectAdminDashboard={() => setViewMode('admin-dashboard')}
          />

          {/* Dynamic View Area: 100% Full-width responsive workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full overflow-x-hidden">
            <div className="w-full">
              {viewMode === 'command-center' ? (
                <CommandCenter onSelectTournament={handleSelectTournament} />
              ) : (
                <TournamentWorkspace
                  tournament={currentTournament}
                  onBackToDashboard={() => setViewMode('command-center')}
                />
              )}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (in workspace view) */}
        {viewMode === 'workspace' && <BottomNav />}

        {/* Mandatory Non-Skippable First-Time Login Onboarding Modal */}
        {isAuthenticated && user && !user.isOnboarded && <OnboardingModal />}
      </div>
    </ToastProvider>
  );
}

export default App;