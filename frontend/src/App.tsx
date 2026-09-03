import { useState, useMemo, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { TournamentWorkspace } from './components/workspace/TournamentWorkspace';
import { BroadcastContainer } from './components/broadcast/BroadcastContainer';
import { BroadcastRemoteControl } from './components/broadcast/BroadcastRemoteControl';
import { LoginView } from './components/auth/LoginView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { HomePage } from './components/home/HomePage';
import { ToastProvider } from './components/ui/Toast';
import { useTournamentStore } from './store/tournamentStore';
import { useAuthStore } from './store/authStore';
import { preloadAndCacheFonts } from './engine/fontEmbedder';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import type { Tournament } from './types/tournament';

export function App() {
  const { currentTournament, setTournament, setActiveTab } = useTournamentStore();
  const { user, isAuthenticated, theme } = useAuthStore();
  
  // Dynamic Route & View Mode Resolution
  const [viewMode, setViewMode] = useState<'home' | 'command-center' | 'workspace' | 'admin-dashboard'>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
      return 'admin-dashboard';
    }
    if (path.startsWith('/workspace')) {
      return 'workspace';
    }
    if (path.startsWith('/dashboard') || path.startsWith('/tournaments')) {
      return 'command-center';
    }
    // If user has an active stored login session, keep them in their command center workspace on refresh
    const rawStoredUser = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('pointx_auth_session_v1') : null;
    if (rawStoredUser && (path === '/' || path === '')) {
      return 'command-center';
    }
    if (path === '/' || path === '') {
      return 'home';
    }
    return 'command-center';
  });

  const [publicRoute, setPublicRoute] = useState<'home' | 'login' | 'signup'>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const authParam = search.get('auth') || search.get('view');

    if (path.startsWith('/login') || path.startsWith('/signin') || authParam === 'login' || authParam === 'signin') {
      return 'login';
    }
    if (path.startsWith('/signup') || path.startsWith('/register') || authParam === 'signup' || authParam === 'register') {
      return 'signup';
    }
    return 'home';
  });

  // Centralized Navigation Helper with History Synchronization
  const navigateTo = useCallback((
    target: 'home' | 'command-center' | 'workspace' | 'admin-dashboard' | 'login' | 'signup',
    customUrl?: string
  ) => {
    let targetUrl = customUrl;
    if (!targetUrl) {
      switch (target) {
        case 'home':
          targetUrl = '/';
          break;
        case 'login':
          targetUrl = '/login';
          break;
        case 'signup':
          targetUrl = '/signup';
          break;
        case 'command-center':
          targetUrl = '/dashboard';
          break;
        case 'workspace':
          targetUrl = '/workspace';
          break;
        case 'admin-dashboard':
          targetUrl = '/admin';
          break;
      }
    }

    if (typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }

    if (target === 'login' || target === 'signup' || target === 'home') {
      setPublicRoute(target);
    }
    if (target === 'command-center' || target === 'workspace' || target === 'admin-dashboard' || target === 'home') {
      setViewMode(target);
    }
  }, []);

  // Restore and verify authenticated session on mount
  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  // Preload and cache all font binary Base64 streams in the background
  useEffect(() => {
    preloadAndCacheFonts();
  }, []);

  // Synchronize authenticated state with URL location
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.toLowerCase();

    if (isAuthenticated) {
      // If user is authenticated and currently sitting on /login or /signup, redirect immediately to /dashboard
      if (path === '/login' || path === '/signup' || path === '/signin' || path === '/register') {
        navigateTo('command-center', '/dashboard');
      } else if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
        if (user?.role === 'admin') {
          setViewMode('admin-dashboard');
        } else {
          navigateTo('command-center', '/dashboard');
        }
      } else if (path.startsWith('/workspace')) {
        setViewMode('workspace');
      } else if (path.startsWith('/dashboard') || path.startsWith('/tournaments')) {
        setViewMode('command-center');
      } else if (path === '/' || path === '') {
        // If user is logged in, keep their active viewMode (command-center or workspace)
        if (!viewMode || viewMode === 'home') {
          setViewMode('home');
        }
      }
    } else {
      // If unauthenticated and on /admin, show login
      if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
        setPublicRoute('login');
      }
    }
  }, [isAuthenticated, user?.role, navigateTo]);

  // Listen to browser navigation popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const authParam = search.get('auth') || search.get('view');

      if (path.startsWith('/login') || path.startsWith('/signin') || authParam === 'login' || authParam === 'signin') {
        setPublicRoute('login');
      } else if (path.startsWith('/signup') || path.startsWith('/register') || authParam === 'signup' || authParam === 'register') {
        setPublicRoute('signup');
      } else if (path.startsWith('/admin') || path.startsWith('/super-admin')) {
        if (isAuthenticated && user?.role === 'admin') {
          setViewMode('admin-dashboard');
        } else {
          setPublicRoute('login');
        }
      } else if (path.startsWith('/workspace')) {
        setViewMode('workspace');
      } else if (path.startsWith('/dashboard') || path.startsWith('/tournaments')) {
        setViewMode('command-center');
      } else if (path === '/' || path === '') {
        setViewMode('home');
        setPublicRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, user?.role]);

  // Direct URL Tab Navigation Handler (e.g. ?tab=organization or ?tab=template-studio)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab') || searchParams.get('view');
      if (tab === 'organization' || tab === 'organizer') {
        setActiveTab('organization');
        setViewMode('workspace');
      } else if (tab === 'template-studio' || tab === 'templates') {
        setActiveTab('template-studio');
        setViewMode('workspace');
      }
    }
  }, [setActiveTab]);

  // Theme Syncing Effect (Defaults to 'dark' mode)
  const currentTheme = theme || 'dark';

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

  // 3. Unauthenticated Public Visitor Routing (Home vs Sign In vs Register)
  if (!isAuthenticated) {
    if (publicRoute === 'login') {
      return (
        <ToastProvider>
          <LoginView
            initialMode="signin"
            onBackToHome={() => navigateTo('home')}
            onModeChange={(mode) => navigateTo(mode === 'signup' ? 'signup' : 'login')}
            onAuthSuccess={() => navigateTo('command-center', '/dashboard')}
          />
        </ToastProvider>
      );
    }

    if (publicRoute === 'signup') {
      return (
        <ToastProvider>
          <LoginView
            initialMode="signup"
            onBackToHome={() => navigateTo('home')}
            onModeChange={(mode) => navigateTo(mode === 'signup' ? 'signup' : 'login')}
            onAuthSuccess={() => navigateTo('command-center', '/dashboard')}
          />
        </ToastProvider>
      );
    }

    // Default public landing page (Always takes user strictly to signin page)
    return (
      <ToastProvider>
        <HomePage
          onNavigateLogin={() => navigateTo('login')}
          onNavigateSignup={() => navigateTo('login')}
          onNavigateDashboard={() => navigateTo('command-center', '/dashboard')}
        />
      </ToastProvider>
    );
  }

  // 3b. Mandatory Organization Onboarding Guard (Requires organization profile activation)
  if (isAuthenticated && user && !user.isOnboarded) {
    return (
      <ToastProvider>
        <OnboardingModal />
      </ToastProvider>
    );
  }

  // 4. Authenticated Home Page Viewing (if logged-in user navigates to landing page)
  if (viewMode === 'home') {
    return (
      <ToastProvider>
        <HomePage
          onNavigateLogin={() => navigateTo('command-center', '/dashboard')}
          onNavigateSignup={() => navigateTo('command-center', '/dashboard')}
          onNavigateDashboard={() => navigateTo('command-center', '/dashboard')}
        />
      </ToastProvider>
    );
  }

  const handleSelectTournament = (tour: Tournament, targetTab: any = 'overview') => {
    setTournament(tour);
    setActiveTab(targetTab);
    navigateTo('workspace');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] font-sans">
        {/* Top Bar */}
        <Navbar
          viewMode={viewMode}
          onBackToDashboard={() => navigateTo('command-center')}
          onOpenAdminDashboard={() => navigateTo('admin-dashboard')}
          onNavigateHome={() => navigateTo('home')}
          onSelectWorkspaceTab={(targetTab) => {
            setActiveTab(targetTab);
            navigateTo('workspace');
          }}
        />

        {/* Main Body Container with balanced widescreen proportions */}
        <div className="flex-1 flex w-full">
          {/* Desktop Sidebar (Rendered on Dashboard, Workspace, and Admin Control Center) */}
          <Sidebar
            viewMode={viewMode}
            onSelectDashboard={() => navigateTo('command-center')}
            onSelectWorkspaceTab={(targetTab) => {
              setActiveTab(targetTab);
              navigateTo('workspace');
            }}
            onSelectAdminDashboard={() => navigateTo('admin-dashboard')}
          />

          {/* Dynamic View Area: 100% Full-width responsive workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 w-full overflow-x-hidden">
            <div className="w-full">
              {viewMode === 'command-center' ? (
                <CommandCenter onSelectTournament={handleSelectTournament} />
              ) : viewMode === 'admin-dashboard' && user?.role === 'admin' ? (
                <SuperAdminDashboard
                  isEmbedded={true}
                  onExitAdmin={() => navigateTo('command-center')}
                  onOpenTemplateStudio={() => {
                    setActiveTab('template-studio');
                    navigateTo('workspace');
                  }}
                  onControlTournament={(tournament) => {
                    setTournament(tournament);
                    setActiveTab('overview');
                    navigateTo('workspace');
                  }}
                />
              ) : (
                <TournamentWorkspace
                  tournament={currentTournament}
                  onBackToDashboard={() => navigateTo('command-center')}
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