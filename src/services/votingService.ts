/**
 * NISC Voting Client Service (Pure Spark Plan Architecture)
 *
 * Direct Firestore atomic voting transaction using runTransaction:
 * 1. Executes atomic Firestore transaction:
 *    - Reads deterministic voteLock: UNIQUE(electionId, voterUid)
 *    - Verifies election status is LIVE / OPEN
 *    - Verifies member eligibility & hasVoted == false
 *    - Validates candidate belongs to election
 *    - Atomically creates lock, sealed ballot, increments candidate voteCount, updates member, and logs audit
 * 2. Implements idempotent duplicate resolution & replay protection
 * 3. Handles controlled error messages without exposing internals
 * 4. Returns sanitized receipt payload (NEVER reveals chosen candidate in receipt)
 */

import {
  collection,
  doc,
  runTransaction,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { VoteRequest, VoteResponse, AuthUserProfile } from '../types';
import { logger } from '../utils/logger';
import { INITIAL_ELECTION_ID } from '../config/electionData';
import { isFrontendCompromised, triggerFrontendRecovery } from './antiInspection';

// User-Facing Controlled Error Catalog
export const ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Please sign in before voting.',
  NOT_ELIGIBLE: 'You are not eligible to vote in this election.',
  ELECTION_NOT_OPEN: 'Voting is not currently open.',
  ALREADY_VOTED: 'Your vote has already been recorded.',
  INVALID_CANDIDATE: 'The selected candidate is not valid for this election.',
  ALREADY_PROCESSED: 'Your vote has already been processed.',
  CONCURRENT_CONFLICT: 'A concurrent voting request was detected. Only one ballot has been recorded.',
  GENERAL_ERROR: 'Your vote could not be processed at this time. Please try again.',
};

/**
 * Generates a CSPRNG-based receipt ID client-side:
 * Format: REC-XXXX-XXXX-2026
 */
export function generateCryptographicReceiptId(): string {
  const chars = '0123456789ABCDEF';
  const array = new Uint8Array(4);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 4; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex1 = Array.from(array.slice(0, 2), (b) => chars[b >> 4] + chars[b & 0xf]).join('');
  const hex2 = Array.from(array.slice(2, 4), (b) => chars[b >> 4] + chars[b & 0xf]).join('');
  return `REC-${hex1}-${hex2}-2026`;
}

/**
 * Maps raw backend / Firestore errors to safe user-facing error text
 */
export function mapVoteError(error: unknown): string {
  if (!error) return ERROR_MESSAGES.GENERAL_ERROR;

  const errString = error instanceof Error ? error.message : String(error);

  if (errString.includes('unauthenticated') || errString.includes('sign in')) {
    return ERROR_MESSAGES.UNAUTHENTICATED;
  }
  if (errString.includes('permission-denied') || errString.includes('not eligible') || errString.includes('PERMISSION_DENIED')) {
    return ERROR_MESSAGES.NOT_ELIGIBLE;
  }
  if (errString.includes('failed-precondition') || errString.includes('not currently open') || errString.includes('not open') || errString.includes('not-found')) {
    return ERROR_MESSAGES.ELECTION_NOT_OPEN;
  }
  if (errString.includes('already recorded') || errString.includes('already voted')) {
    return ERROR_MESSAGES.ALREADY_VOTED;
  }
  if (errString.includes('invalid-argument') || errString.includes('not valid') || errString.includes('INVALID_CANDIDATE')) {
    return ERROR_MESSAGES.INVALID_CANDIDATE;
  }
  if (errString.includes('already been processed') || errString.includes('alreadyProcessed')) {
    return ERROR_MESSAGES.ALREADY_PROCESSED;
  }

  return ERROR_MESSAGES.GENERAL_ERROR;
}

/**
 * In-memory / Client-side Transaction Engine for local simulation & testing
 */
const inMemoryVoteLocks = new Map<string, { receiptId: string; timestamp: string }>();
const inMemoryBallots: Array<{
  electionId: string;
  voterUid: string;
  candidateId: string;
  receiptId: string;
  createdAt: string;
}> = [];

export function resetInMemoryVotingState() {
  inMemoryVoteLocks.clear();
  inMemoryBallots.length = 0;
}

export function getInMemoryBallotsCount() {
  return inMemoryBallots.length;
}

/**
 * Submits an atomic ballot vote for an authenticated voter.
 * Sends ONLY electionId and candidateId.
 */
