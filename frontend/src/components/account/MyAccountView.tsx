import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ImageUpload } from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  LogOut,
  Laptop,
  ArrowLeft,
  Users2,
  Building2,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Swords,
  Tv
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'co-organizer' | 'scorer' | 'broadcast_producer' | 'referee';
  status: 'active' | 'invited';
  addedAt: string;
}

const INITIAL_STAFF: StaffMember[] = [];

export const MyAccountView: React.FC = () => {
  const { user, sessions, updateProfile, changePassword, terminateOtherSessions, logout } = useAuthStore();
  const { currentTournament, updateTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'organization' | 'staff' | 'security' | 'sessions'>('profile');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Org form state
  const [organizationName, setOrganizationName] = useState(user?.organizationName || currentTournament?.organizer || '');
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | undefined>(user?.organizationLogoUrl || currentTournament?.organizerLogoUrl);

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pointx_organizer_staff_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return INITIAL_STAFF;
  });

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffMember['role']>('scorer');
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phoneNumber });
    showToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Account profile details saved.'
    });
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ organizationName, organizationLogoUrl });
    if (currentTournament?.id) {
      updateTournament(currentTournament.id, {
        organizer: organizationName,
        organizerLogoUrl: organizationLogoUrl
      });
    }
    showToast({
      type: 'success',
      title: 'Organization Saved',
      message: 'Host branding and logos saved across all overlays.'
    });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showToast({ type: 'error', title: 'Input Required', message: 'Enter name and email for the staff member.' });
      return;
    }

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      status: 'active',
      addedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newMember, ...staffList];
    setStaffList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pointx_organizer_staff_v1', JSON.stringify(updated));
    }

    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddStaffModal(false);

    showToast({
      type: 'success',
      title: 'Staff Member Added',
      message: `${newMember.name} is now authorized to manage tournament operations.`
    });
  };

  const handleRemoveStaff = (id: string) => {
    const updated = staffList.filter((s) => s.id !== id);
    setStaffList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pointx_organizer_staff_v1', JSON.stringify(updated));
    }
    showToast({ type: 'info', title: 'Staff Removed', message: 'Staff member permissions revoked.' });
  };

  const handleCopyOperatorLink = (staff: StaffMember) => {
    const link = `${window.location.origin}/remote?tour=${currentTournament?.id || 'live'}&role=${staff.role}&staff=${encodeURIComponent(staff.name)}`;
    navigator.clipboard.writeText(link);
    setCopiedStaffId(staff.id);
    setTimeout(() => setCopiedStaffId(null), 2500);
    showToast({
      type: 'success',
      title: 'Operator Link Copied',
      message: `Direct Operator Access URL for ${staff.name} copied to clipboard.`
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
    <div className="w-full space-y-6 font-sans">
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
              Account & Organization Management
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage your personal credentials, host branding, staff operators, and security settings.
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

      {/* Account Info Card */}
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
          <span>Host: <strong className="text-[var(--text-primary)] font-sans">{user.organizationName || 'Independent Organizer'}</strong></span>
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
          onClick={() => setActiveSubTab('organization')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'organization'
              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Host Branding</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'staff'
              ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Users2 className="h-4 w-4" />
          <span>Staff & Operators ({staffList.length})</span>
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
          <span>Security</span>
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

      {/* Sub Tab: Profile */}
      {activeSubTab === 'profile' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Personal Credentials</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Contact Email (Verified)"
              type="email"
              value={email}
              disabled
              className="opacity-75 cursor-not-allowed"
            />
            <Input
              label="Contact Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
            />

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" type="submit">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: Organization */}
      {activeSubTab === 'organization' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Esports Host & Organisation Branding</h3>
          <form onSubmit={handleOrgSubmit} className="space-y-5">
            <Input
              label="Organisation / Club Name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Total Gaming Esports"
              required
            />

            <div>
              <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Official Host Logo
              </label>
              <ImageUpload
                value={organizationLogoUrl}
                onChange={setOrganizationLogoUrl}
                label="Upload Host Logo"
              />
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" type="submit">
                Save Organisation Branding
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: Staff & Operators */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-base font-display flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-[var(--accent-primary)]" />
                  Staff & Tournament Operator Delegation
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Authorize team members and referees to calculate match scores, run OBS overlays, or co-manage brackets.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddStaffModal(true)}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Add Staff Member
              </Button>
            </div>

            {/* Quick Operator Roles Explainer Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] font-mono">
                  <Swords className="h-4 w-4" />
                  <span>Match Scorer</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Records live placement, kill counts, and confirms booyahs.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
                  <Tv className="h-4 w-4" />
                  <span>Broadcast Producer</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Controls OBS overlays, lower-thirds, and 4K social banners.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                  <Shield className="h-4 w-4" />
                  <span>Co-Organizer</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">Full permissions to edit teams, scoring rules, and settings.</p>
              </div>
            </div>

            {/* Staff List Table */}
            <div className="border border-[var(--border-subtle)] rounded-2xl overflow-hidden bg-[var(--bg-surface-inset)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[var(--bg-surface-raised)] border-b border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] uppercase">
                    <tr>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Role & Permissions</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Added Date</th>
                      <th className="px-4 py-3 text-right">Operator Link & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-xs text-[var(--text-muted)] font-sans">
                          <Users2 className="h-8 w-8 mx-auto mb-2 opacity-30 text-[var(--accent-primary)]" />
                          <div className="font-bold text-[var(--text-secondary)]">No Staff Delegated Yet</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-1">
                            Click &ldquo;Add Staff Member&rdquo; above to assign match scorekeepers or OBS stream producers.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="px-4 py-3.5 font-sans font-bold text-[var(--text-primary)]">
                          <div>{staff.name}</div>
                          <div className="text-[11px] font-mono font-normal text-[var(--text-secondary)]">{staff.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              staff.role === 'co-organizer'
                                ? 'amber'
                                : staff.role === 'broadcast_producer'
                                ? 'cyan'
                                : 'emerald'
                            }
                            size="sm"
                          >
                            {staff.role === 'co-organizer'
                              ? 'CO-ORGANIZER'
                              : staff.role === 'broadcast_producer'
                              ? 'BROADCAST PRODUCER'
                              : staff.role === 'scorer'
                              ? 'MATCH SCORER'
                              : 'REFEREE'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[var(--text-muted)] text-[11px]">
                          {staff.addedAt}
                        </td>
                        <td className="px-4 py-3.5 text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyOperatorLink(staff)}
                              leftIcon={copiedStaffId === staff.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-[var(--accent-primary)]" />}
                            >
                              {copiedStaffId === staff.id ? 'Copied Link' : 'Copy Operator Link'}
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStaff(staff.id)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove staff permissions"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Add Staff Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl space-y-4 font-sans">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <h3 className="font-bold text-base text-[var(--text-primary)] font-display flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[var(--accent-primary)]" />
                    Authorize New Staff Member
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-4">
                  <Input
                    label="Staff Member Full Name *"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Vikram Joshi"
                    required
                  />

                  <Input
                    label="Staff Email Address *"
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="vikram@esports.in"
                    required
                  />

                  <div>
                    <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Assign Operational Role
                    </label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] font-sans focus:border-[var(--accent-primary)] outline-none"
                    >
                      <option value="scorer">Match Scorer & Points Operator (Scorecard & Kill Entry)</option>
                      <option value="broadcast_producer">Broadcast & Overlay Producer (OBS Transparent URL & Graphics)</option>
                      <option value="co-organizer">Co-Organizer (Full Administrative Tournament Access)</option>
                      <option value="referee">Tournament Referee (Roster Verification & Rules Checking)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                    <Button variant="outline" size="sm" type="button" onClick={() => setShowAddStaffModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Authorize & Generate Access
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab: Security */}
      {activeSubTab === 'security' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Authentication & Security</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button variant="primary" size="md" type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sub Tab: Sessions */}
      {activeSubTab === 'sessions' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-[var(--shadow-flat)] space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Connected Devices & Browser Sessions</h3>
            <Button variant="danger" size="sm" onClick={terminateOtherSessions}>
              Log Out Other Devices
            </Button>
          </div>

          <div className="space-y-3">
            {sessions.map((sess) => (
              <div key={sess.id} className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{sess.deviceName || 'Authenticated Device'} • {sess.browser}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">{sess.ipAddress || 'Active'} • {new Date(sess.lastActive).toLocaleString()}</div>
                </div>
                {sess.isCurrent && <Badge variant="live" size="sm">THIS DEVICE</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccountView;