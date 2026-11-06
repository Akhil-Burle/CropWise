import type { GrowthStage } from '@/types';
import type { RawReading } from '../engine/soil';
import type { PredictionSpec } from './diseases';
import type { L } from './localize';

export interface MockSample {
  id: string;
  kind: 'soil_card' | 'leaf';
  title: L;
  description: L;
  imageUrl: string;
  fileName: string;
}

export const SAMPLES: MockSample[] = [
  {
    id: 'sample-soil-kolar',
    kind: 'soil_card',
    title: { en: 'Soil Health Card – Kolar (N-deficient)', hi: 'मृदा स्वास्थ्य कार्ड – कोलार (N की कमी)', kn: 'ಮಣ್ಣು ಆರೋಗ್ಯ ಚೀಟಿ – ಕೋಲಾರ (N ಕೊರತೆ)' },
    description: { en: 'Low nitrogen and low organic carbon', hi: 'कम नाइट्रोजन और कम जैविक कार्बन', kn: 'ಕಡಿಮೆ ಸಾರಜನಕ ಮತ್ತು ಕಡಿಮೆ ಸಾವಯವ ಇಂಗಾಲ' },
    imageUrl: '/samples/soil-card-kolar.svg',
    fileName: 'soil-card-kolar.svg',
  },
  {
    id: 'sample-soil-hassan',
    kind: 'soil_card',
    title: { en: 'Soil Health Card – Hassan (high EC)', hi: 'मृदा स्वास्थ्य कार्ड – हासन (अधिक EC)', kn: 'ಮಣ್ಣು ಆರೋಗ್ಯ ಚೀಟಿ – ಹಾಸನ (ಹೆಚ್ಚು EC)' },
    description: { en: 'Acidic soil with high salinity', hi: 'अधिक लवणता वाली अम्लीय मिट्टी', kn: 'ಹೆಚ್ಚು ಲವಣಾಂಶವಿರುವ ಆಮ್ಲೀಯ ಮಣ್ಣು' },
    imageUrl: '/samples/soil-card-hassan.svg',
    fileName: 'soil-card-hassan.svg',
  },
  {
    id: 'sample-soil-haveri',
    kind: 'soil_card',
    title: { en: 'Soil Health Card – Haveri (alkaline)', hi: 'मृदा स्वास्थ्य कार्ड – हावेरी (क्षारीय)', kn: 'ಮಣ್ಣು ಆರೋಗ್ಯ ಚೀಟಿ – ಹಾವೇರಿ (ಕ್ಷಾರೀಯ)' },
    description: { en: 'Slightly alkaline black soil, high potassium', hi: 'हल्की क्षारीय काली मिट्टी, अधिक पोटाश', kn: 'ಸ್ವಲ್ಪ ಕ್ಷಾರೀಯ ಕಪ್ಪು ಮಣ್ಣು, ಹೆಚ್ಚು ಪೊಟ್ಯಾಶ್' },
    imageUrl: '/samples/soil-card-haveri.svg',
    fileName: 'soil-card-haveri.svg',
  },
  {
    id: 'sample-soil-smudged',
    kind: 'soil_card',
    title: { en: 'Smudged card (OCR failure)', hi: 'धुंधला कार्ड (OCR विफल)', kn: 'ಮಸುಕಾದ ಚೀಟಿ (OCR ವಿಫಲ)' },
    description: { en: 'Edge case: values cannot be read', hi: 'विशेष स्थिति: मान पढ़े नहीं जा सकते', kn: 'ವಿಶೇಷ ಸಂದರ್ಭ: ಮೌಲ್ಯಗಳನ್ನು ಓದಲಾಗುವುದಿಲ್ಲ' },
    imageUrl: '/samples/soil-card-smudged.svg',
    fileName: 'soil-card-smudged.svg',
  },
  {
    id: 'sample-leaf-tomato-eb',
    kind: 'leaf',
    title: { en: 'Tomato leaf – spotted', hi: 'टमाटर पत्ती – धब्बेदार', kn: 'ಟೊಮೇಟೊ ಎಲೆ – ಚುಕ್ಕೆಗಳಿರುವ' },
    description: { en: 'Clear close-up, target-like spots', hi: 'साफ़ नज़दीकी फोटो, छल्लेदार धब्बे', kn: 'ಸ್ಪಷ್ಟ ಹತ್ತಿರದ ಚಿತ್ರ, ಉಂಗುರ ಚುಕ್ಕೆಗಳು' },
    imageUrl: '/samples/leaf-tomato-spotted.svg',
    fileName: 'leaf-tomato-spotted.svg',
  },
  {
    id: 'sample-leaf-potato-lb',
    kind: 'leaf',
    title: { en: 'Potato leaf – dark patches', hi: 'आलू पत्ती – गहरे धब्बे', kn: 'ಆಲೂಗಡ್ಡೆ ಎಲೆ – ಗಾಢ ಕಲೆಗಳು' },
    description: { en: 'Water-soaked patches at edges', hi: 'किनारों पर भीगे जैसे धब्बे', kn: 'ಅಂಚುಗಳಲ್ಲಿ ನೆನೆದಂತಹ ಕಲೆಗಳು' },
    imageUrl: '/samples/leaf-potato-patches.svg',
    fileName: 'leaf-potato-patches.svg',
  },
  {
    id: 'sample-leaf-chilli-healthy',
    kind: 'leaf',
    title: { en: 'Chilli leaf – healthy', hi: 'मिर्च पत्ती – स्वस्थ', kn: 'ಮೆಣಸಿನ ಎಲೆ – ಆರೋಗ್ಯಕರ' },
    description: { en: 'No visible symptoms', hi: 'कोई लक्षण नहीं', kn: 'ಯಾವುದೇ ಲಕ್ಷಣಗಳಿಲ್ಲ' },
    imageUrl: '/samples/leaf-chilli-healthy.svg',
    fileName: 'leaf-chilli-healthy.svg',
  },
  {
    id: 'sample-leaf-tomato-blurry',
    kind: 'leaf',
    title: { en: 'Tomato leaf – blurry (low confidence)', hi: 'टमाटर पत्ती – धुंधली (कम विश्वास)', kn: 'ಟೊಮೇಟೊ ಎಲೆ – ಮಸುಕು (ಕಡಿಮೆ ವಿಶ್ವಾಸ)' },
    description: { en: 'Edge case: out of focus, far away', hi: 'विशेष स्थिति: धुंधली, दूर से ली गई', kn: 'ವಿಶೇಷ ಸಂದರ್ಭ: ಮಸುಕು, ದೂರದಿಂದ' },
    imageUrl: '/samples/leaf-tomato-blurry.svg',
    fileName: 'leaf-tomato-blurry.svg',
  },
  {
    id: 'sample-leaf-not-leaf',
    kind: 'leaf',
    title: { en: 'Not a leaf (classification failure)', hi: 'पत्ती नहीं (पहचान विफल)', kn: 'ಎಲೆ ಅಲ್ಲ (ಗುರುತಿಸುವಿಕೆ ವಿಫಲ)' },
    description: { en: 'Edge case: photo of soil and stones', hi: 'विशेष स्थिति: मिट्टी और पत्थरों की फोटो', kn: 'ವಿಶೇಷ ಸಂದರ್ಭ: ಮಣ್ಣು ಮತ್ತು ಕಲ್ಲುಗಳ ಚಿತ್ರ' },
    imageUrl: '/samples/leaf-not-a-leaf.svg',
    fileName: 'leaf-not-a-leaf.svg',
  },
];