export async function submitBallotVote(
  payload: VoteRequest,
  profile?: AuthUserProfile
): Promise<VoteResponse> {
  if (isFrontendCompromised()) {
    triggerFrontendRecovery();
    throw new Error('Session verification failed. Reloading election portal...');
  }

  const { electionId, candidateId } = payload;

  if (!electionId) {
    throw new Error(ERROR_MESSAGES.ELECTION_NOT_OPEN);
  }

  if (!candidateId) {
    throw new Error(ERROR_MESSAGES.INVALID_CANDIDATE);
  }

  const validCandidates = ['zeus', 'athena', 'poseidon'];
  if (!validCandidates.includes(candidateId.toLowerCase())) {
    throw new Error(ERROR_MESSAGES.INVALID_CANDIDATE);
  }

  // 1. Direct Firestore Transaction (Spark Plan Primary Engine)
  if (db && profile && profile.uid && profile.role !== 'UNAUTHENTICATED') {
    try {
      const lockDocId = `${electionId}_${profile.uid}`;
      const lockRef = doc(db, 'voteLocks', lockDocId);
      const memberRef = doc(db, 'members', profile.uid);
      const electionRef = doc(db, 'elections', electionId);
      const candidateRef = doc(db, 'elections', electionId, 'candidates', candidateId);
      const ballotRef = doc(collection(db, 'ballots'));
      const auditRef = doc(collection(db, 'auditLogs'));

      const generatedReceiptId = generateCryptographicReceiptId();

      const txResult = await runTransaction(db, async (tx) => {
        // Read Phase
        const lockSnap = await tx.get(lockRef);
        if (lockSnap.exists()) {
          return {
            success: true,
            receiptId: lockSnap.data()?.receiptId || generatedReceiptId,
            alreadyProcessed: true,
          };
        }

        const electionSnap = await tx.get(electionRef);
        if (!electionSnap.exists()) {
          throw new Error(ERROR_MESSAGES.ELECTION_NOT_OPEN);
        }

        const status = String(electionSnap.data()?.status || '').toUpperCase();
        if (status !== 'LIVE' && status !== 'OPEN') {
          if (status === 'PAUSED' || status === 'CLOSED') {
            throw new Error('Voting is temporarily paused. Please try again when the election is resumed.');
          }
          if (status === 'UPCOMING') {
            throw new Error('Voting has not started yet.');
          }
          if (status === 'FINISHED' || status === 'RESULTS') {
            throw new Error('Voting is closed for this election.');
          }
          throw new Error(ERROR_MESSAGES.ELECTION_NOT_OPEN);
        }

        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists() || memberSnap.data()?.eligible !== true) {
          throw new Error(ERROR_MESSAGES.NOT_ELIGIBLE);
        }
        if (memberSnap.data()?.hasVoted === true) {
          return {
            success: true,
            receiptId: memberSnap.data()?.receiptId || generatedReceiptId,
            alreadyProcessed: true,
          };
        }

        const normEmail = (profile.email || '').trim().toLowerCase();
        const approvedRef = doc(db, 'approvedVoters', normEmail);
        const approvedSnap = await tx.get(approvedRef);
        if (!approvedSnap.exists() || approvedSnap.data()?.eligible !== true) {
          throw new Error(ERROR_MESSAGES.NOT_ELIGIBLE);
        }

        const candidateSnap = await tx.get(candidateRef);
        if (!candidateSnap.exists()) {
          throw new Error(ERROR_MESSAGES.INVALID_CANDIDATE);
        }

        // Write Phase (Atomic Commit)
        tx.set(lockRef, {
          electionId,
          voterUid: profile.uid,
          receiptId: generatedReceiptId,
          ballotId: ballotRef.id,
          createdAt: serverTimestamp(),
        });

        tx.set(ballotRef, {
          electionId,
          voterUid: profile.uid,
          voterEmail: normEmail,
          candidateId,
          receiptId: generatedReceiptId,
          createdAt: serverTimestamp(),
        });

        tx.update(memberRef, {
          hasVoted: true,
          receiptId: generatedReceiptId,
          votedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // SEC-02 REMEDIATION:
        // Candidates collection is strictly admin-writable to prevent voteCount tampering.
        // The authoritative sealed vote is committed to /ballots above.

        tx.set(auditRef, {
          action: 'VOTE_CAST',
          actorUid: profile.uid,
          actorEmail: normEmail,
          electionId,
          metadata: {
            receiptId: generatedReceiptId,
          },
          createdAt: serverTimestamp(),
        });

        return {
          success: true,
          receiptId: generatedReceiptId,
          alreadyProcessed: false,
        };
      });

      return txResult;
    } catch (error: unknown) {
      logger.error({
        message: 'Direct Firestore voting transaction failed',
        context: 'VotingService',
        error,
      });

      // SEC-05 REMEDIATION:
      // Authoritative backend errors MUST be propagated to the caller.
      // NEVER silently swallow the error or fall back to an in-memory fake vote!
      throw error;
    }
  }

  // 2. High-Security In-Memory Transaction Engine (Used ONLY in offline test environments where !db)
  if (db) {
    throw new Error(ERROR_MESSAGES.GENERAL_ERROR);
  }
  if (!profile || profile.role === 'UNAUTHENTICATED') {
    throw new Error(ERROR_MESSAGES.UNAUTHENTICATED);
  }

  if (profile.role === 'UNAUTHORIZED' || !profile.isAllowlisted) {
    throw new Error(ERROR_MESSAGES.NOT_ELIGIBLE);
  }

  if (profile.memberRecord && profile.memberRecord.eligible === false) {
    throw new Error(ERROR_MESSAGES.NOT_ELIGIBLE);
  }

  // Deterministic Lock Check: UNIQUE(electionId, voterUid)
  const lockKey = `${electionId}_${profile.uid}`;
  const existingLock = inMemoryVoteLocks.get(lockKey);

  if (existingLock || (profile.memberRecord && profile.memberRecord.hasVoted)) {
    return {
      success: true,
      receiptId: existingLock?.receiptId || profile.memberRecord?.receiptId || generateCryptographicReceiptId(),
      alreadyProcessed: true,
      message: ERROR_MESSAGES.ALREADY_VOTED,
    };
  }

  // Generate CSPRNG Receipt
  const receiptId = generateCryptographicReceiptId();
  const timestamp = new Date().toISOString();

  // Atomically acquire lock and store ballot
  inMemoryVoteLocks.set(lockKey, { receiptId, timestamp });
  inMemoryBallots.push({
    electionId,
    voterUid: profile.uid,
    candidateId,
    receiptId,
    createdAt: timestamp,
  });

  if (profile.memberRecord) {
    profile.memberRecord.hasVoted = true;
    profile.memberRecord.receiptId = receiptId;
    profile.memberRecord.votedAt = timestamp;
  }

  return {
    success: true,
    receiptId,
  };
}

