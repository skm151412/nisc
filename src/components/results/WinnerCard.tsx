import React from 'react';
import { Trophy, Award, Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { ElectionWinnerInfo, CandidateResultSummary } from '../../types';
import { resolveCandidateArtwork } from '../../config/electionData';

interface WinnerCardProps {
  winnerInfo: ElectionWinnerInfo;
  totalVotesCast: number;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ winnerInfo, totalVotesCast }) => {
  const { isTie, winner, tiedCandidates, announcementStatement } = winnerInfo;

  if (totalVotesCast === 0) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No Ballots Recorded</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The election concluded with zero recorded votes. No presidential candidate elected.
          </p>
        </div>
      </div>
    );
  }

  if (isTie) {
    return (
      <div className="bg-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-800/80 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                Contested Outcome
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Tie in Highest Vote Count
              </h2>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
            Tie ({tiedCandidates[0]?.voteCount || 0} Votes Each)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tiedCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-amber-900/40 border border-amber-700/50 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded-md uppercase"
                  style={{ backgroundColor: candidate.color, color: '#FFFFFF' }}
                >
                  {candidate.codename}
                </span>
                <span className="text-xs font-bold text-amber-200">
                  {candidate.voteCount} Votes ({candidate.percentage}%)
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{candidate.name}</h4>
              <p className="text-xs text-amber-200/80">
                {candidate.department} • {candidate.year}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-amber-900/30 border border-amber-700/40 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-100">Official Tie Protocol Activated</p>
            <p className="mt-0.5 opacity-90">{announcementStatement}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!winner) return null;

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none -mr-20 -mt-20"
        style={{ backgroundColor: winner.color }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center text-3xl shadow-sm border-2 shrink-0"
            style={{
              borderColor: winner.color,
            }}
          >
            <img
              src={resolveCandidateArtwork(winner)}
              alt={winner.imageAlt || `${winner.name} — ${winner.house || winner.codename} candidate artwork`}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
              Official Presidential Victor
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Elected President of NISC
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono shadow-xs border"
            style={{
              backgroundColor: winner.color,
              borderColor: winner.color,
              color: '#FFFFFF',
            }}
          >
            House: {winner.house || winner.codename}
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Winner
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {winner.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            {winner.branch || winner.department} • {winner.year} • North India Student Cell
          </p>
          <p className="text-xs text-slate-400 italic pt-1 leading-relaxed">
            "{announcementStatement}"
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-400 font-medium">Victorious Tally</span>
            <span className="text-emerald-400 font-bold text-xs">Mandate Achieved</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-white font-mono">
              {winner.voteCount}
            </span>
            <span className="text-sm text-slate-400">
              votes (<strong className="text-amber-400">{winner.percentage}%</strong>)
            </span>
          </div>

          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${winner.percentage}%`,
                backgroundColor: winner.color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
