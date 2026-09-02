import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Quote,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { INITIAL_CANDIDATES, INITIAL_ELECTION } from '../config/electionData';
import { Candidate } from '../types';
import { CandidateDetailsModal } from '../components/voter/CandidateDetailsModal';

export const ElectionPage: React.FC = () => {
  const [selectedModalCandidate, setSelectedModalCandidate] = useState<Candidate | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* 1. Official Election Banner */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Official Candidate Manifestos
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Executive Council General Election 2026
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Review the official campaign manifestos, leadership visions, and strategic pillars of all standing candidates.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center text-xs text-slate-300">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 font-semibold">
            {INITIAL_CANDIDATES.length} Official Candidates
          </div>
        </div>
      </div>

      {/* 2. Candidate Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span>Presidential Candidates</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Contesting for NISC Executive Council</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {INITIAL_CANDIDATES.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
            >
              {/* Candidate Card Header */}
              <div
                className="p-6 border-b border-slate-100"
                style={{
                  backgroundColor: candidate.colorLight,
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs border bg-white"
                    style={{
                      borderColor: candidate.color,
                    }}
                  >
                    {candidate.icon}
                  </div>
                  <span
                    className="text-[11px] font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider shadow-xs"
                    style={{ backgroundColor: candidate.color }}
                  >
                    {candidate.codename}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900">{candidate.name}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {candidate.year} • {candidate.department} • {candidate.state}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {candidate.contestingFor.map((pos) => (
                      <span
                        key={pos}
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-white/90 text-slate-800 border border-slate-200"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vision & Pillars Preview */}
              <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Leadership Vision
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      "{candidate.vision}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      Key Pillars
                    </span>
                    <div className="space-y-2">
                      {candidate.pillars.map((pillar, pIdx) => (
                        <div key={pIdx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">{pillar.title}</p>
                          <p className="text-[11px] text-slate-600 leading-snug">{pillar.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] text-slate-500 italic">
                    "{candidate.closingStatement}"
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedModalCandidate(candidate)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Full Manifesto</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Manifesto Modal */}
      <CandidateDetailsModal
        candidate={selectedModalCandidate}
        isOpen={Boolean(selectedModalCandidate)}
        onClose={() => setSelectedModalCandidate(null)}
        isSelected={false}
        disabled={true}
      />
    </div>
  );
};
