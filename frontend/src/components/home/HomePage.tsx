import React from 'react';
import { HomeNavbar } from './HomeNavbar';
import { HeroSection } from './HeroSection';
import { LiveEnergySection } from './LiveEnergySection';
import { TournamentShowcase } from './TournamentShowcase';
import { LiveStandingsPreview } from './LiveStandingsPreview';
import { PlatformFeatures } from './PlatformFeatures';
import { FeaturedGames } from './FeaturedGames';
import { OrganizerExperience } from './OrganizerExperience';
import { FinalCTA } from './FinalCTA';
import { HomeFooter } from './HomeFooter';

export interface HomePageProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
  onNavigateDashboard: () => void;
}

/**
 * High-Performance Master Home Page:
 * - Locked & preserved cinematic hero section.
 * - Dynamic Light/Dark theme responsiveness with dark default.
 * - 60 FPS GPU-accelerated scrolling with zero layout shift.
 * - Interactive live tournament calculation engine & OBS broadcast telemetry preview.
 */
export const HomePage: React.FC<HomePageProps> = ({
  onNavigateLogin,
  onNavigateSignup,
  onNavigateDashboard,
}) => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] font-sans antialiased overflow-x-hidden transition-colors duration-200">
      {/* Public Landing Navigation Bar */}
      <HomeNavbar
        onNavigateLogin={onNavigateLogin}
        onNavigateSignup={onNavigateSignup}
        onNavigateDashboard={onNavigateDashboard}
      />

      {/* Page Content */}
      <main className="flex-1 w-full">
        {/* Section 1: Minimal Hero with Full-Screen Cinematic Video (LOCKED & UNTOUCHED) */}
        <HeroSection
          onNavigateLogin={onNavigateLogin}
          onNavigateSignup={onNavigateSignup}
        />

        {/* Section 2: Live Gaming Energy Telemetry & Ticker */}
        <LiveEnergySection />

        {/* Section 3: Tournament Showcase & Championship Brackets */}
        <TournamentShowcase
          onNavigateSignup={onNavigateSignup}
          onNavigateLogin={onNavigateLogin}
        />

        {/* Section 4: Live Interactive Telemetry Matrix & OBS Overlay Preview */}
        <LiveStandingsPreview />

        {/* Section 5: Platform Features & Architecture */}
        <PlatformFeatures />

        {/* Section 6: Multi-Title Supported Games */}
        <FeaturedGames onNavigateSignup={onNavigateSignup} />

        {/* Section 7: Tournament Organizer Production Workflow */}
        <OrganizerExperience
          onNavigateSignup={onNavigateSignup}
          onNavigateLogin={onNavigateLogin}
        />

        {/* Section 8: Dramatic Final Call to Action */}
        <FinalCTA
          onNavigateSignup={onNavigateSignup}
          onNavigateLogin={onNavigateLogin}
        />
      </main>

      {/* Public Landing Footer */}
      <HomeFooter />
    </div>
  );
};

export default HomePage;
