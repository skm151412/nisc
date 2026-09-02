import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Calendar,
  Lock,
  ShieldCheck,
  RefreshCw,
  Vote,
  Sparkles,
  BarChart3,
  Users,
} from 'lucide-react';
import {
  Election,
  ElectionStatus,
  ElectionResultsSummary,
  AuthUserProfile,
} from '../types';
import { INITIAL_ELECTION, INITIAL_ELECTION_ID } from '../config/electionData';
import { APPROVED_VOTER_EMAILS } from '../config/voterAllowlist';
import {
  subscribeToElection,
  getElectionResults,
  subscribeToElectionResults,
} from '../services/electionService';
import { WinnerCard } from '../components/results/WinnerCard';
import { CandidateResultsList } from '../components/results/CandidateResultsList';
import { ParticipationSummaryCard } from '../components/results/ParticipationSummaryCard';
import { ResultsPendingView } from '../components/results/ResultsPendingView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { logger } from '../utils/logger';

interface ResultsPageProps {
  profile?: AuthUserProfile | null;
  onNavigate: (page: string) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ profile, onNavigate }) => {
  const [election, setElection] = useState<Election>(INITIAL_ELECTION);
  const [results, setResults] = useState<ElectionResultsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isFinished = election.status === ElectionStatus.FINISHED;

  // Subscribe to election doc
  useEffect(() => {
    const unsubscribeElection = subscribeToElection(
      INITIAL_ELECTION_ID,
      (updatedElection) => {
        setElection(updatedElection);
        const isUpFinished = updatedElection.status === ElectionStatus.FINISHED;
        if (!isUpFinished) {
          setResults(null);
          setLoading(false);
        }
      },
      (err) => {
        logger.warn({ message: 'Election listener in ResultsPage', error: err });
      }
    );

    return () => {
      unsubscribeElection();
    };
  }, []);

  // Fetch / Subscribe to results if in FINISHED or RESULTS status
  useEffect(() => {
    if (isFinished) {
      setLoading(true);
      const unsubscribeResults = subscribeToElectionResults(
        INITIAL_ELECTION_ID,
        (data) => {
          if (data) {
            setResults(data);
          }
          setLoading(false);
        },
        () => {
          // Fallback fetch
          getElectionResults(INITIAL_ELECTION_ID).then((res) => {
            setResults(res);
            setLoading(false);
          });
        }
      );

      return () => {
        unsubscribeResults();
      };
    } else {
      setResults(null);
      setLoading(false);
    }
  }, [isFinished]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getElectionResults(INITIAL_ELECTION_ID);
      if (res) setResults(res);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading && isFinished) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-500 font-mono">Loading Certified Election Results...</p>
      </div>
    );
  }

  // If election is not yet in FINISHED/RESULTS state, show the protected pending view (Zero-Leakage)
  if (!isFinished) {
    return (
      <ResultsPendingView
        status={election.status}
        onNavigateToPortal={() => onNavigate('voter-portal')}
        onNavigateToCandidates={() => onNavigate('elections')}
      />
    );
  }

  // Fallback fallback if results summary document is compiling
  const totalCast = results?.totalVotesCast ?? 0;
  const totalEligible = results?.totalEligibleVoters ?? APPROVED_VOTER_EMAILS.length;
  const didNotVote = results?.didNotVote ?? Math.max(0, totalEligible - totalCast);
  const turnout = results?.participationPercentage ?? (totalEligible > 0 ? Number(((totalCast / totalEligible) * 100).toFixed(1)) : 0);

  const formattedPublishDate = results?.publishedAt || election.resultsPublishedAt
    ? new Date(results?.publishedAt || election.resultsPublishedAt || '').toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* 1. Official Header Banner */}
      <div className="bg-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              North India Student Cell
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Results Published</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
            Executive Council General Election 2026
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Official certified election results certified by the NISC Election Commission.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Results Published: <strong className="text-slate-200">{formattedPublishDate}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Winner or Contested Tie Banner */}
      {results?.winnerInfo && (
        <WinnerCard
          winnerInfo={results.winnerInfo}
          totalVotesCast={totalCast}
        />
      )}

      {/* 3. Key Participation Metrics */}
      <ParticipationSummaryCard
        totalEligibleVoters={totalEligible}
        totalVotesCast={totalCast}
        didNotVote={didNotVote}
        participationPercentage={turnout}
        publishedAt={results?.publishedAt || election.resultsPublishedAt || undefined}
      />

      {/* 4. Candidate Breakdown with Visual Bars */}
      {results?.candidates && results.candidates.length > 0 && (
        <CandidateResultsList
          candidates={results.candidates}
          totalVotesCast={totalCast}
        />
      )}

      {/* 5. Certified Election Information */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Certified Election Information
        </div>
        <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>Ballot Secrecy:</strong> Individual voter selections remain completely private. No candidate-voter linkages are stored or published.
          </li>
          <li>
            <strong>Official Certification:</strong> Certified results represent the final official count as published by the NISC Election Commission.
          </li>
        </ul>
      </div>
    </div>
  );
};
