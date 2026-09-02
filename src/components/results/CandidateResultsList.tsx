import React from 'react';
import { Award, Trophy, Check, BarChart2 } from 'lucide-react';
import { CandidateResultSummary } from '../../types';
import { resolveCandidateArtwork } from '../../config/electionData';

interface CandidateResultsListProps {
  candidates: CandidateResultSummary[];
  totalVotesCast: number;
}

export const CandidateResultsList: React.FC<CandidateResultsListProps> = ({
  candidates,
  totalVotesCast,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Official Candidate Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Final aggregate certified vote counts across all participating student electors.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          3 Candidates Standing
        </span>
      </div>

      <div className="space-y-4">
        {candidates.map((candidate) => {
          return (
            <div
              key={candidate.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                candidate.isWinner
                  ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Avatar, Codename, Name, Department */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 border-2 flex items-center justify-center shrink-0 shadow-xs"
                    style={{ borderColor: candidate.color }}
                  >
                    <img
                      src={resolveCandidateArtwork(candidate)}
                      alt={candidate.imageAlt || `${candidate.name} — ${candidate.house || candidate.codename} candidate artwork`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white shadow-xs"
                        style={{ backgroundColor: candidate.color }}
                      >
                        House: {candidate.house || candidate.codename}
                      </span>
                      {candidate.isWinner && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          <span>Winner</span>
                        </span>
                      )}
                      {candidate.isTied && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                          Tied for 1st
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{candidate.name}</h3>
                    <p className="text-xs text-slate-500">
                      {candidate.branch || candidate.department} • {candidate.year}
                    </p>
                  </div>
                </div>

                {/* Right: Vote numbers and percentage */}
                <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {candidate.voteCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">votes</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    <strong className="text-slate-900">{candidate.percentage}%</strong> of total
                  </span>
                </div>
              </div>

              {/* Visual Percentage Bar */}
              <div className="mt-4 space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${candidate.percentage}%`,
                      backgroundColor: candidate.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
