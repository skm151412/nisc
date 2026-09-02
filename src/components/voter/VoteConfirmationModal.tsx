import React from 'react';
import { Vote, AlertTriangle, ShieldCheck, Lock, RefreshCw, X } from 'lucide-react';
import { Candidate, AuthUserProfile } from '../../types';
import { resolveCandidateArtwork } from '../../config/electionData';

interface VoteConfirmationModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  profile: AuthUserProfile;
}

export const VoteConfirmationModal: React.FC<VoteConfirmationModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  profile,
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Vote className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900">
                Confirm Your Vote
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanent Election Record
              </p>
            </div>
          </div>

          {!isSubmitting && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
              aria-label="Cancel confirmation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Candidate Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-xs"
              style={{ borderColor: candidate.color }}
            >
              <img
                src={resolveCandidateArtwork(candidate)}
                alt={candidate.imageAlt || `${candidate.name} — ${candidate.house || candidate.codename} candidate artwork`}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                You have selected:
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-slate-900">
                  {candidate.name}
                </span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {candidate.house || candidate.codename}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                {candidate.year} • {candidate.branch || candidate.department}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Voter Email</span>
              <span className="font-mono text-[11px] text-slate-700 truncate block">
                {profile.email}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Quota</span>
              <span className="font-semibold text-slate-800">1 Vote (Single-Cast)</span>
            </div>
          </div>
        </div>

        {/* Caution Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Are you sure?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900">
            Your vote cannot be changed after submission. Once submitted, your choice is final and recorded.
          </p>
        </div>

        {/* Action Controls with Double-Confirmation Safety */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="voter-confirm-submit-btn"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Submitting your vote securely...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm Vote</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
