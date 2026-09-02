/**
 * Audit Event Type Enum
 */
export enum AuditEventType {
  USER_LOGIN = 'USER_LOGIN',
  VOTE_CAST = 'VOTE_CAST',
  ELECTION_OPENED = 'ELECTION_OPENED',
  ELECTION_CLOSED = 'ELECTION_CLOSED',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  ADMIN_ACTION = 'ADMIN_ACTION',
  SECURITY_VIOLATION_ATTEMPT = 'SECURITY_VIOLATION_ATTEMPT',
}

/**
 * Immutable Audit Log Interface
 * Append-only ledger for security and operational events.
 */
export interface AuditLog {
  id?: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  electionId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
