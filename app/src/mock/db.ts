/**
 * In-browser mock database, persisted to localStorage so the demo survives reloads.
 * Only mock adapters touch this module.
 */
import type {
  AnalysisInput,
  AreaUnit,
  ChatMessage,
  GrowthStage,
  Lang,
  NotificationPrefs,
  NutrientKey,
  RegisterInput,
  TreatmentType,
} from '@/types';
import { SEED_FARMS, SEED_USERS, type MockFarm, type MockUser } from './data/reference';
import { SCENARIOS, SOIL_OUTCOMES } from './data/scenarios';
import { dayOffset, todayIso } from './engine/dates';

export interface MockUpload {
  id: string;
  kind: 'soil_card' | 'leaf';
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  previewUrl: string | null;
  sampleId: string | null;
}

export interface MockJob {
  id: string;
  startedAt: number;
  input: AnalysisInput;
  cancelled: boolean;
  analysisId: string;
}

export interface MockAnalysis {
  id: string;
  jobId: string | null;
  ownerId: string;
  createdAt: string;
  pending: boolean;
  farmId: string;
  cropId: string;
  growthStage: GrowthStage;
  area: number;
  areaUnit: AreaUnit;
  /** Key into SOIL_OUTCOMES, or null when no card was supplied. */
  soilKey: string | null;
  soilCardUrl: string | null;
  soilWithRegions: boolean;
  soilSampleDate: string | null;
  /** Farmer-entered corrections (or manual entry after an OCR failure). */
  soilOverrides: Partial<Record<NutrientKey, number>> | null;
  soilConfirmed: boolean;
  leafKey: string | null;
  leafImageUrl: string | null;
  saved: boolean;
}

export interface MockTreatment {
  id: string;
  farmId: string;
  cropId: string | null;
  type: TreatmentType;
  title: string;
  product: string;
  dose: string | null;
  scheduledDate: string;
  doneDate: string | null;
  phiDays: number | null;
  skipped: boolean;
  reminder: boolean;
  analysisId: string | null;
  notes: string | null;
}

export interface MockSoilRecord {
  id: string;
  farmId: string;
  sampleDate: string;
  labName: string;
  readings: Record<NutrientKey, number>;
}

export interface PendingOtp {
  challengeId: string;
  phone: string;
  code: string;
  expiresAt: number;
  registration: RegisterInput | null;
}

export interface MockDb {
  version: number;
  users: MockUser[];
  farms: MockFarm[];
  uploads: MockUpload[];
  jobs: MockJob[];
  analyses: MockAnalysis[];
  treatments: MockTreatment[];
  soilRecords: MockSoilRecord[];
  bookmarks: string[];
  /** farmId → done task ids */
  planTasks: Record<string, string[]>;
  chat: ChatMessage[];
  notifications: NotificationPrefs;
  sessionUserId: string | null;
  userLang: Record<string, Lang>;
  pendingOtp: PendingOtp | null;
  expertNotes: { id: string; farmerId: string; analysisId: string | null; fromName: string; text: string; createdAt: string; read: boolean }[];
  translationReports: { lang: string; screen: string; note: string; at: string }[];
}

const KEY = 'cropwise-mock-db';
const VERSION = 4;

const soil = (
  id: string,
  farmId: string,
  sampleDate: string,
  labName: string,
  v: [number, number, number, number, number, number],
): MockSoilRecord => ({
  id,
  farmId,
  sampleDate,
  labName,
  readings: { pH: v[0], EC: v[1], OC: v[2], N: v[3], P: v[4], K: v[5] },
});

function seedAnalysis(
  id: string,
  scenarioId: string,
  daysAgo: number,
  saved: boolean,
  soilConfirmed: boolean,
): MockAnalysis {
  const s = SCENARIOS.find((x) => x.id === scenarioId)!;
  const outcome = SOIL_OUTCOMES[s.soilSampleId];
  return {
    id,
    jobId: null,
    ownerId: 'user-ramesh',
    createdAt: `${dayOffset(-daysAgo)}T09:30:00.000Z`,
    pending: false,
    farmId: s.farmId,
    cropId: s.cropId,
    growthStage: s.growthStage,
    area: s.area,
    areaUnit: 'acre',
    soilKey: s.soilSampleId,
    soilCardUrl: `/samples/${s.soilSampleId.replace('sample-soil-', 'soil-card-')}.svg`,
    soilWithRegions: outcome?.kind === 'ok',
    soilSampleDate: dayOffset(-daysAgo - 3),
    soilOverrides: null,
    soilConfirmed,
    leafKey: s.leafSampleId,
    leafImageUrl: null,
    saved,
  };
}

