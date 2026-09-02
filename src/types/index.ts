export * from './election';
export * from './member';
export * from './ballot';
export * from './audit';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  isEmulator: boolean;
  projectId?: string;
  authDomain?: string;
  hasAppCheck?: boolean;
}
