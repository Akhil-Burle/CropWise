import type { WeatherCondition } from '@/types';
import type { L } from './localize';

export const HELPLINES: { id: string; name: L; number: string; hours: L; description: L; isDemo: boolean }[] = [
  {
    id: 'kcc',
    name: { en: 'Kisan Call Centre', hi: 'किसान कॉल सेंटर', kn: 'ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್' },
    number: '1800-180-1551',
    hours: { en: 'Every day, 6 AM – 10 PM', hi: 'प्रतिदिन, सुबह 6 – रात 10', kn: 'ಪ್ರತಿದಿನ, ಬೆಳಿಗ್ಗೆ 6 – ರಾತ್ರಿ 10' },
    description: {
      en: 'Free national helpline answered by agriculture experts in local languages.',
      hi: 'स्थानीय भाषाओं में कृषि विशेषज्ञों द्वारा उत्तर दी जाने वाली निःशुल्क राष्ट्रीय हेल्पलाइन।',
      kn: 'ಸ್ಥಳೀಯ ಭಾಷೆಗಳಲ್ಲಿ ಕೃಷಿ ತಜ್ಞರು ಉತ್ತರಿಸುವ ಉಚಿತ ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ.',
    },
    isDemo: false,
  },
  {
    id: 'kvk-kolar',
    name: { en: 'KVK Kolar (sample contact)', hi: 'KVK कोलार (नमूना संपर्क)', kn: 'KVK ಕೋಲಾರ (ಮಾದರಿ ಸಂಪರ್ಕ)' },
    number: '+91 00000 00000',
    hours: { en: 'Mon–Sat, 10 AM – 5 PM', hi: 'सोम–शनि, सुबह 10 – शाम 5', kn: 'ಸೋಮ–ಶನಿ, ಬೆಳಿಗ್ಗೆ 10 – ಸಂಜೆ 5' },
    description: {
      en: 'Placeholder for your district Krishi Vigyan Kendra. Replace with the real number for deployment.',
      hi: 'आपके जिला कृषि विज्ञान केंद्र के लिए स्थान। उपयोग से पहले असली नंबर डालें।',
      kn: 'ನಿಮ್ಮ ಜಿಲ್ಲಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರದ ಸ್ಥಾನ. ಬಳಕೆಗೆ ಮೊದಲು ನಿಜವಾದ ಸಂಖ್ಯೆ ಹಾಕಿ.',
    },
    isDemo: true,
  },
  {
    id: 'emergency',
    name: { en: 'Medical emergency (poisoning)', hi: 'चिकित्सा आपातकाल (विषाक्तता)', kn: 'ವೈದ್ಯಕೀಯ ತುರ್ತು (ವಿಷಬಾಧೆ)' },
    number: '108',
    hours: { en: '24 × 7', hi: '24 × 7', kn: '24 × 7' },
    description: {
      en: 'Ambulance. Take the pesticide label or pack to the hospital.',
      hi: 'एम्बुलेंस। कीटनाशक का लेबल या पैक अस्पताल ले जाएं।',
      kn: 'ಆಂಬ್ಯುಲೆನ್ಸ್. ಕೀಟನಾಶಕದ ಲೇಬಲ್ ಅಥವಾ ಪ್ಯಾಕ್ ಆಸ್ಪತ್ರೆಗೆ ಕೊಂಡೊಯ್ಯಿರಿ.',
    },
    isDemo: false,
  },
];

export interface ChatRule {
  keywords: string[];
  reply: L;
  suggestions: L[];
}

const S = {
  phi: { en: 'What is PHI?', hi: 'PHI क्या है?', kn: 'PHI ಎಂದರೇನು?' },
  nske: { en: 'How do I make neem spray?', hi: 'नीम स्प्रे कैसे बनाएं?', kn: 'ಬೇವಿನ ಸಿಂಪಡಣೆ ಹೇಗೆ ಮಾಡುವುದು?' },
  blight: { en: 'My tomato leaves have brown rings', hi: 'मेरे टमाटर की पत्तियों पर भूरे छल्ले हैं', kn: 'ನನ್ನ ಟೊಮೇಟೊ ಎಲೆಗಳಲ್ಲಿ ಕಂದು ಉಂಗುರಗಳಿವೆ' },
  organic: { en: 'How do I start organic farming?', hi: 'जैविक खेती कैसे शुरू करें?', kn: 'ಸಾವಯವ ಕೃಷಿ ಹೇಗೆ ಆರಂಭಿಸುವುದು?' },
  poison: { en: 'Someone feels dizzy after spraying', hi: 'छिड़काव के बाद किसी को चक्कर आ रहा है', kn: 'ಸಿಂಪಡಣೆಯ ನಂತರ ಯಾರಿಗೋ ತಲೆತಿರುಗುತ್ತಿದೆ' },
};

