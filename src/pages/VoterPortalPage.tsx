import React, { useState, useEffect, useCallback } from 'react';
import {
  Vote,
  ShieldCheck,
  Award,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  AuthUserProfile,
  Candidate,
  Election,
  ElectionStatus,
  Member,
} from '../types';
import { INITIAL_CANDIDATES, INITIAL_ELECTION, INITIAL_ELECTION_ID } from '../config/electionData';
import {
  subscribeToElection,
  subscribeToMember,
  getCandidates,
  getMemberRecord,
} from '../services/electionService';
import { submitBallotVote, mapVoteError } from '../services/votingService';
import { VoterInfoCard } from '../components/voter/VoterInfoCard';
import { ElectionStatusBanner } from '../components/voter/ElectionStatusBanner';
import { CandidateCard } from '../components/voter/CandidateCard';
import { CandidateDetailsModal } from '../components/voter/CandidateDetailsModal';
import { VoteConfirmationModal } from '../components/voter/VoteConfirmationModal';
import { VoteSuccessReceipt } from '../components/voter/VoteSuccessReceipt';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { logger } from '../utils/logger';

interface VoterPortalPageProps {
  profile: AuthUserProfile;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
}

export const VoterPortalPage: React.FC<VoterPortalPageProps> = ({
  profile,
  onSignOut,
  onNavigate,
}) => {
  // Real-time State from Firestore
  const [election, setElection] = useState<Election>(INITIAL_ELECTION);
  const [member, setMember] = useState<Member | null>(profile.memberRecord || null);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Voting Interaction State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [activeModalCandidate, setActiveModalCandidate] = useState<Candidate | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Immediate Receipt State (from submission or Firestore record)
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    receiptId: string;
    timestamp: string;
  } | null>(null);

  // 1. Subscribe to Real-Time Election Status
  useEffect(() => {
    const unsubscribeElection = subscribeToElection(
      INITIAL_ELECTION_ID,
      (updatedElection) => {
        setElection(updatedElection);
        setLoadingData(false);
      },
      (err) => {
        logger.warn({
          message: 'Error listening to election updates',
          context: 'VoterPortalPage',
          error: err,
        });
      }
    );

    return () => {
      unsubscribeElection();
    };
  }, []);

  // 2. Subscribe to Real-Time Current Member Doc (/members/{profile.uid})
  // Multi-Tab Safety: If user votes in Tab A, Tab B automatically locks voting controls!
  useEffect(() => {
    if (!profile.uid) return;

    const unsubscribeMember = subscribeToMember(
      profile.uid,
      (updatedMember) => {
        if (updatedMember) {
          setMember(updatedMember);
          if (updatedMember.hasVoted && updatedMember.receiptId) {
            setSubmissionReceipt({
              receiptId: updatedMember.receiptId,
              timestamp: updatedMember.votedAt || new Date().toISOString(),
            });
          }
        }
      },
      (err) => {
        logger.warn({
          message: 'Error listening to member updates',
          context: 'VoterPortalPage',
          error: err,
        });
      }
    );

    return () => {
      unsubscribeMember();
    };
  }, [profile.uid]);

  // 3. Load Candidates (Vote counts are stripped client-side during active election)
  useEffect(() => {
    let isMounted = true;
    getCandidates(INITIAL_ELECTION_ID).then((list) => {
      if (isMounted && list.length > 0) {
        setCandidates(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAlreadyVoted = Boolean(member?.hasVoted || submissionReceipt?.receiptId);
  const isElectionOpen = election.status === ElectionStatus.OPEN;
  const isEligible = member?.eligible !== false && profile.isAllowlisted;

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || null;

  // Single Candidate Selection Handler
  const handleSelectCandidate = useCallback(
    (candidateId: string) => {
      if (hasAlreadyVoted || !isElectionOpen) return;
      setSelectedCandidateId(candidateId);
      setErrorMessage(null);
    },
    [hasAlreadyVoted, isElectionOpen]
  );

  // View Candidate Details Modal Handler
  const handleViewCandidateDetails = (candidate: Candidate) => {
    setActiveModalCandidate(candidate);
  };

  // Open Confirmation Step
  const handleInitiateVote = () => {
    if (!selectedCandidateId) {
      setErrorMessage('Please select a candidate before proceeding to confirmation.');
      return;
    }
    if (!isElectionOpen) {
      setErrorMessage('Voting is not currently open for this election.');
      return;
    }
    if (hasAlreadyVoted) {
      setErrorMessage('Your vote has already been recorded.');
      return;
    }
    setIsConfirmModalOpen(true);
    setErrorMessage(null);
  };

  // Secure Vote Submission (Phase 4 / Phase 5 Cloud Function Integration)
  const handleConfirmVote = async () => {
    if (!selectedCandidateId || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Sends ONLY { electionId, candidateId } to Cloud Function submitVote
      // Server securely resolves voterUid, voterEmail, eligibility, lock, receipt, timestamp
      const response = await submitBallotVote(
        {
          electionId: election.id,
          candidateId: selectedCandidateId,
        },
        profile
      );

      if (response.success && response.receiptId) {
        const timestamp = new Date().toISOString();
        setSubmissionReceipt({
          receiptId: response.receiptId,
          timestamp,
        });

        // Update local member state
        setMember((prev) =>
          prev
            ? {
                ...prev,
                hasVoted: true,
                receiptId: response.receiptId,
                votedAt: timestamp,
              }
            : null
        );

        setIsConfirmModalOpen(false);
      } else {
        setErrorMessage(response.message || 'Failed to submit vote. Please try again.');
      }
    } catch (err: unknown) {
      const mappedError = mapVoteError(err);
      setErrorMessage(mappedError);
      setIsConfirmModalOpen(false);

      // Safe Network Recovery: Check if server actually recorded the vote before allowing retry
      if (profile.uid) {
        try {
          const freshRecord = await getMemberRecord(profile.uid);
          if (freshRecord && freshRecord.hasVoted && freshRecord.receiptId) {
            setMember(freshRecord);
            setSubmissionReceipt({
              receiptId: freshRecord.receiptId,
              timestamp: freshRecord.votedAt || new Date().toISOString(),
            });
            setErrorMessage(null);
          }
        } catch {
          // Keep mapped error
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData && !election) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-500">Loading voter session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-2 sm:px-4">
      {/* 1. Voter Verified Identity Card */}
      <VoterInfoCard
        profile={profile}
        member={member}
        hasVoted={hasAlreadyVoted}
        onSignOut={onSignOut}
      />

      {/* 2. Real-Time Election Status Banner */}
      <ElectionStatusBanner
        election={election}
        onNavigateToResults={() => onNavigate('results')}
      />

      {/* Error Message Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Voting Notice</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 3. CONDITIONAL WORKFLOW: ALREADY VOTED (RECEIPT) vs CANDIDATE SELECTION */}
      {hasAlreadyVoted ? (
        <VoteSuccessReceipt
          receiptId={
            submissionReceipt?.receiptId ||
            member?.receiptId ||
            'REC-CONFIRMED-2026'
          }
          timestamp={submissionReceipt?.timestamp || member?.votedAt || undefined}
          election={election}
          onNavigateToCandidates={() => onNavigate('elections')}
          onNavigateToResults={() => onNavigate('results')}
        />
      ) : (
        /* CANDIDATE SELECTION & VOTING WORKFLOW */
        <div className="space-y-6">
          {/* Candidates Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Official Candidates for Executive Council
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review candidate visions and select exactly one candidate to allocate your ballot.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {candidates.length} Candidates Standing
              </span>
            </div>
          </div>

          {/* Accessible Candidates Radio Group */}
          <div
            role="radiogroup"
            aria-label="Official candidates for Executive Council election"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidateId === candidate.id}
                onSelect={handleSelectCandidate}
                onViewDetails={handleViewCandidateDetails}
                disabled={!isElectionOpen || !isEligible}
              />
            ))}
          </div>

          {/* Bottom Cast Ballot Action Bar */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {selectedCandidate
                    ? `Selected: ${selectedCandidate.codename} (${selectedCandidate.name})`
                    : isElectionOpen
                    ? 'Ready to Cast Your Ballot'
                    : 'Voting is Currently Closed'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {selectedCandidate
                  ? 'Proceed to the confirmation dialog to permanently seal your vote.'
                  : isElectionOpen
                  ? 'Select one candidate above to enable the submission action.'
                  : 'Voting actions are only active when the election state is OPEN.'}
              </p>
            </div>

            <button
              id="voter-cast-ballot-action-btn"
              type="button"
              onClick={handleInitiateVote}
              disabled={!selectedCandidateId || !isElectionOpen || !isEligible || isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              aria-label={
                selectedCandidate
                  ? `Proceed to vote for candidate ${selectedCandidate.codename}`
                  : 'Select a candidate to vote'
              }
            >
              <span>
                {selectedCandidate
                  ? `Vote for ${selectedCandidate.codename}`
                  : 'Select Candidate to Vote'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Candidate Full Profile & Manifesto Modal */}
      <CandidateDetailsModal
        candidate={activeModalCandidate}
        isOpen={Boolean(activeModalCandidate)}
        onClose={() => setActiveModalCandidate(null)}
        isSelected={selectedCandidateId === activeModalCandidate?.id}
        onSelect={(candidateId) => {
          handleSelectCandidate(candidateId);
          setActiveModalCandidate(null);
        }}
        disabled={!isElectionOpen || hasAlreadyVoted || !isEligible}
      />

      {/* Dedicated Confirmation Modal with Double-Confirmation Safety */}
      <VoteConfirmationModal
        candidate={selectedCandidate}
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmVote}
        isSubmitting={isSubmitting}
        profile={profile}
      />
    </div>
  );
};
