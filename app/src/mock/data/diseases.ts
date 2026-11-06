import type { Severity } from '@/types';
import type { L } from './localize';

export interface MockDisease {
  id: string;
  cropId: string;
  healthy: boolean;
  name: L;
  scientificName: string | null;
  description: L;
  symptoms: L[];
}

export const DISEASES: MockDisease[] = [
  {
    id: 'tomato_early_blight',
    cropId: 'tomato',
    healthy: false,
    name: { en: 'Early blight', hi: 'अगेती अंगमारी (अर्ली ब्लाइट)', kn: 'ಆರಂಭಿಕ ಎಲೆ ಅಂಗಮಾರಿ' },
    scientificName: 'Alternaria solani',
    description: {
      en: 'A fungal disease that starts on older, lower leaves. It spreads in warm, humid weather and through rain or irrigation splash, and is worse when plants are short of nitrogen.',
      hi: 'यह फफूंद रोग पुरानी, निचली पत्तियों से शुरू होता है। गर्म, नम मौसम और बारिश या सिंचाई के छींटों से फैलता है, और नाइट्रोजन की कमी में अधिक होता है।',
      kn: 'ಇದು ಹಳೆಯ, ಕೆಳಗಿನ ಎಲೆಗಳಿಂದ ಆರಂಭವಾಗುವ ಶಿಲೀಂಧ್ರ ರೋಗ. ಬೆಚ್ಚಗಿನ, ತೇವಾಂಶದ ಹವಾಮಾನ ಮತ್ತು ಮಳೆ ಅಥವಾ ನೀರಾವರಿ ಸಿಡಿತದಿಂದ ಹರಡುತ್ತದೆ; ಸಾರಜನಕ ಕೊರತೆಯಲ್ಲಿ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
    },
    symptoms: [
      {
        en: 'Brown spots with rings like a target (concentric rings)',
        hi: 'निशाने जैसे छल्लों वाले भूरे धब्बे',
        kn: 'ಗುರಿಯಂತೆ ಉಂಗುರಗಳಿರುವ ಕಂದು ಚುಕ್ಕೆಗಳು',
      },
      { en: 'Yellowing around the spots', hi: 'धब्बों के चारों ओर पीलापन', kn: 'ಚುಕ್ಕೆಗಳ ಸುತ್ತ ಹಳದಿ ಬಣ್ಣ' },
      { en: 'Lower leaves dry and drop first', hi: 'निचली पत्तियां पहले सूखकर गिरती हैं', kn: 'ಕೆಳಗಿನ ಎಲೆಗಳು ಮೊದಲು ಒಣಗಿ ಉದುರುತ್ತವೆ' },
    ],
  },
  {
    id: 'tomato_septoria',
    cropId: 'tomato',
    healthy: false,
    name: { en: 'Septoria leaf spot', hi: 'सेप्टोरिया पत्ती धब्बा', kn: 'ಸೆಪ್ಟೋರಿಯಾ ಎಲೆ ಚುಕ್ಕೆ' },
    scientificName: 'Septoria lycopersici',
    description: {
      en: 'Many small round spots with grey centres and dark borders, mostly on lower leaves. Favoured by long periods of leaf wetness.',
      hi: 'निचली पत्तियों पर धूसर बीच और गहरे किनारे वाले कई छोटे गोल धब्बे। पत्तियों के लंबे समय तक गीले रहने से बढ़ता है।',
      kn: 'ಕೆಳಗಿನ ಎಲೆಗಳ ಮೇಲೆ ಬೂದು ಮಧ್ಯ ಮತ್ತು ಗಾಢ ಅಂಚಿನ ಹಲವು ಸಣ್ಣ ದುಂಡು ಚುಕ್ಕೆಗಳು. ಎಲೆಗಳು ದೀರ್ಘಕಾಲ ತೇವವಾಗಿದ್ದರೆ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
    },
    symptoms: [
      { en: 'Small spots (1–3 mm) with grey centres', hi: 'धूसर बीच वाले छोटे (1–3 मिमी) धब्बे', kn: 'ಬೂದು ಮಧ್ಯದ ಸಣ್ಣ (1–3 ಮಿಮೀ) ಚುಕ್ಕೆಗಳು' },
      { en: 'Tiny black dots inside the spots', hi: 'धब्बों के अंदर छोटे काले बिंदु', kn: 'ಚುಕ್ಕೆಗಳೊಳಗೆ ಸಣ್ಣ ಕಪ್ಪು ಬಿಂದುಗಳು' },
    ],
  },
  {
    id: 'tomato_late_blight',
    cropId: 'tomato',
    healthy: false,
    name: { en: 'Late blight', hi: 'पछेती अंगमारी', kn: 'ತಡವಾದ ಅಂಗಮಾರಿ' },
    scientificName: 'Phytophthora infestans',
    description: { en: 'Water-soaked patches that turn brown quickly in cool, wet weather.' },
    symptoms: [{ en: 'Large water-soaked patches' }],
  },
  {
    id: 'tomato_bacterial_spot',
    cropId: 'tomato',
    healthy: false,
    name: { en: 'Bacterial spot', hi: 'जीवाणु धब्बा', kn: 'ಬ್ಯಾಕ್ಟೀರಿಯಾ ಚುಕ್ಕೆ' },
    scientificName: 'Xanthomonas spp.',
    description: { en: 'Small greasy spots that later turn dark and scabby.' },
    symptoms: [{ en: 'Greasy dark spots' }],
  },
  {
    id: 'potato_late_blight',
    cropId: 'potato',
    healthy: false,
    name: { en: 'Late blight', hi: 'पछेती अंगमारी (लेट ब्लाइट)', kn: 'ಆಲೂಗಡ್ಡೆ ಅಂಗಮಾರಿ (ಲೇಟ್ ಬ್ಲೈಟ್)' },
    scientificName: 'Phytophthora infestans',
    description: {
      en: 'A fast-spreading water-mould disease. In cool, cloudy, wet weather it can destroy a field within a week and also rots tubers.',
      hi: 'तेजी से फैलने वाला रोग। ठंडे, बादल और गीले मौसम में यह एक सप्ताह में खेत नष्ट कर सकता है और कंदों को भी सड़ाता है।',
      kn: 'ವೇಗವಾಗಿ ಹರಡುವ ರೋಗ. ತಂಪಾದ, ಮೋಡ ಮತ್ತು ತೇವದ ಹವಾಮಾನದಲ್ಲಿ ಒಂದು ವಾರದಲ್ಲಿ ಹೊಲವನ್ನು ನಾಶ ಮಾಡಬಹುದು ಮತ್ತು ಗೆಡ್ಡೆಗಳನ್ನೂ ಕೊಳೆಸುತ್ತದೆ.',
    },
    symptoms: [
      {
        en: 'Dark, water-soaked patches at leaf tips and edges',
        hi: 'पत्ती के सिरों और किनारों पर गहरे, पानी से भीगे जैसे धब्बे',
        kn: 'ಎಲೆಯ ತುದಿ ಮತ್ತು ಅಂಚುಗಳಲ್ಲಿ ಗಾಢ, ನೀರಿನಲ್ಲಿ ನೆನೆದಂತಹ ಕಲೆಗಳು',
      },
      {
        en: 'White fuzzy growth under the leaf in the morning',
        hi: 'सुबह पत्ती के नीचे सफेद रुई जैसी परत',
        kn: 'ಬೆಳಿಗ್ಗೆ ಎಲೆಯ ಕೆಳಭಾಗದಲ್ಲಿ ಬಿಳಿ ಹತ್ತಿಯಂತಹ ಬೆಳವಣಿಗೆ',
      },
      { en: 'Bad smell from rotting stems', hi: 'सड़ते तनों से दुर्गंध', kn: 'ಕೊಳೆಯುವ ಕಾಂಡಗಳಿಂದ ದುರ್ವಾಸನೆ' },
    ],
  },
  {
    id: 'potato_early_blight',
    cropId: 'potato',
    healthy: false,
    name: { en: 'Early blight', hi: 'अगेती अंगमारी', kn: 'ಆರಂಭಿಕ ಅಂಗಮಾರಿ' },
    scientificName: 'Alternaria solani',
    description: { en: 'Target-like brown spots on older leaves.' },
    symptoms: [{ en: 'Target-like brown spots' }],
  },
  {
    id: 'chilli_healthy',
    cropId: 'chilli',
    healthy: true,
    name: { en: 'Healthy leaf', hi: 'स्वस्थ पत्ती', kn: 'ಆರೋಗ್ಯಕರ ಎಲೆ' },
    scientificName: null,
    description: {
      en: 'No disease symptoms found on this leaf. Keep monitoring twice a week, especially for thrips, mites and leaf curl during dry spells.',
      hi: 'इस पत्ती पर रोग के लक्षण नहीं मिले। सप्ताह में दो बार निगरानी करते रहें, खासकर सूखे में थ्रिप्स, माइट और पत्ती मरोड़ के लिए।',
      kn: 'ಈ ಎಲೆಯಲ್ಲಿ ರೋಗ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ ಗಮನಿಸುತ್ತಿರಿ, ವಿಶೇಷವಾಗಿ ಒಣ ಹವೆಯಲ್ಲಿ ಥ್ರಿಪ್ಸ್, ನುಸಿ ಮತ್ತು ಎಲೆ ಮುರುಟು ರೋಗಕ್ಕಾಗಿ.',
    },
    symptoms: [],
  },
  {
    id: 'chilli_leaf_curl',
    cropId: 'chilli',
    healthy: false,
    name: { en: 'Leaf curl (viral)', hi: 'पत्ती मरोड़ (वायरस)', kn: 'ಎಲೆ ಮುರುಟು (ವೈರಸ್)' },
    scientificName: 'Chilli leaf curl virus',
    description: { en: 'Leaves curl upward and become small; spread by whitefly.' },
    symptoms: [{ en: 'Upward curling leaves' }],
  },
  {
    id: 'chilli_anthracnose',
    cropId: 'chilli',
    healthy: false,
    name: { en: 'Anthracnose (die-back)', hi: 'एन्थ्रेक्नोज़ (डाई-बैक)', kn: 'ಆಂಥ್ರಾಕ್ನೋಸ್ (ಡೈ-ಬ್ಯಾಕ್)' },
    scientificName: 'Colletotrichum capsici',
    description: { en: 'Sunken spots on fruit and drying of twigs from the tip.' },
    symptoms: [{ en: 'Sunken fruit spots' }],
  },
];

export const diseaseById = (id: string): MockDisease => {
  const d = DISEASES.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown disease ${id}`);
  return d;
};

export interface PredictionSpec {
  diseaseId: string;
  confidence: number;
  severity: Severity;
  affectedAreaPct: number | null;
  alternatives: { diseaseId: string; probability: number }[];
}