export type SoilOutcome =
  | { kind: 'ok'; readings: RawReading[]; labName: string; sampleDate: string; withRegions: boolean }
  | { kind: 'error'; code: 'UNREADABLE_SOIL_CARD' };

export type LeafOutcome = { kind: 'ok'; prediction: PredictionSpec } | { kind: 'error'; code: 'LEAF_NOT_DETECTED' };

const r = (key: RawReading['key'], value: number, confidence: number): RawReading => ({ key, value, confidence });

export const SOIL_OUTCOMES: Record<string, SoilOutcome> = {
  'sample-soil-kolar': {
    kind: 'ok',
    labName: 'District Soil Testing Laboratory, Kolar',
    sampleDate: '2026-10-08',
    withRegions: true,
    readings: [r('pH', 6.8, 0.97), r('EC', 0.42, 0.71), r('OC', 0.41, 0.93), r('N', 182, 0.95), r('P', 18.4, 0.68), r('K', 236, 0.9)],
  },
  'sample-soil-hassan': {
    kind: 'ok',
    labName: 'District Soil Testing Laboratory, Hassan',
    sampleDate: '2026-09-22',
    withRegions: true,
    readings: [r('pH', 5.9, 0.94), r('EC', 1.86, 0.88), r('OC', 0.52, 0.74), r('N', 312, 0.91), r('P', 28.6, 0.93), r('K', 168, 0.62)],
  },
  'sample-soil-haveri': {
    kind: 'ok',
    labName: 'Soil Testing Laboratory, Haveri',
    sampleDate: '2026-09-30',
    withRegions: true,
    readings: [r('pH', 7.6, 0.96), r('EC', 0.61, 0.92), r('OC', 0.58, 0.89), r('N', 298, 0.94), r('P', 14.2, 0.86), r('K', 305, 0.83)],
  },
  'sample-soil-smudged': { kind: 'error', code: 'UNREADABLE_SOIL_CARD' },
};

