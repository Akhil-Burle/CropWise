/**
 * Offline read cache. Wraps selected read methods: every success is stored on the device,
 * and a NETWORK/TIMEOUT failure returns the last stored copy instead of an error screen.
 * Works with any adapter (mock or http) because it only sees the service interfaces.
 */
import type { Services } from './contracts';
import { isAppError } from './errors';

const PREFIX = 'cw-cache:';
const MAX_ENTRY_CHARS = 200_000;

type AnyFn = (...args: never[]) => Promise<unknown>;

function cached<F extends AnyFn>(name: string, fn: F): F {
  return (async (...args: Parameters<F>) => {
    const key = `${PREFIX}${name}:${JSON.stringify(args)}`;
    try {
      const value = await fn(...args);
      try {
        const json = JSON.stringify(value);
        if (json.length < MAX_ENTRY_CHARS) localStorage.setItem(key, json);
      } catch {
        /* quota exceeded – caching is best effort */
      }
      return value;
    } catch (e) {
      if (isAppError(e) && (e.code === 'NETWORK' || e.code === 'TIMEOUT')) {
        const hit = localStorage.getItem(key);
        if (hit) return JSON.parse(hit);
      }
      throw e;
    }
  }) as F;
}

/** Last advisory, sprays, farms, guides and soil open without network. */
export function withOfflineCache(s: Services): Services {
  if (typeof localStorage === 'undefined') return s;
  return {
    ...s,
    farms: { ...s.farms, list: cached('farms.list', s.farms.list), listCrops: cached('farms.listCrops', s.farms.listCrops) },
    analysis: { ...s.analysis, get: cached('analysis.get', s.analysis.get), list: cached('analysis.list', s.analysis.list) },
    advisory: { ...s.advisory, getAdvisory: cached('advisory.getAdvisory', s.advisory.getAdvisory) },
    treatments: { ...s.treatments, list: cached('treatments.list', s.treatments.list), getPhiAlerts: cached('treatments.getPhiAlerts', s.treatments.getPhiAlerts) },
    soil: { ...s.soil, getLatest: cached('soil.getLatest', s.soil.getLatest) },
    learn: { ...s.learn, listArticles: cached('learn.listArticles', s.learn.listArticles), getArticle: cached('learn.getArticle', s.learn.getArticle) },
    chat: { ...s.chat, listExpertNotes: cached('chat.listExpertNotes', s.chat.listExpertNotes) },
  };
}
