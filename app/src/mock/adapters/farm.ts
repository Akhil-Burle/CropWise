import type { FarmService, SoilService, WeatherService } from '@/services/contracts';
import { decode, decodeList, decodePage } from '@/services/decode';
import { appError } from '@/services/errors';
import {
  CropSchema,
  FarmSchema,
  RegionSchema,
  SeasonTimelineItemSchema,
  SoilComparisonSchema,
  SoilReportSchema,
  SoilTrendSchema,
  WeatherSchema,
  type SoilReportDto,
} from '@/services/schemas';
import { toCrop, toFarm, toRegion, toSeasonItem, toSoilComparison, toSoilReport, toSoilTrend, toWeather } from '@/services/mappers';
import type { FarmInput, Lang, NutrientKey, SeasonPhase } from '@/types';
import { NUTRIENT_KEYS } from '@/types';
import { commit, currentUserId, db, isStaff, type MockSoilRecord } from '../db';
import { CROPS, REGIONS, type MockFarm } from '../data/reference';
import { translator, type L } from '../data/localize';
import { WEATHER } from '../data/support';
import { fail, respond, uid } from '../latency';
import { matches, paginate } from '../paginate';
import { compareValue, buildSoilValues, NORMS } from '../engine/soil';
import { renderSoil } from '../engine/analysis';
import { dayOffset } from '../engine/dates';
import { fill } from '../engine/advisory';

const farmDto = (f: MockFarm) => {
  const latest = allReports(f.id, 'en')[0];
  return {
    id: f.id,
    name: f.name,
    village: f.village,
    district: f.district,
    state: f.state,
    area: f.area,
    areaUnit: f.areaUnit,
    cropIds: f.cropIds,
    soilType: f.soilType,
    location: f.location,
    lastSoilTestDate: latest?.sampleDate ?? null,
  };
};

export const myFarms = (): MockFarm[] => (isStaff() ? db.farms : db.farms.filter((f) => f.ownerId === currentUserId()));

export function findFarm(id: string): MockFarm {
  const farm = db.farms.find((f) => f.id === id);
  if (!farm) throw appError('NOT_FOUND', `Farm ${id} not found`, { retryable: false });
  return farm;
}

function validateFarm(input: FarmInput) {
  const fieldErrors: Record<string, string> = {};
  if (input.name.trim().length < 2) fieldErrors.name = 'required';
  if (!input.state) fieldErrors.state = 'required';
  if (!input.district) fieldErrors.district = 'required';
  if (!(input.area > 0) || input.area > 500) fieldErrors.area = 'range';
  if (input.cropIds.length === 0) fieldErrors.cropIds = 'required';
  if (Object.keys(fieldErrors).length) throw appError('VALIDATION', 'Invalid farm', { retryable: false, fieldErrors });
}

/* ---------- Season timeline ---------- */

