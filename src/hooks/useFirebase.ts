/**
 * React Hook for Firebase Environment and Readiness State
 */

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isConfigured } from '../services/firebase';
import { getFirebaseConfig } from '../config/firebase';
import { FirebaseConfigStatus } from '../types';

export function useFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const config = getFirebaseConfig();

  useEffect(() => {
    if (!auth || !isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const configStatus: FirebaseConfigStatus = {
    isConfigured,
    projectId: config.projectId,
    authDomain: config.authDomain,
    hasAppCheck: Boolean(config.appCheckSiteKey),
    isEmulator: config.useEmulator,
  };

  return {
    user,
    loading,
    isConfigured,
    configStatus,
  };
}
