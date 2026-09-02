/**
 * Strict 4-State Election Lifecycle Status Enum
 */
export enum ElectionStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  // Backward-compatible aliases
  OPEN = 'LIVE',
  CLOSED = 'PAUSED',
  RESULTS = 'FINISHED',
}

/**
 * Candidate Campaign Pillar
 */
export interface CandidatePillar {
  title: string;
  description: string;
}

/**
 * Candidate Interface
 * Contesting for NISC Election leadership
 */
export interface Candidate {
  id: string;
  slug: string;
  name: string;
  codename: string;
  house?: string;
  year: string;
  department: string;
  branch?: string;
  state: string;
  color: string;
  colorLight: string;
  icon: string;
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  contestingFor: string[];
  position?: string;
  roleInfo?: string;
  vision: string;
  pillars: CandidatePillar[];
  closingStatement: string;
  signature?: string;
  manifestoText?: string;
  voteCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Election Configuration & Lifecycle State Interface
 */
export interface Election {
  id: string;
  title: string;
  description: string;
  status: ElectionStatus;
  totalEligibleVoters: number;
  createdAt: string;
  updatedAt: string;
  openedAt?: string | null;
  closedAt?: string | null;
  resultsPublishedAt?: string | null;
}

/**
 * Candidate Aggregate Result for Public & Admin Summary
 */
export interface CandidateResultSummary {
  id: string;
  name: string;
  codename: string;
  house?: string;
  year: string;
  department: string;
  branch?: string;
  position?: string;
  roleInfo?: string;
  color: string;
  colorLight: string;
  icon: string;
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  voteCount: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  isTied: boolean;
}

/**
 * Winner or Tie Determination
 */
export interface ElectionWinnerInfo {
  isTie: boolean;
  highestVoteCount: number;
  winner: CandidateResultSummary | null;
  tiedCandidates: CandidateResultSummary[];
  announcementStatement: string;
}

/**
 * Official Published Election Results Document (/elections/{electionId}/results/summary)
 */
export interface ElectionResultsSummary {
  electionId: string;
  title: string;
  status: ElectionStatus;
  totalEligibleVoters: number;
  totalVotesCast: number;
  didNotVote: number;
  participationPercentage: number;
  candidates: CandidateResultSummary[];
  winnerInfo: ElectionWinnerInfo;
  publishedAt: string;
  isImmutable: boolean;
  dataIntegrityVerified: boolean;
}
