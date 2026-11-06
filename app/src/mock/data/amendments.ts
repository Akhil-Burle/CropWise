import type { NutrientKey, NutrientStatus } from '@/types';
import type { L } from './localize';

export interface AmendmentSpec {
  id: string;
  nutrient: NutrientKey;
  when: NutrientStatus;
  product: L;
  /** Quantity per acre in `unit`. 0 means "skip this input". */
  perAcre: number;
  unit: 'kg';
  timing: L;
  note: L;
  costPerAcre: number;
}

export const AMENDMENTS: AmendmentSpec[] = [
  {
    id: 'n-vermicompost',
    nutrient: 'N',
    when: 'deficient',
    product: { en: 'Vermicompost', hi: 'केंचुआ खाद (वर्मीकम्पोस्ट)', kn: 'ಎರೆಹುಳು ಗೊಬ್ಬರ' },
    perAcre: 1000,
    unit: 'kg',
    timing: { en: 'Side-dress now along the rows, then before next sowing', hi: 'अभी पंक्तियों के साथ डालें, फिर अगली बुवाई से पहले', kn: 'ಈಗ ಸಾಲುಗಳ ಉದ್ದಕ್ಕೂ ಹಾಕಿ, ನಂತರ ಮುಂದಿನ ಬಿತ್ತನೆಗೆ ಮೊದಲು' },
    note: { en: 'Slow-release nitrogen; also raises organic carbon.', hi: 'धीरे-धीरे नाइट्रोजन देता है; जैविक कार्बन भी बढ़ाता है।', kn: 'ನಿಧಾನವಾಗಿ ಸಾರಜನಕ ನೀಡುತ್ತದೆ; ಸಾವಯವ ಇಂಗಾಲವನ್ನೂ ಹೆಚ್ಚಿಸುತ್ತದೆ.' },
    costPerAcre: 8000,
  },
  {
    id: 'n-azospirillum',
    nutrient: 'N',
    when: 'deficient',
    product: { en: 'Azospirillum / Azotobacter (bio-N)', hi: 'एज़ोस्पिरिलम / एज़ोटोबैक्टर (जैव-N)', kn: 'ಅಜೋಸ್ಪಿರಿಲಮ್ / ಅಜೋಟೋಬ್ಯಾಕ್ಟರ್ (ಜೈವಿಕ-N)' },
    perAcre: 2,
    unit: 'kg',
    timing: { en: 'Mix with 50 kg FYM and apply at the root zone', hi: '50 किलो गोबर खाद में मिलाकर जड़ों के पास डालें', kn: '50 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರದಲ್ಲಿ ಬೆರೆಸಿ ಬೇರಿನ ಬಳಿ ಹಾಕಿ' },
    note: { en: 'Fixes nitrogen from the air; can replace about a quarter of urea over time.', hi: 'हवा से नाइट्रोजन लेता है; समय के साथ लगभग एक-चौथाई यूरिया की जगह ले सकता है।', kn: 'ಗಾಳಿಯಿಂದ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸುತ್ತದೆ; ಕಾಲಕ್ರಮೇಣ ಸುಮಾರು ಕಾಲು ಭಾಗ ಯೂರಿಯಾ ಬದಲಿಸಬಹುದು.' },
    costPerAcre: 240,
  },
  {
    id: 'p-psb',
    nutrient: 'P',
    when: 'deficient',
    product: { en: 'Phosphate solubilising bacteria (PSB) + rock phosphate', hi: 'फॉस्फेट घोलक जीवाणु (PSB) + रॉक फॉस्फेट', kn: 'ರಂಜಕ ಕರಗಿಸುವ ಬ್ಯಾಕ್ಟೀರಿಯಾ (PSB) + ರಾಕ್ ಫಾಸ್ಫೇಟ್' },
    perAcre: 100,
    unit: 'kg',
    timing: { en: 'At sowing or transplanting', hi: 'बुवाई या रोपाई के समय', kn: 'ಬಿತ್ತನೆ ಅಥವಾ ನಾಟಿ ಸಮಯದಲ್ಲಿ' },
    note: { en: '2 kg PSB with 100 kg rock phosphate per acre.', hi: 'प्रति एकड़ 2 किलो PSB के साथ 100 किलो रॉक फॉस्फेट।', kn: 'ಎಕರೆಗೆ 2 ಕೆಜಿ PSB ಜೊತೆ 100 ಕೆಜಿ ರಾಕ್ ಫಾಸ್ಫೇಟ್.' },
    costPerAcre: 1100,
  },
  {
    id: 'p-skip',
    nutrient: 'P',
    when: 'excess',
    product: { en: 'No phosphorus inputs this season', hi: 'इस मौसम फॉस्फोरस न दें', kn: 'ಈ ಋತುವಿನಲ್ಲಿ ರಂಜಕ ನೀಡಬೇಡಿ' },
    perAcre: 0,
    unit: 'kg',
    timing: { en: 'This season and next', hi: 'इस और अगले मौसम', kn: 'ಈ ಮತ್ತು ಮುಂದಿನ ಋತು' },
    note: { en: 'Phosphorus is already high. Skipping DAP saves money and avoids zinc lock-up.', hi: 'फॉस्फोरस पहले से अधिक है। DAP न देने से पैसा बचता है और जिंक की कमी नहीं होती।', kn: 'ರಂಜಕ ಈಗಾಗಲೇ ಹೆಚ್ಚಿದೆ. DAP ಬಿಡುವುದರಿಂದ ಹಣ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಸತು ಕೊರತೆ ತಪ್ಪುತ್ತದೆ.' },
    costPerAcre: 0,
  },
  {
    id: 'k-kmb',
    nutrient: 'K',
    when: 'deficient',
    product: { en: 'Potash mobilising bacteria (KMB) + wood ash', hi: 'पोटाश सक्रियक जीवाणु (KMB) + लकड़ी की राख', kn: 'ಪೊಟ್ಯಾಶ್ ಚಲನಗೊಳಿಸುವ ಬ್ಯಾಕ್ಟೀರಿಯಾ (KMB) + ಮರದ ಬೂದಿ' },
    perAcre: 200,
    unit: 'kg',
    timing: { en: 'Before flowering', hi: 'फूल आने से पहले', kn: 'ಹೂಬಿಡುವ ಮೊದಲು' },
    note: { en: '2 kg KMB with 200 kg sieved wood ash per acre.', hi: 'प्रति एकड़ 2 किलो KMB के साथ 200 किलो छनी राख।', kn: 'ಎಕರೆಗೆ 2 ಕೆಜಿ KMB ಜೊತೆ 200 ಕೆಜಿ ಜರಡಿ ಮಾಡಿದ ಬೂದಿ.' },
    costPerAcre: 600,
  },
  {
    id: 'k-skip',
    nutrient: 'K',
    when: 'excess',
    product: { en: 'No potash inputs this season', hi: 'इस मौसम पोटाश न दें', kn: 'ಈ ಋತುವಿನಲ್ಲಿ ಪೊಟ್ಯಾಶ್ ನೀಡಬೇಡಿ' },
    perAcre: 0,
    unit: 'kg',
    timing: { en: 'This season', hi: 'इस मौसम', kn: 'ಈ ಋತು' },
    note: { en: 'Potassium is already high; extra MOP adds cost and salt.', hi: 'पोटाश पहले से अधिक है; अतिरिक्त MOP से खर्च और लवण बढ़ता है।', kn: 'ಪೊಟ್ಯಾಶ್ ಈಗಾಗಲೇ ಹೆಚ್ಚಿದೆ; ಹೆಚ್ಚುವರಿ MOP ವೆಚ್ಚ ಮತ್ತು ಲವಣ ಹೆಚ್ಚಿಸುತ್ತದೆ.' },
    costPerAcre: 0,
  },
  {
    id: 'ph-lime',
    nutrient: 'pH',
    when: 'deficient',
    product: { en: 'Agricultural lime (dolomite)', hi: 'कृषि चूना (डोलोमाइट)', kn: 'ಕೃಷಿ ಸುಣ್ಣ (ಡೊಲೊಮೈಟ್)' },
    perAcre: 400,
    unit: 'kg',
    timing: { en: 'After harvest, 3–4 weeks before next sowing', hi: 'कटाई के बाद, अगली बुवाई से 3–4 सप्ताह पहले', kn: 'ಕೊಯ್ಲಿನ ನಂತರ, ಮುಂದಿನ ಬಿತ್ತನೆಗೆ 3–4 ವಾರ ಮೊದಲು' },
    note: { en: 'Raises acidic pH towards neutral so nutrients become available.', hi: 'अम्लीय pH को उदासीन की ओर ले जाता है ताकि पोषक तत्व उपलब्ध हों।', kn: 'ಆಮ್ಲೀಯ pH ಅನ್ನು ತಟಸ್ಥದ ಕಡೆಗೆ ಏರಿಸಿ ಪೋಷಕಾಂಶಗಳು ಲಭ್ಯವಾಗುವಂತೆ ಮಾಡುತ್ತದೆ.' },
    costPerAcre: 1400,
  },
  {
    id: 'ph-gypsum',
    nutrient: 'pH',
    when: 'excess',
    product: { en: 'Gypsum + extra compost', hi: 'जिप्सम + अतिरिक्त कम्पोस्ट', kn: 'ಜಿಪ್ಸಮ್ + ಹೆಚ್ಚುವರಿ ಕಾಂಪೋಸ್ಟ್' },
    perAcre: 200,
    unit: 'kg',
    timing: { en: 'Before the next irrigation', hi: 'अगली सिंचाई से पहले', kn: 'ಮುಂದಿನ ನೀರಾವರಿಗೆ ಮೊದಲು' },
    note: { en: 'Helps alkaline black soils; organic matter slowly brings pH down.', hi: 'क्षारीय काली मिट्टी में मदद करता है; जैविक पदार्थ धीरे-धीरे pH घटाते हैं।', kn: 'ಕ್ಷಾರೀಯ ಕಪ್ಪು ಮಣ್ಣಿಗೆ ಸಹಾಯಕ; ಸಾವಯವ ಪದಾರ್ಥ ನಿಧಾನವಾಗಿ pH ಇಳಿಸುತ್ತದೆ.' },
    costPerAcre: 900,
  },
  {
    id: 'ec-leach',
    nutrient: 'EC',
    when: 'excess',
    product: { en: 'Well-rotted FYM + leaching irrigation', hi: 'सड़ी गोबर खाद + लवण धोने वाली सिंचाई', kn: 'ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ + ಲವಣ ತೊಳೆಯುವ ನೀರಾವರಿ' },
    perAcre: 2000,
    unit: 'kg',
    timing: { en: 'After harvest, before the next crop', hi: 'कटाई के बाद, अगली फसल से पहले', kn: 'ಕೊಯ್ಲಿನ ನಂತರ, ಮುಂದಿನ ಬೆಳೆಗೆ ಮೊದಲು' },
    note: {
      en: 'High salinity stresses roots. Give one heavy irrigation with good water to wash salts down, add FYM, and avoid chloride fertilisers (MOP).',
      hi: 'अधिक लवणता जड़ों पर दबाव डालती है। अच्छे पानी से एक भारी सिंचाई कर लवण नीचे धोएं, गोबर खाद डालें, और क्लोराइड उर्वरक (MOP) से बचें।',
      kn: 'ಹೆಚ್ಚು ಲವಣಾಂಶ ಬೇರುಗಳಿಗೆ ಒತ್ತಡ ನೀಡುತ್ತದೆ. ಉತ್ತಮ ನೀರಿನಿಂದ ಒಂದು ಭಾರೀ ನೀರಾವರಿ ಮಾಡಿ ಲವಣ ತೊಳೆಯಿರಿ, ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಹಾಕಿ, ಕ್ಲೋರೈಡ್ ಗೊಬ್ಬರ (MOP) ತಪ್ಪಿಸಿ.',
    },
    costPerAcre: 3000,
  },
  {
    id: 'oc-fym',
    nutrient: 'OC',
    when: 'deficient',
    product: { en: 'FYM + green manure (sunhemp / dhaincha)', hi: 'गोबर खाद + हरी खाद (सनई / ढैंचा)', kn: 'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ + ಹಸಿರೆಲೆ ಗೊಬ್ಬರ (ಸೆಣಬು / ಡಯಾಂಚ)' },
    perAcre: 4000,
    unit: 'kg',
    timing: { en: 'Green manure before next season; FYM at land preparation', hi: 'अगले मौसम से पहले हरी खाद; खेत तैयारी पर गोबर खाद', kn: 'ಮುಂದಿನ ಋತುವಿಗೆ ಮೊದಲು ಹಸಿರೆಲೆ ಗೊಬ್ಬರ; ಭೂಮಿ ಸಿದ್ಧತೆಯಲ್ಲಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ' },
    note: {
      en: 'Organic carbon below 0.5% means poor water holding and weak soil life. Target is above 0.75%.',
      hi: '0.5% से कम जैविक कार्बन का अर्थ है कम जल धारण और कमजोर मिट्टी जीवन। लक्ष्य 0.75% से अधिक है।',
      kn: '0.5%ಕ್ಕಿಂತ ಕಡಿಮೆ ಸಾವಯವ ಇಂಗಾಲ ಎಂದರೆ ಕಡಿಮೆ ನೀರು ಹಿಡಿದಿಡುವಿಕೆ ಮತ್ತು ದುರ್ಬಲ ಮಣ್ಣಿನ ಜೀವ. ಗುರಿ 0.75%ಕ್ಕಿಂತ ಹೆಚ್ಚು.',
    },
    costPerAcre: 4800,
  },
];
