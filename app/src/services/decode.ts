import type { z } from 'zod';
import type { Paginated } from '@/types';
import { paginatedSchema } from './schemas';
import { toPage } from './mappers';
import { appError } from './errors';

/**
 * Validate an untrusted payload and map it into the domain model.
 * A malformed payload becomes an INVALID_RESPONSE AppError instead of crashing a screen.
 */
export function decode<S extends z.ZodTypeAny, T>(schema: S, raw: unknown, map: (dto: z.infer<S>) => T): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue ? `${issue.path.join('.') || '(root)'}: ${issue.message}` : 'unknown';
    if (import.meta.env.DEV) console.warn('[service] invalid response', where, raw);
    throw appError('INVALID_RESPONSE', `Response failed validation at ${where}`, { retryable: true });
  }
  return map(parsed.data);
}

export function decodeList<S extends z.ZodTypeAny, T>(schema: S, raw: unknown, map: (dto: z.infer<S>) => T): T[] {
  if (!Array.isArray(raw)) throw appError('INVALID_RESPONSE', 'Expected a list', { retryable: true });
  return raw.map((item) => decode(schema, item, map));
}

export function decodePage<S extends z.ZodTypeAny, T>(
  itemSchema: S,
  raw: unknown,
  map: (dto: z.infer<S>) => T,
): Paginated<T> {
  return decode(paginatedSchema(itemSchema), raw, (dto) => toPage(dto, map));
}