export const LEAF_OUTCOMES: Record<string, LeafOutcome> = {
  'sample-leaf-tomato-eb': {
    kind: 'ok',
    prediction: {
      diseaseId: 'tomato_early_blight',
      confidence: 0.91,
      severity: 'moderate',
      affectedAreaPct: 18,
      alternatives: [
        { diseaseId: 'tomato_septoria', probability: 0.05 },
        { diseaseId: 'tomato_late_blight', probability: 0.03 },
      ],
    },
  },
  'sample-leaf-potato-lb': {
    kind: 'ok',
    prediction: {
      diseaseId: 'potato_late_blight',
      confidence: 0.88,
      severity: 'high',
      affectedAreaPct: 32,
      alternatives: [{ diseaseId: 'potato_early_blight', probability: 0.09 }],
    },
  },
  'sample-leaf-chilli-healthy': {
    kind: 'ok',
    prediction: {
      diseaseId: 'chilli_healthy',
      confidence: 0.94,
      severity: 'none',
      affectedAreaPct: 0,
      alternatives: [
        { diseaseId: 'chilli_leaf_curl', probability: 0.03 },
        { diseaseId: 'chilli_anthracnose', probability: 0.02 },
      ],
    },
  },
  'sample-leaf-tomato-blurry': {
    kind: 'ok',
    prediction: {
      diseaseId: 'tomato_septoria',
      confidence: 0.54,
      severity: 'low',
      affectedAreaPct: null,
      alternatives: [
        { diseaseId: 'tomato_early_blight', probability: 0.31 },
        { diseaseId: 'tomato_bacterial_spot', probability: 0.09 },
      ],
    },
  },
  'sample-leaf-not-leaf': { kind: 'error', code: 'LEAF_NOT_DETECTED' },
};

/** Used when a real (non-sample) file is uploaded in mock mode. */
export const DEFAULT_BY_CROP: Record<string, { soil: string; leaf: string }> = {
  tomato: { soil: 'sample-soil-kolar', leaf: 'sample-leaf-tomato-eb' },
  potato: { soil: 'sample-soil-hassan', leaf: 'sample-leaf-potato-lb' },
  chilli: { soil: 'sample-soil-haveri', leaf: 'sample-leaf-chilli-healthy' },
};

export interface MockScenario {
  id: string;
  title: L;
  description: L;
  tag: 'main' | 'edge';
  farmId: string;
  cropId: string;
  growthStage: GrowthStage;
  area: number;
  soilSampleId: string;
  leafSampleId: string;
}

