/**
 * Runtime configuration and feature flags. This is the only place that reads env variables.
 * Both variables are optional: with no .env file the app runs fully offline on mock data.
 */
/** mock = offline demo · local = real ML backend for uploads/analysis, mock for the rest · http = all real. */
export type DataSource = 'mock' | 'local' | 'http';

const rawSource = import.meta.env.VITE_DATA_SOURCE;
const dataSource: DataSource = rawSource === 'http' || rawSource === 'local' ? rawSource : 'mock';
const isMock = dataSource === 'mock';

export const config = {
  dataSource,
  /** Used only by src/services/http/*. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api',
  polling: {
    intervalMs: 700,
    /** Give up on an analysis job after this long and show a timeout state. */
    timeoutMs: 90_000,
  },
  /** Debounce before re-requesting an advisory or plan when an input changes. */
  inputDebounceMs: 450,
  flags: {
    /** "Run full demo", sample-data buttons and scenario picker. */
    demoMode: isMock,
    /** "Demo data – not for real agricultural use" notice. */
    // Still shown in "local": advice and accounts are mock data there.
    demoBanner: dataSource !== 'http',
    readAloud: true,
    adminArea: true,
  },
} as const;

export type AppConfig = typeof config;
