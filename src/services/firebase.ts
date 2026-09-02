/**
 * Central Firebase Initialization Module
 * Initializes Firebase App, Auth, Firestore, Functions, and App Check
 * Configured specifically for target project: nisc-2026
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getFirebaseConfig, isFirebaseConfigured } from '../config/firebase';
import { initAppCheck } from './appCheck';
import { logger } from '../utils/logger';

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;

const config = getFirebaseConfig();

export function initializeFirebaseServices() {
  if (!isFirebaseConfigured() && !config.useEmulator) {
    logger.warn({
      message: 'Firebase configuration is incomplete. Missing required parameters.',
      context: 'FirebaseInit',
    });
    return {
      app: null,
      auth: null,
      db: null,
      functions: null,
      isConfigured: false,
    };
  }

  try {
    if (!getApps().length) {
      if (!config.apiKey || !config.projectId || !config.authDomain) {
        throw new Error('Firebase configuration parameters missing for project nisc-2026.');
      }
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
      logger.info({
        message: `Firebase App initialized for project: ${config.projectId}`,
        context: 'FirebaseInit',
      });
    } else {
      firebaseApp = getApp();
    }

    authInstance = getAuth(firebaseApp);
    firestoreInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);
    functionsInstance = getFunctions(firebaseApp);

    // Optional App Check initialization (only if site key is non-empty)
    if (config.appCheckSiteKey && config.appCheckSiteKey.trim() !== '' && firebaseApp) {
      initAppCheck(firebaseApp, config.appCheckSiteKey);
    }

    // Emulator Connection (only if VITE_USE_FIREBASE_EMULATOR is explicitly true)
    if (config.useEmulator) {
      logger.info({
        message: 'Connecting to local Firebase Emulators (Auth: 9099, Firestore: 8080, Functions: 5001)',
        context: 'FirebaseInit',
      });
      try {
        connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(firestoreInstance, '127.0.0.1', 8080);
        connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
      } catch {
        logger.warn({
          message: 'Firebase Emulators already connected or connection skipped.',
          context: 'FirebaseInit',
        });
      }
    }

    return {
      app: firebaseApp,
      auth: authInstance,
      db: firestoreInstance,
      functions: functionsInstance,
      isConfigured: true,
    };
  } catch (error) {
    logger.error({
      message: 'Fatal error initializing Firebase services',
      context: 'FirebaseInit',
      error,
    });
    return {
      app: null,
      auth: null,
      db: null,
      functions: null,
      isConfigured: false,
    };
  }
}

// Initialize on module load
const { app, auth, db, functions, isConfigured } = initializeFirebaseServices();

export { app, auth, db, functions, isConfigured };
