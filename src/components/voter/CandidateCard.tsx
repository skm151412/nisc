import React from 'react';
import { Check, Eye, User, Award, MapPin, Building, GraduationCap } from 'lucide-react';
import { Candidate } from '../../types';

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
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border-2 bg-white ${
        isSelected
          ? 'border-blue-600 ring-4 ring-blue-600/10 shadow-lg'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      style={{
        borderTopColor: isSelected ? undefined : candidate.color,
        borderTopWidth: isSelected ? '2px' : '4px',
      }}
    >
      <div className="space-y-4">
        {/* Header with Icon and Radio Selector */}
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-transform group-hover:scale-105"
            style={{
              backgroundColor: candidate.colorLight || '#F1F5F9',
              color: candidate.color,
            }}
          >
            {candidate.icon}
          </div>

          <div className="flex items-center gap-2">
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

        {/* Identity & Metadata */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {candidate.codename}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              ({candidate.name})
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
              <GraduationCap className="w-3 h-3 text-slate-500" />
              {candidate.year}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
              <Building className="w-3 h-3 text-slate-500" />
              {candidate.department}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
              <MapPin className="w-3 h-3 text-slate-500" />
              {candidate.state}
            </span>
          </div>
        </div>

        {/* Contesting For Badges */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Contesting Position
          </span>
          <div className="flex flex-wrap gap-1">
            {candidate.contestingFor.map((pos, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              >
                {pos}
              </span>
            ))}
          </div>
        </div>

        {/* Vision Preview */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Vision Summary
          </span>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
            {candidate.vision}
          </p>
        </div>

        {/* Pillars Mini Preview */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Key Pillars
          </span>
          <div className="space-y-1">
            {candidate.pillars.slice(0, 2).map((pillar, pIdx) => (
              <div key={pIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="font-bold text-slate-400" style={{ color: candidate.color }}>
                  •
                </span>
                <span className="font-medium text-slate-800 truncate">{pillar.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons: View Profile & Select */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(candidate);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
          aria-label={`View profile and manifesto for ${candidate.codename}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Profile</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onSelect(candidate.id);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2 ${
            isSelected
              ? 'bg-blue-600 text-white shadow-xs focus:ring-blue-600'
              : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Select candidate ${candidate.codename}`}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Selected</span>
            </>
          ) : (
            <span>Select Candidate</span>
          )}
        </button>
      </div>
    </div>
  );
};