export const CHAT_SUGGESTIONS: L[] = [S.blight, S.phi, S.nske, S.organic];

export const CHAT_GREETING: L = {
  en: 'Namaskara! I am the CropWise demo assistant. I can explain your advisory, safety rules and organic methods. For a real diagnosis, please talk to your agriculture officer or call the Kisan Call Centre.',
  hi: 'नमस्ते! मैं CropWise डेमो सहायक हूं। मैं आपकी सलाह, सुरक्षा नियम और जैविक तरीके समझा सकता हूं। वास्तविक निदान के लिए कृषि अधिकारी से बात करें या किसान कॉल सेंटर पर कॉल करें।',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು CropWise ಡೆಮೊ ಸಹಾಯಕ. ನಿಮ್ಮ ಸಲಹೆ, ಸುರಕ್ಷತಾ ನಿಯಮ ಮತ್ತು ಸಾವಯವ ವಿಧಾನಗಳನ್ನು ವಿವರಿಸಬಲ್ಲೆ. ನಿಜವಾದ ರೋಗನಿರ್ಣಯಕ್ಕೆ ಕೃಷಿ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ ಅಥವಾ ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್‌ಗೆ ಕರೆ ಮಾಡಿ.',
};

export const CHAT_RULES: ChatRule[] = [
  {
    keywords: ['dizzy', 'poison', 'vomit', 'chakkar', 'चक्कर', 'जहर', 'ತಲೆತಿರುಗ', 'ವಿಷ'],
    reply: {
      en: 'This can be pesticide poisoning. Move the person to fresh air, remove soaked clothes, wash skin with soap and water, and call 108 now. Take the pesticide label to the hospital. Do not make them vomit.',
      hi: 'यह कीटनाशक विषाक्तता हो सकती है। व्यक्ति को ताजी हवा में ले जाएं, भीगे कपड़े उतारें, साबुन-पानी से त्वचा धोएं और अभी 108 पर कॉल करें। कीटनाशक का लेबल अस्पताल ले जाएं। उल्टी न कराएं।',
      kn: 'ಇದು ಕೀಟನಾಶಕ ವಿಷಬಾಧೆ ಆಗಿರಬಹುದು. ವ್ಯಕ್ತಿಯನ್ನು ತಾಜಾ ಗಾಳಿಗೆ ಕರೆದೊಯ್ಯಿರಿ, ನೆನೆದ ಬಟ್ಟೆ ತೆಗೆಯಿರಿ, ಸೋಪು-ನೀರಿನಿಂದ ಚರ್ಮ ತೊಳೆಯಿರಿ ಮತ್ತು ಈಗಲೇ 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ. ಕೀಟನಾಶಕದ ಲೇಬಲ್ ಆಸ್ಪತ್ರೆಗೆ ಕೊಂಡೊಯ್ಯಿರಿ. ವಾಂತಿ ಮಾಡಿಸಬೇಡಿ.',
    },
    suggestions: [S.phi],
  },
  {
    keywords: ['phi', 'harvest', 'कटाई', 'ಕೊಯ್ಲು'],
    reply: {
      en: 'PHI (pre-harvest interval) is the number of days you must wait after the last spray before harvesting. Your tracker shows a "safe to harvest" date for every spray you mark as done.',
      hi: 'PHI (कटाई पूर्व अंतराल) अंतिम छिड़काव के बाद कटाई से पहले प्रतीक्षा के दिन हैं। आपका ट्रैकर हर पूरे किए गए छिड़काव के लिए "कटाई सुरक्षित" तिथि दिखाता है।',
      kn: 'PHI (ಕೊಯ್ಲು ಪೂರ್ವ ಅಂತರ) ಎಂದರೆ ಕೊನೆಯ ಸಿಂಪಡಣೆಯ ನಂತರ ಕೊಯ್ಲಿಗೆ ಮೊದಲು ಕಾಯಬೇಕಾದ ದಿನಗಳು. ನಿಮ್ಮ ಟ್ರ್ಯಾಕರ್ ಪ್ರತಿ ಮುಗಿದ ಸಿಂಪಡಣೆಗೆ "ಕೊಯ್ಲು ಸುರಕ್ಷಿತ" ದಿನಾಂಕ ತೋರಿಸುತ್ತದೆ.',
    },
    suggestions: [S.nske, S.organic],
  },
  {
    keywords: ['neem', 'nske', 'नीम', 'ಬೇವು', 'ಬೇವಿನ'],
    reply: {
      en: 'For NSKE 5%: soak 5 kg pounded neem kernels in 10 L water overnight, squeeze, add 100 g soap, filter and make up to 100 L. Spray the same evening. The full recipe is in Learn → Guides.',
      hi: 'NSKE 5% के लिए: 5 किलो कुटी नीम गिरी 10 लीटर पानी में रात भर भिगोएं, निचोड़ें, 100 ग्राम साबुन मिलाएं, छानें और 100 लीटर बनाएं। उसी शाम छिड़कें। पूरी विधि सीखें → गाइड में है।',
      kn: 'NSKE 5% ಗೆ: 5 ಕೆಜಿ ಕುಟ್ಟಿದ ಬೇವಿನ ತಿರುಳನ್ನು 10 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ರಾತ್ರಿ ನೆನೆಸಿ, ಹಿಂಡಿ, 100 ಗ್ರಾಂ ಸೋಪು ಸೇರಿಸಿ, ಸೋಸಿ 100 ಲೀಟರ್ ಮಾಡಿ. ಅದೇ ಸಂಜೆ ಸಿಂಪಡಿಸಿ. ಪೂರ್ಣ ವಿಧಾನ ಕಲಿಯಿರಿ → ಮಾರ್ಗದರ್ಶಿಯಲ್ಲಿದೆ.',
    },
    suggestions: [S.phi, S.organic],
  },
  {
    keywords: ['blight', 'ring', 'spot', 'brown', 'धब्बे', 'छल्ले', 'ಚುಕ್ಕೆ', 'ಉಂಗುರ'],
    reply: {
      en: 'Brown spots with rings on lower tomato leaves are typical of early blight. Remove affected leaves, avoid wetting leaves, and start an analysis with a clear leaf photo so we can match a protocol. Please confirm with your agriculture officer before spraying.',
      hi: 'टमाटर की निचली पत्तियों पर छल्लेदार भूरे धब्बे अगेती अंगमारी के लक्षण हैं। प्रभावित पत्तियां हटाएं, पत्तियां गीली न करें, और पत्ती की साफ फोटो से विश्लेषण शुरू करें। छिड़काव से पहले कृषि अधिकारी से पुष्टि करें।',
      kn: 'ಟೊಮೇಟೊ ಕೆಳಗಿನ ಎಲೆಗಳಲ್ಲಿ ಉಂಗುರದ ಕಂದು ಚುಕ್ಕೆಗಳು ಆರಂಭಿಕ ಅಂಗಮಾರಿಯ ಲಕ್ಷಣ. ಬಾಧಿತ ಎಲೆ ತೆಗೆಯಿರಿ, ಎಲೆ ಒದ್ದೆ ಮಾಡಬೇಡಿ, ಸ್ಪಷ್ಟ ಎಲೆ ಚಿತ್ರದೊಂದಿಗೆ ವಿಶ್ಲೇಷಣೆ ಆರಂಭಿಸಿ. ಸಿಂಪಡಿಸುವ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ದೃಢಪಡಿಸಿ.',
    },
    suggestions: [S.nske, S.phi],
  },
  {
    keywords: ['organic', 'जैविक', 'ಸಾವಯವ', 'transition'],
    reply: {
      en: 'Start in phases: about a quarter of your sprays replaced by bio-inputs in Year 1, most in Year 2, and fully organic/IPM in Year 3. Open the Transition Hub to see the plan, costs and soil-carbon projection for your farm.',
      hi: 'चरणों में शुरू करें: वर्ष 1 में लगभग एक-चौथाई छिड़काव जैव-सामग्री से, वर्ष 2 में अधिकांश, और वर्ष 3 में पूर्ण जैविक/IPM। अपने खेत की योजना, लागत और कार्बन अनुमान के लिए परिवर्तन केंद्र खोलें।',
      kn: 'ಹಂತಗಳಲ್ಲಿ ಆರಂಭಿಸಿ: ವರ್ಷ 1 ರಲ್ಲಿ ಸುಮಾರು ಕಾಲು ಭಾಗ ಸಿಂಪಡಣೆ ಜೈವಿಕ ಸಾಮಗ್ರಿಯಿಂದ, ವರ್ಷ 2 ರಲ್ಲಿ ಹೆಚ್ಚಿನವು, ವರ್ಷ 3 ರಲ್ಲಿ ಪೂರ್ಣ ಸಾವಯವ/IPM. ನಿಮ್ಮ ಹೊಲದ ಯೋಜನೆ, ವೆಚ್ಚ ಮತ್ತು ಇಂಗಾಲ ಅಂದಾಜಿಗೆ ಪರಿವರ್ತನಾ ಕೇಂದ್ರ ತೆರೆಯಿರಿ.',
    },
    suggestions: [S.nske, S.blight],
  },
];

