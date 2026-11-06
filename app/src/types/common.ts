/** App-wide primitives shared by every domain type. */

export type Lang = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'mr' | 'bn' | 'gu' | 'ml' | 'pa' | 'or';
export const LANGS: readonly Lang[] = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'or'] as const;

/** ISO-8601 date or date-time string. */
export type ISODate = string;

export type AreaUnit = 'acre' | 'hectare';

export interface Quantity {
  value: number;
  unit: string;
}

/** Page-based pagination plus free-text search and sort. Cursor backends can map `page` to a cursor in the adapter. */
export interface PageParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  /** Null when the backend cannot count cheaply. */
  total: number | null;
  hasMore: boolean;
}

/** Server-driven content tells the UI which language it was actually served in (may fall back to English). */
export interface Localized {
  contentLang: Lang;
}

export type AppErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INVALID_RESPONSE'
  | 'UPLOAD_FAILED'
  | 'FILE_TOO_LARGE'
  | 'FILE_TYPE'
  | 'UNREADABLE_SOIL_CARD'
  | 'LEAF_NOT_DETECTED'
  | 'CANCELLED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'RATE_LIMITED'
  | 'NOT_IMPLEMENTED'
  | 'SERVER'
  | 'UNKNOWN';

/** The single error shape every service rejects with. */
export interface AppError {
  readonly kind: 'AppError';
  code: AppErrorCode;
  /** Developer-facing message. The UI shows a translated message keyed by `code`. */
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string>;
}
