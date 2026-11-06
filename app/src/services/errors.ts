import type { AppError, AppErrorCode } from '@/types';

const RETRYABLE: ReadonlySet<AppErrorCode> = new Set<AppErrorCode>([
  'NETWORK',
  'TIMEOUT',
  'UPLOAD_FAILED',
  'RATE_LIMITED',
  'SERVER',
  'UNKNOWN',
]);

export function appError(
  code: AppErrorCode,
  message?: string,
  options: { retryable?: boolean; fieldErrors?: Record<string, string> } = {},
): AppError {
  return {
    kind: 'AppError',
    code,
    message: message ?? code,
    retryable: options.retryable ?? RETRYABLE.has(code),
    ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'AppError' &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

/** Normalises anything thrown inside an adapter into an AppError. */
export function toAppError(value: unknown): AppError {
  if (isAppError(value)) return value;
  if (value instanceof DOMException && value.name === 'AbortError') return appError('CANCELLED', 'Request cancelled');
  if (value instanceof TypeError) return appError('NETWORK', value.message);
  if (value instanceof Error) return appError('UNKNOWN', value.message);
  return appError('UNKNOWN', 'Unexpected error');
}

export function notImplemented(method: string): AppError {
  return appError('NOT_IMPLEMENTED', `${method} is not implemented for the http data source yet`, {
    retryable: false,
  });
}