export const CHAT_FALLBACK: L = {
  en: 'I am a demo assistant with a small set of answers. Try asking about PHI, neem spray, tomato blight or organic transition – or call the Kisan Call Centre (1800-180-1551) to talk to an expert.',
  hi: 'मैं सीमित उत्तरों वाला डेमो सहायक हूं। PHI, नीम स्प्रे, टमाटर अंगमारी या जैविक परिवर्तन के बारे में पूछें – या विशेषज्ञ से बात करने के लिए किसान कॉल सेंटर (1800-180-1551) पर कॉल करें।',
  kn: 'ನಾನು ಸೀಮಿತ ಉತ್ತರಗಳ ಡೆಮೊ ಸಹಾಯಕ. PHI, ಬೇವಿನ ಸಿಂಪಡಣೆ, ಟೊಮೇಟೊ ಅಂಗಮಾರಿ ಅಥವಾ ಸಾವಯವ ಪರಿವರ್ತನೆ ಬಗ್ಗೆ ಕೇಳಿ – ಅಥವಾ ತಜ್ಞರೊಂದಿಗೆ ಮಾತನಾಡಲು ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ (1800-180-1551) ಗೆ ಕರೆ ಮಾಡಿ.',
};

export interface WeatherSpec {
  tempC: number;
  humidityPct: number;
  rainChancePct: number;
  windKph: number;
  condition: WeatherCondition;
  forecast: { condition: WeatherCondition; maxC: number; minC: number; rainChancePct: number }[];
}

