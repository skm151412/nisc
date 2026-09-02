import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ResetVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
  adminEmail: string;
}

export const ResetVotesModal: React.FC<ResetVotesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  adminEmail,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'RESET VOTES';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isProcessing) return;
    setLocalError(null);
    try {
      await onConfirm();
      setConfirmationInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setConfirmationInput('');
    setLocalError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden"
          role="dialog"
          aria-labelledby="reset-modal-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="reset-modal-title"
                  className="text-lg font-bold text-rose-950 tracking-tight"
                >
                  Reset Election Votes
                </h2>
                <p className="text-xs text-rose-700 mt-0.5">
                  Authoritative administrative reset operation
                </p>
              </div>
            </div>
            <button
              type="button"
              id="reset-modal-close-btn"
              onClick={handleClose}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-rose-100/60 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Critical Warning Box */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Destructive Operation Warning</span>
              </div>
              <ul className="text-xs text-rose-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  Permanently clears <strong>all recorded ballots</strong> and vote lock documents.
                </li>
                <li>
                  Resets candidate vote counters to <strong>0</strong>.
                </li>
                <li>
                  Resets voter statuses (<code>hasVoted: false</code>) so all eligible voters can vote again.
                </li>
                <li>
                  <strong>Preserved:</strong> Election state, candidate definitions, voter allowlist, and admin credentials remain completely unchanged.
                </li>
                <li>
                  A tamper-resistant <code>RESET_VOTES</code> audit log entry will be created.
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Authorized Admin: <strong className="font-mono text-slate-900">{adminEmail}</strong>
              </span>
            </div>

            {localError && (
              <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{localError}</span>
              </div>
            )}

            {/* Confirmation input */}
            <div className="space-y-2">
              <label
                htmlFor="reset-confirmation-input"
                className="block text-xs font-semibold text-slate-700"
              >
                To confirm this operation, type <span className="font-mono font-bold text-rose-600">RESET VOTES</span> below:
              </label>
              <input
                id="reset-confirmation-input"
                type="text"
                autoComplete="off"
                disabled={isProcessing}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type RESET VOTES"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="reset-modal-cancel-btn"
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="reset-modal-confirm-btn"
                disabled={!isConfirmed || isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Votes...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Vote Reset</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
