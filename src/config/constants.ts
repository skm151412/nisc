/**
 * NISC Election System Core Constants
 */
export const SYSTEM_CONSTANTS = {
  ORGANIZATION_NAME: 'NISC',
  ORGANIZATION_FULL_NAME: 'National Institute Student Council',
  SYSTEM_NAME: 'NISC Secure Election System',
  DESIGNATED_ADMIN_EMAIL: 'skm151412@gmail.com',
  TOTAL_APPROVED_VOTERS: 70,
  TOTAL_CANDIDATES: 3,
  COLLECTIONS: {
    MEMBERS: 'members',
    ADMINS: 'admins',
    ELECTIONS: 'elections',
    CANDIDATES: 'candidates',
    BALLOTS: 'ballots',
    AUDIT_LOGS: 'auditLogs',
  },
} as const;
