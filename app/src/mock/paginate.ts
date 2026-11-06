import type { PageParams } from '@/types';

/** Page-based slicing with the same envelope a real API would return. */
export function paginate<T>(items: T[], params: PageParams = {}) {
  const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
  const page = Math.max(1, params.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length,
  };
}

export function matches(search: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}
