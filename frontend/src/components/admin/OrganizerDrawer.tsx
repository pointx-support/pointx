import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Trash2,
  Edit3,
  Trophy,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { AdminUserRecord } from '../../types/admin';
import { adminApi, tournamentsApi } from '../../services/api';

export interface OrganizerDrawerProps {
  organizer: AdminUserRecord | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onSuspend: (id: string, reason: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (organizer: AdminUserRecord) => void;
  onPromote?: (id: string) => void;
  onDemote?: (id: string) => void;
  onControlTournament?: (tournament: any) => void;
}

export const OrganizerDrawer: React.FC<OrganizerDrawerProps> = ({
  organizer,
  onClose,
  onApprove,
  onReject,
  onSuspend,
  onRestore,
  onDelete,
  onEdit,
  onPromote,
  onDemote,
  onControlTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'activity' | 'tournaments'>('profile');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [organizerTournaments, setOrganizerTournaments] = useState<any[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);

  if (!organizer) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved / Active
          </span>
        );
      case 'pending_verification':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold animate-pulse">
            <Clock className="h-3.5 w-3.5" /> Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
            <X className="h-3.5 w-3.5" /> Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
            <Ban className="h-3.5 w-3.5" /> Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
            {status}
          </span>
        );
    }
  };

  const handleConfirmReject = () => {
    if (organizer) {
      onReject(organizer.id || (organizer as any)._id, rejectReason || 'Did not meet platform criteria');
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleConfirmSuspend = () => {
    if (organizer) {
      onSuspend(organizer.id || (organizer as any)._id, suspendReason || 'Violation of terms');
      setShowSuspendModal(false);
      setSuspendReason('');
    }
  };

  const handleConfirmDelete = () => {
    if (organizer) {
      onDelete(organizer.id || (organizer as any)._id);
      setShowDeleteModal(false);
      onClose();
    }
  };

  const fetchTournaments = async () => {
    if (!organizer) return;
    const orgId = organizer.id || (organizer as any)._id;
    if (!orgId) return;
    setIsLoadingTournaments(true);
    try {
      const res = await adminApi.getOrganizerTournaments(orgId);
      if (res && res.data) {
        setOrganizerTournaments(res.data);
      }
    } catch (err) {
      console.error('Failed to load organizer tournaments:', err);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'tournaments') {
      fetchTournaments();
    }
  }, [activeTab, organizer?.id]);

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this tournament? All associated match results will be removed.')) {
      return;
    }
    setDeletingTourId(tournamentId);
    try {
      await tournamentsApi.delete(tournamentId);
      setOrganizerTournaments((prev) => prev.filter((t) => (t.id || t.customId) !== tournamentId));
    } catch (err) {
      alert('Failed to delete tournament: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingTourId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* Click Outside Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Card */}
      <div className="w-full max-w-xl bg-[#0D111A] border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl overflow-hidden font-sans">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#111624]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {organizer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{organizer.name}</h2>
              <p className="text-xs font-mono text-cyan-400">
                {organizer.organizerId || `ORG-${organizer.id.slice(-6).toUpperCase()}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-header Banner */}
        <div className="p-5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getStatusBadge(organizer.status)}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
              organizer.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>{organizer.role === 'admin' ? 'Admin / Super Admin' : 'Organizer'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {organizer.role === 'admin' ? (
              onDemote && (
                <button
                  type="button"
                  onClick={() => onDemote(organizer.id || (organizer as any)._id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
                  title="Demote to standard organizer"
                >
                  <User className="h-3.5 w-3.5" /> Demote to Organizer
                </button>
              )
            ) : (
              onPromote && (
                <button
                  type="button"
                  onClick={() => onPromote(organizer.id || (organizer as any)._id)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Promote account to Admin / Super Admin"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Promote to Admin
                </button>
              )
            )}
            <button
              onClick={() => onEdit(organizer)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0B0F17]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Organizer Profile
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'organization'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Organization Info
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Platform Telemetry
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tournaments'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Tournaments</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold">
              {organizerTournaments.length || organizer.tournamentsCreatedCount || 0}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <User className="h-3.5 w-3.5 text-cyan-400" /> Full Name
                  </div>
                  <div className="text-sm font-bold text-white">{organizer.name}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Mail className="h-3.5 w-3.5 text-cyan-400" /> Email Address
                  </div>
                  <div className="text-sm font-bold text-white truncate">{organizer.email}</div>
                  <div className="text-[11px] text-slate-400">
                    Verified: {organizer.isEmailVerified ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Phone className="h-3.5 w-3.5 text-cyan-400" /> Phone Number
                  </div>
                  <div className="text-sm font-bold text-white">
                    {organizer.phoneNumber || 'Not provided'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Registration Date
                  </div>
                  <div className="text-sm font-bold text-white">
                    {organizer.createdAt ? new Date(organizer.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Suspension Warning if suspended */}
              {organizer.status === 'suspended' && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-1">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" /> Account Suspended
                  </div>
                  <p className="text-xs text-rose-200/90">
                    Reason: {organizer.suspensionReason || 'Violation of platform policies.'}
                  </p>
                  {organizer.suspendedAt && (
                    <div className="text-[11px] text-rose-400 font-mono">
                      Suspended on: {new Date(organizer.suspendedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Organization Name</div>
                    <div className="text-base font-bold text-white">
                      {organizer.organizationName || 'Individual Organizer'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono">Org Size: </span>
                    <span className="text-white font-bold">{organizer.orgSize || '1-10 members'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono">Onboarded: </span>
                    <span className="text-white font-bold">{organizer.isOnboarded ? 'Completed' : 'Incomplete'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
                    <Trophy className="h-4 w-4 text-cyan-400" /> Tournaments Created
                  </div>
                  <div className="text-2xl font-black text-white">{organizer.tournamentsCreatedCount || 0}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
                    <Clock className="h-4 w-4 text-cyan-400" /> Total Logins
                  </div>
                  <div className="text-2xl font-black text-white">{organizer.loginCount || 1}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-cyan-400" />
                    <span>Organizer's Tournaments</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    View, manage, or take direct control of tournaments created by {organizer.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchTournaments}
                  disabled={isLoadingTournaments}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1 border border-slate-700 disabled:opacity-50"
                  title="Refresh tournaments list"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTournaments ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              {isLoadingTournaments ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                  <span className="text-xs font-mono">Loading tournaments...</span>
                </div>
              ) : organizerTournaments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <Trophy className="h-8 w-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No Tournaments Found</div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This organizer hasn't created any tournaments yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {organizerTournaments.map((t) => {
                    const tourId = t.id || t.customId;
                    const isDeleting = deletingTourId === tourId;
                    const statusColor =
                      t.status === 'Live' || t.status === 'Ongoing'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : t.status === 'Completed'
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300';

                    return (
                      <div
                        key={tourId}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white truncate" title={t.title}>
                                {t.title}
                              </h4>
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${statusColor}`}
                              >
                                {t.status || 'Draft'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                              <span>Game: <strong className="text-slate-200">{t.game || 'Free Fire'}</strong></span>
                              <span>•</span>
                              <span>ID: <code className="text-cyan-400">{tourId}</code></span>
                            </div>
                          </div>
                        </div>

                        {/* Tournament Metrics Row */}
                        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
                          <div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">Teams</div>
                            <div className="font-bold text-white">{t.teams?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">Matches</div>
                            <div className="font-bold text-white">{t.matches?.length || 0}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">Created</div>
                            <div className="font-bold text-slate-300 text-[11px]">
                              {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Control Actions Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onControlTournament) {
                                onControlTournament(t);
                                onClose();
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="Open in Tournament Workspace to control points, matches, and broadcast"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Manage / Control in Workspace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTournament(tourId)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Delete this tournament"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar Bottom Bar */}
        <div className="p-5 border-t border-slate-800 bg-[#111624] space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Super Admin Controls
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(organizer.status === 'pending_verification' || organizer.status === 'rejected') && (
              <button
                onClick={() => onApprove(organizer.id || (organizer as any)._id)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve Organizer
              </button>
            )}

            {organizer.status === 'pending_verification' && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" /> Reject Request
              </button>
            )}

            {organizer.status === 'active' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Ban className="h-4 w-4" /> Suspend Account
              </button>
            )}

            {organizer.status === 'suspended' && (
              <button
                onClick={() => onRestore(organizer.id || (organizer as any)._id)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" /> Restore Account
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className="py-2.5 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <X className="h-5 w-5 text-amber-400" /> Reject Organizer Registration
            </h3>
            <p className="text-xs text-slate-300">
              Provide an optional rejection reason for {organizer.name}:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid organization documentation..."
              className="w-full bg-[#131825] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 h-24"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ban className="h-5 w-5 text-rose-400" /> Suspend Organizer Account
            </h3>
            <p className="text-xs text-slate-300">
              Provide a suspension reason for {organizer.name}:
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Violation of tournament host guidelines..."
              className="w-full bg-[#131825] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500 h-24"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Permanent Account Deletion
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete account <strong>{organizer.name}</strong> ({organizer.email})? This action will remove all associated tournaments and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
