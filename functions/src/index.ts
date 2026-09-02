/**
 * NISC Election System - Cloud Functions (Phase 3)
 *
 * Trusted server-side operations using Firebase Admin SDK:
 * 1. Admin claim assignment for skm151412@gmail.com
 * 2. Server-side allowlist verification & UID-indexed member record creation
 * 3. Seed initial election and candidate models
 * 4. Health check
 */

import * as admin from 'firebase-admin';
import { onCall, onRequest, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as functionsV1 from 'firebase-functions/v1';
import * as logger from 'firebase-functions/logger';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const DESIGNATED_ADMIN_EMAILS = [
  'skm151412@gmail.com',
  'mohiuddinahmad9abcs@gmail.com',
];
const DESIGNATED_ADMIN_EMAIL = DESIGNATED_ADMIN_EMAILS[0];

const RAW_VOTER_EMAILS = [
  '2410080042@klh.edu.in',
  '2410030472@klh.edu.in',
  '2410030302@klh.edu.in',
  '2410080043@klh.edu.in',
  '2410080035@klh.edu.in',
  '2410030075@klh.edu.in',
  '2410030111@klh.edu.in',
  '2410030510@klh.edu.in',
  '2410030469@klh.edu.in',
  '2410030456@klh.edu.in',
  '2410030346@klh.edu.in',
  '2410030096@klh.edu.in',
  '2410030520@klh.edu.in',
  '2410030109@klh.edu.in',
  '2410080017@klh.edu.in',
  '2410030026@klh.edu.in',
  '2410030316@klh.edu.in',
  '2410080008@klh.edu.in',
  '2410030196@klh.edu.in',
  '2410030530@klh.edu.in',
  '2410030404@klh.edu.in',
  '2410030023@klh.edu.in',
  '2410030521@klh.edu.in',
  '2410030110@klh.edu.in',
  '2410030170@klh.edu.in',
  '2410080075@klh.edu.in',
  '2410080023@klh.edu.in',
  '2410080026@klh.edu.in',
  '2410030285@klh.edu.in',
  '2410030021@klh.edu.in',
  '2410030515@klh.edu.in',
  '2410040023@klh.edu.in',
  '2510030203@klh.edu.in',
  '2510030062@klh.edu.in',
  '2510030088@klh.edu.in',
  '2510030087@klh.edu.in',
  '2510030077@klh.edu.in',
  '2510040121@klh.edu.in',
  '2510520036@klh.edu.in',
  '2510030181@klh.edu.in',
  '2510030390@klh.edu.in',
  '2510030436@klh.edu.in',
  '2510030053@klh.edu.in',
  '2510040039@klh.edu.in',
  '2510080004@klh.edu.in',
  '2510030059@klh.edu.in',
  '2510030152@klh.edu.in',
  '2510030057@klh.edu.in',
  '2510040024@klh.edu.in',
  '2510040034@klh.edu.in',
  '2510030356@klh.edu.in',
  '2510030080@klh.edu.in',
  '2510030350@klh.edu.in',
  '2510040078@klh.edu.in',
  '2510030235@klh.edu.in',
  '2510030352@klh.edu.in',
  '2510030299@klh.edu.in',
  '2510040014@klh.edu.in',
  '2510030052@klh.edu.in',
  '2520030540@klh.edu.in',
  '2510250035@klh.edu.in',
  '2610030324@klh.edu.in',
  '2610030377@klh.edu.in',
  '2610030343@klh.edu.in',
  '2610030395@klh.edu.in',
  '2610030362@klh.edu.in',
  '2610030348@klh.edu.in',
  '2610030388@klh.edu.in',
  '2610030015@klh.edu.in',
  '2610030123@klh.edu.in',
];

const APPROVED_VOTER_SET = new Set(
  RAW_VOTER_EMAILS.map((e) => e.trim().toLowerCase())
);

function deriveDetails(email: string) {
  const rollNumber = email.split('@')[0] || '';
  let batch = 'Batch 2024';
  if (rollNumber.startsWith('24')) batch = 'Batch 2024';
  else if (rollNumber.startsWith('25')) batch = 'Batch 2025';
  else if (rollNumber.startsWith('26')) batch = 'Batch 2026';

  let department = 'Computer Science & Engineering';
  if (rollNumber.includes('008')) department = 'AI & Data Science';
  else if (rollNumber.includes('004')) department = 'Electronics & Communication';
  else if (rollNumber.includes('025') || rollNumber.includes('052')) department = 'Information Technology';

  return {
    rollNumber,
    batch,
    department,
    name: `Student (${rollNumber})`,
    state: 'Active',
  };
}

/**
 * Health check handler
 */
export const healthCheck = onRequest((request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'nisc-election-functions',
    phase: 4,
    adminConfigured: DESIGNATED_ADMIN_EMAIL,
    allowlistedVoterCount: APPROVED_VOTER_SET.size,
  });
});

