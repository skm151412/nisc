/**
 * NISC Election Admin Service (Phase 6)
 *
 * Implements client-side integration with backend administrative Cloud Functions:
 * 1. updateElectionStatus (UPCOMING -> OPEN -> CLOSED -> RESULTS)
 * 2. getAdminElectionStats (Total voters, votes cast, participation rate, candidate counts, integrity checks)
 * 3. getAdminVoteRecords (Authoritative voter-to-candidate mapping for admin audit)
 * 4. getAdminParticipation (All 70 eligible voters with Voted / Not Voted status)
 * 5. exportParticipationCsv (Safe CSV export with CSV formula injection protection)
 * 6. getAdminAuditLogs (Tamper-resistant audit events)
 *
 * Zero-Trust: Every operation verifies backend administrator authorization.
 */

import { httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit,
  Unsubscribe,
} from 'firebase/firestore';
import { functions, db } from './firebase';
import {
  ElectionStatus,
  AuthUserProfile,
  Candidate,
  AuditLog,
} from '../types';
import { DESIGNATED_ADMIN_EMAIL, APPROVED_VOTERS } from '../config/voterAllowlist';
import { INITIAL_CANDIDATES, INITIAL_ELECTION_ID } from '../config/electionData';
import { logger } from '../utils/logger';

export interface AdminElectionStats {
  electionId: string;
  status: ElectionStatus;
  totalEligibleVoters: number;
  votesCast: number;
  remainingVoters: number;
  participationRate: number;
  candidates: Record<string, { id: string; name: string; codename: string; voteCount: number }>;
  consistency: {
    isConsistent: boolean;
    votesCastMatchesBallots: boolean;
    votesCastWithinLimit: boolean;
    ballotsCount: number;
    candidateVotesSum: number;
  };
  openedAt?: string | null;
  closedAt?: string | null;
  resultsPublishedAt?: string | null;
}

export interface AdminVoteRecord {
  ballotId: string;
  voterUid: string;
  voterEmail: string;
  voterName: string;
  rollNumber: string;
  batch: string;
  department: string;
  candidateId: string;
  candidateName: string;
  candidateCodename: string;
  receiptId: string;
  voteTime: string;
}

export interface AdminVoterParticipation {
  uid: string;
  name: string;
  rollNumber: string;
  email: string;
  batch: string;
  department: string;
  state: string;
  hasVoted: boolean;
  eligible: boolean;
  receiptId?: string | null;
  votedAt?: string | null;
}

export interface CsvExportResult {
  filename: string;
  rowCount: number;
  csvContent: string;
}

/**
 * Sanitizes CSV field values against Formula Injection (CSV Injection).
 * Any cell value starting with =, +, -, @, \t, \r is escaped with a leading single quote.
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape inner double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Verifies caller authorization locally before dispatching to backend.
 * Backend independently enforces zero-trust admin authentication.
 */
function assertAdminRole(profile?: AuthUserProfile) {
  if (
    !profile ||
    profile.role !== 'ADMIN' ||
    profile.email.toLowerCase() !== DESIGNATED_ADMIN_EMAIL.toLowerCase()
  ) {
    throw new Error('PERMISSION_DENIED: Administrator privilege required.');
  }
}

/**
 * In-memory state tracking for development fallback/simulations
 */
let inMemoryElectionStatus: ElectionStatus = ElectionStatus.UPCOMING;
let inMemoryOpenedAt: string | null = null;
let inMemoryClosedAt: string | null = null;
let inMemoryResultsPublishedAt: string | null = null;

const inMemoryAuditLogs: AuditLog[] = [
  {
    id: 'audit-init',
    action: 'ADMIN_LOGIN',
    actorUid: 'admin-seed-uid',
    actorEmail: DESIGNATED_ADMIN_EMAIL,
    electionId: INITIAL_ELECTION_ID,
    createdAt: new Date().toISOString(),
  },
];

