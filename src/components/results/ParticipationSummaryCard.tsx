import React from 'react';
import { Users, Vote, UserCheck, Percent, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ParticipationSummaryCardProps {
  totalEligibleVoters: number;
  totalVotesCast: number;
  didNotVote: number;
  participationPercentage: number;
  publishedAt?: string;
}

export const ParticipationSummaryCard: React.FC<ParticipationSummaryCardProps> = ({
  totalEligibleVoters,
  totalVotesCast,
  didNotVote,
  participationPercentage,
  publishedAt,
}) => {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Eligible</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalEligibleVoters}</p>
          <p className="text-[11px] text-slate-500 mt-1">Authorized student electorate</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Votes Cast</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalVotesCast}</p>
          <p className="text-[11px] text-slate-500 mt-1">Recorded ballots in ledger</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Did Not Vote</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{didNotVote}</p>
          <p className="text-[11px] text-slate-500 mt-1">Uncast student ballots</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Participation</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{participationPercentage}%</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalVotesCast} of {totalEligibleVoters} members voted
          </p>
        </div>
      </div>

      {/* Certified Ledger Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Official Results Published & Immutable</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Certified on {formattedDate}. All vote tallies and ledger hashes are cryptographically sealed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Discrepancy Audit Pass</span>
        </div>
      </div>
    </div>
  );
};