function seedTreatments(): MockTreatment[] {
  const base = { skipped: false, analysisId: null, notes: null };
  return [
    { ...base, id: 'tr-1', farmId: 'farm-hosahalli', cropId: 'tomato', type: 'chemical', title: 'Early blight spray', product: 'Mancozeb 75% WP', dose: '600 g/acre in 300 L water', scheduledDate: dayOffset(-1), doneDate: dayOffset(-1), phiDays: 7, reminder: false, analysisId: 'an-seed-1' },
    { ...base, id: 'tr-2', farmId: 'farm-hosahalli', cropId: 'tomato', type: 'organic', title: 'NSKE 5% foliar spray', product: 'Neem seed kernel extract', dose: '200 L/acre', scheduledDate: dayOffset(2), doneDate: null, phiDays: 0, reminder: true },
    { ...base, id: 'tr-3', farmId: 'farm-belur', cropId: 'potato', type: 'chemical', title: 'Late blight spray', product: 'Metalaxyl 8% + Mancozeb 64% WP', dose: '750 g/acre in 300 L water', scheduledDate: dayOffset(-4), doneDate: dayOffset(-4), phiDays: 7, reminder: false, analysisId: 'an-seed-2' },
    { ...base, id: 'tr-4', farmId: 'farm-belur', cropId: 'potato', type: 'organic', title: 'Trichoderma soil application', product: 'Trichoderma viride 1% WP', dose: '1 kg/acre in 50 kg FYM', scheduledDate: dayOffset(5), doneDate: null, phiDays: null, reminder: true },
    { ...base, id: 'tr-5', farmId: 'farm-byadgi', cropId: 'chilli', type: 'organic', title: 'Beauveria spray for thrips', product: 'Beauveria bassiana 1.15% WP', dose: '5 g/L', scheduledDate: dayOffset(-2), doneDate: null, phiDays: 0, reminder: true },
    { ...base, id: 'tr-6', farmId: 'farm-byadgi', cropId: 'chilli', type: 'organic', title: 'Jeevamrut drench', product: 'Jeevamrut', dose: '200 L/acre with irrigation', scheduledDate: dayOffset(9), doneDate: null, phiDays: null, reminder: false },
    { ...base, id: 'tr-7', farmId: 'farm-hosahalli', cropId: 'tomato', type: 'organic', title: 'Trichoderma-enriched FYM', product: 'Trichoderma viride + FYM', dose: '100 kg/acre', scheduledDate: dayOffset(-12), doneDate: dayOffset(-12), phiDays: null, reminder: false },
    { ...base, id: 'tr-8', farmId: 'farm-belur', cropId: 'potato', type: 'chemical', title: 'Preventive blight spray', product: 'Mancozeb 75% WP', dose: '500 g/acre', scheduledDate: dayOffset(-21), doneDate: dayOffset(-21), phiDays: 5, reminder: false },
    { ...base, id: 'tr-9', farmId: 'farm-hosahalli', cropId: 'tomato', type: 'organic', title: 'Pseudomonas foliar spray', product: 'Pseudomonas fluorescens 1.5% WP', dose: '10 g/L', scheduledDate: dayOffset(12), doneDate: null, phiDays: 0, reminder: true },
  ];
}