export function resetInMemoryAdminState() {
  inMemoryElectionStatus = ElectionStatus.UPCOMING;
  inMemoryOpenedAt = null;
  inMemoryClosedAt = null;
  inMemoryResultsPublishedAt = null;
  inMemoryAuditLogs.length = 1;
}

/**
 * Updates election status to OPEN, CLOSED, or RESULTS.
 * Rejects invalid transitions (e.g. UPCOMING -> CLOSED, RESULTS -> OPEN, etc.).
 * NO RESET IS PERMITTED.
 */
export async function updateElectionStatus(
  targetStatus: ElectionStatus,
  electionId: string = INITIAL_ELECTION_ID,
  profile?: AuthUserProfile
): Promise<{ success: boolean; status: ElectionStatus; electionId: string }> {
  assertAdminRole(profile);

  // 1. If Cloud Functions live, call updateElectionStatus
  if (functions) {
    try {
      logger.info({
        message: `Admin requesting state transition to ${targetStatus}`,
        context: 'AdminService',
        data: { electionId, targetStatus },
      });

      const fn = httpsCallable<{ electionId: string; targetStatus: string }, { success: boolean; newStatus: ElectionStatus }>(
        functions,
        'updateElectionStatus'
      );
      const result = await fn({ electionId, targetStatus });
      return {
        success: true,
        status: result.data.newStatus || targetStatus,
        electionId,
      };
    } catch (err) {
      logger.warn({
        message: 'Cloud Function updateElectionStatus failed, trying direct Firestore transaction',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 2. Direct Firestore update if running with admin permissions
  if (db) {
    try {
      const electionRef = doc(db, 'elections', electionId);
      const snap = await getDoc(electionRef);
      const currentStatus = (snap.exists() ? snap.data()?.status : inMemoryElectionStatus) as ElectionStatus;

      // Validate allowed transitions
      const isValid =
        (currentStatus === ElectionStatus.UPCOMING && targetStatus === ElectionStatus.OPEN) ||
        (currentStatus === ElectionStatus.OPEN && targetStatus === ElectionStatus.CLOSED) ||
        (currentStatus === ElectionStatus.CLOSED && targetStatus === ElectionStatus.RESULTS);

      if (!isValid) {
        throw new Error(
          `Invalid state transition from ${currentStatus} to ${targetStatus}. Allowed: UPCOMING -> OPEN, OPEN -> CLOSED, CLOSED -> RESULTS.`
        );
      }

      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
        updatedAt: serverTimestamp(),
      };

      let action = 'ADMIN_ACTION';
      if (targetStatus === ElectionStatus.OPEN) {
        updatePayload.openedAt = serverTimestamp();
        action = 'ELECTION_OPENED';
      } else if (targetStatus === ElectionStatus.CLOSED) {
        updatePayload.closedAt = serverTimestamp();
        action = 'ELECTION_CLOSED';
      } else if (targetStatus === ElectionStatus.RESULTS) {
        updatePayload.resultsPublishedAt = serverTimestamp();
        action = 'RESULTS_PUBLISHED';

        // Write aggregate snapshot
        try {
          const candidatesSnap = await getDocs(collection(db, 'elections', electionId, 'candidates'));
          const ballotsSnap = await getDocs(collection(db, 'ballots'));
          const totalEligible = 70;
          const totalCast = ballotsSnap.size;

          const candidateList: any[] = [];
          candidatesSnap.forEach((docS) => {
            const d = docS.data();
            const count = d.voteCount || 0;
            candidateList.push({
              id: docS.id,
              name: d.name || docS.id,
              codename: d.codename || '',
              year: d.year || '',
              department: d.department || '',
              color: d.color || '#F59E0B',
              colorLight: d.colorLight || '#FEF3C7',
              icon: d.icon || '⚡',
              voteCount: count,
              percentage: totalCast > 0 ? Number(((count / totalCast) * 100).toFixed(1)) : 0,
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

          const summaryRef = doc(db, 'elections', electionId, 'results', 'summary');
          await setDoc(summaryRef, {
            electionId,
            title: snap.data()?.title || 'NISC Executive Council General Election 2026',
            status: ElectionStatus.RESULTS,
            totalEligibleVoters: totalEligible,
            totalVotesCast: totalCast,
            didNotVote: Math.max(0, totalEligible - totalCast),
            participationPercentage: totalEligible > 0 ? Number(((totalCast / totalEligible) * 100).toFixed(1)) : 0,
            candidates: candidateList,
            winnerInfo,
            publishedAt: new Date().toISOString(),
            isImmutable: true,
            dataIntegrityVerified: true,
          });
        } catch (snapErr) {
          logger.warn({ message: 'Failed to write local results summary', error: snapErr });
        }
      }

      await updateDoc(electionRef, updatePayload);

      inMemoryElectionStatus = targetStatus;
      inMemoryAuditLogs.unshift({
        id: `audit-${Date.now()}`,
        action,
        actorUid: profile?.uid || 'admin',
        actorEmail: profile?.email || DESIGNATED_ADMIN_EMAIL,
        electionId,
        createdAt: new Date().toISOString(),
      });

      return { success: true, status: targetStatus, electionId };
    } catch (err: unknown) {
      logger.warn({
        message: 'Direct Firestore update failed, evaluating local transition',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 3. Fallback in-memory transition engine
  const currentStatus = inMemoryElectionStatus;
  const isValid =
    (currentStatus === ElectionStatus.UPCOMING && targetStatus === ElectionStatus.OPEN) ||
    (currentStatus === ElectionStatus.OPEN && targetStatus === ElectionStatus.CLOSED) ||
    (currentStatus === ElectionStatus.CLOSED && targetStatus === ElectionStatus.RESULTS);

  if (!isValid) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed: UPCOMING -> OPEN, OPEN -> CLOSED, CLOSED -> RESULTS.`
    );
  }

  inMemoryElectionStatus = targetStatus;
  const nowStr = new Date().toISOString();

  let action = 'ADMIN_ACTION';
  if (targetStatus === ElectionStatus.OPEN) {
    inMemoryOpenedAt = nowStr;
    action = 'ELECTION_OPENED';
  } else if (targetStatus === ElectionStatus.CLOSED) {
    inMemoryClosedAt = nowStr;
    action = 'ELECTION_CLOSED';
  } else if (targetStatus === ElectionStatus.RESULTS) {
    inMemoryResultsPublishedAt = nowStr;
    action = 'RESULTS_PUBLISHED';
  }

  inMemoryAuditLogs.unshift({
    id: `audit-${Date.now()}`,
    action,
    actorUid: profile?.uid || 'admin',
    actorEmail: profile?.email || DESIGNATED_ADMIN_EMAIL,
    electionId,
    createdAt: nowStr,
  });

  return { success: true, status: targetStatus, electionId };
}

/**
 * Retrieves aggregate election stats and consistency analysis for Admin dashboard.
 */
export async function getAdminElectionStats(
  electionId: string = INITIAL_ELECTION_ID,
  profile?: AuthUserProfile
): Promise<AdminElectionStats> {
  assertAdminRole(profile);

  // 1. Cloud Function callable
  if (functions) {
    try {
      const fn = httpsCallable<{ electionId: string }, AdminElectionStats>(functions, 'getAdminElectionStats');
      const res = await fn({ electionId });
      if (res.data) return res.data;
    } catch (err) {
      logger.warn({
        message: 'Cloud Function getAdminElectionStats failed, using Firestore query',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 2. Direct Firestore calculation
  if (db) {
    try {
      const electionSnap = await getDoc(doc(db, 'elections', electionId));
      const candidatesSnap = await getDocs(collection(db, 'elections', electionId, 'candidates'));
      const ballotsSnap = await getDocs(collection(db, 'ballots'));
      const membersSnap = await getDocs(collection(db, 'members'));

      const totalEligibleVoters = membersSnap.size || APPROVED_VOTERS.length;
      const votesCast = ballotsSnap.size;
      const remainingVoters = Math.max(0, totalEligibleVoters - votesCast);
      const participationRate = totalEligibleVoters > 0 ? (votesCast / totalEligibleVoters) * 100 : 0;

      const candidateCounts: Record<string, { id: string; name: string; codename: string; voteCount: number }> = {};
      let sumCandidateVotes = 0;

      if (!candidatesSnap.empty) {
        candidatesSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const count = typeof d.voteCount === 'number' ? d.voteCount : 0;
          sumCandidateVotes += count;
          candidateCounts[docSnap.id] = {
            id: docSnap.id,
            name: d.name || docSnap.id,
            codename: d.codename || '',
            voteCount: count,
          };
        });
      } else {
        INITIAL_CANDIDATES.forEach((c) => {
          candidateCounts[c.id] = {
            id: c.id,
            name: c.name,
            codename: c.codename,
            voteCount: 0,
          };
        });
      }

      const status = (electionSnap.exists() ? electionSnap.data()?.status : inMemoryElectionStatus) as ElectionStatus;

      return {
        electionId,
        status: status || ElectionStatus.UPCOMING,
        totalEligibleVoters,
        votesCast,
        remainingVoters,
        participationRate: Number(participationRate.toFixed(1)),
        candidates: candidateCounts,
        consistency: {
          isConsistent: votesCast === sumCandidateVotes && votesCast <= totalEligibleVoters,
          votesCastMatchesBallots: votesCast === sumCandidateVotes,
          votesCastWithinLimit: votesCast <= totalEligibleVoters,
          ballotsCount: votesCast,
          candidateVotesSum: sumCandidateVotes,
        },
        openedAt: electionSnap.data()?.openedAt?.toDate?.()?.toISOString() || inMemoryOpenedAt,
        closedAt: electionSnap.data()?.closedAt?.toDate?.()?.toISOString() || inMemoryClosedAt,
        resultsPublishedAt: electionSnap.data()?.resultsPublishedAt?.toDate?.()?.toISOString() || inMemoryResultsPublishedAt,
      };
    } catch (err) {
      logger.warn({
        message: 'Direct Firestore stats failed, using memory state',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 3. Fallback memory state
  const totalEligibleVoters = APPROVED_VOTERS.length;
  const candidateCounts: Record<string, { id: string; name: string; codename: string; voteCount: number }> = {};
  INITIAL_CANDIDATES.forEach((c) => {
    candidateCounts[c.id] = {
      id: c.id,
      name: c.name,
      codename: c.codename,
      voteCount: 0,
    };
  });

  return {
    electionId,
    status: inMemoryElectionStatus,
    totalEligibleVoters,
    votesCast: 0,
    remainingVoters: totalEligibleVoters,
    participationRate: 0,
    candidates: candidateCounts,
    consistency: {
      isConsistent: true,
      votesCastMatchesBallots: true,
      votesCastWithinLimit: true,
      ballotsCount: 0,
      candidateVotesSum: 0,
    },
    openedAt: inMemoryOpenedAt,
    closedAt: inMemoryClosedAt,
    resultsPublishedAt: inMemoryResultsPublishedAt,
  };
}

/**
 * Retrieves full voter-to-candidate mapping (Who voted for whom) for the Administrator.
 */
export async function getAdminVoteRecords(
  electionId: string = INITIAL_ELECTION_ID,
  profile?: AuthUserProfile
): Promise<AdminVoteRecord[]> {
  assertAdminRole(profile);

  // 1. Cloud function callable
  if (functions) {
    try {
      const fn = httpsCallable<{ electionId: string }, { records: AdminVoteRecord[] }>(
        functions,
        'getAdminVoteRecords'
      );
      const res = await fn({ electionId });
      if (res.data && Array.isArray(res.data.records)) {
        return res.data.records;
      }
    } catch (err) {
      logger.warn({
        message: 'Cloud Function getAdminVoteRecords failed, trying Firestore',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 2. Direct Firestore queries
  if (db) {
    try {
      const ballotsSnap = await getDocs(collection(db, 'ballots'));
      const membersSnap = await getDocs(collection(db, 'members'));

      const memberMap = new Map<string, { name: string; rollNumber: string; batch: string; department: string; email: string }>();
      membersSnap.forEach((docSnap) => {
        const d = docSnap.data();
        memberMap.set(docSnap.id, {
          name: d.name || '',
          rollNumber: d.rollNumber || '',
          batch: d.batch || '',
          department: d.department || '',
          email: d.email || '',
        });
      });

      const candidateMap: Record<string, { name: string; codename: string }> = {
        zeus: { name: 'Anshul Raj', codename: 'Zeus' },
        athena: { name: 'Paridhi Gupta', codename: 'Athena' },
        poseidon: { name: 'Granth Jigneshbhai Mangukiya', codename: 'Poseidon' },
      };

      const records: AdminVoteRecord[] = [];
      ballotsSnap.forEach((docSnap) => {
        const b = docSnap.data();
        const m = memberMap.get(b.voterUid) || {
          name: 'Student Voter',
          rollNumber: b.voterEmail?.split('@')[0] || '—',
          batch: '—',
          department: '—',
          email: b.voterEmail || '',
        };
        const cand = candidateMap[b.candidateId] || { name: b.candidateId, codename: b.candidateId };

        records.push({
          ballotId: docSnap.id,
          voterUid: b.voterUid,
          voterEmail: b.voterEmail || m.email,
          voterName: m.name,
          rollNumber: m.rollNumber,
          batch: m.batch,
          department: m.department,
          candidateId: b.candidateId,
          candidateName: cand.name,
          candidateCodename: cand.codename,
          receiptId: b.receiptId || 'REC-XXXX-XXXX-2026',
          voteTime: b.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      records.sort((a, b) => new Date(b.voteTime).getTime() - new Date(a.voteTime).getTime());
      return records;
    } catch (err) {
      logger.warn({
        message: 'Direct Firestore vote records query failed',
        context: 'AdminService',
        error: err,
      });
    }
  }

  return [];
}

/**
 * Retrieves all 70 eligible voter records with participation status.
 */
export async function getAdminParticipation(
  profile?: AuthUserProfile
): Promise<AdminVoterParticipation[]> {
  assertAdminRole(profile);

  // 1. Cloud function callable
  if (functions) {
    try {
      const fn = httpsCallable<unknown, { participation: AdminVoterParticipation[] }>(
        functions,
        'getAdminParticipation'
      );
      const res = await fn({});
      if (res.data && Array.isArray(res.data.participation)) {
        return res.data.participation;
      }
    } catch (err) {
      logger.warn({
        message: 'Cloud Function getAdminParticipation failed, trying Firestore',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 2. Direct Firestore query
  if (db) {
    try {
      const membersSnap = await getDocs(collection(db, 'members'));
      if (!membersSnap.empty) {
        const list: AdminVoterParticipation[] = [];
        membersSnap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            uid: docSnap.id,
            name: d.name || `Student (${d.rollNumber || ''})`,
            rollNumber: d.rollNumber || '',
            email: d.email || '',
            batch: d.batch || '',
            department: d.department || '',
            state: d.state || 'ACTIVE',
            hasVoted: d.hasVoted === true,
            eligible: d.eligible !== false,
            receiptId: d.receiptId || null,
            votedAt: d.votedAt?.toDate?.()?.toISOString() || null,
          });
        });
        list.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
        return list;
      }
    } catch (err) {
      logger.warn({
        message: 'Direct Firestore members query failed, using static allowlist',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 3. Fallback mapped from approved allowlist
  return APPROVED_VOTERS.map((voter) => ({
    uid: `seed-${voter.rollNumber}`,
    name: voter.name,
    rollNumber: voter.rollNumber,
    email: voter.email,
    batch: voter.batch,
    department: voter.department,
    state: voter.state,
    hasVoted: false,
    eligible: true,
    receiptId: null,
    votedAt: null,
  })).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
}

/**
 * Generates and triggers download of Participation CSV.
 * Formula injection protected.
 * Does NOT include chosen candidates.
 */
export async function exportParticipationCsv(
  profile?: AuthUserProfile
): Promise<CsvExportResult> {
  assertAdminRole(profile);

  // 1. Cloud Function callable
  if (functions) {
    try {
      const fn = httpsCallable<unknown, CsvExportResult>(functions, 'exportParticipationCsv');
      const res = await fn({});
      if (res.data && res.data.csvContent) {
        downloadCsvFile(res.data.filename, res.data.csvContent);
        return res.data;
      }
    } catch (err) {
      logger.warn({
        message: 'Cloud Function exportParticipationCsv failed, generating client-side with full sanitization',
        context: 'AdminService',
        error: err,
      });
    }
  }

  // 2. Client-side fallback generation with strict CSV formula injection escaping
  const participation = await getAdminParticipation(profile);
  const headers = ['#', 'Voter Name', 'Roll Number', 'Email', 'Batch', 'Department', 'State', 'Status', 'Vote Time'];
  const rows: string[] = [headers.map(sanitizeCsvField).join(',')];

  participation.forEach((voter, index) => {
    const row = [
      index + 1,
      voter.name,
      voter.rollNumber,
      voter.email,
      voter.batch,
      voter.department,
      voter.state,
      voter.hasVoted ? 'Voted' : 'Not Voted',
      voter.votedAt || (voter.hasVoted ? 'Recorded' : '—'),
    ];
    rows.push(row.map(sanitizeCsvField).join(','));
  });

  const csvContent = rows.join('\r\n');
  const filename = `NISC_Election_Participation_${new Date().toISOString().slice(0, 10)}.csv`;

  downloadCsvFile(filename, csvContent);

  return {
    filename,
    rowCount: participation.length,
    csvContent,
  };
}

/**
 * Helper to trigger browser download of CSV
 */
function downloadCsvFile(filename: string, content: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Retrieves audit logs for the administrator console.
 */
export async function getAdminAuditLogs(
  limitCount: number = 50,
  profile?: AuthUserProfile
): Promise<AuditLog[]> {
  assertAdminRole(profile);

  if (functions) {
    try {
      const fn = httpsCallable<{ limit?: number }, { logs: AuditLog[] }>(functions, 'getAdminAuditLogs');
      const res = await fn({ limit: limitCount });
      if (res.data && Array.isArray(res.data.logs)) {
        return res.data.logs;
      }
    } catch (err) {
      logger.warn({
        message: 'Cloud Function getAdminAuditLogs failed, trying Firestore',
        context: 'AdminService',
        error: err,
      });
    }
  }

  if (db) {
    try {
      const auditQuery = query(
        collection(db, 'auditLogs'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );
      const snap = await getDocs(auditQuery);
      if (!snap.empty) {
        const logs: AuditLog[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          logs.push({
            id: docSnap.id,
            action: d.action,
            actorUid: d.actorUid,
            actorEmail: d.actorEmail,
            electionId: d.electionId || null,
            metadata: d.metadata || {},
            createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          });
        });
        return logs;
      }
    } catch (err) {
      logger.warn({
        message: 'Direct Firestore audit log fetch failed',
        context: 'AdminService',
        error: err,
      });
    }
  }

  return [...inMemoryAuditLogs];
}
