import React from 'react';
import { Play, Power, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ElectionStatus } from '../../types';

interface ElectionStatusControlProps {
  status: ElectionStatus;
  openedAt?: string | null;
  closedAt?: string | null;
  resultsPublishedAt?: string | null;
  onRequestTransition: (target: ElectionStatus) => void;
  isProcessing: boolean;
}

export const ElectionStatusControl: React.FC<ElectionStatusControlProps> = ({
  status,
  openedAt,
  closedAt,
  resultsPublishedAt,
  onRequestTransition,
  isProcessing,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case ElectionStatus.UPCOMING:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300/80 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            🟡 UPCOMING
          </span>
        );
      case ElectionStatus.OPEN:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-300/80 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            🟢 OPEN
          </span>
        );
      case ElectionStatus.CLOSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-800 border border-rose-300/80 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            🔴 CLOSED
          </span>
        );
      case ElectionStatus.RESULTS:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-800 border border-blue-300/80 font-bold text-xs">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            🏆 RESULTS PUBLISHED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs">
            {status}
          </span>
        );
    }
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Election Lifecycle Control</h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Election state management and lifecycle progression.
          </p>
        </div>

        {/* Action Button depending on current status */}
        <div className="flex items-center gap-3 shrink-0">
          {status === ElectionStatus.UPCOMING && (
            <button
              type="button"
              id="admin-start-election-btn"
              onClick={() => onRequestTransition(ElectionStatus.OPEN)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START ELECTION</span>
            </button>
          )}

          {status === ElectionStatus.OPEN && (
            <button
              type="button"
              id="admin-close-election-btn"
              onClick={() => onRequestTransition(ElectionStatus.CLOSED)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              <span>CLOSE ELECTION</span>
            </button>
          )}

          {status === ElectionStatus.CLOSED && (
            <button
              type="button"
              id="admin-publish-results-btn"
              onClick={() => onRequestTransition(ElectionStatus.RESULTS)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              <span>PUBLISH RESULTS</span>
            </button>
          )}

          {status === ElectionStatus.RESULTS && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Election Lifecycle Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Timeline Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Opened At
          </span>
          <span className="font-mono text-slate-800 font-semibold">{formatTimestamp(openedAt)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Closed At
          </span>
          <span className="font-mono text-slate-800 font-semibold">{formatTimestamp(closedAt)}</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Results Published At
          </span>
          <span className="font-mono text-slate-800 font-semibold">{formatTimestamp(resultsPublishedAt)}</span>
        </div>
      </div>
    </div>
  );
};
