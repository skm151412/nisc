import React from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, BarChart3, Radio } from 'lucide-react';
import { Election, ElectionStatus } from '../../types';

interface ElectionStatusBannerProps {
  election: Election;
  onNavigateToResults?: () => void;
}

export const ElectionStatusBanner: React.FC<ElectionStatusBannerProps> = ({
  election,
  onNavigateToResults,
}) => {
  const renderStatusContent = () => {
    switch (election.status) {
      case ElectionStatus.UPCOMING:
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-7 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-amber-900 tracking-tight">
                    Election Upcoming
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    Status: UPCOMING
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 mt-1 font-medium leading-relaxed">
                  The election has not started yet. Voting controls will become active once an administrator starts the election.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold px-4 py-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 self-start sm:self-auto">
              Voting Not Started
            </div>
          </div>
        );

      case ElectionStatus.LIVE:
      case ElectionStatus.OPEN:
        return (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Election is Live
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40">
                    🟢 Voting is Live
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Voting is currently live. You may cast one official ballot. Your vote cannot be altered after submission.
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to Vote</span>
            </div>
          </div>
        );

      case ElectionStatus.PAUSED:
      case ElectionStatus.CLOSED:
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-7 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-lg font-bold text-amber-950 tracking-tight">
                    Voting Temporarily Paused
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Status: PAUSED
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 mt-1 font-medium leading-relaxed">
                  Voting is temporarily paused by the election administration. Ballot submissions will automatically resume when the election is resumed.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold px-4 py-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 self-start sm:self-auto">
              Voting Paused
            </div>
          </div>
        );

      case ElectionStatus.FINISHED:
      case ElectionStatus.RESULTS:
        return (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6 sm:p-7 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="text-lg font-bold text-blue-950 tracking-tight">
                    Election Finished
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                    Status: FINISHED
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-900/90 mt-1 font-medium leading-relaxed">
                  The election has concluded and official certified results have been published.
                </p>
              </div>
            </div>

            {onNavigateToResults && (
              <button
                onClick={onNavigateToResults}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
              >
                View Official Results
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="w-full">{renderStatusContent()}</div>;
};