export const WEATHER: Record<string, WeatherSpec> = {
  'farm-hosahalli': {
    tempC: 27,
    humidityPct: 64,
    rainChancePct: 15,
    windKph: 8,
    condition: 'partly_cloudy',
    forecast: [
      { condition: 'partly_cloudy', maxC: 29, minC: 19, rainChancePct: 15 },
      { condition: 'sunny', maxC: 30, minC: 19, rainChancePct: 5 },
      { condition: 'cloudy', maxC: 28, minC: 20, rainChancePct: 35 },
      { condition: 'rain', maxC: 25, minC: 19, rainChancePct: 70 },
      { condition: 'partly_cloudy', maxC: 27, minC: 18, rainChancePct: 20 },
    ],
  },
  'farm-belur': {
    tempC: 21,
    humidityPct: 89,
    rainChancePct: 72,
    windKph: 6,
    condition: 'rain',
    forecast: [
      { condition: 'rain', maxC: 23, minC: 17, rainChancePct: 72 },
      { condition: 'storm', maxC: 22, minC: 17, rainChancePct: 85 },
      { condition: 'cloudy', maxC: 24, minC: 17, rainChancePct: 45 },
      { condition: 'partly_cloudy', maxC: 25, minC: 16, rainChancePct: 25 },
      { condition: 'partly_cloudy', maxC: 26, minC: 16, rainChancePct: 20 },
    ],
  },
  'farm-byadgi': {
    tempC: 31,
    humidityPct: 48,
    rainChancePct: 5,
    windKph: 19,
    condition: 'sunny',
    forecast: [
      { condition: 'sunny', maxC: 33, minC: 21, rainChancePct: 5 },
      { condition: 'sunny', maxC: 33, minC: 22, rainChancePct: 5 },
      { condition: 'partly_cloudy', maxC: 32, minC: 21, rainChancePct: 10 },
      { condition: 'partly_cloudy', maxC: 31, minC: 21, rainChancePct: 15 },
      { condition: 'cloudy', maxC: 30, minC: 21, rainChancePct: 30 },
    ],
  },
};

