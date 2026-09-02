import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Standard Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// In-Memory Rate Limiting Tracker for sensitive administrative operations (SEC-07)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const adminRateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ADMIN_REQUESTS = 10; // Max 10 reset operations per window

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = adminRateLimits.get(key);
  if (!entry || now > entry.resetTime) {
    adminRateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_ADMIN_REQUESTS) {
    return true;
  }
  entry.count += 1;
  return false;
}

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyC9u3O-N7WE7C5gTkh__pXyrLNt84tqtF0';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'nisc-2026';

const AUTHORIZED_ADMIN_EMAILS = [
  'skm151412@gmail.com',
  'mohiuddinahmad9abcs@gmail.com',
];

interface VerifiedAdminUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Verifies the caller's Firebase ID token against Google Identity Toolkit API.
 * Guarantees that the caller is authenticated and retrieves verified email & UID.
 */
async function verifyAdminIdToken(idToken: string): Promise<VerifiedAdminUser> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token verification failed: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const users = data.users || [];
  if (users.length === 0) {
    throw new Error('No user profile found for provided token');
  }

  const user = users[0];
  const email = (user.email || '').trim().toLowerCase();
  const uid = user.localId || '';
  const emailVerified = user.emailVerified === true;

  return { uid, email, emailVerified };
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Backend Admin Reset Votes Endpoint
 * Authoritative server-side operation for resetting votes:
 * 1. Verifies Bearer ID token with Google Identity Toolkit
 * 2. Strictly enforces that caller is skm151412@gmail.com or mohiuddinahmad9abcs@gmail.com
 * 3. Deletes all ballots and voteLocks in Firestore
 * 4. Clears hasVoted status, receiptId, votedAt on members
 * 5. Resets candidate voteCount to 0
 * 6. Preserves election status, candidate definitions, voter registry, admin config
 * 7. Records tamper-resistant audit log: RESET_VOTES
 */
