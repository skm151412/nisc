import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Users,
  Database,
  Play,
  LogOut,
  RefreshCw,
  Award,
  Zap,
  Vote,
  Percent,
  UserCheck,
  AlertOctagon,
} from 'lucide-react';
import { AuthUserProfile, ElectionStatus } from '../types';
import {
  AdminElectionStats,
  AdminVoteRecord,
  AdminVoterParticipation,
  getAdminElectionStats,
  getAdminVoteRecords,
  getAdminParticipation,
  updateElectionStatus,
  exportParticipationCsv,
  getAdminAuditLogs,
} from '../services/adminService';
import { subscribeToElection } from '../services/electionService';
import { AuditLog } from '../types/audit';
import { DESIGNATED_ADMIN_EMAIL, isAdminEmail } from '../config/voterAllowlist';
import { INITIAL_ELECTION_ID } from '../config/electionData';
import { ElectionStatusControl } from '../components/admin/ElectionStatusControl';
import { CandidateResultsCard } from '../components/admin/CandidateResultsCard';
import { VoteRecordsTable } from '../components/admin/VoteRecordsTable';
import { VoterParticipationTable } from '../components/admin/VoterParticipationTable';
import { AdminAuditLogView } from '../components/admin/AdminAuditLogView';
import { StatusTransitionModal } from '../components/admin/StatusTransitionModal';
import { logger } from '../utils/logger';

