/**
 * NISC Database Seeding & Initialization Service
 * Server / Admin initialization utility for Phase 3
 * Initializes:
 * 1. 1 Active Election ('nisc-election-2026')
 * 2. 3 Official Candidates (Zeus, Athena, Poseidon) under subcollection /elections/{id}/candidates/
 * 3. 70 Allowlisted Voter Member seeds
 * 4. 1 Admin authorization record (skm151412@gmail.com)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_ELECTION, INITIAL_CANDIDATES, INITIAL_ELECTION_ID } from '../config/electionData';
import { DESIGNATED_ADMIN_EMAIL, APPROVED_VOTER_EMAILS } from '../config/voterAllowlist';
import { logger } from '../utils/logger';

export interface SeedResult {
  success: boolean;
  electionSeeded: boolean;
  candidatesSeeded: number;
  adminSeeded: boolean;
  uniqueVoterCount: number;
  timestamp: string;
  error?: string;
}

/**
 * Seeds the initial election configuration and candidate seats into Firestore.
 * Idempotent & Non-destructive: Does NOT overwrite existing ballots, votes, or election state.
 */
export async function seedElectionSystem(adminUid?: string): Promise<SeedResult> {
  if (!db) {
    throw new Error('Firestore database is not initialized.');
  }

  // Section 6 Validation: Expected number of unique voters is strictly 70.
  const uniqueCount = APPROVED_VOTER_EMAILS.length;
  if (uniqueCount !== 70) {
    const errorMsg = `CRITICAL DISCREPANCY: Expected exactly 70 approved unique voters, but found ${uniqueCount}. Seed operation halted.`;
    logger.error({
      message: errorMsg,
      context: 'SeedService',
    });
    throw new Error(errorMsg);
  }

  try {
    // 1. Inspect existing election document (Idempotent: preserve if exists)
    const electionRef = doc(db, 'elections', INITIAL_ELECTION_ID);
    const existingElectionSnap = await getDoc(electionRef);

    if (!existingElectionSnap.exists()) {
      await setDoc(electionRef, {
        title: INITIAL_ELECTION.title,
        description: INITIAL_ELECTION.description,
        status: INITIAL_ELECTION.status,
        totalEligibleVoters: INITIAL_ELECTION.totalEligibleVoters,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        openedAt: null,
        closedAt: null,
        resultsPublishedAt: null,
      });
      logger.info({
        message: 'Initial election record created in UPCOMING state',
        context: 'SeedService',
      });
    } else {
      logger.info({
        message: `Election ${INITIAL_ELECTION_ID} already exists with status: ${existingElectionSnap.data()?.status}. Preserved existing data.`,
        context: 'SeedService',
      });
    }

    // 2. Seed Candidates in subcollection /elections/{electionId}/candidates/{candidateId} (Idempotent)
    let candidateCount = 0;
    for (const candidate of INITIAL_CANDIDATES) {
      const candidateRef = doc(db, 'elections', INITIAL_ELECTION_ID, 'candidates', candidate.id);
      const existingCandSnap = await getDoc(candidateRef);

      if (!existingCandSnap.exists()) {
        await setDoc(candidateRef, {
          id: candidate.id,
          slug: candidate.slug,
          name: candidate.name,
          codename: candidate.codename,
          year: candidate.year,
          department: candidate.department,
          state: candidate.state,
          color: candidate.color,
          colorLight: candidate.colorLight,
          icon: candidate.icon,
          contestingFor: candidate.contestingFor,
          vision: candidate.vision,
          pillars: candidate.pillars,
          closingStatement: candidate.closingStatement,
          voteCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      candidateCount++;
    }

    // 3. Seed Admin Record if admin UID provided
    let adminSeeded = false;
    if (adminUid) {
      const adminRef = doc(db, 'admins', adminUid);
      await setDoc(adminRef, {
        email: DESIGNATED_ADMIN_EMAIL,
        active: true,
        createdAt: serverTimestamp(),
      }, { merge: true });
      adminSeeded = true;
    }

    logger.info({
      message: 'Election system verified and seeded safely',
      context: 'SeedService',
      data: { candidateCount, electionId: INITIAL_ELECTION_ID, uniqueVoterCount: uniqueCount },
    });

    return {
      success: true,
      electionSeeded: true,
      candidatesSeeded: candidateCount,
      adminSeeded,
      uniqueVoterCount: uniqueCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({
      message: 'Failed to seed election system',
      context: 'SeedService',
      error,
    });
    return {
      success: false,
      electionSeeded: false,
      candidatesSeeded: 0,
      adminSeeded: false,
      uniqueVoterCount: uniqueCount,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