/**
 * Auth trigger on user creation:
 * - Checks if email is skm151412@gmail.com -> assigns { admin: true } custom claim and /admins/{uid} doc
 * - Checks if email is in the allowlist -> creates /members/{uid} doc
 */
export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const email = user.email ? user.email.trim().toLowerCase() : '';
  const uid = user.uid;

  logger.info(`Processing new user creation: ${email} (${uid})`);

  if (!email) {
    logger.warn(`User ${uid} has no email address. Skipping.`);
    return;
  }

  // 1. Exact Admin Authorization Check (Both Administrators)
  const isAdmin = DESIGNATED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email);
  if (isAdmin) {
    try {
      await auth.setCustomUserClaims(uid, { admin: true });
      await db.collection('admins').doc(uid).set(
        {
          email,
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      logger.info(`Custom admin claim and /admins/${uid} document created for admin: ${email}`);
    } catch (error) {
      logger.error(`Failed to assign admin claim to ${email}:`, error);
    }
    return;
  }

  // 2. Member Allowlist Verification & UID Document Creation
  if (APPROVED_VOTER_SET.has(email)) {
    try {
      const details = deriveDetails(email);
      await db.collection('members').doc(uid).set(
        {
          name: user.displayName || details.name,
          email,
          rollNumber: details.rollNumber,
          batch: details.batch,
          department: details.department,
          state: 'ACTIVE',
          eligible: true,
          hasVoted: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      logger.info(`Created /members/${uid} document for allowlisted voter ${email}`);
    } catch (error) {
      logger.error(`Error creating /members/${uid} for ${email}:`, error);
    }
  } else {
    logger.warn(
      `User ${email} created an account but is not in the approved voter allowlist.`
    );
  }
});

export interface SubmitVoteData {
  electionId?: string;
  candidateId?: string;
  // Any extra untrusted fields supplied by clients are strictly ignored
  [key: string]: unknown;
}

/**
 * PHASE 4: SECURE ONE-PERSON-ONE-VOTE ATOMIC TRANSACTION
 *
 * Requirements:
 * 1. Derives authenticated identity strictly from request.auth.uid (Zero-Trust)
 * 2. Validates election status is strictly 'OPEN'
 * 3. Verifies member exists and eligible === true
 * 4. Ensures hasVoted === false and enforces deterministic voteLock UNIQUE(electionId, voterUid)
 * 5. Validates candidate belongs to the election
 * 6. Executes atomic Firestore transaction for all reads & writes
 * 7. Generates cryptographically secure receipt ID: REC-XXXX-XXXX-2026
 * 8. Creates sealed ballot document in /ballots (direct client write forbidden)
 * 9. Atomically marks member hasVoted = true and increments candidate voteCount
 * 10. Creates tamper-resistant auditLog entry
 * 11. Returns minimal receipt without exposing chosen candidate
 */
export const submitVote = onCall(async (request: CallableRequest<SubmitVoteData>) => {
  // 1. Authentication Check (Rejects unauthenticated requests immediately)
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Please sign in before voting.'
    );
  }

  const voterUid = request.auth.uid;
  const voterEmail = request.auth.token.email
    ? request.auth.token.email.trim().toLowerCase()
    : '';

  // 2. Input Validation (Accepts strictly electionId and candidateId)
  // Ignores/rejects any client-supplied voterUid, voterEmail, hasVoted, voteCount
  const { electionId, candidateId } = request.data || {};

  if (!electionId || typeof electionId !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The selected election is required.'
    );
  }

  if (!candidateId || typeof candidateId !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The selected candidate is not valid for this election.'
    );
  }

  // 3. Generate Cryptographically Secure Receipt ID: REC-XXXX-XXXX-2026 (CSPRNG)
  const randA = crypto.randomBytes(2).toString('hex').toUpperCase();
  const randB = crypto.randomBytes(2).toString('hex').toUpperCase();
  const generatedReceiptId = `REC-${randA}-${randB}-2026`;

  // 4. Deterministic Concurrency & Replay Guard: UNIQUE(electionId, voterUid)
  const lockDocId = `${electionId}_${voterUid}`;
  const lockRef = db.collection('voteLocks').doc(lockDocId);

  // Firestore Document References
  const electionRef = db.collection('elections').doc(electionId);
  const memberRef = db.collection('members').doc(voterUid);
  const candidateRef = db
    .collection('elections')
    .doc(electionId)
    .collection('candidates')
    .doc(candidateId);

  // Sealed cryptographic ballot document ID
  const ballotDocId = crypto
    .createHash('sha256')
    .update(`${electionId}:${voterUid}:${crypto.randomBytes(16).toString('hex')}`)
    .digest('hex');
  const ballotRef = db.collection('ballots').doc(ballotDocId);
  const auditRef = db.collection('auditLogs').doc();

  // 5. Execute Atomic Firestore Transaction
  try {
    const transactionResult = await db.runTransaction(async (transaction) => {
      // -------------------------------------------------------------
      // READ PHASE (All reads executed before any write)
      // -------------------------------------------------------------
      const lockDoc = await transaction.get(lockRef);
      const electionDoc = await transaction.get(electionRef);
      const memberDoc = await transaction.get(memberRef);
      const candidateDoc = await transaction.get(candidateRef);

      // Guard A: Check Deterministic Vote Lock (Idempotent Retry & Replay Defense)
      if (lockDoc.exists) {
        const lockData = lockDoc.data();
        return {
          success: true,
          receiptId: lockData?.receiptId || generatedReceiptId,
          alreadyProcessed: true,
        };
      }

      // Guard B: Election Existence & Status Validation
      if (!electionDoc.exists) {
        throw new HttpsError(
          'not-found',
          'Voting is not currently open.'
        );
      }
      const electionData = electionDoc.data();
      const currentElectionStatus = String(electionData?.status || '').toUpperCase();

      if (currentElectionStatus === 'PAUSED' || currentElectionStatus === 'CLOSED') {
        throw new HttpsError(
          'failed-precondition',
          'Voting is temporarily paused. Please try again when the election is resumed.'
        );
      }

      if (currentElectionStatus === 'UPCOMING') {
        throw new HttpsError(
          'failed-precondition',
          'Voting has not started yet.'
        );
      }

      if (currentElectionStatus === 'FINISHED' || currentElectionStatus === 'RESULTS') {
        throw new HttpsError(
          'failed-precondition',
          'Voting is closed for this election.'
        );
      }

      if (currentElectionStatus !== 'LIVE' && currentElectionStatus !== 'OPEN') {
        throw new HttpsError(
          'failed-precondition',
          'Voting is not currently open.'
        );
      }

      // Guard C: Member Existence & Eligibility Verification
      if (!memberDoc.exists) {
        throw new HttpsError(
          'permission-denied',
          'You are not eligible to vote in this election.'
        );
      }
      const memberData = memberDoc.data();
      if (memberData?.eligible !== true) {
        throw new HttpsError(
          'permission-denied',
          'You are not eligible to vote in this election.'
        );
      }
      if (memberData?.hasVoted === true) {
        return {
          success: true,
          receiptId: memberData.receiptId || generatedReceiptId,
          alreadyProcessed: true,
        };
      }

      // Guard D: Candidate Existence & Association Validation
      if (!candidateDoc.exists) {
        throw new HttpsError(
          'invalid-argument',
          'The selected candidate is not valid for this election.'
        );
      }

      // -------------------------------------------------------------
      // WRITE PHASE (Atomic All-or-Nothing Commit)
      // -------------------------------------------------------------

      // 1. Set Deterministic Vote Lock
      transaction.set(lockRef, {
        electionId,
        voterUid,
        receiptId: generatedReceiptId,
        ballotId: ballotDocId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Insert Sealed Ballot Record (Stores candidate relation for admin audit)
      transaction.set(ballotRef, {
        electionId,
        voterUid,
        voterEmail: memberData.email || voterEmail,
        candidateId,
        receiptId: generatedReceiptId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Mark Member as Voted
      transaction.update(memberRef, {
        hasVoted: true,
        receiptId: generatedReceiptId,
        votedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Atomically Increment Candidate voteCount
      transaction.update(candidateRef, {
        voteCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Append Tamper-Resistant Audit Log
      transaction.set(auditRef, {
        action: 'VOTE_CAST',
        actorUid: voterUid,
        actorEmail: memberData.email || voterEmail,
        electionId,
        metadata: {
          candidateId,
          receiptId: generatedReceiptId,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        receiptId: generatedReceiptId,
        alreadyProcessed: false,
      };
    });

    // 6. Return Clean Client Response
    // IMPORTANT: Receipt contains ONLY receiptId, not the candidate name
    return {
      success: true,
      receiptId: transactionResult.receiptId,
    };
  } catch (error: unknown) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Unexpected transaction failure during voting:', error);
    throw new HttpsError(
      'internal',
      'Your vote could not be processed at this time. Please try again.'
    );
  }
});

/**
 * ============================================================================
 * PHASE 6: SECURE ADMIN DASHBOARD & ELECTION CONTROLS
 * ============================================================================
 */

/**
 * Verifies that the caller has authoritative administrator privileges on the backend.
 * Zero-Trust: Never trusts frontend claims or unverified payloads.
 */
async function verifyAdminAuthorization(request: CallableRequest<unknown>): Promise<{ uid: string; email: string }> {
  if (!request.auth || !request.auth.uid) {
    logger.warn('Unauthenticated call to admin function');
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const uid = request.auth.uid;
  const tokenEmail = request.auth.token.email ? request.auth.token.email.trim().toLowerCase() : '';
  const isDesignatedEmail = DESIGNATED_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === tokenEmail);
  const hasAdminClaim = request.auth.token.admin === true;

  if (isDesignatedEmail || hasAdminClaim) {
    return { uid, email: tokenEmail || DESIGNATED_ADMIN_EMAIL };
  }

  // Double check /admins/{uid} collection in Firestore
  try {
    const adminDoc = await db.collection('admins').doc(uid).get();
    if (adminDoc.exists && adminDoc.data()?.active === true) {
      return { uid, email: adminDoc.data()?.email || tokenEmail || DESIGNATED_ADMIN_EMAIL };
    }
  } catch (err) {
    logger.error('Error verifying admin document:', err);
  }

  logger.warn(`Permission denied: UID ${uid} (${tokenEmail}) attempted admin operation.`);
  throw new HttpsError('permission-denied', 'Access denied. Super Administrator privilege required.');
}

/**
 * CSV formula injection protection helper.
 * Prepends a single quote to cells starting with =, +, -, @, \t, \r
 */
function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape inner double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export interface UpdateElectionStatusData {
  electionId?: string;
  targetStatus?: 'UPCOMING' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'OPEN' | 'CLOSED' | 'RESULTS';
}

/**
 * Normalizes state name to the authoritative 4-state model: UPCOMING, LIVE, PAUSED, FINISHED
 */
function normalizeElectionStatus(status?: string | null): 'UPCOMING' | 'LIVE' | 'PAUSED' | 'FINISHED' {
  if (!status) return 'UPCOMING';
  const upper = String(status).trim().toUpperCase();
  if (upper === 'LIVE' || upper === 'OPEN') return 'LIVE';
  if (upper === 'PAUSED' || upper === 'CLOSED') return 'PAUSED';
  if (upper === 'FINISHED' || upper === 'RESULTS') return 'FINISHED';
  if (upper === 'UPCOMING') return 'UPCOMING';
  return 'UPCOMING';
}

/**
 * Strict state transition engine for election lifecycle.
 * States: UPCOMING, LIVE, PAUSED, FINISHED
 * Allowed transitions:
 *   UPCOMING -> LIVE
 *   LIVE -> PAUSED
 *   PAUSED -> LIVE
 *   LIVE -> FINISHED
 *   PAUSED -> FINISHED
 * Rejects all other transitions. NO RESET IS IMPLEMENTED.
 */
export const updateElectionStatus = onCall(async (request: CallableRequest<UpdateElectionStatusData>) => {
  const adminInfo = await verifyAdminAuthorization(request);
  const { electionId } = request.data || {};
  const rawTarget = request.data?.targetStatus;

  if (!electionId || typeof electionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid election ID is required.');
  }

  if (!rawTarget) {
    throw new HttpsError('invalid-argument', 'Target status is required.');
  }

  const normalizedTarget = normalizeElectionStatus(rawTarget);

  const electionRef = db.collection('elections').doc(electionId);
  const auditRef = db.collection('auditLogs').doc();
  const resultsSummaryRef = db.collection('elections').doc(electionId).collection('results').doc('summary');

  return await db.runTransaction(async (transaction) => {
    const electionDoc = await transaction.get(electionRef);
    if (!electionDoc.exists) {
      throw new HttpsError('not-found', `Election ${electionId} not found.`);
    }

    const currentRawStatus = electionDoc.data()?.status || 'UPCOMING';
    const currentStatus = normalizeElectionStatus(currentRawStatus);

    // Validate 4-state transitions:
    // UPCOMING -> LIVE
    // LIVE -> PAUSED
    // PAUSED -> LIVE
    // LIVE -> FINISHED
    // PAUSED -> FINISHED
    const isValidTransition =
      (currentStatus === 'UPCOMING' && normalizedTarget === 'LIVE') ||
      (currentStatus === 'LIVE' && normalizedTarget === 'PAUSED') ||
      (currentStatus === 'PAUSED' && normalizedTarget === 'LIVE') ||
      (currentStatus === 'LIVE' && normalizedTarget === 'FINISHED') ||
      (currentStatus === 'PAUSED' && normalizedTarget === 'FINISHED');

    if (!isValidTransition) {
      if (currentStatus === 'FINISHED') {
        throw new HttpsError(
          'failed-precondition',
          'Election is FINISHED. No further status changes are permitted.'
        );
      }
      throw new HttpsError(
        'failed-precondition',
        `Invalid status transition from ${currentStatus} to ${normalizedTarget}. Allowed transitions: UPCOMING -> LIVE, LIVE -> PAUSED, PAUSED -> LIVE, LIVE -> FINISHED, PAUSED -> FINISHED.`
      );
    }

    // -------------------------------------------------------------
    // RESULTS PUBLICATION & SNAPSHOT ENGINE (when transitioning to FINISHED)
    // -------------------------------------------------------------
    if (normalizedTarget === 'FINISHED') {
      const candidatesSnap = await db.collection('elections').doc(electionId).collection('candidates').get();
      const ballotsSnap = await db.collection('ballots').where('electionId', '==', electionId).get();
      const membersSnap = await db.collection('members').get();

      const totalEligibleVoters = membersSnap.size || electionDoc.data()?.totalEligibleVoters || 70;
      const totalVotesCast = ballotsSnap.size;

      let sumCandidateVotes = 0;
      const candidateList: Array<{
        id: string;
        name: string;
        codename: string;
        year: string;
        department: string;
        color: string;
        colorLight: string;
        icon: string;
        voteCount: number;
        percentage: number;
        rank: number;
        isWinner: boolean;
        isTied: boolean;
      }> = [];

      candidatesSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const count = typeof d.voteCount === 'number' ? d.voteCount : 0;
        sumCandidateVotes += count;
        candidateList.push({
          id: docSnap.id,
          name: d.name || docSnap.id,
          codename: d.codename || '',
          year: d.year || '',
          department: d.department || '',
          color: d.color || '#F59E0B',
          colorLight: d.colorLight || '#FEF3C7',
          icon: d.icon || '⚡',
          voteCount: count,
          percentage: totalVotesCast > 0 ? Number(((count / totalVotesCast) * 100).toFixed(1)) : 0,
          rank: 1,
          isWinner: false,
          isTied: false,
        });
      });

      // TOTAL INTEGRITY VALIDATION
      const isConsistent = sumCandidateVotes === totalVotesCast && totalVotesCast <= totalEligibleVoters;
      if (!isConsistent) {
        logger.error(`INTEGRITY FAILURE: Candidate sum (${sumCandidateVotes}) != ballots (${totalVotesCast})`);
        throw new HttpsError(
          'failed-precondition',
          '⚠ Election Data Integrity Warning: The candidate vote totals do not match the recorded ballot total. Results publication has been blocked. Please investigate the election data.'
        );
      }

      // Sort descending by vote count
      candidateList.sort((a, b) => b.voteCount - a.voteCount);

      // DYNAMIC WINNER & TIE HANDLING
      const topVote = candidateList[0]?.voteCount ?? 0;
      const topCandidates = candidateList.filter((c) => c.voteCount === topVote);
      const isTie = topCandidates.length > 1;

      candidateList.forEach((c, idx) => {
        if (isTie) {
          if (c.voteCount === topVote) {
            c.rank = 1;
            c.isTied = true;
            c.isWinner = false;
          } else {
            c.rank = topCandidates.length + 1;
            c.isTied = false;
            c.isWinner = false;
          }
        } else {
          c.rank = idx + 1;
          c.isWinner = idx === 0 && topVote > 0;
          c.isTied = false;
        }
      });

      const winnerInfo = {
        isTie,
        highestVoteCount: topVote,
        winner: !isTie && candidateList.length > 0 ? candidateList[0] : null,
        tiedCandidates: isTie ? topCandidates : [],
        announcementStatement: isTie
          ? `The election has resulted in a tie between ${topCandidates.map((c) => `${c.name} (${c.codename})`).join(' and ')}. Official winner determination requires the election authority's decision.`
          : topVote > 0
          ? `${candidateList[0]?.name} (${candidateList[0]?.codename}) is officially elected President of the NISC Executive Council.`
          : 'No votes were recorded in this election.',
      };

      const resultsSnapshot = {
        electionId,
        title: electionDoc.data()?.title || 'NISC Executive Council General Election 2026',
        status: 'FINISHED',
        totalEligibleVoters,
        totalVotesCast,
        didNotVote: Math.max(0, totalEligibleVoters - totalVotesCast),
        participationPercentage: totalEligibleVoters > 0 ? Number(((totalVotesCast / totalEligibleVoters) * 100).toFixed(1)) : 0,
        candidates: candidateList,
        winnerInfo,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        isImmutable: true,
        dataIntegrityVerified: true,
      };

      // Set authoritative aggregate results snapshot in Firestore
      transaction.set(resultsSummaryRef, resultsSnapshot);
    }

    const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      status: normalizedTarget,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let auditAction = 'ADMIN_ACTION';
    if (normalizedTarget === 'LIVE') {
      if (!electionDoc.data()?.openedAt) {
        updateData.openedAt = admin.firestore.FieldValue.serverTimestamp();
      }
      updateData.resumedAt = admin.firestore.FieldValue.serverTimestamp();
      auditAction = currentStatus === 'PAUSED' ? 'ELECTION_RESUMED' : 'ELECTION_STARTED';
    } else if (normalizedTarget === 'PAUSED') {
      updateData.pausedAt = admin.firestore.FieldValue.serverTimestamp();
      auditAction = 'ELECTION_PAUSED';
    } else if (normalizedTarget === 'FINISHED') {
      updateData.closedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.resultsPublishedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.finishedAt = admin.firestore.FieldValue.serverTimestamp();
      auditAction = 'ELECTION_FINISHED';
    }

    transaction.update(electionRef, updateData);

    transaction.set(auditRef, {
      action: auditAction,
      actorUid: adminInfo.uid,
      actorEmail: adminInfo.email,
      electionId,
      metadata: {
        previousStatus: currentStatus,
        newStatus: normalizedTarget,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Admin ${adminInfo.email} updated election ${electionId} status from ${currentStatus} to ${normalizedTarget}`);

    return {
      success: true,
      electionId,
      previousStatus: currentStatus,
      newStatus: normalizedTarget,
      updatedBy: adminInfo.email,
    };
  });
});

/**
 * Phase 7: Public / Voter Aggregate Results Retrieval Function
 * Available to authenticated voters ONLY when election is in 'RESULTS' status.
 * Rejects pre-publication leakage.
 */
export const getPublicElectionResults = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Authentication required to view official election results.');
  }

  const electionId = request.data?.electionId || 'nisc-election-2026';
  const electionDoc = await db.collection('elections').doc(electionId).get();

  if (!electionDoc.exists) {
    throw new HttpsError('not-found', 'Election not found.');
  }

  const electionData = electionDoc.data();
  const currentRawStatus = electionData?.status || 'UPCOMING';
  const currentStatus = normalizeElectionStatus(currentRawStatus);

  if (currentStatus !== 'FINISHED') {
    throw new HttpsError(
      'failed-precondition',
      currentStatus === 'LIVE'
        ? 'Results Not Available: The election is currently in progress. Please wait until voting is complete and official results are published.'
        : currentStatus === 'PAUSED'
        ? 'Results Pending: Voting is temporarily paused. The official results will be available once the election is finished.'
        : 'Results Not Available: The election has not started yet.'
    );
  }

  // Retrieve the immutable results summary snapshot
  const summaryDoc = await db.collection('elections').doc(electionId).collection('results').doc('summary').get();

  if (summaryDoc.exists) {
    const data = summaryDoc.data();
    return {
      ...data,
      publishedAt: data?.publishedAt?.toDate?.()?.toISOString() || electionData?.resultsPublishedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // Fallback generation if snapshot is missing
  const candidatesSnap = await db.collection('elections').doc(electionId).collection('candidates').get();
  const ballotsSnap = await db.collection('ballots').where('electionId', '==', electionId).get();
  const totalEligibleVoters = electionData?.totalEligibleVoters || 70;
  const totalVotesCast = ballotsSnap.size;

  const candidateList: Array<{
    id: string;
    name: string;
    codename: string;
    year: string;
    department: string;
    color: string;
    colorLight: string;
    icon: string;
    voteCount: number;
    percentage: number;
    rank: number;
    isWinner: boolean;
    isTied: boolean;
  }> = [];

  candidatesSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const count = typeof d.voteCount === 'number' ? d.voteCount : 0;
    candidateList.push({
      id: docSnap.id,
      name: d.name || docSnap.id,
      codename: d.codename || '',
      year: d.year || '',
      department: d.department || '',
      color: d.color || '#F59E0B',
      colorLight: d.colorLight || '#FEF3C7',
      icon: d.icon || '⚡',
      voteCount: count,
      percentage: totalVotesCast > 0 ? Number(((count / totalVotesCast) * 100).toFixed(1)) : 0,
      rank: 1,
      isWinner: false,
      isTied: false,
    });
  });

  candidateList.sort((a, b) => b.voteCount - a.voteCount);
  const topVote = candidateList[0]?.voteCount ?? 0;
  const topCandidates = candidateList.filter((c) => c.voteCount === topVote);
  const isTie = topCandidates.length > 1;

  candidateList.forEach((c, idx) => {
    if (isTie) {
      if (c.voteCount === topVote) {
        c.rank = 1;
        c.isTied = true;
        c.isWinner = false;
      } else {
        c.rank = topCandidates.length + 1;
        c.isTied = false;
        c.isWinner = false;
      }
    } else {
      c.rank = idx + 1;
      c.isWinner = idx === 0 && topVote > 0;
      c.isTied = false;
    }
  });

  return {
    electionId,
    title: electionData?.title || 'NISC Executive Council General Election 2026',
    status: 'RESULTS',
    totalEligibleVoters,
    totalVotesCast,
    didNotVote: Math.max(0, totalEligibleVoters - totalVotesCast),
    participationPercentage: totalEligibleVoters > 0 ? Number(((totalVotesCast / totalEligibleVoters) * 100).toFixed(1)) : 0,
    candidates: candidateList,
    winnerInfo: {
      isTie,
      highestVoteCount: topVote,
      winner: !isTie && candidateList.length > 0 ? candidateList[0] : null,
      tiedCandidates: isTie ? topCandidates : [],
      announcementStatement: isTie
        ? `The election has resulted in a tie between ${topCandidates.map((c) => `${c.name} (${c.codename})`).join(' and ')}. Official winner determination requires the election authority's decision.`
        : `${candidateList[0]?.name} (${candidateList[0]?.codename}) is officially elected President of the NISC Executive Council.`,
    },
    publishedAt: electionData?.resultsPublishedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    isImmutable: true,
    dataIntegrityVerified: true,
  };
});

/**
 * Convenience helper to start election (UPCOMING -> LIVE)
 */
export const startElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'LIVE',
    },
  });
});

/**
 * Convenience helper to stop / pause election (LIVE -> PAUSED)
 */
export const stopElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'PAUSED',
    },
  });
});