const PHASES: Record<string, { phase: SeasonPhase; from: number; to: number; label: L }[]> = {
  tomato: [
    { phase: 'sowing', from: 0, to: 25, label: { en: 'Nursery & transplanting', hi: 'नर्सरी व रोपाई', kn: 'ಸಸಿಮಡಿ ಮತ್ತು ನಾಟಿ' } },
    { phase: 'vegetative', from: 25, to: 45, label: { en: 'Vegetative growth', hi: 'वानस्पतिक वृद्धि', kn: 'ಸಸ್ಯಕ ಬೆಳವಣಿಗೆ' } },
    { phase: 'flowering', from: 45, to: 62, label: { en: 'Flowering', hi: 'फूल आना', kn: 'ಹೂಬಿಡುವಿಕೆ' } },
    { phase: 'fruiting', from: 62, to: 78, label: { en: 'Fruit set & development', hi: 'फल बनना', kn: 'ಕಾಯಿ ಕಟ್ಟುವಿಕೆ' } },
    { phase: 'harvest', from: 78, to: 125, label: { en: 'Harvest (multiple pickings)', hi: 'तुड़ाई (कई बार)', kn: 'ಕೊಯ್ಲು (ಹಲವು ಬಾರಿ)' } },
  ],
  potato: [
    { phase: 'sowing', from: 0, to: 15, label: { en: 'Planting & emergence', hi: 'बुवाई व अंकुरण', kn: 'ನಾಟಿ ಮತ್ತು ಮೊಳಕೆ' } },
    { phase: 'vegetative', from: 15, to: 45, label: { en: 'Vegetative & earthing up', hi: 'वृद्धि व मिट्टी चढ़ाना', kn: 'ಬೆಳವಣಿಗೆ ಮತ್ತು ಮಣ್ಣು ಏರಿಸುವಿಕೆ' } },
    { phase: 'flowering', from: 45, to: 65, label: { en: 'Flowering & tuber initiation', hi: 'फूल व कंद बनना', kn: 'ಹೂಬಿಡುವಿಕೆ ಮತ್ತು ಗೆಡ್ಡೆ ಆರಂಭ' } },
    { phase: 'fruiting', from: 65, to: 90, label: { en: 'Tuber bulking', hi: 'कंद बढ़ना', kn: 'ಗೆಡ್ಡೆ ಬೆಳವಣಿಗೆ' } },
    { phase: 'harvest', from: 90, to: 110, label: { en: 'Haulm cutting & harvest', hi: 'डंठल कटाई व खुदाई', kn: 'ಕಾಂಡ ಕತ್ತರಿಸುವಿಕೆ ಮತ್ತು ಕೊಯ್ಲು' } },
  ],
  chilli: [
    { phase: 'sowing', from: 0, to: 35, label: { en: 'Nursery & transplanting', hi: 'नर्सरी व रोपाई', kn: 'ಸಸಿಮಡಿ ಮತ್ತು ನಾಟಿ' } },
    { phase: 'vegetative', from: 35, to: 65, label: { en: 'Vegetative growth', hi: 'वानस्पतिक वृद्धि', kn: 'ಸಸ್ಯಕ ಬೆಳವಣಿಗೆ' } },
    { phase: 'flowering', from: 65, to: 85, label: { en: 'Flowering', hi: 'फूल आना', kn: 'ಹೂಬಿಡುವಿಕೆ' } },
    { phase: 'fruiting', from: 85, to: 110, label: { en: 'Fruiting', hi: 'फल लगना', kn: 'ಕಾಯಿ ಬಿಡುವಿಕೆ' } },
    { phase: 'harvest', from: 110, to: 180, label: { en: 'Picking (green & red)', hi: 'तुड़ाई (हरी व लाल)', kn: 'ಕೊಯ್ಲು (ಹಸಿರು ಮತ್ತು ಕೆಂಪು)' } },
  ],
};

/* ---------- Soil helpers ---------- */

function recordDto(r: MockSoilRecord, lang: Lang): SoilReportDto {
  return {
    id: r.id,
    farmId: r.farmId,
    sampleDate: r.sampleDate,
    labName: r.labName,
    cardImageUrl: null,
    source: 'lab',
    confirmed: true,
    values: buildSoilValues(
      NUTRIENT_KEYS.map((key) => ({ key, value: r.readings[key], confidence: null })),
      lang,
      false,
    ),
  };
}

/** Lab records plus farmer-confirmed analysis reports, newest first. */
export function allReports(farmId: string, lang: Lang): SoilReportDto[] {
  const lab = db.soilRecords.filter((r) => r.farmId === farmId).map((r) => recordDto(r, lang));
  const fromAnalyses = db.analyses
    .filter((a) => a.farmId === farmId && a.soilConfirmed && !a.pending)
    .map((a) => renderSoil(a, lang).soil)
    .filter((s): s is SoilReportDto => s !== null && s.values.every((v) => v.value !== null && v.value !== undefined));
  return [...lab, ...fromAnalyses].sort((a, b) => (b.sampleDate ?? '').localeCompare(a.sampleDate ?? ''));
}