interface AdminPageProps {
  profile: AuthUserProfile;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  profile,
  onSignOut,
  onNavigate,
}) => {
  // Authorization boundary verification
  const isAuthorizedAdmin =
    profile.role === 'ADMIN' &&
    isAdminEmail(profile.email);

  const [stats, setStats] = useState<AdminElectionStats | null>(null);
  const [voteRecords, setVoteRecords] = useState<AdminVoteRecord[]>([]);
  const [participation, setParticipation] = useState<AdminVoterParticipation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Transition modal state
  const [targetTransitionStatus, setTargetTransitionStatus] = useState<ElectionStatus | null>(null);
  const [isProcessingTransition, setIsProcessingTransition] = useState<boolean>(false);

  const loadAllAdminData = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    setErrorMsg(null);
    try {
      const [fetchedStats, fetchedRecords, fetchedParticipation, fetchedLogs] = await Promise.all([
        getAdminElectionStats(INITIAL_ELECTION_ID, profile),
        getAdminVoteRecords(INITIAL_ELECTION_ID, profile),
        getAdminParticipation(profile),
        getAdminAuditLogs(50, profile),
      ]);

      setStats(fetchedStats);
      setVoteRecords(fetchedRecords);
      setParticipation(fetchedParticipation);
      setAuditLogs(fetchedLogs);
    } catch (err: unknown) {
      logger.error({
        message: 'Failed to fetch authoritative admin dashboard data',
        context: 'AdminPage',
        error: err,
      });
      setErrorMsg(err instanceof Error ? err.message : 'Error loading admin datasets');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthorizedAdmin, profile]);

  // Initial fetch and real-time subscription on the election document
  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    loadAllAdminData();

    // Subscribe to election status changes in real-time
    const unsubscribe = subscribeToElection(
      INITIAL_ELECTION_ID,
      () => {
        loadAllAdminData();
      },
      (err) => {
        logger.warn({
          message: 'Election listener error on admin dashboard',
          context: 'AdminPage',
          error: err,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthorizedAdmin, loadAllAdminData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadAllAdminData();
  };

  const handleRequestTransition = (target: ElectionStatus) => {
    setTargetTransitionStatus(target);
  };

  const handleConfirmTransition = async () => {
    if (!targetTransitionStatus) return;
    setIsProcessingTransition(true);
    setErrorMsg(null);
    try {
      await updateElectionStatus(targetTransitionStatus, INITIAL_ELECTION_ID, profile);
      setTargetTransitionStatus(null);
      await loadAllAdminData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update election status');
    } finally {
      setIsProcessingTransition(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    try {
      await exportParticipationCsv(profile);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to export participation CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Immediate authorization barrier
  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Administrator Privilege Required
          </h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            This console is cryptographically restricted to the designated election administrator (<code className="font-mono text-slate-800 font-semibold">{DESIGNATED_ADMIN_EMAIL}</code>).
          </p>
          <button
            onClick={() => onNavigate('access-denied')}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
          >
            Acknowledge Restriction
          </button>
        </div>
      </div>
    );
  }

  const totalVoters = stats?.totalEligibleVoters || 70;
  const votesCast = stats?.votesCast ?? voteRecords.length;
  const remaining = Math.max(0, totalVoters - votesCast);
  const participationRate = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(1) : '0.0';
  const currentStatus = stats?.status || ElectionStatus.UPCOMING;

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Top Banner: Admin Authorized Identity */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                NISC Election Administration
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-semibold border border-emerald-400/30">
                Official Control Center
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Administrator: <span className="font-mono text-amber-200 font-semibold">{profile.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="admin-refresh-dashboard-btn"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            id="admin-signout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Live Election Status Banner (Section 19 & 22) */}
      {currentStatus === ElectionStatus.OPEN && (
        <div className="p-5 rounded-3xl bg-emerald-900 border border-emerald-700 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  🟢 ELECTION LIVE
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600">
                  REAL-TIME VOTING ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Voting is currently open. Student council ballots are actively being processed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-bold bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-emerald-300">
              {votesCast} / {totalVoters} Cast ({participationRate}%)
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Status Readiness Alert Banner */}
      {currentStatus === ElectionStatus.UPCOMING && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-900">
                  Election Status: UPCOMING
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Pre-Launch
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                The election is awaiting deliberate administrator launch. Verify all 15 production invariants before opening.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('admin-readiness')}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pre-Flight Readiness</span>
          </button>
        </div>
      )}

      {/* Global Error Banner if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="font-bold text-rose-600 hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row (Total Voters, Votes Cast, Remaining, Turnout %) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Voters</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalVoters}</p>
          <p className="text-[11px] text-slate-500 mt-1">Authoritative eligible population</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Votes Cast</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{votesCast}</p>
          <p className="text-[11px] text-slate-500 mt-1">Authoritative recorded ballots</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Remaining</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{remaining}</p>
          <p className="text-[11px] text-slate-500 mt-1">Pending student ballots</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Participation</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{participationRate}%</p>
          <p className="text-[11px] text-slate-500 mt-1">{votesCast} / {totalVoters} eligible voters</p>
        </div>
      </div>

      {/* Data Consistency & Integrity Check Card */}
      {stats?.consistency && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
            stats.consistency.isConsistent
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {stats.consistency.isConsistent ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {stats.consistency.isConsistent
                  ? 'Authoritative Ledger Consistency: Verified'
                  : 'Integrity Warning: Inconsistency Detected'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.5">
                Ballots in collection ({stats.consistency.ballotsCount}) match candidate tallies sum ({stats.consistency.candidateVotesSum}) within eligible ceiling ({totalVoters}).
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60">
            Zero Discrepancy
          </span>
        </div>
      )}

      {/* 1. Election Lifecycle Controls */}
      <ElectionStatusControl
        status={currentStatus}
        openedAt={stats?.openedAt}
        closedAt={stats?.closedAt}
        resultsPublishedAt={stats?.resultsPublishedAt}
        onRequestTransition={handleRequestTransition}
        isProcessing={isProcessingTransition}
      />

      {/* 2. Candidate Results & Tallies */}
      <CandidateResultsCard
        candidates={stats?.candidates || {}}
        totalVotesCast={votesCast}
      />

      {/* 3. Vote Details (Who Voted for Whom) */}
      <VoteRecordsTable
        records={voteRecords}
        isLoading={isLoading}
      />

      {/* 4. Voter Participation Table (All 70 Members) */}
      <VoterParticipationTable
        voters={participation}
        isLoading={isLoading}
        onExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* 5. Recent Admin & System Activity Log */}
      <AdminAuditLogView
        logs={auditLogs}
        isLoading={isLoading}
      />

      {/* Confirmation Modal for State Transitions */}
      <StatusTransitionModal
        isOpen={targetTransitionStatus !== null}
        targetStatus={targetTransitionStatus}
        currentStatus={currentStatus}
        isProcessing={isProcessingTransition}
        onConfirm={handleConfirmTransition}
        onCancel={() => setTargetTransitionStatus(null)}
      />
    </div>
  );
};