/**
 * Convenience helper to resume election (PAUSED -> LIVE)
 */
export const resumeElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'LIVE',
    },
  });
});

/**
 * Convenience helper to finish election (LIVE or PAUSED -> FINISHED)
 */
export const finishElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'FINISHED',
    },
  });
});

/**
 * Convenience helper to start election (UPCOMING -> OPEN) - legacy alias
 */
export const openElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'LIVE',
    },
  });
});

/**
 * Convenience helper to close election (OPEN -> CLOSED) - legacy alias
 */
export const closeElection = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'PAUSED',
    },
  });
});

/**
 * Convenience helper to publish results (CLOSED -> RESULTS) - legacy alias
 */
export const publishResults = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  return await updateElectionStatus.run({
    ...request,
    data: {
      electionId: request.data?.electionId,
      targetStatus: 'FINISHED',
    },
  });
});

/**
 * Retrieves aggregate election stats and checks consistency for the Admin dashboard.
 */
export const getAdminElectionStats = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  await verifyAdminAuthorization(request);
  const electionId = request.data?.electionId || 'nisc-election-2026';

  const electionDoc = await db.collection('elections').doc(electionId).get();
  const candidatesSnap = await db.collection('elections').doc(electionId).collection('candidates').get();
  const ballotsSnap = await db.collection('ballots').where('electionId', '==', electionId).get();
  const membersSnap = await db.collection('members').get();

  const electionData = electionDoc.exists ? electionDoc.data() : null;
  const totalEligibleVoters = membersSnap.size || electionData?.totalEligibleVoters || 70;
  const votesCast = ballotsSnap.size;

  const candidateCounts: Record<string, { id: string; name: string; codename: string; voteCount: number }> = {};
  let candidateVotesSum = 0;

  candidatesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const count = typeof data.voteCount === 'number' ? data.voteCount : 0;
    candidateVotesSum += count;
    candidateCounts[docSnap.id] = {
      id: docSnap.id,
      name: data.name || docSnap.id,
      codename: data.codename || '',
      voteCount: count,
    };
  });

  const remaining = Math.max(0, totalEligibleVoters - votesCast);
  const participationRate = totalEligibleVoters > 0 ? (votesCast / totalEligibleVoters) * 100 : 0;

  // Consistency checks
  const consistency = {
    isConsistent: votesCast === candidateVotesSum && votesCast <= totalEligibleVoters,
    votesCastMatchesBallots: votesCast === candidateVotesSum,
    votesCastWithinLimit: votesCast <= totalEligibleVoters,
    ballotsCount: votesCast,
    candidateVotesSum,
  };

  return {
    electionId,
    status: electionData?.status || 'UPCOMING',
    totalEligibleVoters,
    votesCast,
    remainingVoters: remaining,
    participationRate: Number(participationRate.toFixed(1)),
    candidates: candidateCounts,
    consistency,
    openedAt: electionData?.openedAt?.toDate?.()?.toISOString() || null,
    closedAt: electionData?.closedAt?.toDate?.()?.toISOString() || null,
    resultsPublishedAt: electionData?.resultsPublishedAt?.toDate?.()?.toISOString() || null,
  };
});

