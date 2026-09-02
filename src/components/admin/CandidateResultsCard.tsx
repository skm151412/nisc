import React from 'react';
import { Award, CheckCircle, ShieldCheck, Trophy, AlertTriangle } from 'lucide-react';
import { INITIAL_CANDIDATES, resolveCandidateArtwork } from '../../config/electionData';

interface CandidateResultsCardProps {
  candidates: Record<string, { id: string; name: string; codename: string; voteCount: number }>;
  totalVotesCast: number;
}

export const CandidateResultsCard: React.FC<CandidateResultsCardProps> = ({
  candidates,
  totalVotesCast,
}) => {
  const candidateList = INITIAL_CANDIDATES.map((c) => {
    const live = candidates[c.id] || { id: c.id, name: c.name, codename: c.codename, voteCount: 0 };
    const voteCount = live.voteCount || 0;
    const percentage = totalVotesCast > 0 ? (voteCount / totalVotesCast) * 100 : 0;
    return {
      ...c,
      voteCount,
      percentage: Number(percentage.toFixed(1)),
    };
  });

  const sumVotes = candidateList.reduce((acc, c) => acc + c.voteCount, 0);
  const isIntegrityMismatch = sumVotes !== totalVotesCast;

  // Determine top candidate / tie
  const highestVote = Math.max(...candidateList.map((c) => c.voteCount), 0);
  const topCandidates = candidateList.filter((c) => c.voteCount === highestVote && highestVote > 0);
  const isTie = topCandidates.length > 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Candidate Results & Tallies</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time vote counts from trusted Firestore state. Total ballots evaluated: <strong className="text-slate-800">{totalVotesCast}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topCandidates.length > 0 && !isIntegrityMismatch && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-600" />
              <span>{isTie ? 'Tie for Lead' : `Leading: ${topCandidates[0].codename}`}</span>
            </span>
          )}
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Admin Authoritative View
          </span>
        </div>
      </div>

      {/* Integrity Mismatch Warning */}
      {isIntegrityMismatch && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-950">⚠ Election Data Integrity Warning</h4>
            <p className="leading-relaxed">
              The candidate vote totals ({sumVotes}) do not match the recorded ballot total ({totalVotesCast}). Results publication has been blocked. Please investigate the election data.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {candidateList.map((cand) => {
          const isWinner = topCandidates.length === 1 && topCandidates[0].id === cand.id;
          const isTiedLead = isTie && topCandidates.some((t) => t.id === cand.id);

          return (
            <div
              key={cand.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                isWinner
                  ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                  : 'bg-slate-50/50 border-slate-200/90 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white"
                      style={{ backgroundColor: cand.color }}
                    >
                      {cand.codename}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5 text-amber-600" />
                        <span>Winner</span>
                      </span>
                    )}
                    {isTiedLead && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300">
                        Tie
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{cand.name}</h3>
                </div>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center shadow-xs border-2 shrink-0"
                  style={{
                    borderColor: cand.color,
                  }}
                >
                  <img
                    src={resolveCandidateArtwork(cand)}
                    alt={cand.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">Votes Cast</span>
                  <span className="text-slate-900 font-mono font-bold text-base">
                    {cand.voteCount} <span className="text-xs text-slate-400 font-normal">({cand.percentage}%)</span>
                  </span>
                </div>

                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${cand.percentage}%`,
                      backgroundColor: cand.color,
                    }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200/50">
                <span>{cand.department}</span>
                <span className="font-mono text-slate-600">{cand.year}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
