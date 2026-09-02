import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ElectionStatus } from '../../types';

interface StatusTransitionModalProps {
  isOpen: boolean;
  targetStatus: ElectionStatus | null;
  currentStatus: ElectionStatus;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  isOpen,
  targetStatus,
  currentStatus,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !targetStatus) return null;

  const getModalDetails = () => {
    // UPCOMING -> LIVE
    if (targetStatus === ElectionStatus.LIVE && currentStatus === ElectionStatus.UPCOMING) {
      return {
        title: 'Start Election?',
        badge: 'UPCOMING → LIVE',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
        description:
          'This will open voting for all 70 verified institutional voters. Eligible voters will be permitted to cast a single atomic ballot.',
        warning: 'The election cannot be reset from this dashboard.',
        confirmText: 'Start Election',
        confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }

    // PAUSED -> LIVE
    if (targetStatus === ElectionStatus.LIVE && (currentStatus === ElectionStatus.PAUSED || currentStatus === ElectionStatus.CLOSED)) {
      return {
        title: 'Resume Election?',
        badge: 'PAUSED → LIVE',
        badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
        description:
          'This will resume active voting for all eligible voters who have not yet cast their ballot.',
        warning: 'Voters will immediately be able to submit ballots again.',
        confirmText: 'Resume Election',
        confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }

    // LIVE -> PAUSED
    if (targetStatus === ElectionStatus.PAUSED && (currentStatus === ElectionStatus.LIVE || currentStatus === ElectionStatus.OPEN)) {
      return {
        title: 'Stop / Pause Election?',
        badge: 'LIVE → PAUSED',
        badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-300',
        description:
          'Voting will be temporarily paused. Ballot submissions will be rejected until an administrator resumes the election.',
        warning: 'The election can be resumed or finished later by an administrator.',
        confirmText: 'Stop / Pause Election',
        confirmBtnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
    }

    // LIVE or PAUSED -> FINISHED
    if (targetStatus === ElectionStatus.FINISHED || targetStatus === ElectionStatus.RESULTS) {
      return {
        title: 'Finish Election & Publish Results?',
        badge: `${currentStatus} → FINISHED`,
        badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-300',
        description:
          'This permanently ends the election and generates the authoritative results summary. Candidate vote totals and winners will become visible to all participants.',
        warning: 'This action is PERMANENT. Once finished, no further voting or state transitions are permitted.',
        confirmText: 'Finish Election',
        confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      };
    }

    return {
      title: 'Confirm State Transition',
      badge: `${currentStatus} → ${targetStatus}`,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      description: 'Are you sure you want to transition the election status?',
      warning: 'This action will be recorded in the audit log.',
      confirmText: 'Confirm Transition',
      confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    };
  };

  const details = getModalDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transition-modal-title"
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${details.badgeColor}`}>
            {details.badge}
          </span>
          <ShieldAlert className="w-5 h-5 text-amber-600" />
        </div>

        <div>
          <h2 id="transition-modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
            {details.title}
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {details.description}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-900 leading-snug">
            {details.warning}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            id="modal-cancel-btn"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="modal-confirm-btn"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 ${details.confirmBtnClass} disabled:opacity-50 cursor-pointer`}
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{details.confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
