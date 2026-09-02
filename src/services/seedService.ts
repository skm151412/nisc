/**
 * NISC Database Seeding & Initialization Service
 * Server / Admin initialization utility for Phase 3
 * Initializes:
 * 1. 1 Active Election ('nisc-election-2026')
 * 2. 3 Official Candidates (Zeus, Athena, Poseidon) under subcollection /elections/{id}/candidates/
 * 3. 79 Allowlisted Voter Member seeds
 * 4. 1 Admin authorization record (skm151412@gmail.com)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_ELECTION, INITIAL_CANDIDATES, INITIAL_ELECTION_ID } from '../config/electionData';
import { DESIGNATED_ADMIN_EMAIL, APPROVED_VOTER_EMAILS, APPROVED_VOTERS, normalizeEmail } from '../config/voterAllowlist';
import { logger } from '../utils/logger';

export interface SeedResult {
  success: boolean;
  electionSeeded: boolean;
  candidatesSeeded: number;
  adminSeeded: boolean;
  approvedVotersSeeded: number;
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

  // Section 6 Validation: Expected number of unique voters is strictly 79.
  const uniqueCount = APPROVED_VOTER_EMAILS.length;
  if (uniqueCount !== 79) {
    const errorMsg = `CRITICAL DISCREPANCY: Expected exactly 79 approved unique voters, but found ${uniqueCount}. Seed operation halted.`;
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

    // 2. Seed / Update Candidates in subcollection /elections/{electionId}/candidates/{candidateId} (Non-destructive)
    let candidateCount = 0;
    for (const candidate of INITIAL_CANDIDATES) {
      const candidateRef = doc(db, 'elections', INITIAL_ELECTION_ID, 'candidates', candidate.id);
      const existingCandSnap = await getDoc(candidateRef);

      const candidateData = {
        id: candidate.id,
        slug: candidate.slug,
        name: candidate.name,
        codename: candidate.codename,
        house: candidate.house || candidate.codename,
        year: candidate.year,
        department: candidate.department,
        branch: candidate.branch || candidate.department,
        state: candidate.state,
        color: candidate.color,
        colorLight: candidate.colorLight,
        icon: candidate.icon,
        image: candidate.image || candidate.imageUrl || '',
        imageUrl: candidate.imageUrl || candidate.image || '',
        imageAlt: candidate.imageAlt || '',
        contestingFor: candidate.contestingFor,
        position: candidate.position || 'Candidate for President',
        roleInfo: candidate.roleInfo || '',
        vision: candidate.vision,
        pillars: candidate.pillars,
        closingStatement: candidate.closingStatement,
        signature: candidate.signature || '',
        updatedAt: serverTimestamp(),
      };

      if (!existingCandSnap.exists()) {
        await setDoc(candidateRef, {
          ...candidateData,
          voteCount: 0,
          createdAt: serverTimestamp(),
        });
      } else {
        // Safe metadata update: preserves existing voteCount and other historical counters
        await setDoc(candidateRef, candidateData, { merge: true });
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

    // 4. Seed / Verify Authoritative Voter Registry in /approvedVoters/{normalizedEmail} (Idempotent & Non-destructive)
    let approvedVotersSeeded = 0;
    for (const voter of APPROVED_VOTERS) {
      const normEmail = normalizeEmail(voter.email);
      const approvedRef = doc(db, 'approvedVoters', normEmail);
      const existingSnap = await getDoc(approvedRef);
      if (!existingSnap.exists()) {
        await setDoc(approvedRef, {
          email: normEmail,
          name: voter.name,
          rollNumber: voter.rollNumber,
          batch: voter.batch,
          department: voter.department,
          state: voter.state || 'ACTIVE',
          eligible: true,
          createdAt: serverTimestamp(),
        });
        approvedVotersSeeded++;
      }
    }

    logger.info({
      message: 'Election system verified and seeded safely',
      context: 'SeedService',
      data: { candidateCount, electionId: INITIAL_ELECTION_ID, uniqueVoterCount: uniqueCount, approvedVotersSeeded },
    });

    return {
      success: true,
      electionSeeded: true,
      candidatesSeeded: candidateCount,
      adminSeeded,
      approvedVotersSeeded,
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
      approvedVotersSeeded: 0,
      uniqueVoterCount: uniqueCount,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