export const SCENARIOS: MockScenario[] = [
  {
    id: 'tomato-early-blight',
    title: { en: 'Tomato early blight · N-deficient soil', hi: 'टमाटर अगेती अंगमारी · N की कमी वाली मिट्टी', kn: 'ಟೊಮೇಟೊ ಆರಂಭಿಕ ಅಂಗಮಾರಿ · N ಕೊರತೆಯ ಮಣ್ಣು' },
    description: { en: 'Main demo: Kolar, fruiting stage, 2.5 acres', hi: 'मुख्य डेमो: कोलार, फल अवस्था, 2.5 एकड़', kn: 'ಮುಖ್ಯ ಡೆಮೊ: ಕೋಲಾರ, ಫಲ ಹಂತ, 2.5 ಎಕರೆ' },
    tag: 'main',
    farmId: 'farm-hosahalli',
    cropId: 'tomato',
    growthStage: 'fruiting',
    area: 2.5,
    soilSampleId: 'sample-soil-kolar',
    leafSampleId: 'sample-leaf-tomato-eb',
  },
  {
    id: 'potato-late-blight',
    title: { en: 'Potato late blight · high-EC soil', hi: 'आलू पछेती अंगमारी · अधिक EC मिट्टी', kn: 'ಆಲೂಗಡ್ಡೆ ಅಂಗಮಾರಿ · ಹೆಚ್ಚು EC ಮಣ್ಣು' },
    description: { en: 'Hassan, flowering stage, 1.8 acres', hi: 'हासन, फूल अवस्था, 1.8 एकड़', kn: 'ಹಾಸನ, ಹೂಬಿಡುವ ಹಂತ, 1.8 ಎಕರೆ' },
    tag: 'main',
    farmId: 'farm-belur',
    cropId: 'potato',
    growthStage: 'flowering',
    area: 1.8,
    soilSampleId: 'sample-soil-hassan',
    leafSampleId: 'sample-leaf-potato-lb',
  },
  {
    id: 'chilli-healthy',
    title: { en: 'Chilli · healthy leaf', hi: 'मिर्च · स्वस्थ पत्ती', kn: 'ಮೆಣಸಿನಕಾಯಿ · ಆರೋಗ್ಯಕರ ಎಲೆ' },
    description: { en: 'Haveri, vegetative stage, 3.2 acres', hi: 'हावेरी, वानस्पतिक अवस्था, 3.2 एकड़', kn: 'ಹಾವೇರಿ, ಸಸ್ಯಕ ಹಂತ, 3.2 ಎಕರೆ' },
    tag: 'main',
    farmId: 'farm-byadgi',
    cropId: 'chilli',
    growthStage: 'vegetative',
    area: 3.2,
    soilSampleId: 'sample-soil-haveri',
    leafSampleId: 'sample-leaf-chilli-healthy',
  },
  {
    id: 'low-confidence',
    title: { en: 'Low-confidence diagnosis', hi: 'कम विश्वास वाला निदान', kn: 'ಕಡಿಮೆ ವಿಶ್ವಾಸದ ರೋಗನಿರ್ಣಯ' },
    description: { en: 'Blurry tomato photo → 54% confidence', hi: 'धुंधली टमाटर फोटो → 54% विश्वास', kn: 'ಮಸುಕಾದ ಟೊಮೇಟೊ ಚಿತ್ರ → 54% ವಿಶ್ವಾಸ' },
    tag: 'edge',
    farmId: 'farm-hosahalli',
    cropId: 'tomato',
    growthStage: 'flowering',
    area: 2.5,
    soilSampleId: 'sample-soil-kolar',
    leafSampleId: 'sample-leaf-tomato-blurry',
  },
  {
    id: 'ocr-failure',
    title: { en: 'Unreadable soil card', hi: 'न पढ़ा जा सकने वाला मृदा कार्ड', kn: 'ಓದಲಾಗದ ಮಣ್ಣು ಚೀಟಿ' },
    description: { en: 'Soil OCR fails, leaf succeeds (partial result)', hi: 'मृदा OCR विफल, पत्ती सफल (आंशिक परिणाम)', kn: 'ಮಣ್ಣು OCR ವಿಫಲ, ಎಲೆ ಯಶಸ್ವಿ (ಭಾಗಶಃ ಫಲಿತಾಂಶ)' },
    tag: 'edge',
    farmId: 'farm-hosahalli',
    cropId: 'tomato',
    growthStage: 'fruiting',
    area: 2.5,
    soilSampleId: 'sample-soil-smudged',
    leafSampleId: 'sample-leaf-tomato-eb',
  },
  {
    id: 'leaf-failure',
    title: { en: 'Leaf not detected', hi: 'पत्ती नहीं पहचानी गई', kn: 'ಎಲೆ ಪತ್ತೆಯಾಗಿಲ್ಲ' },
    description: { en: 'Soil succeeds, leaf classification fails (partial)', hi: 'मृदा सफल, पत्ती पहचान विफल (आंशिक)', kn: 'ಮಣ್ಣು ಯಶಸ್ವಿ, ಎಲೆ ಗುರುತಿಸುವಿಕೆ ವಿಫಲ (ಭಾಗಶಃ)' },
    tag: 'edge',
    farmId: 'farm-belur',
    cropId: 'potato',
    growthStage: 'flowering',
    area: 1.8,
    soilSampleId: 'sample-soil-hassan',
    leafSampleId: 'sample-leaf-not-leaf',
  },
];
