import { appError } from '@/services/errors';
import { sessionEvents } from '@/services/session';

let expireNextCall = false;

export function armSessionExpiry(): void {
  expireNextCall = true;
}

/** Simulated network latency. Responses are deep-cloned so callers can never mutate the mock DB. */
export async function respond<T>(value: T, min = 220, max = 650): Promise<T> {
  const ms = min + Math.random() * (max - min);
  await new Promise((r) => setTimeout(r, ms));
  if (expireNextCall) {
    expireNextCall = false;
    sessionEvents.emitUnauthorized();
    throw appError('UNAUTHORIZED', 'Session expired (simulated)', { retryable: false });
  }
  return structuredClone(value);
}

export async function fail(code: Parameters<typeof appError>[0], message?: string, min = 200, max = 500): Promise<never> {
  const ms = min + Math.random() * (max - min);
  await new Promise((r) => setTimeout(r, ms));
  throw appError(code, message);
}

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
