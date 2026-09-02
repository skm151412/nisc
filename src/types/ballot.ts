/**
 * Sealed Ballot Record Interface
 * Immutable voter-to-candidate mapping for designated administrator audit.
 * Direct client writes/reads are strictly denied.
 */
export interface Ballot {
  id?: string;
  electionId: string;
  voterUid: string;
  voterEmail: string;
  candidateId: string;
  receiptId: string;
  createdAt: string;
}

/**
 * Deterministic Vote Lock Interface
 * UNIQUE(electionId, voterUid) concurrency & replay barrier
 */
export interface VoteLock {
  electionId: string;
  voterUid: string;
  receiptId: string;
  ballotId: string;
  createdAt: string;
}

/**
 * Minimal Client Input Payload
 * Strict ceiling: Client sends only electionId and candidateId
 */
export interface VoteRequest {
  electionId: string;
  candidateId: string;
}

/**
 * Minimal Sanitized Server Response
 * Never reveals chosen candidate in receipt
 */
export interface VoteResponse {
  success: boolean;
  receiptId: string;
  message?: string;
  alreadyProcessed?: boolean;
}

export interface VoteReceiptInfo {
  receiptId: string;
  electionId: string;
  electionTitle: string;
  voterUid: string;
  voterEmail: string;
  timestamp: string;
  verificationHash?: string;
}

