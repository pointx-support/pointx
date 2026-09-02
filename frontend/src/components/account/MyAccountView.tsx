import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  LogOut,
  Laptop,
  ArrowLeft
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

export const MyAccountView: React.FC = () => {
  const { user, sessions, updateProfile, changePassword, terminateOtherSessions, logout } = useAuthStore();
  const { currentTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [organizationName, setOrganizationName] = useState(user?.organizationName || currentTournament?.organizer || '');

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, organizationName });
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Account profile details saved.'
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', title: 'Password Mismatch', message: 'New passwords do not match.' });
      return;
    }
    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your account password has been updated securely.'
      });
    } else {
      showToast({
        type: 'error',
        title: 'Password Error',
        message: res.error || 'Failed to change password.'
      });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goBackTab}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <UserIcon className="h-6 w-6 text-[var(--accent-primary)]" />
              Account Management & Security Portal
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage your organizer profile, authentication credentials, and active browser sessions.
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Sign Out
        </Button>
      </div>

      {/* Account Info Pill Strip */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface-inset)] text-2xl font-bold text-[var(--accent-primary)] font-mono border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-[var(--text-primary)] text-lg font-display">{user.name}</h3>
              <Badge variant="cyan" size="sm">
                <Shield className="h-3.5 w-3.5 mr-1" />
                {user.role.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-[var(--text-secondary)]">
          <span>Org: <strong className="text-[var(--text-primary)] font-sans">{user.organizationName || 'Independent'}</strong></span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] rounded-2xl w-fit shadow-[var(--shadow-inset)] flex-wrap">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'sessions'
              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Laptop className="h-4 w-4" />
          <span>Active Sessions</span>
        </button>
      </div>

      {/* Sub Tab View */}
      {activeSubTab === 'profile' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Organizer Profile</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Esports Organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" type="submit">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'security' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Update Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'sessions' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Active Browser Sessions</h3>
            <div className="flex items-center gap-2.5">
              <Badge variant="coral" size="sm">
                {sessions.length} Sessions
              </Badge>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  terminateOtherSessions();
                  showToast({ type: 'info', title: 'Sessions Terminated', message: 'Logged out other devices.' });
                }}
              >
                Log Out Others
              </Button>
            </div>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] font-mono text-xs sm:text-sm">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-3.5 flex items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5">
                  <Laptop className="h-5 w-5 text-[var(--text-secondary)] shrink-0" />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] font-sans flex items-center gap-2">
                      {sess.deviceName}
                      {sess.isCurrent && (
                        <span className="text-xs text-[var(--status-live)] font-mono bg-[var(--status-live)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--status-live)]/20 font-bold">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      IP: {sess.ipAddress} • {sess.browser} • Last active: {sess.lastActive}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};