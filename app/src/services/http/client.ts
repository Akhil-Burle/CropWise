/**
 * Minimal transport for the future http adapters. Not used by the mock data source.
 *
 * Token mechanism is deliberately private to this module:
 *  - Cookie sessions: leave `tokenStore` empty; requests send `credentials: 'include'`.
 *  - Bearer tokens: the AuthService adapter calls `tokenStore.set()` after login/refresh.
 */
import { config } from '@/config';
import { platform } from '@/platform';
import { appError, toAppError } from '../errors';
import { sessionEvents } from '../session';

let bearerToken: string | null = null;
const TOKEN_KEY = 'cropwise-token';

/** In the Android app the token persists in native storage, so the farmer logs in once. */
export const tokenStore = {
  get: (): string | null => bearerToken,
  set: (token: string | null): void => {
    bearerToken = token;
    void (token ? platform.storage.set(TOKEN_KEY, token) : platform.storage.remove(TOKEN_KEY));
  },
  /** Call once at startup before the first request. */
  restore: async (): Promise<void> => {
    bearerToken = await platform.storage.get(TOKEN_KEY);
  },
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = config.apiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/** Absolute-or-relative URL for an API path (used by multipart uploads, which bypass `request`). */
export function apiUrl(path: string): string {
  return buildUrl(path);
}

/**
 * The backend returns file links as paths ("/api/uploads/…/file"). Through the dev proxy they already
 * work; when VITE_API_BASE_URL points at another origin they must be prefixed with it.
 */
export function absolutizeAssetUrls<T>(raw: T): T {
  const base = config.apiBaseUrl;
  if (!/^https?:\/\//i.test(base)) return raw;
  const origin = new URL(base).origin;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [
          k,
          k.endsWith('Url') && typeof v === 'string' && v.startsWith('/') ? `${origin}${v}` : walk(v),
        ]),
      );
    }
    return value;
  };
  return walk(raw) as T;
}

/** Returns parsed JSON (unknown – always pass it through `decode`). Rejects with AppError. */
export async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    throw toAppError(error);
  }

  if (response.status === 401) {
    sessionEvents.emitUnauthorized();
    throw appError('UNAUTHORIZED', 'Session expired', { retryable: false });
  }
  if (response.status === 403) throw appError('FORBIDDEN', 'Forbidden', { retryable: false });
  if (response.status === 404) throw appError('NOT_FOUND', 'Not found', { retryable: false });
  if (response.status === 429) throw appError('RATE_LIMITED', 'Too many requests');
  if (response.status === 422 || response.status === 400) {
    const payload = (await response.json().catch(() => null)) as { fieldErrors?: Record<string, string> } | null;
    throw appError('VALIDATION', 'Validation failed', { retryable: false, fieldErrors: payload?.fieldErrors });
  }
  if (!response.ok) throw appError('SERVER', `HTTP ${response.status}`);
  if (response.status === 204) return null;
  return response.json().catch(() => {
    throw appError('INVALID_RESPONSE', 'Response was not JSON');
  });
}

/**
 * XHR-based upload so we get real progress events (fetch has no upload progress).
 * Works for multipart POST (pass FormData) and pre-signed PUT (pass the Blob).
 */
export function sendWithProgress(params: {
  url: string;
  method: 'POST' | 'PUT';
  body: FormData | Blob;
  headers?: Record<string, string>;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(params.method, params.url);
    xhr.withCredentials = true;
    Object.entries(params.headers ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) params.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 401) {
        sessionEvents.emitUnauthorized();
        reject(appError('UNAUTHORIZED', 'Session expired', { retryable: false }));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const code = xhr.status === 413 ? 'FILE_TOO_LARGE' : xhr.status === 415 ? 'FILE_TYPE' : 'UPLOAD_FAILED';
        // Bad input will not succeed on retry; a server hiccup might.
        reject(appError(code, `HTTP ${xhr.status}`, { retryable: xhr.status >= 500 || xhr.status === 0 }));
        return;
      }
      try {
        resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => reject(appError('NETWORK', 'Upload failed'));
    xhr.onabort = () => reject(appError('CANCELLED', 'Upload cancelled', { retryable: false }));
    params.signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(params.body);
  });
}