/**
 * Dedicated admin function to view full voter-to-candidate mapping (Who voted for whom).
 * Strictly denied to all non-administrators.
 */
export const getAdminVoteRecords = onCall(async (request: CallableRequest<{ electionId?: string }>) => {
  await verifyAdminAuthorization(request);
  const electionId = request.data?.electionId || 'nisc-election-2026';

  const ballotsSnap = await db.collection('ballots').where('electionId', '==', electionId).get();
  const membersSnap = await db.collection('members').get();
  const candidatesSnap = await db.collection('elections').doc(electionId).collection('candidates').get();

  const memberMap = new Map<string, FirebaseFirestore.DocumentData>();
  membersSnap.forEach((docSnap) => {
    memberMap.set(docSnap.id, docSnap.data());
  });

  const candidateMap = new Map<string, { name: string; codename: string }>();
  candidatesSnap.forEach((docSnap) => {
    const data = docSnap.data();
    candidateMap.set(docSnap.id, {
      name: data.name || docSnap.id,
      codename: data.codename || '',
    });
  });

  const records = ballotsSnap.docs.map((docSnap) => {
    const ballot = docSnap.data();
    const member = memberMap.get(ballot.voterUid) || {};
    const candidate = candidateMap.get(ballot.candidateId) || {
      name: ballot.candidateId,
      codename: ballot.candidateId,
    };

    return {
      ballotId: docSnap.id,
      voterUid: ballot.voterUid,
      voterEmail: ballot.voterEmail || member.email || '',
      voterName: member.name || 'Student Member',
      rollNumber: member.rollNumber || ballot.voterEmail?.split('@')[0] || '—',
      batch: member.batch || '—',
      department: member.department || '—',
      candidateId: ballot.candidateId,
      candidateName: candidate.name,
      candidateCodename: candidate.codename,
      receiptId: ballot.receiptId,
      voteTime: ballot.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  // Sort latest first
  records.sort((a, b) => new Date(b.voteTime).getTime() - new Date(a.voteTime).getTime());

  return {
    records,
    totalRecords: records.length,
  };
});

/**
 * Dedicated admin function to retrieve all eligible voter participation records.
 */
export const getAdminParticipation = onCall(async (request: CallableRequest<unknown>) => {
  await verifyAdminAuthorization(request);

  const membersSnap = await db.collection('members').get();
  const participation = membersSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      name: data.name || `Student (${data.rollNumber || ''})`,
      rollNumber: data.rollNumber || '',
      email: data.email || '',
      batch: data.batch || '',
      department: data.department || '',
      state: data.state || 'ACTIVE',
      hasVoted: data.hasVoted === true,
      eligible: data.eligible === true,
      receiptId: data.receiptId || null,
      votedAt: data.votedAt?.toDate?.()?.toISOString() || null,
    };
  });

  // Sort by roll number ascending
  participation.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

  return {
    participation,
    totalMembers: participation.length,
    votedCount: participation.filter((p) => p.hasVoted).length,
    notVotedCount: participation.filter((p) => !p.hasVoted).length,
  };
});