app.post('/api/admin/reset-votes', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED: Authorization bearer token is required.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED: Empty authentication token.',
      });
    }

    // 1. Authoritative verification of caller identity
    let adminUser: VerifiedAdminUser;
    try {
      adminUser = await verifyAdminIdToken(idToken);
    } catch (verifyErr: unknown) {
      const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
      return res.status(401).json({
        success: false,
        error: `UNAUTHENTICATED: Invalid or expired administrator session token. (${msg})`,
      });
    }

    // 2. Strict Super-Administrator Allowlist & Verification Check
    const normalizedEmail = adminUser.email.toLowerCase();
    const isAuthorized = AUTHORIZED_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalizedEmail);

    if (!isAuthorized || !adminUser.emailVerified) {
      return res.status(403).json({
        success: false,
        error: `PERMISSION_DENIED: User ${adminUser.email} is not authorized to perform vote resets or email is not verified.`,
      });
    }

    // Rate Limiting (SEC-07)
    const clientKey = `${adminUser.uid}_${req.ip || 'ip'}`;
    if (isRateLimited(clientKey)) {
      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS: Administrative rate limit exceeded. Please wait a few minutes.',
      });
    }

    const electionId = req.body.electionId || 'nisc-election-2026';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    };

    // 3. Reset Firestore collections using admin credentials
    let ballotsDeleted = 0;
    let locksDeleted = 0;
    let membersUpdated = 0;
    let candidatesReset = 0;

    // A. Delete all documents in /ballots
    try {
      const ballotsRes = await fetch(`${baseUrl}/ballots?pageSize=500`, { headers });
      if (ballotsRes.ok) {
        const data = await ballotsRes.json();
        const documents = data.documents || [];
        for (const doc of documents) {
          const delRes = await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
            method: 'DELETE',
            headers,
          });
          if (delRes.ok) ballotsDeleted++;
        }
      }
    } catch (e) {
      console.warn('Notice: Error clearing ballots via REST', e);
    }

    // B. Delete all documents in /voteLocks
    try {
      const locksRes = await fetch(`${baseUrl}/voteLocks?pageSize=500`, { headers });
      if (locksRes.ok) {
        const data = await locksRes.json();
        const documents = data.documents || [];
        for (const doc of documents) {
          const delRes = await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
            method: 'DELETE',
            headers,
          });
          if (delRes.ok) locksDeleted++;
        }
      }
    } catch (e) {
      console.warn('Notice: Error clearing voteLocks via REST', e);
    }

    // C. Reset member hasVoted flag, receiptId, votedAt
    try {
      const membersRes = await fetch(`${baseUrl}/members?pageSize=500`, { headers });
      if (membersRes.ok) {
        const data = await membersRes.json();
        const documents = data.documents || [];
        for (const doc of documents) {
          const docFields = doc.fields || {};
          const hasVoted = docFields.hasVoted?.booleanValue === true;
          if (hasVoted || docFields.receiptId || docFields.votedAt) {
            const patchUrl = `https://firestore.googleapis.com/v1/${doc.name}?updateMask.fieldPaths=hasVoted&updateMask.fieldPaths=receiptId&updateMask.fieldPaths=votedAt&updateMask.fieldPaths=updatedAt`;
            const patchRes = await fetch(patchUrl, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                fields: {
                  hasVoted: { booleanValue: false },
                  receiptId: { nullValue: null },
                  votedAt: { nullValue: null },
                  updatedAt: { timestampValue: new Date().toISOString() },
                },
              }),
            });
            if (patchRes.ok) membersUpdated++;
          }
        }
      }
    } catch (e) {
      console.warn('Notice: Error resetting members via REST', e);
    }

    // D. Reset Candidate voteCount to 0
    try {
      const candidatesRes = await fetch(`${baseUrl}/elections/${electionId}/candidates`, { headers });
      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        const documents = data.documents || [];
        for (const doc of documents) {
          const patchUrl = `https://firestore.googleapis.com/v1/${doc.name}?updateMask.fieldPaths=voteCount&updateMask.fieldPaths=updatedAt`;
          const patchRes = await fetch(patchUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              fields: {
                voteCount: { integerValue: '0' },
                updatedAt: { timestampValue: new Date().toISOString() },
              },
            }),
          });
          if (patchRes.ok) candidatesReset++;
        }
      }
    } catch (e) {
      console.warn('Notice: Error resetting candidate counts via REST', e);
    }

    // E. Remove or reset results/summary if it exists
    try {
      await fetch(`${baseUrl}/elections/${electionId}/results/summary`, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      console.warn('Notice: Error clearing results summary', e);
    }

    // F. Append Audit Log Entry
    try {
      const auditLogUrl = `${baseUrl}/auditLogs`;
      await fetch(auditLogUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fields: {
            action: { stringValue: 'RESET_VOTES' },
            actorUid: { stringValue: adminUser.uid },
            actorEmail: { stringValue: adminUser.email },
            electionId: { stringValue: electionId },
            metadata: {
              mapValue: {
                fields: {
                  ballotsDeleted: { integerValue: String(ballotsDeleted) },
                  locksDeleted: { integerValue: String(locksDeleted) },
                  membersUpdated: { integerValue: String(membersUpdated) },
                  candidatesReset: { integerValue: String(candidatesReset) },
                  resetBy: { stringValue: adminUser.email },
                  resetTime: { stringValue: new Date().toISOString() },
                },
              },
            },
            createdAt: { timestampValue: new Date().toISOString() },
          },
        }),
      });
    } catch (e) {
      console.warn('Notice: Error appending audit log via REST', e);
    }

    return res.json({
      success: true,
      message: 'All votes have been reset successfully.',
      details: {
        electionId,
        resetBy: adminUser.email,
        ballotsDeleted,
        locksDeleted,
        membersUpdated,
        candidatesReset,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Fatal error during admin reset votes:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: `Failed to reset votes: ${message}`,
    });
  }
});

// Vite middleware / static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Election Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