function seed(): MockDb {
  return {
    version: VERSION,
    users: structuredClone(SEED_USERS),
    farms: structuredClone(SEED_FARMS),
    uploads: [],
    jobs: [],
    analyses: [
      seedAnalysis('an-seed-1', 'tomato-early-blight', 4, true, true),
      seedAnalysis('an-seed-2', 'potato-late-blight', 6, true, true),
      seedAnalysis('an-seed-3', 'chilli-healthy', 19, false, true),
      seedAnalysis('an-seed-4', 'low-confidence', 33, false, false),
    ],
    treatments: seedTreatments(),
    soilRecords: [
      soil('soil-h1', 'farm-hosahalli', '2024-06-12', 'District Soil Testing Laboratory, Kolar', [6.6, 0.38, 0.38, 205, 15.1, 248]),
      soil('soil-h2', 'farm-hosahalli', '2025-01-18', 'District Soil Testing Laboratory, Kolar', [6.7, 0.4, 0.39, 198, 16.0, 244]),
      soil('soil-h3', 'farm-hosahalli', '2025-07-09', 'KVK Kolar mobile lab', [6.7, 0.41, 0.4, 190, 17.2, 240]),
      soil('soil-h4', 'farm-hosahalli', '2026-02-03', 'District Soil Testing Laboratory, Kolar', [6.8, 0.41, 0.4, 186, 17.9, 238]),
      soil('soil-b1', 'farm-belur', '2025-02-10', 'District Soil Testing Laboratory, Hassan', [6.1, 1.32, 0.49, 330, 26.0, 175]),
      soil('soil-b2', 'farm-belur', '2025-09-14', 'District Soil Testing Laboratory, Hassan', [6.0, 1.58, 0.5, 321, 27.4, 171]),
      soil('soil-b3', 'farm-belur', '2026-03-20', 'District Soil Testing Laboratory, Hassan', [5.9, 1.74, 0.51, 315, 28.1, 169]),
      soil('soil-y1', 'farm-byadgi', '2025-05-06', 'Soil Testing Laboratory, Haveri', [7.8, 0.66, 0.52, 285, 12.8, 318]),
      soil('soil-y2', 'farm-byadgi', '2026-04-11', 'Soil Testing Laboratory, Haveri', [7.7, 0.63, 0.55, 292, 13.5, 310]),
    ],
    bookmarks: ['guide-jeevamrut'],
    planTasks: { 'farm-hosahalli': ['s1-soil-test'] },
    chat: [],
    notifications: { sprayReminders: true, phiAlerts: true, weatherAlerts: true, learningTips: false, channel: 'sms' },
    sessionUserId: null,
    userLang: {},
    pendingOtp: null,
    expertNotes: [
      {
        id: 'note-1',
        farmerId: 'user-ramesh',
        analysisId: 'an-seed-4',
        fromName: 'Dr. Kavya Shetty',
        text: 'Your blurry tomato photo was hard to read. Please send a clear close-up of one leaf in daylight. Until then, remove spotted lower leaves and spray Pseudomonas in the evening.',
        createdAt: `${dayOffset(-2)}T11:00:00.000Z`,
        read: false,
      },
    ],
    translationReports: [],
  };
}

function load(): MockDb {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb & { seededOn?: string };
      // Re-seed when the schema changes or on a new day, so relative dates (PHI countdowns) stay meaningful.
      if (parsed.version === VERSION && parsed.seededOn === todayIso()) return parsed;
      if (parsed.version === VERSION) {
        const fresh = seed();
        return { ...fresh, sessionUserId: parsed.sessionUserId, userLang: parsed.userLang ?? {} };
      }
    }
  } catch {
    /* corrupted storage – fall through to a fresh seed */
  }
  return seed();
}

export const db: MockDb = load();

export function commit(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...db, seededOn: todayIso() }));
  } catch {
    /* storage full or unavailable – the demo keeps working in memory */
  }
}

export function resetDb(): void {
  const fresh = seed();
  const sessionUserId = db.sessionUserId;
  Object.assign(db, fresh, { sessionUserId });
  commit();
}

export const currentUserId = (): string => db.sessionUserId ?? 'user-ramesh';

/** Agronomists and admins work across the farmers they support, so they see every farm. */
export const isStaff = (): boolean => {
  const u = db.users.find((x) => x.id === currentUserId());
  return Boolean(u?.roles.some((r) => r === 'agronomist' || r === 'admin'));
};