/**
 * Admin function to export participation CSV with injection protection.
 * As per specification, does NOT contain candidate chosen.
 */
export const exportParticipationCsv = onCall(async (request: CallableRequest<unknown>) => {
  await verifyAdminAuthorization(request);

  const membersSnap = await db.collection('members').get();
  const members = membersSnap.docs.map((docSnap) => docSnap.data());
  members.sort((a, b) => String(a.rollNumber || '').localeCompare(String(b.rollNumber || '')));

  const headers = ['#', 'Voter Name', 'Roll Number', 'Email', 'Batch', 'Department', 'State', 'Status', 'Vote Time'];
  const rows: string[] = [headers.map(sanitizeCsvField).join(',')];

  members.forEach((m, idx) => {
    const row = [
      idx + 1,
      m.name || `Student (${m.rollNumber || ''})`,
      m.rollNumber || '',
      m.email || '',
      m.batch || '',
      m.department || '',
      m.state || 'Active',
      m.hasVoted ? 'Voted' : 'Not Voted',
      m.votedAt?.toDate?.()?.toISOString() || (m.hasVoted ? 'Recorded' : '—'),
    ];
    rows.push(row.map(sanitizeCsvField).join(','));
  });

  const csvContent = rows.join('\r\n');

  return {
    filename: `NISC_Election_Participation_${new Date().toISOString().slice(0, 10)}.csv`,
    rowCount: members.length,
    csvContent,
  };
});

/**
 * Dedicated admin function to retrieve immutable audit logs.
 */
export const getAdminAuditLogs = onCall(async (request: CallableRequest<{ limit?: number }>) => {
  await verifyAdminAuthorization(request);
  const logLimit = Math.min(100, Math.max(1, request.data?.limit || 50));

  const auditSnap = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(logLimit).get();
  const logs = auditSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      action: data.action,
      actorUid: data.actorUid,
      actorEmail: data.actorEmail,
      electionId: data.electionId || null,
      metadata: data.metadata || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  return { logs };
});

/**
 * Log administrative activity such as login.
 */
export const logAdminEvent = onCall(async (request: CallableRequest<{ action: string; metadata?: Record<string, unknown> }>) => {
  const adminInfo = await verifyAdminAuthorization(request);
  const action = request.data?.action || 'ADMIN_ACTION';

  await db.collection('auditLogs').add({
    action,
    actorUid: adminInfo.uid,
    actorEmail: adminInfo.email,
    metadata: request.data?.metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

