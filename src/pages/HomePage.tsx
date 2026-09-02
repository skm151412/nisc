import React, { useState, useEffect } from 'react';
import {
  Vote,
  Award,
  BarChart3,
  ArrowRight,
  UserCheck,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Radio,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AuthUserProfile, Candidate, Election, ElectionStatus } from '../types';
import { INITIAL_ELECTION, INITIAL_ELECTION_ID, INITIAL_CANDIDATES, resolveCandidateArtwork } from '../config/electionData';
import { subscribeToElection } from '../services/electionService';
import { CandidateDetailsModal } from '../components/voter/CandidateDetailsModal';

interface HomePageProps {
  profile: AuthUserProfile;
  onNavigate: (page: string) => void;
  onSignIn: () => Promise<AuthUserProfile>;
  authActionLoading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  onNavigate,
  onSignIn,
}) => {
  const [election, setElection] = useState<Election>(INITIAL_ELECTION);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const isAuthenticated = profile.role !== 'UNAUTHENTICATED';
  const isAdmin = profile.role === 'ADMIN' && profile.isAdmin;

  useEffect(() => {
    const unsubscribe = subscribeToElection(
      INITIAL_ELECTION_ID,
      (updatedElection) => {
        setElection(updatedElection);
      },
      () => {}
    );
    return () => unsubscribe();
  }, []);

  const getStatusBadge = () => {
    switch (election.status) {
      case ElectionStatus.LIVE:
      case ElectionStatus.OPEN:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>🟢 ELECTION IS LIVE</span>
          </div>
        );
      case ElectionStatus.PAUSED:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>⏸ VOTING TEMPORARILY PAUSED</span>
          </div>
        );
      case ElectionStatus.CLOSED:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>VOTING CONCLUDED</span>
          </div>
        );
      case ElectionStatus.FINISHED:
      case ElectionStatus.RESULTS:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>🏆 ELECTION FINISHED — RESULTS AVAILABLE</span>
          </div>
        );
      case ElectionStatus.UPCOMING:
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>🟡 UPCOMING</span>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (election.status) {
      case ElectionStatus.LIVE:
      case ElectionStatus.OPEN:
        return 'Voting is currently live. Cast your official ballot before the election concludes.';
      case ElectionStatus.PAUSED:
        return 'Voting is temporarily paused. Please check back when the election is resumed.';
      case ElectionStatus.FINISHED:
      case ElectionStatus.RESULTS:
        return 'The election has concluded and official certified results are now published.';
      case ElectionStatus.CLOSED:
        return 'Voting has ended. Results will be available once finalized.';
      case ElectionStatus.UPCOMING:
      default:
        return 'Voting has not started yet. Please check back when the election opens.';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 sm:py-10 px-4">
      {/* Hero Section */}
      <div className="bg-slate-900 rounded-3xl text-white p-7 sm:p-12 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-5 relative z-10">
          {getStatusBadge()}

          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              NISC Executive Council
            </h1>
            <h2 className="text-xl sm:text-3xl font-bold text-blue-400 mt-1">
              General Election 2026
            </h2>
          </div>

          <p className="text-base sm:text-lg text-slate-300 italic font-normal">
            "Your voice. Your choice. Your representatives."
          </p>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {getStatusMessage()}
          </p>

          {/* Action Bar */}
          <div className="pt-3 flex flex-wrap gap-3.5">
            <button
              id="hero-view-candidates-btn"
              onClick={() => onNavigate('candidates')}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>View Candidates</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isAdmin && (
              <button
                id="hero-vote-btn"
                onClick={() => onNavigate(isAuthenticated ? 'voter' : 'login')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-colors"
              >
                <Vote className="w-4 h-4 text-emerald-400" />
                <span>{isAuthenticated ? 'Cast Your Vote' : 'Sign In to Vote'}</span>
              </button>
            )}

            {election.status === ElectionStatus.RESULTS && (
              <button
                id="hero-results-btn"
                onClick={() => onNavigate('results')}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Results</span>
              </button>
            )}

            {isAdmin && (
              <button
                id="hero-admin-btn"
                onClick={() => onNavigate('admin')}
                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Election Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Registered Student Body</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All registered members of the North India Student Cell are eligible to participate in electing the 2026 Executive Council.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Vote className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Democracy & Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every eligible student receives exactly one ballot. Individual ballot choices remain strictly confidential and protected.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Candidate Manifestos</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review detailed vision statements, key pillars, and leadership goals submitted by all {INITIAL_CANDIDATES.length} standing presidential candidates.
          </p>
        </div>
      </div>

      {/* Featured Candidates Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Meet the Candidates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contesting for the NISC Executive Council Leadership (General Election 2026)
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidates')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Candidate Profiles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_CANDIDATES.map((candidate) => {
            const houseName = candidate.house || candidate.codename;
            const branchName = candidate.branch || candidate.department;
            const positionName = candidate.position || candidate.contestingFor.join(' & ');

            return (
              <div
                key={candidate.id}
                className="rounded-3xl border-2 border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-lg transition-all p-5 sm:p-6 flex flex-col justify-between"
                style={{
                  borderTopColor: candidate.color,
                  borderTopWidth: '5px',
                }}
              >
                <div className="space-y-4">
                  {/* 1. Circular Candidate Symbol / Artwork */}
                  <div className="flex justify-center py-2">
                    <div
                      className="w-48 sm:w-52 md:w-56 aspect-square rounded-full overflow-hidden bg-slate-950 border-4 shadow-md flex items-center justify-center relative group transition-transform duration-300 hover:scale-[1.03]"
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

                  {/* 2. Candidate Identity & Credentials */}
                  <div className="text-center space-y-1">
                    <h4 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                      {candidate.name}
                    </h4>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        House
                      </span>
                      <span
                        className="text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"
                        style={{
                          backgroundColor: candidate.colorLight || '#F1F5F9',
                          color: candidate.color,
                        }}
                      >
                        <span>{candidate.icon}</span>
                        <span>{houseName}</span>
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {candidate.year} | {branchName}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {positionName}
                      </span>
                    </div>
                  </div>

                  {/* 3. Manifesto Preview */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Manifesto Vision
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {candidate.vision}
                    </p>
                  </div>
                </div>

                {/* 4. Read Manifesto Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(candidate)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Read Full Manifesto</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Manifesto Modal on Home Page */}
      <CandidateDetailsModal
        candidate={selectedCandidate}
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        isSelected={false}
        disabled={true}
      />
    </div>
  );
};
