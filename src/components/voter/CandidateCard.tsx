import React from 'react';
import { Check, Eye, Building, GraduationCap, Sparkles, Award } from 'lucide-react';
import { Candidate } from '../../types';
import { resolveCandidateArtwork } from '../../config/electionData';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  onViewDetails: (candidate: Candidate) => void;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  onSelect,
  onViewDetails,
  disabled = false,
}) => {
  const houseName = candidate.house || candidate.codename;
  const branchName = candidate.branch || candidate.department;
  const positionName = candidate.position || candidate.contestingFor?.join(' & ') || 'Candidate for President';

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onSelect(candidate.id);
      }}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
          e.preventDefault();
          onSelect(candidate.id);
        }
      }}
      className={`group relative rounded-3xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border-2 bg-white ${
        isSelected
          ? 'border-blue-600 ring-4 ring-blue-600/10 shadow-lg'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      style={{
        borderTopColor: isSelected ? undefined : candidate.color,
        borderTopWidth: isSelected ? '2px' : '5px',
      }}
    >
      <div className="space-y-4">
        {/* Header with Candidate Name, House Badge, and Selection Radio */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                House
              </span>
              <span
                className="text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"
                style={{
                  backgroundColor: candidate.colorLight || '#F1F5F9',
                  color: candidate.color,
                }}
              >
                <span>{candidate.icon}</span>
                <span>{houseName}</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {candidate.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                  : 'border-slate-300 bg-white group-hover:border-slate-400'
              }`}
              aria-hidden="true"
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
          </div>
        </div>

        {/* Real Candidate Artwork Symbol */}
        <div className="flex justify-center py-2">
          <div
            className="w-44 sm:w-48 md:w-52 aspect-square rounded-full overflow-hidden bg-slate-950 border-4 shadow-md flex items-center justify-center relative"
            style={{
              borderColor: candidate.color,
            }}
          >
            <img
              src={resolveCandidateArtwork(candidate)}
              alt={candidate.imageAlt || `${candidate.name} — ${houseName} candidate artwork`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </div>

        {/* Academic & Batch Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-800 border border-slate-200/60">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            {candidate.year}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-800 border border-slate-200/60">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            {branchName}
          </span>
        </div>

        {/* Contesting Position & Role Info */}
        <div className="space-y-1.5">
          <div className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {positionName}
          </div>
          {candidate.roleInfo && (
            <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{candidate.roleInfo}</span>
            </div>
          )}
        </div>

        {/* Vision Statement */}
        <div className="space-y-1 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Vision & Motivation
          </span>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {candidate.vision}
          </p>
        </div>

        {/* Key Manifesto Highlights */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Manifesto Highlights ({candidate.pillars.length} Action Points)
          </span>
          <div className="space-y-1">
            {candidate.pillars.slice(0, 3).map((pillar, pIdx) => (
              <div key={pIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="font-bold text-slate-400" style={{ color: candidate.color }}>
                  {pIdx + 1}.
                </span>
                <span className="font-medium text-slate-800 truncate">{pillar.title}</span>
              </div>
            ))}
            {candidate.pillars.length > 3 && (
              <p className="text-[11px] text-blue-600 font-semibold pl-4">
                +{candidate.pillars.length - 3} more action areas in full manifesto...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: View Full Manifesto & Select Candidate */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(candidate);
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          aria-label={`View full manifesto for ${candidate.name}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Full Manifesto</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onSelect(candidate.id);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2 ${
            isSelected
              ? 'bg-blue-600 text-white shadow-xs focus:ring-blue-600'
              : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Select candidate ${candidate.name}`}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Selected</span>
            </>
          ) : (
            <span>Vote {candidate.name.split(' ')[0]}</span>
          )}
        </button>
      </div>
    </div>
  );
};
