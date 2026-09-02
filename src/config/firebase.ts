/**
 * Firebase Client Environment Configuration Loader
 * Note: Firebase web client config keys are public client identifiers.
 * Never store private service account keys or admin credentials here.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  appCheckSiteKey?: string;
  useEmulator: boolean;
  firestoreDatabaseId: string;
}

/**
 * Production Firebase project configuration for nisc-2026
 */
export const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC9u3O-N7WE7C5gTkh__pXyrLNt84tqtF0',
  authDomain: 'nisc-2026.firebaseapp.com',
  projectId: 'nisc-2026',
  storageBucket: 'nisc-2026.firebasestorage.app',
  messagingSenderId: '252912759752',
  appId: '1:252912759752:web:f21200eaf84761ce7906fd',
};

export const getFirebaseConfig = (): FirebaseClientConfig => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (process.env as any || {});
  const apiKey = env.VITE_FIREBASE_API_KEY || PRODUCTION_FIREBASE_CONFIG.apiKey;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || PRODUCTION_FIREBASE_CONFIG.authDomain;
  const projectId = env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_FIREBASE_CONFIG.projectId;
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || PRODUCTION_FIREBASE_CONFIG.storageBucket;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || PRODUCTION_FIREBASE_CONFIG.messagingSenderId;
  const appId = env.VITE_FIREBASE_APP_ID || PRODUCTION_FIREBASE_CONFIG.appId;
  const appCheckSiteKey = env.VITE_FIREBASE_APPCHECK_SITE_KEY || '';
  const useEmulator = env.VITE_USE_FIREBASE_EMULATOR === 'true';
  const firestoreDatabaseId = env.VITE_FIREBASE_DATABASE_ID || '(default)';

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    appCheckSiteKey,
    useEmulator,
    firestoreDatabaseId,
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.authDomain);
};
