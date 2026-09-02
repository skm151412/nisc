/**
 * Firebase App Check Initialization Service (Phase 10 Hardened)
 * Evaluates and configures App Check with reCAPTCHA Enterprise
 */

import { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { logger } from '../utils/logger';

let appCheckInstance: AppCheck | null = null;
let appCheckStatus: 'Not configured' | 'Configured' | 'Configured but not enforced' | 'Enforced' = 'Not configured';

export function getAppCheckStatus(): 'Not configured' | 'Configured' | 'Configured but not enforced' | 'Enforced' {
  return appCheckStatus;
}

export function initAppCheck(app: FirebaseApp, siteKey?: string): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  // In development / emulator mode, configure debug token support
  if (import.meta.env.DEV) {
    // Enable debug token for local testing without breaking legitimate developer/voter tests
    // @ts-expect-error Firebase global debug token flag
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    logger.info({
      message: 'App Check configured with debug token for development mode',
      context: 'AppCheck',
    });
  }

  if (!siteKey) {
    appCheckStatus = 'Not configured';
    logger.warn({
      message: 'App Check site key not provided. Running in un-enforced monitoring mode.',
      context: 'AppCheck',
    });
    return null;
  }

  try {
    // Prefer reCAPTCHA Enterprise provider as mandated by Phase 10
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckStatus = 'Configured';

    logger.info({
      message: 'Firebase App Check initialized with reCAPTCHA Enterprise provider',
      context: 'AppCheck',
    });

    return appCheckInstance;
  } catch (enterpriseError) {
    logger.warn({
      message: 'ReCaptchaEnterpriseProvider initialization fallback to v3',
      context: 'AppCheck',
      error: enterpriseError,
    });

    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckStatus = 'Configured';
      return appCheckInstance;
    } catch (v3Error) {
      logger.error({
        message: 'Failed to initialize Firebase App Check',
        context: 'AppCheck',
        error: v3Error,
      });
      appCheckStatus = 'Not configured';
      return null;
    }
  }
}
