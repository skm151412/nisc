/**
 * Safe Application Logger
 * Enforces sanitization of sensitive values (tokens, credentials, PII)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

const SANITIZED_KEYS = [
  'password',
  'token',
  'accessToken',
  'idToken',
  'credential',
  'secret',
  'apiKey',
  'privateKey',
  'vote',
  'candidateSelection',
];

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SANITIZED_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  debug(payload: LogPayload): void {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG][${payload.context || 'App'}] ${payload.message}`, sanitize(payload.data) || '');
    }
  },

  info(payload: LogPayload): void {
    console.info(`[INFO][${payload.context || 'App'}] ${payload.message}`, sanitize(payload.data) || '');
  },

  warn(payload: LogPayload): void {
    console.warn(`[WARN][${payload.context || 'App'}] ${payload.message}`, sanitize(payload.data) || '');
  },

  error(payload: LogPayload): void {
    const errorDetails = payload.error instanceof Error ? payload.error.message : payload.error;
    console.error(
      `[ERROR][${payload.context || 'App'}] ${payload.message}`,
      errorDetails || '',
      sanitize(payload.data) || ''
    );
  },
};
