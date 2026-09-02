/**
 * Approved NISC Voter Member Interface
 * Document ID must be Firebase Auth UID in Firestore
 */
export interface Member {
  name: string;
  email: string;
  rollNumber: string;
  batch: string;
  department: string;
  state: string;
  eligible: boolean;
  hasVoted: boolean;
  receiptId?: string | null;
  createdAt: string;
  updatedAt: string;
  id?: string;
  uid?: string | null;
  votedAt?: string | null;
  addedAt?: string;
  lastLoginAt?: string | null;
}

/**
 * Election Administrator Interface
 * Document ID must be Firebase Auth UID in Firestore
 */
export interface Admin {
  email: string;
  active: boolean;
  createdAt: string;
  id?: string;
  uid?: string;
  name?: string;
  role?: string;
  lastLoginAt?: string | null;
}

/**
 * Authenticated User Resolved Authorization Profile
 */
export type UserRole = 'VOTER' | 'ADMIN' | 'UNAUTHORIZED' | 'UNAUTHENTICATED';

export interface AuthUserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  role: UserRole;
  isAllowlisted: boolean;
  isAdmin: boolean;
  memberRecord?: Member | null;
  adminRecord?: Admin | null;
}
