import React from 'react';
import { X, Check, Award, GraduationCap, Building, MapPin, Quote, Shield, Sparkles } from 'lucide-react';
import { Candidate } from '../../types';

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Candidate Branding */}
        <div
          className="p-6 text-white relative flex items-start justify-between"
          style={{
            backgroundColor: '#0F172A',
            borderBottom: `4px solid ${candidate.color}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
              style={{
                backgroundColor: candidate.colorLight || '#F1F5F9',
                color: candidate.color,
              }}
            >
              {candidate.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Official Candidate
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                  {candidate.contestingFor.join(' & ')}
                </span>
              </div>
              <h2 id="candidate-modal-title" className="text-2xl font-bold tracking-tight text-white mt-0.5">
                {candidate.codename}{' '}
                <span className="text-base font-normal text-slate-300">({candidate.name})</span>
              </h2>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.year}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.department}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.state}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Executive Vision */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Executive Vision
              </h3>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm leading-relaxed text-slate-700 font-normal">
              {candidate.vision}
            </div>
          </div>

          {/* Core Campaign Pillars */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Strategic Campaign Pillars (4 Directives)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidate.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-colors space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: candidate.colorLight || '#F1F5F9',
                        color: candidate.color,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                      {pillar.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing Statement */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Candidate Closing Statement
              </h3>
            </div>
            <blockquote className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs italic leading-relaxed text-amber-950 font-serif">
              "{candidate.closingStatement}"
            </blockquote>
          </div>
        </div>

        {/* Modal Footer with Selection Action */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close Profile
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
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selected as Ballot Choice</span>
              </>
            ) : (
              <span>Select {candidate.codename} for Ballot</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
