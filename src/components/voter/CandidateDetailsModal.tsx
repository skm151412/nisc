import React from 'react';
import { X, Check, Award, GraduationCap, Building, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Candidate } from '../../types';
import { resolveCandidateArtwork } from '../../config/electionData';

interface CandidateDetailsModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  disabled?: boolean;
}

export const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({
  candidate,
  isOpen,
  onClose,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  if (!isOpen || !candidate) return null;

  const houseName = candidate.house || candidate.codename;
  const branchName = candidate.branch || candidate.department;
  const positionName = candidate.position || candidate.contestingFor?.join(' & ') || 'Candidate for President';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Candidate & House Branding */}
        <div
          className="p-5 sm:p-6 text-white relative flex items-start justify-between"
          style={{
            backgroundColor: '#0F172A',
            borderBottom: `4px solid ${candidate.color}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-950 border-2 flex items-center justify-center shrink-0 shadow-md"
              style={{ borderColor: candidate.color }}
            >
              <img
                src={resolveCandidateArtwork(candidate)}
                alt={candidate.imageAlt || `${candidate.name} — ${houseName} candidate artwork`}
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                  House: {houseName}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                  {positionName}
                </span>
              </div>
              <h2 id="candidate-modal-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {candidate.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.year}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {branchName}
                </span>
                {candidate.roleInfo && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {candidate.roleInfo}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400 shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Manifesto Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7 text-slate-800">
          {/* Candidate Profile Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Candidate</span>
              <strong className="text-slate-900 font-bold">{candidate.name}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">House</span>
              <strong className="text-slate-900 font-bold flex items-center gap-1">
                <span>{candidate.icon}</span> {houseName}
              </strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Year & Branch</span>
              <strong className="text-slate-900 font-bold">{candidate.year} | {branchName}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contesting</span>
              <strong className="text-blue-700 font-bold">{positionName}</strong>
            </div>
          </div>

          {/* Official Manifesto Header */}
          <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              Official Candidate Manifesto
            </h3>
          </div>

          {/* Manifesto Opening / Vision */}
          <div className="space-y-3">
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 font-normal whitespace-pre-line">
              {candidate.vision}
            </div>
          </div>

          {/* Numbered Action Points / Strategic Pillars */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Key Initiatives & Strategic Priorities ({candidate.pillars.length} Action Points)</span>
            </h4>
            <div className="space-y-3">
              {candidate.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        backgroundColor: candidate.colorLight || '#F1F5F9',
                        color: candidate.color,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 tracking-tight">
                      {pillar.title}
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-8">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing Statement / Commitment */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Closing Commitment
            </h4>
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs sm:text-sm leading-relaxed text-amber-950 font-serif whitespace-pre-line">
              {candidate.closingStatement}
            </div>
          </div>

          {/* Official Candidate Signature Block */}
          {candidate.signature && (
            <div className="pt-4 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Candidate Signature
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed font-semibold">
                {candidate.signature}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Selection Action */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close Manifesto
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                onSelect(candidate.id);
                onClose();
              }
            }}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected as Ballot Choice</span>
              </>
            ) : (
              <span>Select {candidate.name} on Ballot</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
