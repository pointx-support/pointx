import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTournamentStore } from '../../store/tournamentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { PointXLogo } from '../ui/PointXLogo';
import {
  Building2,
  User,
  Phone,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import type { User as UserType } from '../../types/auth';

export const OnboardingModal: React.FC = () => {
  const { user, completeOnboarding } = useAuthStore();
  const { currentTournament, updateTournament } = useTournamentStore();
  const { showToast } = useToast();

  // Fresh, empty state with zero auto-filling
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<UserType['gender']>('');
  const [orgSize, setOrgSize] = useState<string>('');
  const [heardFrom, setHeardFrom] = useState('');
  const [customHeardFrom, setCustomHeardFrom] = useState('');

  if (!user || user.isOnboarded) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter your full name.' });
      return;
    }
    if (!organizationName.trim()) {
      showToast({ type: 'error', title: 'Organisation Name Required', message: 'Please enter your organisation name.' });
      return;
    }
    if (!phoneNumber.trim()) {
      showToast({ type: 'error', title: 'Phone Number Required', message: 'Please provide a contact number.' });
      return;
    }
    if (!gender) {
      showToast({ type: 'error', title: 'Gender Required', message: 'Please select your gender.' });
      return;
    }
    if (!orgSize) {
      showToast({ type: 'error', title: 'Org Size Required', message: 'Please select your organisation size.' });
      return;
    }
    if (!heardFrom) {
      showToast({ type: 'error', title: 'Source Required', message: 'Please select how you knew this website.' });
      return;
    }

    const finalHeardFrom = heardFrom === 'Other' && customHeardFrom.trim() ? customHeardFrom.trim() : heardFrom;

    completeOnboarding({
      name: name.trim(),
      organizationName: organizationName.trim(),
      phoneNumber: phoneNumber.trim(),
      gender: gender as UserType['gender'],
      orgSize: orgSize as UserType['orgSize'],
      heardFrom: finalHeardFrom
    });

    // Update active tournament organiser if exists
    if (currentTournament?.id) {
      updateTournament(currentTournament.id, {
        organizer: organizationName.trim()
      });
    }

    showToast({
      type: 'success',
      title: 'Welcome to PointX! 🎉',
      message: `Profile initialized for ${organizationName.trim()}. Enjoy the studio!`
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-sans overflow-y-auto animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl my-auto sm:my-8 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* Top Decorative Gradient Ribbon */}
        <div className="h-1.5 sm:h-2 w-full shrink-0 bg-gradient-to-r from-[var(--accent-primary)] via-amber-400 to-[var(--accent-secondary)]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-7 pb-3 sm:pb-4 text-center border-b border-[var(--border-subtle)] space-y-2 sm:space-y-3 shrink-0">
          <div className="flex justify-center mb-0.5 sm:mb-1">
            <PointXLogo className="h-8 sm:h-10 w-auto object-contain select-none" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
              <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Initial Organizer Setup
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] font-display tracking-tight">
              Welcome to PointX Esports Studio
            </h2>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto line-clamp-2 sm:line-clamp-none">
              Please complete your organization profile to activate your esports workspace.
            </p>
          </div>
        </div>

        {/* Mandatory Onboarding Form (Smooth Scrollable Container on Mobile) */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-4 sm:p-7 space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {/* 1. Full Name & Organization Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                leftIcon={<User className="h-4 w-4 text-[var(--text-muted)]" />}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-1">
              <Input
                label="Organisation Name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organisation name"
                leftIcon={<Building2 className="h-4 w-4 text-[var(--text-muted)]" />}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* 2. Contact Number & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <Input
                label="Contact Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter contact number"
                leftIcon={<Phone className="h-4 w-4 text-[var(--text-muted)]" />}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Gender:
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className={`w-full appearance-none px-3.5 sm:px-4 py-2.5 sm:py-2.5 pr-10 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-inner ${
                    !gender ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  }`}
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="male" className="text-[var(--text-primary)]">Male</option>
                  <option value="female" className="text-[var(--text-primary)]">Female</option>
                  <option value="prefer-not-to-say" className="text-[var(--text-primary)]">Prefer not to say</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Org Size & How did you know this website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                Org Size:
              </label>
              <div className="relative">
                <select
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                  className={`w-full appearance-none px-3.5 sm:px-4 py-2.5 sm:py-2.5 pr-10 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-inner ${
                    !orgSize ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  }`}
                  required
                >
                  <option value="" disabled>Select Org Size</option>
                  <option value="200+" className="text-[var(--text-primary)]">200+</option>
                  <option value="500+" className="text-[var(--text-primary)]">500+</option>
                  <option value="1000+" className="text-[var(--text-primary)]">1000+</option>
                  <option value="5000+" className="text-[var(--text-primary)]">5000+</option>
                  <option value="10,000+" className="text-[var(--text-primary)]">10,000+</option>
                  <option value="20,000+" className="text-[var(--text-primary)]">20,000+</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                How Did You Know This Website?
              </label>
              <div className="relative">
                <select
                  value={heardFrom}
                  onChange={(e) => setHeardFrom(e.target.value)}
                  className={`w-full appearance-none px-3.5 sm:px-4 py-2.5 sm:py-2.5 pr-10 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-inner ${
                    !heardFrom ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  }`}
                  required
                >
                  <option value="" disabled>Select Source</option>
                  <option value="YouTube" className="text-[var(--text-primary)]">YouTube</option>
                  <option value="Instagram" className="text-[var(--text-primary)]">Instagram</option>
                  <option value="Discord" className="text-[var(--text-primary)]">Discord Community</option>
                  <option value="Tournament Organizer" className="text-[var(--text-primary)]">Tournament Host / Organizer</option>
                  <option value="Friend" className="text-[var(--text-primary)]">Friend / Colleague</option>
                  <option value="Google" className="text-[var(--text-primary)]">Google / Web Search</option>
                  <option value="Other" className="text-[var(--text-primary)]">Other Source</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {heardFrom === 'Other' && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <Input
                label="Specify Source"
                value={customHeardFrom}
                onChange={(e) => setCustomHeardFrom(e.target.value)}
                placeholder="Enter where you found us"
                autoComplete="off"
                required
              />
            </div>
          )}

          {/* Notice Banner */}
          <div className="p-3 rounded-xl sm:rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center gap-2 text-[11px] sm:text-xs text-[var(--text-secondary)] font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
            <span>Personalizes your broadcast overlays and leaderboard graphics.</span>
          </div>

          {/* Submit Button */}
          <div className="pt-1.5 sm:pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center py-3 sm:py-3.5 font-bold shadow-lg text-xs sm:text-sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue / Complete Organization Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