/* ---------------- Agronomist / admin ---------------- */

const FIRST = ['Manjunath', 'Lakshmi', 'Basavaraj', 'Shivamma', 'Nagaraj', 'Geetha', 'Prakash', 'Savitri', 'Mahesh', 'Rekha', 'Venkatesh', 'Kamala', 'Siddappa', 'Asha', 'Hanumanthappa', 'Yashoda', 'Ravi', 'Parvathi', 'Chandrashekar', 'Sunitha', 'Krishnappa', 'Bhagya', 'Anand', 'Roopa'];
const LAST = ['Gowda', 'Patil', 'Naik', 'Reddy', 'Hegde', 'Shetty', 'Kumar', 'Rao'];
const PLACES: [string, string][] = [
  ['Hosahalli', 'Kolar'], ['Mulbagal', 'Kolar'], ['Srinivaspur', 'Kolar'], ['Belur', 'Hassan'], ['Arsikere', 'Hassan'],
  ['Byadgi', 'Haveri'], ['Ranebennur', 'Haveri'], ['Chintamani', 'Chikkaballapur'], ['Gauribidanur', 'Chikkaballapur'], ['Hiriyur', 'Chitradurga'],
];
const ADOPTION = ['mixed', 'chemical', 'organic', 'mixed', 'none', 'mixed', 'chemical', 'organic'] as const;

export const FARMERS = FIRST.map((first, i) => {
  const [village, district] = PLACES[i % PLACES.length];
  return {
    id: `farmer-${i + 1}`,
    name: `${first} ${LAST[i % LAST.length]}`,
    phone: `+91 9${String(845000000 + i * 7919).slice(0, 4)} ${String(10000 + i * 173).slice(0, 5)}`,
    village,
    district,
    state: 'Karnataka',
    farmCount: 1 + (i % 3),
    totalArea: Math.round((1.2 + ((i * 37) % 40) / 10) * 10) / 10,
    lastAnalysisDaysAgo: i % 6 === 5 ? null : (i * 3) % 40,
    adoption: ADOPTION[i % ADOPTION.length],
  };
});

export const ANALYTICS = {
  totals: { farmers: 1248, analyses: 3917, advisoriesSaved: 2604, organicAdoptionPct: 38 },
  byDisease: [
    { id: 'tomato_early_blight', count: 912 },
    { id: 'potato_late_blight', count: 684 },
    { id: 'chilli_leaf_curl', count: 541 },
    { id: 'tomato_septoria', count: 322 },
    { id: 'chilli_anthracnose', count: 297 },
    { id: 'chilli_healthy', count: 468 },
  ],
  byDistrict: [
    { district: 'Kolar', count: 1104 },
    { district: 'Chikkaballapur', count: 806 },
    { district: 'Hassan', count: 731 },
    { district: 'Haveri', count: 642 },
    { district: 'Chitradurga', count: 388 },
    { district: 'Tumakuru', count: 246 },
  ],
  adoption: [
    { key: 'chemical' as const, value: 31 },
    { key: 'mixed' as const, value: 41 },
    { key: 'organic' as const, value: 17 },
    { key: 'none' as const, value: 11 },
  ],
  monthly: [
    { month: { en: 'May', hi: 'मई', kn: 'ಮೇ' }, analyses: 402, organicActions: 118 },
    { month: { en: 'Jun', hi: 'जून', kn: 'ಜೂನ್' }, analyses: 516, organicActions: 171 },
    { month: { en: 'Jul', hi: 'जुला', kn: 'ಜುಲೈ' }, analyses: 688, organicActions: 240 },
    { month: { en: 'Aug', hi: 'अग', kn: 'ಆಗ' }, analyses: 741, organicActions: 296 },
    { month: { en: 'Sep', hi: 'सित', kn: 'ಸೆಪ್ಟೆಂ' }, analyses: 802, organicActions: 352 },
    { month: { en: 'Oct', hi: 'अक्टू', kn: 'ಅಕ್ಟೋ' }, analyses: 768, organicActions: 377 },
  ] as { month: L; analyses: number; organicActions: number }[],
};
