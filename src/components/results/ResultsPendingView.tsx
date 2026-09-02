import React from 'react';
import { Clock, Radio, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { ElectionStatus } from '../../types';

interface ResultsPendingViewProps {
  status: ElectionStatus;
  onNavigateToPortal?: () => void;
  onNavigateToCandidates?: () => void;
}

export const ResultsPendingView: React.FC<ResultsPendingViewProps> = ({
  status,
  onNavigateToPortal,
  onNavigateToCandidates,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case ElectionStatus.UPCOMING:
        return {
          icon: <Clock className="w-8 h-8 text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeText: 'Election Upcoming',
          badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
          title: 'Results Not Available',
          subtitle: 'The election has not started yet.',
          description:
            'Candidate profiles are available for review. Voting will open when the election is officially started.',
        };

      case ElectionStatus.OPEN:
        return {
          icon: <Radio className="w-8 h-8 text-emerald-600 animate-pulse" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeText: 'Voting in Progress',
          badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'Results Not Available',
          subtitle: 'The election is currently in progress.',
          description:
            'Live vote counts are concealed during the voting period to protect voter privacy and ballot integrity. Please check back when results are officially published.',
        };

      case ElectionStatus.CLOSED:
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-rose-600" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          badgeText: 'Voting Closed',
          badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
          title: 'Election Closed',
          subtitle: 'Voting has ended.',
          description:
            'Voting has concluded. Results are currently being finalized and will be available once officially certified.',
        };
    }
  };

  const config = getStatusContent();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <div className={`rounded-3xl border ${config.borderColor} ${config.bgColor} p-8 sm:p-10 shadow-xs space-y-6 text-center`}>
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs mx-auto flex items-center justify-center">
          {config.icon}
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${config.badgeStyle}`}>
            {config.badgeText}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {config.title}
          </h2>
          <p className="text-sm font-semibold text-slate-700">{config.subtitle}</p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
            {config.description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-3">
          {onNavigateToPortal && (
            <button
              onClick={onNavigateToPortal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <span>Go to Voter Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onNavigateToCandidates && (
            <button
              onClick={onNavigateToCandidates}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all"
            >
              <span>View Candidate Profiles</span>
            </button>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-1.5 text-center sm:text-left">
        <p className="font-bold text-blue-300">Official Ballot Confidentiality</p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Ballot records and individual selections remain completely private. No voter identities are linked to cast ballots in published results.
        </p>
      </div>
    </div>
  );
};
