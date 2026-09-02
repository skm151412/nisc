/**
 * React Hook for Firebase Authentication & Verified Authorization Profile
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isConfigured } from '../services/firebase';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOutUser as authSignOutUser,
  resolveUserProfile,
} from '../services/authService';
import { AuthUserProfile } from '../types';
import { logger } from '../utils/logger';

const INITIAL_PROFILE: AuthUserProfile = {
  uid: '',
  email: '',
  displayName: null,
  photoURL: null,
  emailVerified: false,
  role: 'UNAUTHENTICATED',
  isAllowlisted: false,
  isAdmin: false,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);
  const [authActionLoading, setAuthActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          setUser(firebaseUser);
          if (firebaseUser) {
            const resolved = await resolveUserProfile(firebaseUser);
            setProfile(resolved);
          } else {
            setProfile(INITIAL_PROFILE);
          }
        } catch (err) {
          logger.error({
            message: 'Error resolving auth state change',
            context: 'useAuth',
            error: err,
          });
          setError('Failed to resolve authenticated profile.');
        } finally {
          setLoading(false);
        }
      },
      (authError) => {
        logger.error({
          message: 'Firebase Auth listener error',
          context: 'useAuth',
          error: authError,
        });
        setError('Authentication service connection failed.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setAuthActionLoading(true);
    try {
      const result = await authSignInWithGoogle();
      setUser(result.user);
      setProfile(result.profile);
      return result.profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      // Filter out standard popup closure by user
      if (!message.includes('auth/popup-closed-by-user')) {
        setError(message);
      }
      throw err;
    } finally {
      setAuthActionLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setAuthActionLoading(true);
    try {
      await authSignOutUser();
      setUser(null);
      setProfile(INITIAL_PROFILE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed.');
    } finally {
      setAuthActionLoading(false);
    }
  }, []);

  return {
    user,
    profile,
    loading,
    authActionLoading,
    error,
    signIn,
    signOut,
    isAuthenticated: Boolean(user && profile.role !== 'UNAUTHENTICATED'),
    isVoter: profile.role === 'VOTER',
    isAdmin: profile.role === 'ADMIN',
    isUnauthorized: profile.role === 'UNAUTHORIZED',
  };
}