function findReport(id: string, lang: Lang): SoilReportDto {
  for (const farm of db.farms) {
    const hit = allReports(farm.id, lang).find((r) => r.id === id);
    if (hit) return hit;
  }
  throw appError('NOT_FOUND', `Soil report ${id} not found`, { retryable: false });
}

/* ---------- Services ---------- */

export const mockFarms: FarmService = {
  async list(params = {}) {
    const items = myFarms().filter((f) => matches(params.search, f.name, f.village, f.district)).map(farmDto);
    return decodePage(FarmSchema, await respond(paginate(items, params)), toFarm);
  },

  async get(id) {
    return decode(FarmSchema, await respond(farmDto(findFarm(id))), toFarm);
  },

  async create(input) {
    await respond(null, 300, 600);
    validateFarm(input);
    const farm: MockFarm = {
      id: uid('farm'),
      ownerId: currentUserId(),
      name: input.name.trim(),
      village: input.village.trim(),
      district: input.district,
      state: input.state,
      area: input.area,
      areaUnit: input.areaUnit,
      cropIds: input.cropIds,
      soilType: input.soilType,
      location: null,
      plantedDaysAgo: 30,
    };
    db.farms.push(farm);
    commit();
    return decode(FarmSchema, farmDto(farm), toFarm);
  },

  async update(id, input) {
    await respond(null, 300, 600);
    validateFarm(input);
    const farm = findFarm(id);
    Object.assign(farm, { ...input, name: input.name.trim(), village: input.village.trim() });
    commit();
    return decode(FarmSchema, farmDto(farm), toFarm);
  },

  async remove(id) {
    await respond(null, 300, 500);
    findFarm(id);
    db.farms = db.farms.filter((f) => f.id !== id);
    commit();
  },

  async listCrops(lang) {
    const tr = translator(lang);
    const raw = CROPS.map((c) => ({ id: c.id, name: tr.t(c.name), scientificName: c.scientificName, contentLang: tr.served() }));
    return decodeList(CropSchema, await respond(raw, 100, 250), toCrop);
  },

  async listRegions() {
    return decodeList(RegionSchema, await respond(REGIONS, 100, 250), toRegion);
  },

  async getSeasonTimeline(farmId, lang) {
    const farm = findFarm(farmId);
    const tr = translator(lang);
    const phases = PHASES[farm.cropIds[0] ?? 'tomato'] ?? PHASES.tomato;
    const age = farm.plantedDaysAgo;
    const raw = phases.map((p) => ({
      id: `${farm.id}-${p.phase}`,
      phase: p.phase,
      label: tr.t(p.label),
      start: dayOffset(p.from - age),
      end: dayOffset(p.to - age),
      status: age >= p.to ? 'done' : age >= p.from ? 'current' : 'upcoming',
      contentLang: tr.served(),
    }));
    return decodeList(SeasonTimelineItemSchema, await respond(raw), toSeasonItem);
  },
};

