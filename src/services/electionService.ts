/**
 * NISC Election Service
 * Provides client-side reads for Election and Candidate data.
 * Adheres strictly to security rules:
 * - Reads only current user's /members/{uid}
 * - Reads /elections/{electionId} and public candidate details
 * - Never queries /ballots
 * - Never queries entire /members collection
 */

import { doc, getDoc, collection, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { Election, Candidate, Member, ElectionStatus, ElectionResultsSummary } from '../types';
import { INITIAL_ELECTION, INITIAL_CANDIDATES, INITIAL_ELECTION_ID, resolveCandidateArtwork } from '../config/electionData';
import { logger } from '../utils/logger';

/**
 * Subscribes to real-time updates for an election document.
 * Falls back to INITIAL_ELECTION if offline or uninitialized.
 */
export function subscribeToElection(
  electionId: string = INITIAL_ELECTION_ID,
  onUpdate: (election: Election) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!db) {
    onUpdate(INITIAL_ELECTION);
    return () => {};
  }

  try {
    const electionRef = doc(db, 'elections', electionId);
    const unsubscribe = onSnapshot(
      electionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate({
            id: snapshot.id,
            title: data.title || INITIAL_ELECTION.title,
            description: data.description || INITIAL_ELECTION.description,
            status: (data.status as ElectionStatus) || INITIAL_ELECTION.status,
            totalEligibleVoters: data.totalEligibleVoters || INITIAL_ELECTION.totalEligibleVoters,
            createdAt: data.createdAt || INITIAL_ELECTION.createdAt,
            updatedAt: data.updatedAt || INITIAL_ELECTION.updatedAt,
            openedAt: data.openedAt || null,
            closedAt: data.closedAt || null,
            resultsPublishedAt: data.resultsPublishedAt || null,
          });
        } else {
          onUpdate(INITIAL_ELECTION);
        }
      },
      (error) => {
        logger.warn({
          message: 'Election onSnapshot listener notice',
          context: 'ElectionService',
          error,
        });
        if (onError) onError(error);
        onUpdate(INITIAL_ELECTION);
      }
    );

    return unsubscribe;
  } catch (err) {
    logger.warn({
      message: 'Failed to establish election listener, using fallback',
      context: 'ElectionService',
      error: err,
    });
    onUpdate(INITIAL_ELECTION);
    return () => {};
  }
}

/**
 * Subscribes to real-time updates for the logged-in member's own record /members/{uid}.
 * Never queries other members or whole collections.
 */
export function subscribeToMember(
  uid: string,
  onUpdate: (member: Member | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!db || !uid) {
    return () => {};
  }

  try {
    const memberRef = doc(db, 'members', uid);
    const unsubscribe = onSnapshot(
      memberRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as Member);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        logger.warn({
          message: 'Member onSnapshot listener notice',
          context: 'ElectionService',
          error,
        });
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    logger.warn({
      message: 'Failed to subscribe to member record',
      context: 'ElectionService',
      error: err,
    });
    return () => {};
  }
}

/**
 * Re-fetches the current authenticated member record directly from Firestore.
 * Used for recovery / verification after network errors.
 */
export async function getMemberRecord(uid: string): Promise<Member | null> {
  if (!db || !uid) return null;
  try {
    const memberRef = doc(db, 'members', uid);
    const snap = await getDoc(memberRef);
    if (snap.exists()) {
      return snap.data() as Member;
    }
    return null;
  } catch (err) {
    logger.warn({
      message: 'Error fetching member record',
      context: 'ElectionService',
      error: err,
    });
    return null;
  }
}

/**
 * Fetches the list of candidates for an election.
 * Sanitizes candidate data to ensure vote counts are never exposed to clients during active voting.
 */
export async function getCandidates(electionId: string = INITIAL_ELECTION_ID): Promise<Candidate[]> {
  if (!db) {
    return sanitizeCandidates(INITIAL_CANDIDATES);
  }

  try {
    const candidatesRef = collection(db, 'elections', electionId, 'candidates');
    const snapshot = await getDocs(candidatesRef);
    if (!snapshot.empty) {
      const candidates: Candidate[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Candidate;
        const initialMatch = INITIAL_CANDIDATES.find(
          (ic) =>
            ic.id === docSnap.id ||
            ic.slug === d.slug ||
            ic.house?.toLowerCase() === d.house?.toLowerCase() ||
            ic.name?.toLowerCase() === d.name?.toLowerCase()
        );
        const resolvedImage = resolveCandidateArtwork({
          id: docSnap.id,
          name: d.name,
          codename: d.codename,
          house: d.house,
          image: d.image || initialMatch?.image,
        });
        candidates.push({
          ...initialMatch,
          ...d,
          id: docSnap.id,
          image: resolvedImage,
          imageUrl: resolvedImage,
          imageAlt: d.imageAlt || initialMatch?.imageAlt || `${d.name} candidate artwork`,
          // Strict security: Zero out voteCount on client side during election
          voteCount: 0,
        });
      });
      return candidates;
    }
  } catch (err) {
    logger.warn({
      message: 'Candidate fetch failed, falling back to static config',
      context: 'ElectionService',
      error: err,
    });
  }

  return sanitizeCandidates(INITIAL_CANDIDATES);
}

/**
 * Ensures candidate vote counts are never exposed on the client
 */
function sanitizeCandidates(candidates: Candidate[]): Candidate[] {
  return candidates.map((c) => ({
    ...c,
    voteCount: 0,
  }));
}

/**
 * Phase 7: Retrieves the official published election results.
 * Returns null if election has not reached RESULTS status.
 */
export async function getElectionResults(
  electionId: string = INITIAL_ELECTION_ID
): Promise<ElectionResultsSummary | null> {
  if (db) {
    try {
      const summaryRef = doc(db, 'elections', electionId, 'results', 'summary');
      const snap = await getDoc(summaryRef);
      if (snap.exists()) {
        const data = snap.data() as ElectionResultsSummary;
        return {
          ...data,
          publishedAt: data.publishedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      logger.info({
        message: 'Direct results read unfulfilled or not published yet',
        context: 'ElectionService',
        error: err,
      });
    }
  }

  return null;
}

/**
 * Phase 7: Subscribes to real-time updates for published results summary doc
 */
export function subscribeToElectionResults(
  electionId: string = INITIAL_ELECTION_ID,
  onUpdate: (results: ElectionResultsSummary | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!db) {
    onUpdate(null);
    return () => {};
  }

  try {
    const summaryRef = doc(db, 'elections', electionId, 'results', 'summary');
    return onSnapshot(
      summaryRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as ElectionResultsSummary);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        if (onError) onError(error);
        onUpdate(null);
      }
    );
  } catch (err) {
    onUpdate(null);
    return () => {};
  }
}
