/**
 * NISC Authentication & Authorization Service
 * Pure Google OAuth + Firebase Auth with exact allowlisting and server claims
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  isVoterAllowlisted,
  isAdminEmail,
  normalizeEmail,
  deriveMemberDetailsFromEmail,
} from '../config/voterAllowlist';
import { Member, Admin, AuthUserProfile, UserRole } from '../types';
import { logger } from '../utils/logger';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Executes Google Single Sign-On via Firebase Auth Popup
 */
export async function signInWithGoogle(): Promise<{
  user: User;
  profile: AuthUserProfile;
}> {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const email = normalizeEmail(user.email);

    logger.info({
      message: `Google Sign-In completed for: ${email}`,
      context: 'AuthService',
    });

    const profile = await resolveUserProfile(user);

    // If approved voter and Firestore is active, link/sync verified member doc
    if (profile.role === 'VOTER' && db) {
      await ensureMemberRecordLinked(user);
    }

    return { user, profile };
  } catch (error) {
    logger.error({
      message: 'Google Sign-In failed',
      context: 'AuthService',
      error,
    });
    throw error;
  }
}

/**
 * Signs out the current Firebase user
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;

  try {
    await signOut(auth);
    logger.info({
      message: 'User signed out successfully',
      context: 'AuthService',
    });
  } catch (error) {
    logger.error({
      message: 'Error during signOut',
      context: 'AuthService',
      error,
    });
    throw error;
  }
}

/**
 * Resolves the authorization role and profile from the verified Firebase user
 */
export async function resolveUserProfile(user: User | null): Promise<AuthUserProfile> {
  if (!user || !user.email) {
    return {
      uid: '',
      email: '',
      displayName: null,
      photoURL: null,
      emailVerified: false,
      role: 'UNAUTHENTICATED',
      isAllowlisted: false,
      isAdmin: false,
    };
  }

  const email = normalizeEmail(user.email);
  const isAdmin = isAdminEmail(email);
  const isAllowlisted = isVoterAllowlisted(email);

  let role: UserRole = 'UNAUTHORIZED';
  if (isAdmin) {
    role = 'ADMIN';
  } else if (isAllowlisted) {
    role = 'VOTER';
  }

  let memberRecord: Member | null = null;
  let adminRecord: Admin | null = null;

  // Authoritative Firestore record lookup using request.auth.uid directly
  if (db) {
    try {
      if (role === 'VOTER') {
        const memberRef = doc(db, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          memberRecord = memberSnap.data() as Member;
        }
      } else if (role === 'ADMIN') {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          adminRecord = adminSnap.data() as Admin;
        }
      }
    } catch {
      // If Firestore read fails due to rules or network, we still have verified allowlist status
    }
  }

  // Fallback synthetic member record matching Phase 3 schema
  if (role === 'VOTER' && !memberRecord) {
    const details = deriveMemberDetailsFromEmail(email);
    memberRecord = {
      name: user.displayName || details.name,
      email,
      rollNumber: details.rollNumber,
      batch: details.batch,
      department: details.department,
      state: 'ACTIVE',
      eligible: true,
      hasVoted: false,
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
      uid: user.uid,
    };
  }

  if (role === 'ADMIN' && !adminRecord) {
    adminRecord = {
      email,
      active: true,
      createdAt: '2026-08-21T00:00:00.000Z',
      uid: user.uid,
      name: user.displayName || 'Election Administrator',
    };
  }

  return {
    uid: user.uid,
    email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    role,
    isAllowlisted,
    isAdmin,
    memberRecord,
    adminRecord,
  };
}

/**
 * Links user UID to member document in Firestore upon verified login
 * Strictly uses user.uid as document ID
 */
export async function ensureMemberRecordLinked(user: User): Promise<void> {
  if (!db || !user.email) return;

  const email = normalizeEmail(user.email);
  // Client-side guard: Only allowlisted student voters should attempt to sync their member record.
  // Authoritative server-side enforcement is guaranteed by Firestore Security Rules.
  if (!isVoterAllowlisted(email)) {
    return;
  }

  try {
    const memberDocRef = doc(db, 'members', user.uid);
    const snap = await getDoc(memberDocRef);

    if (!snap.exists()) {
      const details = deriveMemberDetailsFromEmail(email);
      await setDoc(memberDocRef, {
        name: user.displayName || details.name,
        email,
        rollNumber: details.rollNumber,
        batch: details.batch,
        department: details.department,
        state: 'ACTIVE',
        eligible: true,
        hasVoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.warn({
      message: 'Member doc sync skipped or governed by Cloud Functions / Rules',
      context: 'AuthService',
      data: { error: String(error) },
    });
  }
}
