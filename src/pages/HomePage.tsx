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
import { AuthUserProfile, Election, ElectionStatus } from '../types';
import { INITIAL_ELECTION, INITIAL_ELECTION_ID, INITIAL_CANDIDATES } from '../config/electionData';
import { subscribeToElection } from '../services/electionService';

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
      case ElectionStatus.OPEN:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>ELECTION IN PROGRESS</span>
          </div>
        );
      case ElectionStatus.CLOSED:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>VOTING CLOSED</span>
          </div>
        );
      case ElectionStatus.RESULTS:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>RESULTS AVAILABLE</span>
          </div>
        );
      case ElectionStatus.UPCOMING:
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>UPCOMING</span>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (election.status) {
      case ElectionStatus.OPEN:
        return 'Voting is now open. Cast your vote before the election closes.';
      case ElectionStatus.CLOSED:
        return 'Voting has ended. Results will be available after the election is officially closed.';
      case ElectionStatus.RESULTS:
        return 'The election has concluded and official certified results are now published.';
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

      {/* Featured Candidates Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Standing Candidates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contesting for the NISC Executive Council Presidency
            </p>
          </div>
          <button
            onClick={() => onNavigate('candidates')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Manifestos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {INITIAL_CANDIDATES.map((candidate) => (
            <div
              key={candidate.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xs">
                    {candidate.icon}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider"
                    style={{ backgroundColor: candidate.color }}
                  >
                    {candidate.codename}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{candidate.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {candidate.year} • {candidate.department}
                </p>
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic">
                  "{candidate.vision}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <button
                  onClick={() => onNavigate('candidates')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Read Manifesto →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