export const mockSoil: SoilService = {
  async listReports(farmId, params) {
    findFarm(farmId);
    const items = allReports(farmId, params.lang);
    return decodePage(SoilReportSchema, await respond(paginate(items, params)), toSoilReport);
  },

  async getLatest(farmId, lang) {
    const farms = farmId ? [findFarm(farmId)] : myFarms();
    const latest = farms
      .flatMap((f) => allReports(f.id, lang))
      .sort((a, b) => (b.sampleDate ?? '').localeCompare(a.sampleDate ?? ''))[0];
    const raw = await respond(latest ?? null);
    return raw ? decode(SoilReportSchema, raw, toSoilReport) : null;
  },

  async getTrend(farmId) {
    findFarm(farmId);
    const reports = allReports(farmId, 'en').slice().reverse();
    const raw = {
      farmId,
      series: NUTRIENT_KEYS.map((key: NutrientKey) => ({
        key,
        unit: NORMS[key].unit,
        range: { low: NORMS[key].low, high: NORMS[key].high },
        points: reports
          .map((r) => ({ date: r.sampleDate ?? '', value: r.values.find((v) => v.key === key)?.value ?? null }))
          .filter((p): p is { date: string; value: number } => p.value !== null && p.date !== ''),
      })),
    };
    return decode(SoilTrendSchema, await respond(raw), toSoilTrend);
  },

  async compare(aId, bId, lang) {
    if (aId === bId) return fail('VALIDATION', 'Pick two different reports');
    const a = findReport(aId, lang);
    const b = findReport(bId, lang);
    const val = (r: SoilReportDto, k: NutrientKey) => r.values.find((v) => v.key === k)?.value ?? null;
    const raw = { a, b, rows: NUTRIENT_KEYS.map((k) => compareValue(k, val(a, k), val(b, k), lang)) };
    return decode(SoilComparisonSchema, await respond(raw), toSoilComparison);
  },
};

export const mockWeather: WeatherService = {
  async getForFarm(farmId, lang) {
    const farm = findFarm(farmId);
    const spec = WEATHER[farm.id] ?? WEATHER['farm-hosahalli'];
    const tr = translator(lang);
    const sprayWindow =
      spec.rainChancePct >= 60
        ? {
            ok: false,
            message: tr.t({
              en: 'Rain likely in the next 24 hours – postpone spraying, it would wash off.',
              hi: 'अगले 24 घंटे में बारिश की संभावना – छिड़काव टालें, वह धुल जाएगा।',
              kn: 'ಮುಂದಿನ 24 ಗಂಟೆಯಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ – ಸಿಂಪಡಣೆ ಮುಂದೂಡಿ, ಅದು ತೊಳೆದುಹೋಗುತ್ತದೆ.',
            }),
          }
        : spec.windKph > 15
          ? {
              ok: false,
              message: fill(
                tr.t({
                  en: 'Wind is {w} km/h – spray drift risk. Spray in calm early morning instead.',
                  hi: 'हवा {w} किमी/घंटा – छिड़काव उड़ने का खतरा। शांत सुबह जल्दी छिड़कें।',
                  kn: 'ಗಾಳಿ {w} ಕಿಮೀ/ಗಂ – ಸಿಂಪಡಣೆ ಹಾರುವ ಅಪಾಯ. ಶಾಂತ ಮುಂಜಾನೆ ಸಿಂಪಡಿಸಿ.',
                }),
                { w: spec.windKph },
              ),
            }
          : {
              ok: true,
              message: tr.t({
                en: 'Good spray window: 6–10 AM tomorrow, wind below 10 km/h, no rain expected.',
                hi: 'अच्छा छिड़काव समय: कल सुबह 6–10, हवा 10 किमी/घंटा से कम, बारिश नहीं।',
                kn: 'ಉತ್ತಮ ಸಿಂಪಡಣೆ ಸಮಯ: ನಾಳೆ ಬೆಳಿಗ್ಗೆ 6–10, ಗಾಳಿ 10 ಕಿಮೀ/ಗಂ ಕೆಳಗೆ, ಮಳೆ ಇಲ್ಲ.',
              }),
            };
    const raw = {
      farmId,
      location: `${farm.village}, ${farm.district}`,
      tempC: spec.tempC,
      humidityPct: spec.humidityPct,
      rainChancePct: spec.rainChancePct,
      windKph: spec.windKph,
      condition: spec.condition,
      sprayWindow,
      forecast: spec.forecast.map((f, i) => ({ ...f, date: dayOffset(i) })),
      isDemo: true,
      contentLang: tr.served(),
    };
    return decode(WeatherSchema, await respond(raw), toWeather);
  },
};
