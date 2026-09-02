/**
 * Firestore Error Handling and Sanitization
 * Formats errors for secure reporting and diagnostic tracing
 */

import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentAuth = auth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentAuth?.uid,
      email: currentAuth?.email,
      emailVerified: currentAuth?.emailVerified,
      isAnonymous: currentAuth?.isAnonymous,
      tenantId: currentAuth?.tenantId,
      providerInfo:
        currentAuth?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
  };

  console.error('Firestore Security / Access Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getCleanErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Access denied: You do not have the required permissions to perform this action.';
  }

  if (message.includes('unavailable') || message.includes('network')) {
    return 'Service temporarily unavailable. Please verify your connection.';
  }

  if (message.includes('unauthenticated')) {
    return 'Authentication required. Please sign in with an approved NISC account.';
  }

  return 'An error occurred while processing your request.';
}
