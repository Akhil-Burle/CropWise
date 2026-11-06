import type { PpeIcon, ToxicityClass } from '@/types';
import type { L } from './localize';

/* ---------------- Shared catalogues ---------------- */

export const PPE: Record<PpeIcon, L> = {
  gloves: { en: 'Nitrile gloves (not cloth)', hi: 'नाइट्राइल दस्ताने (कपड़े के नहीं)', kn: 'ನೈಟ್ರೈಲ್ ಕೈಗವಸು (ಬಟ್ಟೆಯದಲ್ಲ)' },
  mask: { en: 'Respirator mask (N95 or better)', hi: 'रेस्पिरेटर मास्क (N95 या बेहतर)', kn: 'ರೆಸ್ಪಿರೇಟರ್ ಮಾಸ್ಕ್ (N95 ಅಥವಾ ಉತ್ತಮ)' },
  goggles: { en: 'Splash goggles', hi: 'छींटा-रोधी चश्मा', kn: 'ಸಿಡಿತ ತಡೆ ಕನ್ನಡಕ' },
  coverall: { en: 'Full-sleeve coverall or apron', hi: 'पूरी बांह का कवरऑल या एप्रन', kn: 'ಪೂರ್ಣ ತೋಳಿನ ಕವರಾಲ್ ಅಥವಾ ಏಪ್ರನ್' },
  boots: { en: 'Rubber boots', hi: 'रबर के जूते', kn: 'ರಬ್ಬರ್ ಬೂಟು' },
  cap: { en: 'Head cover', hi: 'सिर ढकने का कपड़ा/टोपी', kn: 'ತಲೆ ಮುಚ್ಚುವ ಟೋಪಿ' },
};

export const TOXICITY: Record<ToxicityClass, { label: L; description: L }> = {
  red: {
    label: { en: 'Extremely toxic (red)', hi: 'अत्यंत विषैला (लाल)', kn: 'ಅತ್ಯಂತ ವಿಷಕಾರಿ (ಕೆಂಪು)' },
    description: { en: 'Red triangle. Highest hazard – handle only with full PPE and training.', hi: 'लाल त्रिकोण। सबसे अधिक खतरा – पूरे सुरक्षा उपकरण और प्रशिक्षण के साथ ही उपयोग करें।', kn: 'ಕೆಂಪು ತ್ರಿಕೋನ. ಅತಿ ಹೆಚ್ಚು ಅಪಾಯ – ಪೂರ್ಣ ರಕ್ಷಣಾ ಸಾಧನ ಮತ್ತು ತರಬೇತಿಯೊಂದಿಗೆ ಮಾತ್ರ ಬಳಸಿ.' },
  },
  yellow: {
    label: { en: 'Highly toxic (yellow)', hi: 'अधिक विषैला (पीला)', kn: 'ಹೆಚ್ಚು ವಿಷಕಾರಿ (ಹಳದಿ)' },
    description: { en: 'Yellow triangle. Serious harm if swallowed, inhaled or spilled on skin.', hi: 'पीला त्रिकोण। निगलने, सांस में जाने या त्वचा पर गिरने से गंभीर नुकसान।', kn: 'ಹಳದಿ ತ್ರಿಕೋನ. ನುಂಗಿದರೆ, ಉಸಿರಾಡಿದರೆ ಅಥವಾ ಚರ್ಮದ ಮೇಲೆ ಬಿದ್ದರೆ ಗಂಭೀರ ಹಾನಿ.' },
  },
  blue: {
    label: { en: 'Moderately toxic (blue)', hi: 'मध्यम विषैला (नीला)', kn: 'ಮಧ್ಯಮ ವಿಷಕಾರಿ (ನೀಲಿ)' },
    description: { en: 'Blue triangle. Harmful – always wear PPE and keep away from children and animals.', hi: 'नीला त्रिकोण। हानिकारक – हमेशा सुरक्षा उपकरण पहनें और बच्चों व पशुओं से दूर रखें।', kn: 'ನೀಲಿ ತ್ರಿಕೋನ. ಹಾನಿಕಾರಕ – ಯಾವಾಗಲೂ ರಕ್ಷಣಾ ಸಾಧನ ಧರಿಸಿ, ಮಕ್ಕಳು ಮತ್ತು ಪ್ರಾಣಿಗಳಿಂದ ದೂರವಿಡಿ.' },
  },
  green: {
    label: { en: 'Slightly toxic (green)', hi: 'कम विषैला (हरा)', kn: 'ಸ್ವಲ್ಪ ವಿಷಕಾರಿ (ಹಸಿರು)' },
    description: { en: 'Green triangle. Lowest hazard class – still a pesticide; PPE is still required.', hi: 'हरा त्रिकोण। सबसे कम खतरा – फिर भी कीटनाशक है; सुरक्षा उपकरण जरूरी हैं।', kn: 'ಹಸಿರು ತ್ರಿಕೋನ. ಕಡಿಮೆ ಅಪಾಯ – ಆದರೂ ಕೀಟನಾಶಕ; ರಕ್ಷಣಾ ಸಾಧನ ಅಗತ್ಯ.' },
  },
};

const COMMON_STORAGE: L[] = [
  {
    en: 'Keep in the original labelled container, locked, away from food, feed and children.',
    hi: 'मूल लेबल वाले डिब्बे में, ताले में, भोजन, चारे और बच्चों से दूर रखें।',
    kn: 'ಮೂಲ ಲೇಬಲ್ ಇರುವ ಡಬ್ಬದಲ್ಲಿ, ಬೀಗ ಹಾಕಿ, ಆಹಾರ, ಮೇವು ಮತ್ತು ಮಕ್ಕಳಿಂದ ದೂರ ಇಡಿ.',
  },
  { en: 'Store in a dry, shaded, ventilated place.', hi: 'सूखी, छायादार, हवादार जगह पर रखें।', kn: 'ಒಣ, ನೆರಳಿನ, ಗಾಳಿಯಾಡುವ ಸ್ಥಳದಲ್ಲಿ ಇಡಿ.' },
];

const COMMON_DISPOSAL: L[] = [
  {
    en: 'Triple-rinse the empty pack, pour rinse water into the spray tank, then puncture the pack.',
    hi: 'खाली पैक को तीन बार धोएं, धोवन स्प्रे टैंक में डालें, फिर पैक में छेद कर दें।',
    kn: 'ಖಾಲಿ ಪ್ಯಾಕ್ ಅನ್ನು ಮೂರು ಬಾರಿ ತೊಳೆಯಿರಿ, ತೊಳೆದ ನೀರನ್ನು ಸ್ಪ್ರೇ ಟ್ಯಾಂಕ್‌ಗೆ ಹಾಕಿ, ನಂತರ ಪ್ಯಾಕ್‌ಗೆ ತೂತು ಮಾಡಿ.',
  },
  {
    en: 'Never wash sprayers in ponds, wells or streams. Bury packs away from water sources or return them to the dealer.',
    hi: 'स्प्रेयर को तालाब, कुएं या नाले में कभी न धोएं। पैक को जल स्रोतों से दूर गाड़ें या डीलर को लौटाएं।',
    kn: 'ಸ್ಪ್ರೇಯರ್ ಅನ್ನು ಕೆರೆ, ಬಾವಿ ಅಥವಾ ಹಳ್ಳದಲ್ಲಿ ಎಂದಿಗೂ ತೊಳೆಯಬೇಡಿ. ಪ್ಯಾಕ್‌ಗಳನ್ನು ನೀರಿನ ಮೂಲಗಳಿಂದ ದೂರ ಹೂಳಿ ಅಥವಾ ಡೀಲರ್‌ಗೆ ಹಿಂತಿರುಗಿಸಿ.',
  },
];

const COMMON_FIRST_AID: L[] = [
  {
    en: 'Skin contact: remove soaked clothes and wash skin with soap and plenty of water for 15 minutes.',
    hi: 'त्वचा पर लगे: भीगे कपड़े उतारें और 15 मिनट तक साबुन व खूब पानी से धोएं।',
    kn: 'ಚರ್ಮಕ್ಕೆ ತಾಗಿದರೆ: ನೆನೆದ ಬಟ್ಟೆ ತೆಗೆದು 15 ನಿಮಿಷ ಸೋಪು ಮತ್ತು ಸಾಕಷ್ಟು ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ.',
  },
  {
    en: 'Eyes: rinse with clean running water for 15 minutes.',
    hi: 'आंखों में: 15 मिनट तक साफ बहते पानी से धोएं।',
    kn: 'ಕಣ್ಣಿಗೆ: 15 ನಿಮಿಷ ಶುದ್ಧ ಹರಿಯುವ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ.',
  },
  {
    en: 'Swallowed or dizzy: do not make the person vomit. Call 108 and take the product label to the doctor.',
    hi: 'निगल लिया या चक्कर: उल्टी न कराएं। 108 पर कॉल करें और उत्पाद का लेबल डॉक्टर के पास ले जाएं।',
    kn: 'ನುಂಗಿದರೆ ಅಥವಾ ತಲೆತಿರುಗಿದರೆ: ವಾಂತಿ ಮಾಡಿಸಬೇಡಿ. 108ಕ್ಕೆ ಕರೆ ಮಾಡಿ ಮತ್ತು ಉತ್ಪನ್ನದ ಲೇಬಲ್ ಅನ್ನು ವೈದ್ಯರ ಬಳಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಿ.',
  },
];

const COMMON_WARNINGS: L[] = [
  {
    en: 'Do not eat, drink, smoke or chew tobacco while mixing or spraying.',
    hi: 'मिलाते या छिड़कते समय खाना, पीना, धूम्रपान या तंबाकू न लें।',
    kn: 'ಮಿಶ್ರಣ ಮಾಡುವಾಗ ಅಥವಾ ಸಿಂಪಡಿಸುವಾಗ ತಿನ್ನಬೇಡಿ, ಕುಡಿಯಬೇಡಿ, ಧೂಮಪಾನ ಅಥವಾ ತಂಬಾಕು ಬೇಡ.',
  },
  {
    en: 'Spray with the wind at your back. Do not spray when wind is above 15 km/h or rain is expected within 6 hours.',
    hi: 'हवा पीठ की ओर रखकर छिड़कें। 15 किमी/घंटा से तेज हवा या 6 घंटे में बारिश की संभावना हो तो न छिड़कें।',
    kn: 'ಗಾಳಿ ಬೆನ್ನಿನ ಕಡೆ ಇರುವಂತೆ ಸಿಂಪಡಿಸಿ. ಗಾಳಿ 15 ಕಿಮೀ/ಗಂ ಮೀರಿದ್ದರೆ ಅಥವಾ 6 ಗಂಟೆಯಲ್ಲಿ ಮಳೆ ನಿರೀಕ್ಷಿತವಾಗಿದ್ದರೆ ಸಿಂಪಡಿಸಬೇಡಿ.',
  },
  {
    en: 'Keep children, pregnant women and animals out of the field until the re-entry time has passed.',
    hi: 'पुनः प्रवेश समय पूरा होने तक बच्चों, गर्भवती महिलाओं और पशुओं को खेत से दूर रखें।',
    kn: 'ಮರುಪ್ರವೇಶ ಸಮಯ ಮುಗಿಯುವವರೆಗೆ ಮಕ್ಕಳು, ಗರ್ಭಿಣಿಯರು ಮತ್ತು ಪ್ರಾಣಿಗಳನ್ನು ಹೊಲದಿಂದ ದೂರವಿಡಿ.',
  },
];

/* ---------------- Chemical protocols ---------------- */

export interface ChemicalSpec {
  productName: string | null;
  activeIngredient: L;
  formulation: string;
  /** Product per litre of spray solution. Dose per acre = concentration × water per acre. */
  concentration: { value: number; unit: 'g' | 'ml' };
  /** Water per acre at fruiting stage; scaled by growth stage. */
  waterLPerAcre: number;
  toxicity: ToxicityClass;
  phiDays: number;
  reentryHours: number;
  sprayTiming: L;
  maxApplications: number;
  intervalDays: number;
  ppe: PpeIcon[];
  extraWarnings: L[];
  rotationNote: L | null;
  /** INR per kg (or litre) of product. */
  productPricePerUnit: number;
  sprays: number;
}

export const CHEMICAL: Record<string, ChemicalSpec> = {
  tomato_early_blight: {
    productName: null,
    activeIngredient: { en: 'Mancozeb', hi: 'मैंकोज़ेब', kn: 'ಮ್ಯಾಂಕೋಜೆಬ್' },
    formulation: 'Mancozeb 75% WP',
    concentration: { value: 2, unit: 'g' },
    waterLPerAcre: 300,
    toxicity: 'blue',
    phiDays: 7,
    reentryHours: 24,
    sprayTiming: {
      en: 'Early morning (6–10 AM) or late evening, at first symptoms. Cover both sides of lower leaves.',
      hi: 'सुबह जल्दी (6–10 बजे) या शाम को, पहले लक्षण दिखते ही। निचली पत्तियों के दोनों ओर छिड़कें।',
      kn: 'ಬೆಳಿಗ್ಗೆ ಬೇಗ (6–10) ಅಥವಾ ಸಂಜೆ, ಮೊದಲ ಲಕ್ಷಣ ಕಂಡ ಕೂಡಲೇ. ಕೆಳಗಿನ ಎಲೆಗಳ ಎರಡೂ ಬದಿಗೆ ಸಿಂಪಡಿಸಿ.',
    },
    maxApplications: 3,
    intervalDays: 10,
    ppe: ['gloves', 'mask', 'goggles', 'coverall', 'boots', 'cap'],
    extraWarnings: [
      {
        en: 'Do not harvest fruit for sale or home use until the PHI has passed.',
        hi: 'PHI पूरा होने तक बिक्री या घर के लिए फल न तोड़ें।',
        kn: 'PHI ಮುಗಿಯುವವರೆಗೆ ಮಾರಾಟಕ್ಕೆ ಅಥವಾ ಮನೆ ಬಳಕೆಗೆ ಹಣ್ಣು ಕೀಳಬೇಡಿ.',
      },
    ],
    rotationNote: {
      en: 'Do not use the same fungicide group more than 3 times a season – alternate with a different mode of action to slow resistance.',
      hi: 'एक ही फफूंदनाशक समूह को मौसम में 3 बार से अधिक न उपयोग करें – प्रतिरोध धीमा करने के लिए अलग प्रकार के साथ बदलें।',
      kn: 'ಒಂದೇ ಶಿಲೀಂಧ್ರನಾಶಕ ಗುಂಪನ್ನು ಋತುವಿನಲ್ಲಿ 3 ಬಾರಿಗಿಂತ ಹೆಚ್ಚು ಬಳಸಬೇಡಿ – ಪ್ರತಿರೋಧ ತಡೆಯಲು ಬೇರೆ ಗುಂಪಿನೊಂದಿಗೆ ಬದಲಾಯಿಸಿ.',
    },
    productPricePerUnit: 480,
    sprays: 2,
  },
  tomato_septoria: {
    productName: null,
    activeIngredient: { en: 'Chlorothalonil', hi: 'क्लोरोथैलोनिल', kn: 'ಕ್ಲೋರೋಥಲೋನಿಲ್' },
    formulation: 'Chlorothalonil 75% WP',
    concentration: { value: 2, unit: 'g' },
    waterLPerAcre: 250,
    toxicity: 'blue',
    phiDays: 7,
    reentryHours: 24,
    sprayTiming: {
      en: 'Only after the diagnosis is confirmed. Early morning, covering lower leaves.',
      hi: 'निदान की पुष्टि के बाद ही। सुबह जल्दी, निचली पत्तियों पर।',
      kn: 'ರೋಗನಿರ್ಣಯ ದೃಢಪಟ್ಟ ನಂತರವೇ. ಬೆಳಿಗ್ಗೆ ಬೇಗ, ಕೆಳಗಿನ ಎಲೆಗಳ ಮೇಲೆ.',
    },
    maxApplications: 3,
    intervalDays: 10,
    ppe: ['gloves', 'mask', 'goggles', 'coverall', 'boots'],
    extraWarnings: [
      {
        en: 'Diagnosis confidence is low. Confirm with an agriculture officer before buying or spraying.',
        hi: 'निदान का विश्वास कम है। खरीदने या छिड़कने से पहले कृषि अधिकारी से पुष्टि करें।',
        kn: 'ರೋಗನಿರ್ಣಯ ವಿಶ್ವಾಸ ಕಡಿಮೆ ಇದೆ. ಖರೀದಿಸುವ ಅಥವಾ ಸಿಂಪಡಿಸುವ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ದೃಢಪಡಿಸಿ.',
      },
    ],
    rotationNote: null,
    productPricePerUnit: 720,
    sprays: 2,
  },
  potato_late_blight: {
    productName: null,
    activeIngredient: { en: 'Metalaxyl + Mancozeb', hi: 'मेटालैक्सिल + मैंकोज़ेब', kn: 'ಮೆಟಾಲಾಕ್ಸಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್' },
    formulation: 'Metalaxyl 8% + Mancozeb 64% WP',
    concentration: { value: 2.5, unit: 'g' },
    waterLPerAcre: 300,
    toxicity: 'yellow',
    phiDays: 7,
    reentryHours: 48,
    sprayTiming: {
      en: 'Immediately, in a dry window of at least 6 hours. Repeat after 10 days if cool, wet weather continues.',
      hi: 'तुरंत, कम से कम 6 घंटे के सूखे समय में। ठंडा-गीला मौसम जारी रहे तो 10 दिन बाद दोहराएं।',
      kn: 'ತಕ್ಷಣ, ಕನಿಷ್ಠ 6 ಗಂಟೆಗಳ ಒಣ ಸಮಯದಲ್ಲಿ. ತಂಪು-ತೇವದ ಹವಾಮಾನ ಮುಂದುವರಿದರೆ 10 ದಿನಗಳ ನಂತರ ಮತ್ತೆ ಸಿಂಪಡಿಸಿ.',
    },
    maxApplications: 2,
    intervalDays: 10,
    ppe: ['gloves', 'mask', 'goggles', 'coverall', 'boots', 'cap'],
    extraWarnings: [
      {
        en: 'Systemic fungicide: limit to 2 sprays per season and never as a preventive-only spray.',
        hi: 'अंतर्प्रवाही फफूंदनाशक: मौसम में अधिकतम 2 छिड़काव, केवल बचाव के लिए कभी नहीं।',
        kn: 'ಅಂತರ್ವ್ಯಾಪಿ ಶಿಲೀಂಧ್ರನಾಶಕ: ಋತುವಿಗೆ ಗರಿಷ್ಠ 2 ಸಿಂಪಡಣೆ, ಕೇವಲ ತಡೆಗಟ್ಟಲು ಎಂದಿಗೂ ಬೇಡ.',
      },
    ],
    rotationNote: {
      en: 'Alternate with a contact fungicide for any further sprays to avoid metalaxyl resistance.',
      hi: 'मेटालैक्सिल प्रतिरोध से बचने के लिए आगे के छिड़काव में संपर्क फफूंदनाशक से बदलें।',
      kn: 'ಮೆಟಾಲಾಕ್ಸಿಲ್ ಪ್ರತಿರೋಧ ತಪ್ಪಿಸಲು ಮುಂದಿನ ಸಿಂಪಡಣೆಗೆ ಸಂಪರ್ಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಿ.',
    },
    productPricePerUnit: 1150,
    sprays: 2,
  },
};

export const CHEMICAL_COMMON = {
  storage: COMMON_STORAGE,
  disposal: COMMON_DISPOSAL,
  firstAid: COMMON_FIRST_AID,
  warnings: COMMON_WARNINGS,
  compliance: {
    en: 'Use only products registered with CIB&RC for this crop and problem. Check the registration number and expiry date on the label before buying.',
    hi: 'केवल इस फसल और समस्या के लिए CIB&RC में पंजीकृत उत्पाद ही उपयोग करें। खरीदने से पहले लेबल पर पंजीकरण संख्या और समाप्ति तिथि देखें।',
    kn: 'ಈ ಬೆಳೆ ಮತ್ತು ಸಮಸ್ಯೆಗೆ CIB&RC ನಲ್ಲಿ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನಗಳನ್ನು ಮಾತ್ರ ಬಳಸಿ. ಖರೀದಿಸುವ ಮೊದಲು ಲೇಬಲ್‌ನಲ್ಲಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ ಮತ್ತು ಅವಧಿ ದಿನಾಂಕ ಪರಿಶೀಲಿಸಿ.',
  } as L,
};

/* ---------------- Organic & IPM protocols ---------------- */

export type AgentDosing =
  | { mode: 'foliar'; perL: number; unit: 'g' | 'ml' }
  | { mode: 'fixed'; perAcre: number; unit: 'kg' | 'g' | 'L' };

export interface AgentSpec {
  id: string;
  name: L;
  type: 'fungal' | 'bacterial' | 'botanical' | 'other';
  dosing: AgentDosing;
  method: L;
  timing: L;
  frequency: L;
}

export const AGENTS: Record<string, AgentSpec> = {
  trichoderma_soil: {
    id: 'trichoderma_soil',
    name: { en: 'Trichoderma viride 1% WP', hi: 'ट्राइकोडर्मा विरिडी 1% WP', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ 1% WP' },
    type: 'fungal',
    dosing: { mode: 'fixed', perAcre: 1, unit: 'kg' },
    method: {
      en: 'Mix into 50 kg well-rotted FYM or vermicompost, keep moist in shade for 7 days, then apply at the root zone.',
      hi: '50 किलो सड़ी गोबर खाद या केंचुआ खाद में मिलाएं, 7 दिन छाया में नम रखें, फिर जड़ों के पास डालें।',
      kn: '50 ಕೆಜಿ ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಅಥವಾ ಎರೆಹುಳು ಗೊಬ್ಬರದಲ್ಲಿ ಬೆರೆಸಿ, 7 ದಿನ ನೆರಳಿನಲ್ಲಿ ತೇವವಾಗಿಡಿ, ನಂತರ ಬೇರಿನ ಬಳಿ ಹಾಕಿ.',
    },
    timing: { en: 'Now, then at next earthing-up', hi: 'अभी, फिर अगली मिट्टी चढ़ाई पर', kn: 'ಈಗ, ನಂತರ ಮುಂದಿನ ಮಣ್ಣು ಏರಿಸುವಾಗ' },
    frequency: { en: 'Once every 30 days', hi: 'हर 30 दिन में एक बार', kn: 'ಪ್ರತಿ 30 ದಿನಕ್ಕೊಮ್ಮೆ' },
  },
  pseudomonas_foliar: {
    id: 'pseudomonas_foliar',
    name: { en: 'Pseudomonas fluorescens 1.5% WP', hi: 'स्यूडोमोनास फ्लोरेसेंस 1.5% WP', kn: 'ಸ್ಯೂಡೋಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ 1.5% WP' },
    type: 'bacterial',
    dosing: { mode: 'foliar', perL: 10, unit: 'g' },
    method: { en: 'Foliar spray covering both leaf surfaces', hi: 'पत्तियों के दोनों ओर छिड़काव', kn: 'ಎಲೆಯ ಎರಡೂ ಬದಿಗೆ ಸಿಂಪಡಣೆ' },
    timing: { en: 'Evening, after removing infected leaves', hi: 'शाम को, रोगी पत्तियां हटाने के बाद', kn: 'ಸಂಜೆ, ರೋಗಪೀಡಿತ ಎಲೆ ತೆಗೆದ ನಂತರ' },
    frequency: { en: 'Every 7–10 days, 3 times', hi: 'हर 7–10 दिन, 3 बार', kn: 'ಪ್ರತಿ 7–10 ದಿನ, 3 ಬಾರಿ' },
  },
  nske: {
    id: 'nske',
    name: { en: 'Neem seed kernel extract (NSKE) 5%', hi: 'नीम बीज गिरी अर्क (NSKE) 5%', kn: 'ಬೇವಿನ ಬೀಜ ತಿರುಳು ಸಾರ (NSKE) 5%' },
    type: 'botanical',
    dosing: { mode: 'foliar', perL: 50, unit: 'g' },
    method: {
      en: 'Home-made extract (see recipe). Quantity shown is neem kernel needed.',
      hi: 'घर पर बना अर्क (विधि देखें)। दिखाई गई मात्रा नीम गिरी की है।',
      kn: 'ಮನೆಯಲ್ಲಿ ತಯಾರಿಸಿದ ಸಾರ (ವಿಧಾನ ನೋಡಿ). ತೋರಿಸಿದ ಪ್ರಮಾಣ ಬೇವಿನ ತಿರುಳಿನದು.',
    },
    timing: { en: 'Late evening (neem breaks down in sunlight)', hi: 'देर शाम (धूप में नीम जल्दी नष्ट होता है)', kn: 'ತಡ ಸಂಜೆ (ಬಿಸಿಲಿನಲ್ಲಿ ಬೇವು ಬೇಗ ಹಾಳಾಗುತ್ತದೆ)' },
    frequency: { en: 'Every 10 days', hi: 'हर 10 दिन', kn: 'ಪ್ರತಿ 10 ದಿನ' },
  },
  azadirachtin: {
    id: 'azadirachtin',
    name: { en: 'Azadirachtin 0.15% EC (1500 ppm)', hi: 'एज़ाडिरेक्टिन 0.15% EC (1500 ppm)', kn: 'ಅಜಾಡಿರಾಕ್ಟಿನ್ 0.15% EC (1500 ppm)' },
    type: 'botanical',
    dosing: { mode: 'foliar', perL: 3, unit: 'ml' },
    method: { en: 'Ready-made neem formulation if NSKE cannot be prepared', hi: 'NSKE न बना सकें तो तैयार नीम उत्पाद', kn: 'NSKE ತಯಾರಿಸಲು ಆಗದಿದ್ದರೆ ಸಿದ್ಧ ಬೇವಿನ ಉತ್ಪನ್ನ' },
    timing: { en: 'Late evening', hi: 'देर शाम', kn: 'ತಡ ಸಂಜೆ' },
    frequency: { en: 'Every 10–12 days', hi: 'हर 10–12 दिन', kn: 'ಪ್ರತಿ 10–12 ದಿನ' },
  },
  beauveria: {
    id: 'beauveria',
    name: { en: 'Beauveria bassiana 1.15% WP', hi: 'ब्यूवेरिया बैसियाना 1.15% WP', kn: 'ಬ್ಯೂವೇರಿಯಾ ಬ್ಯಾಸಿಯಾನಾ 1.15% WP' },
    type: 'fungal',
    dosing: { mode: 'foliar', perL: 5, unit: 'g' },
    method: {
      en: 'Foliar spray against sucking pests (whitefly, thrips) and fruit borer larvae',
      hi: 'रस चूसने वाले कीट (सफेद मक्खी, थ्रिप्स) और फल छेदक के विरुद्ध छिड़काव',
      kn: 'ರಸ ಹೀರುವ ಕೀಟಗಳು (ಬಿಳಿನೊಣ, ಥ್ರಿಪ್ಸ್) ಮತ್ತು ಹಣ್ಣು ಕೊರಕದ ವಿರುದ್ಧ ಸಿಂಪಡಣೆ',
    },
    timing: { en: 'Evening, when humidity is higher', hi: 'शाम को, जब नमी अधिक हो', kn: 'ಸಂಜೆ, ತೇವಾಂಶ ಹೆಚ್ಚಿರುವಾಗ' },
    frequency: { en: 'Every 10 days during pest pressure', hi: 'कीट दबाव में हर 10 दिन', kn: 'ಕೀಟ ಒತ್ತಡದಲ್ಲಿ ಪ್ರತಿ 10 ದಿನ' },
  },
  bacillus: {
    id: 'bacillus',
    name: { en: 'Bacillus subtilis 1.5% WP', hi: 'बैसिलस सबटिलिस 1.5% WP', kn: 'ಬ್ಯಾಸಿಲಸ್ ಸಬ್ಟಿಲಿಸ್ 1.5% WP' },
    type: 'bacterial',
    dosing: { mode: 'foliar', perL: 10, unit: 'g' },
    method: { en: 'Protective foliar spray on healthy and lightly affected plants', hi: 'स्वस्थ और हल्के प्रभावित पौधों पर बचाव छिड़काव', kn: 'ಆರೋಗ್ಯಕರ ಮತ್ತು ಸ್ವಲ್ಪ ಬಾಧಿತ ಸಸ್ಯಗಳ ಮೇಲೆ ರಕ್ಷಣಾತ್ಮಕ ಸಿಂಪಡಣೆ' },
    timing: { en: 'Before forecast rain or fog', hi: 'बारिश या कोहरे के पूर्वानुमान से पहले', kn: 'ಮಳೆ ಅಥವಾ ಮಂಜಿನ ಮುನ್ಸೂಚನೆಗೆ ಮೊದಲು' },
    frequency: { en: 'Every 7 days in wet weather', hi: 'गीले मौसम में हर 7 दिन', kn: 'ತೇವದ ಹವಾಮಾನದಲ್ಲಿ ಪ್ರತಿ 7 ದಿನ' },
  },
};

export interface RecipeSpec {
  id: string;
  title: L;
  yields: L;
  prepTime: L;
  ingredients: { name: L; quantity: L }[];
  steps: L[];
  shelfLife: L;
  caution: L | null;
}

export const RECIPES: Record<string, RecipeSpec> = {
  nske: {
    id: 'nske',
    title: { en: 'Neem seed kernel extract (NSKE) 5%', hi: 'नीम बीज गिरी अर्क (NSKE) 5%', kn: 'ಬೇವಿನ ಬೀಜ ತಿರುಳು ಸಾರ (NSKE) 5%' },
    yields: { en: '100 litres (½ acre)', hi: '100 लीटर (½ एकड़)', kn: '100 ಲೀಟರ್ (½ ಎಕರೆ)' },
    prepTime: { en: 'Overnight soak + 30 min', hi: 'रात भर भिगोना + 30 मिनट', kn: 'ರಾತ್ರಿ ನೆನೆಸುವುದು + 30 ನಿಮಿಷ' },
    ingredients: [
      { name: { en: 'Dried neem seed kernels', hi: 'सूखी नीम बीज गिरी', kn: 'ಒಣ ಬೇವಿನ ಬೀಜ ತಿರುಳು' }, quantity: { en: '5 kg', hi: '5 किलो', kn: '5 ಕೆಜಿ' } },
      { name: { en: 'Clean water', hi: 'साफ पानी', kn: 'ಶುದ್ಧ ನೀರು' }, quantity: { en: '100 L', hi: '100 लीटर', kn: '100 ಲೀಟರ್' } },
      { name: { en: 'Khadi or bar soap (sticker)', hi: 'खादी/साधारण साबुन (चिपकाने हेतु)', kn: 'ಖಾದಿ ಅಥವಾ ಬಾರ್ ಸೋಪು (ಅಂಟಿಸಲು)' }, quantity: { en: '100 g', hi: '100 ग्राम', kn: '100 ಗ್ರಾಂ' } },
      { name: { en: 'Muslin cloth', hi: 'मलमल का कपड़ा', kn: 'ಮಸ್ಲಿನ್ ಬಟ್ಟೆ' }, quantity: { en: '1 piece', hi: '1 टुकड़ा', kn: '1 ತುಂಡು' } },
    ],
    steps: [
      { en: 'Pound the kernels gently into a coarse powder (do not make a paste).', hi: 'गिरी को हल्का कूटकर दरदरा पाउडर बनाएं (पेस्ट नहीं)।', kn: 'ತಿರುಳನ್ನು ಹಗುರವಾಗಿ ಕುಟ್ಟಿ ಒರಟು ಪುಡಿ ಮಾಡಿ (ಪೇಸ್ಟ್ ಬೇಡ).' },
      { en: 'Tie the powder in muslin cloth and soak overnight in 10 L of water.', hi: 'पाउडर को मलमल में बांधकर 10 लीटर पानी में रात भर भिगोएं।', kn: 'ಪುಡಿಯನ್ನು ಮಸ್ಲಿನ್ ಬಟ್ಟೆಯಲ್ಲಿ ಕಟ್ಟಿ 10 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ರಾತ್ರಿ ನೆನೆಸಿ.' },
      { en: 'In the morning, squeeze the bag repeatedly until the liquid turns milky brown.', hi: 'सुबह पोटली को बार-बार निचोड़ें जब तक घोल दूधिया भूरा न हो जाए।', kn: 'ಬೆಳಿಗ್ಗೆ ದ್ರವ ಹಾಲಿನಂತೆ ಕಂದು ಆಗುವವರೆಗೆ ಚೀಲವನ್ನು ಹಿಂಡಿ.' },
      { en: 'Dissolve the soap in a little warm water and add it.', hi: 'साबुन को थोड़े गुनगुने पानी में घोलकर मिलाएं।', kn: 'ಸೋಪನ್ನು ಸ್ವಲ್ಪ ಬೆಚ್ಚಗಿನ ನೀರಿನಲ್ಲಿ ಕರಗಿಸಿ ಸೇರಿಸಿ.' },
      { en: 'Filter and make up to 100 L with water. Spray the same evening.', hi: 'छानकर पानी से 100 लीटर करें। उसी शाम छिड़कें।', kn: 'ಸೋಸಿ ನೀರಿನಿಂದ 100 ಲೀಟರ್ ಮಾಡಿ. ಅದೇ ಸಂಜೆ ಸಿಂಪಡಿಸಿ.' },
    ],
    shelfLife: { en: 'Use within 12 hours', hi: '12 घंटे में उपयोग करें', kn: '12 ಗಂಟೆಯೊಳಗೆ ಬಳಸಿ' },
    caution: {
      en: 'Test on a few plants first; very strong extract can scorch tender leaves.',
      hi: 'पहले कुछ पौधों पर परखें; बहुत तेज अर्क कोमल पत्तियों को झुलसा सकता है।',
      kn: 'ಮೊದಲು ಕೆಲವು ಸಸ್ಯಗಳ ಮೇಲೆ ಪರೀಕ್ಷಿಸಿ; ತುಂಬಾ ಗಾಢ ಸಾರ ಎಳೆ ಎಲೆಗಳನ್ನು ಸುಡಬಹುದು.',
    },
  },
  trichoderma_fym: {
    id: 'trichoderma_fym',
    title: { en: 'Trichoderma-enriched FYM', hi: 'ट्राइकोडर्मा समृद्ध गोबर खाद', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ಸಮೃದ್ಧ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ' },
    yields: { en: '100 kg (enough for 1 acre)', hi: '100 किलो (1 एकड़ के लिए)', kn: '100 ಕೆಜಿ (1 ಎಕರೆಗೆ)' },
    prepTime: { en: '15 days', hi: '15 दिन', kn: '15 ದಿನ' },
    ingredients: [
      { name: { en: 'Trichoderma viride 1% WP', hi: 'ट्राइकोडर्मा विरिडी 1% WP', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ 1% WP' }, quantity: { en: '1 kg', hi: '1 किलो', kn: '1 ಕೆಜಿ' } },
      { name: { en: 'Well-rotted farmyard manure', hi: 'अच्छी सड़ी गोबर खाद', kn: 'ಚೆನ್ನಾಗಿ ಕೊಳೆತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ' }, quantity: { en: '100 kg', hi: '100 किलो', kn: '100 ಕೆಜಿ' } },
      { name: { en: 'Jaggery water (optional)', hi: 'गुड़ का पानी (वैकल्पिक)', kn: 'ಬೆಲ್ಲದ ನೀರು (ಐಚ್ಛಿಕ)' }, quantity: { en: '250 g in 5 L', hi: '5 लीटर में 250 ग्राम', kn: '5 ಲೀಟರ್‌ನಲ್ಲಿ 250 ಗ್ರಾಂ' } },
      { name: { en: 'Wet gunny bags', hi: 'गीले बोरे', kn: 'ಒದ್ದೆ ಗೋಣಿ ಚೀಲ' }, quantity: { en: '2–3', hi: '2–3', kn: '2–3' } },
    ],
    steps: [
      { en: 'Spread the FYM in a shaded spot and sprinkle water until it is moist but not dripping.', hi: 'गोबर खाद को छाया में फैलाएं और पानी छिड़कें – नम हो पर टपके नहीं।', kn: 'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರವನ್ನು ನೆರಳಿನಲ್ಲಿ ಹರಡಿ, ತೇವವಾಗುವಷ್ಟು ನೀರು ಚಿಮುಕಿಸಿ – ತೊಟ್ಟಿಕ್ಕಬಾರದು.' },
      { en: 'Mix the Trichoderma powder (and jaggery water) evenly through the heap.', hi: 'ट्राइकोडर्मा पाउडर (और गुड़ पानी) ढेर में समान रूप से मिलाएं।', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ಪುಡಿಯನ್ನು (ಮತ್ತು ಬೆಲ್ಲದ ನೀರು) ರಾಶಿಯಲ್ಲಿ ಸಮವಾಗಿ ಬೆರೆಸಿ.' },
      { en: 'Heap it up to about 1 metre and cover with wet gunny bags.', hi: 'लगभग 1 मीटर का ढेर बनाकर गीले बोरों से ढकें।', kn: 'ಸುಮಾರು 1 ಮೀಟರ್ ರಾಶಿ ಮಾಡಿ ಒದ್ದೆ ಗೋಣಿ ಚೀಲದಿಂದ ಮುಚ್ಚಿ.' },
      { en: 'Turn the heap every 5–7 days and keep it moist.', hi: 'हर 5–7 दिन में ढेर पलटें और नम रखें।', kn: 'ಪ್ರತಿ 5–7 ದಿನಕ್ಕೆ ರಾಶಿಯನ್ನು ತಿರುಗಿಸಿ ತೇವವಾಗಿಡಿ.' },
      { en: 'After about 15 days, when green-white fungal growth is visible, apply at the root zone.', hi: 'लगभग 15 दिन बाद, हरी-सफेद फफूंद दिखने पर, जड़ों के पास डालें।', kn: 'ಸುಮಾರು 15 ದಿನದ ನಂತರ ಹಸಿರು-ಬಿಳಿ ಶಿಲೀಂಧ್ರ ಕಂಡಾಗ ಬೇರಿನ ಬಳಿ ಹಾಕಿ.' },
    ],
    shelfLife: { en: 'Use within 30 days', hi: '30 दिन में उपयोग करें', kn: '30 ದಿನದೊಳಗೆ ಬಳಸಿ' },
    caution: {
      en: 'Do not mix with chemical fungicides; keep a 7-day gap after any fungicide spray.',
      hi: 'रासायनिक फफूंदनाशक के साथ न मिलाएं; किसी भी फफूंदनाशक छिड़काव के बाद 7 दिन का अंतर रखें।',
      kn: 'ರಾಸಾಯನಿಕ ಶಿಲೀಂಧ್ರನಾಶಕದೊಂದಿಗೆ ಬೆರೆಸಬೇಡಿ; ಯಾವುದೇ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಣೆಯ ನಂತರ 7 ದಿನ ಅಂತರವಿಡಿ.',
    },
  },
  bordeaux: {
    id: 'bordeaux',
    title: { en: 'Bordeaux mixture 1%', hi: 'बोर्डो मिश्रण 1%', kn: 'ಬೋರ್ಡೋ ಮಿಶ್ರಣ 1%' },
    yields: { en: '100 litres', hi: '100 लीटर', kn: '100 ಲೀಟರ್' },
    prepTime: { en: '30 minutes', hi: '30 मिनट', kn: '30 ನಿಮಿಷ' },
    ingredients: [
      { name: { en: 'Copper sulphate (blue crystals)', hi: 'नीला थोथा (कॉपर सल्फेट)', kn: 'ಮೈಲುತುತ್ತ (ಕಾಪರ್ ಸಲ್ಫೇಟ್)' }, quantity: { en: '1 kg', hi: '1 किलो', kn: '1 ಕೆಜಿ' } },
      { name: { en: 'Fresh lime (chuna)', hi: 'ताजा चूना', kn: 'ತಾಜಾ ಸುಣ್ಣ' }, quantity: { en: '1 kg', hi: '1 किलो', kn: '1 ಕೆಜಿ' } },
      { name: { en: 'Water', hi: 'पानी', kn: 'ನೀರು' }, quantity: { en: '100 L', hi: '100 लीटर', kn: '100 ಲೀಟರ್' } },
    ],
    steps: [
      { en: 'Dissolve copper sulphate in 50 L of water in a plastic or wooden container (never iron).', hi: 'नीला थोथा 50 लीटर पानी में प्लास्टिक या लकड़ी के बर्तन में घोलें (लोहे में कभी नहीं)।', kn: 'ಮೈಲುತುತ್ತವನ್ನು 50 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಪ್ಲಾಸ್ಟಿಕ್ ಅಥವಾ ಮರದ ಪಾತ್ರೆಯಲ್ಲಿ ಕರಗಿಸಿ (ಕಬ್ಬಿಣದಲ್ಲಿ ಎಂದಿಗೂ ಬೇಡ).' },
      { en: 'Dissolve lime in the other 50 L separately.', hi: 'चूने को बाकी 50 लीटर में अलग घोलें।', kn: 'ಸುಣ್ಣವನ್ನು ಉಳಿದ 50 ಲೀಟರ್‌ನಲ್ಲಿ ಪ್ರತ್ಯೇಕವಾಗಿ ಕರಗಿಸಿ.' },
      { en: 'Slowly pour the copper solution into the lime solution while stirring.', hi: 'हिलाते हुए धीरे-धीरे कॉपर घोल को चूने के घोल में डालें।', kn: 'ಕಲಕುತ್ತಾ ನಿಧಾನವಾಗಿ ಕಾಪರ್ ದ್ರಾವಣವನ್ನು ಸುಣ್ಣದ ದ್ರಾವಣಕ್ಕೆ ಸುರಿಯಿರಿ.' },
      { en: 'Dip a clean iron knife for 1 minute: if it turns reddish, add more lime.', hi: 'साफ लोहे का चाकू 1 मिनट डुबोएं: लाल हो तो और चूना डालें।', kn: 'ಸ್ವಚ್ಛ ಕಬ್ಬಿಣದ ಚಾಕುವನ್ನು 1 ನಿಮಿಷ ಮುಳುಗಿಸಿ: ಕೆಂಪಾದರೆ ಇನ್ನಷ್ಟು ಸುಣ್ಣ ಸೇರಿಸಿ.' },
      { en: 'Spray the same day.', hi: 'उसी दिन छिड़कें।', kn: 'ಅದೇ ದಿನ ಸಿಂಪಡಿಸಿ.' },
    ],
    shelfLife: { en: 'Same day only', hi: 'केवल उसी दिन', kn: 'ಅದೇ ದಿನ ಮಾತ್ರ' },
    caution: {
      en: 'Copper is allowed in organic farming only in limited amounts. Wear gloves and goggles – it irritates eyes and skin.',
      hi: 'जैविक खेती में कॉपर सीमित मात्रा में ही अनुमत है। दस्ताने और चश्मा पहनें – यह आंख और त्वचा में जलन करता है।',
      kn: 'ಸಾವಯವ ಕೃಷಿಯಲ್ಲಿ ತಾಮ್ರ ಸೀಮಿತ ಪ್ರಮಾಣದಲ್ಲಿ ಮಾತ್ರ ಅನುಮತಿ. ಕೈಗವಸು ಮತ್ತು ಕನ್ನಡಕ ಧರಿಸಿ – ಕಣ್ಣು ಮತ್ತು ಚರ್ಮಕ್ಕೆ ಉರಿ ಉಂಟುಮಾಡುತ್ತದೆ.',
    },
  },
  jeevamrut: {
    id: 'jeevamrut',
    title: { en: 'Jeevamrut (soil tonic)', hi: 'जीवामृत (मिट्टी टॉनिक)', kn: 'ಜೀವಾಮೃತ (ಮಣ್ಣಿನ ಟಾನಿಕ್)' },
    yields: { en: '200 litres (1 acre)', hi: '200 लीटर (1 एकड़)', kn: '200 ಲೀಟರ್ (1 ಎಕರೆ)' },
    prepTime: { en: '2–7 days fermentation', hi: '2–7 दिन किण्वन', kn: '2–7 ದಿನ ಹುದುಗುವಿಕೆ' },
    ingredients: [
      { name: { en: 'Fresh desi cow dung', hi: 'ताजा देसी गाय का गोबर', kn: 'ತಾಜಾ ದೇಸಿ ಹಸುವಿನ ಸಗಣಿ' }, quantity: { en: '10 kg', hi: '10 किलो', kn: '10 ಕೆಜಿ' } },
      { name: { en: 'Cow urine', hi: 'गोमूत्र', kn: 'ಗೋಮೂತ್ರ' }, quantity: { en: '5–10 L', hi: '5–10 लीटर', kn: '5–10 ಲೀಟರ್' } },
      { name: { en: 'Jaggery', hi: 'गुड़', kn: 'ಬೆಲ್ಲ' }, quantity: { en: '2 kg', hi: '2 किलो', kn: '2 ಕೆಜಿ' } },
      { name: { en: 'Pulse flour (besan)', hi: 'दाल का आटा (बेसन)', kn: 'ಬೇಳೆ ಹಿಟ್ಟು (ಕಡಲೆ ಹಿಟ್ಟು)' }, quantity: { en: '2 kg', hi: '2 किलो', kn: '2 ಕೆಜಿ' } },
      { name: { en: 'Handful of soil from the farm bund', hi: 'खेत की मेड़ की मुट्ठी भर मिट्टी', kn: 'ಹೊಲದ ಬದುವಿನ ಹಿಡಿ ಮಣ್ಣು' }, quantity: { en: '1 handful', hi: '1 मुट्ठी', kn: '1 ಹಿಡಿ' } },
      { name: { en: 'Water', hi: 'पानी', kn: 'ನೀರು' }, quantity: { en: '200 L', hi: '200 लीटर', kn: '200 ಲೀಟರ್' } },
    ],
    steps: [
      { en: 'Put water in a 200 L drum kept in shade.', hi: 'छाया में रखे 200 लीटर ड्रम में पानी डालें।', kn: 'ನೆರಳಿನಲ್ಲಿಟ್ಟ 200 ಲೀಟರ್ ಡ್ರಮ್‌ಗೆ ನೀರು ಹಾಕಿ.' },
      { en: 'Add dung, urine, jaggery, flour and soil; stir well with a stick.', hi: 'गोबर, गोमूत्र, गुड़, आटा और मिट्टी डालकर डंडे से अच्छी तरह मिलाएं।', kn: 'ಸಗಣಿ, ಗೋಮೂತ್ರ, ಬೆಲ್ಲ, ಹಿಟ್ಟು ಮತ್ತು ಮಣ್ಣು ಸೇರಿಸಿ ಕೋಲಿನಿಂದ ಚೆನ್ನಾಗಿ ಕಲಕಿ.' },
      { en: 'Cover with a jute bag. Stir clockwise for 2 minutes, twice a day.', hi: 'जूट के बोरे से ढकें। दिन में दो बार 2 मिनट घड़ी की दिशा में हिलाएं।', kn: 'ಸೆಣಬಿನ ಚೀಲದಿಂದ ಮುಚ್ಚಿ. ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ 2 ನಿಮಿಷ ಗಡಿಯಾರದ ದಿಕ್ಕಿನಲ್ಲಿ ಕಲಕಿ.' },
      { en: 'Ready in 48 hours in summer, up to 7 days in winter.', hi: 'गर्मी में 48 घंटे में, सर्दी में 7 दिन तक में तैयार।', kn: 'ಬೇಸಿಗೆಯಲ್ಲಿ 48 ಗಂಟೆಯಲ್ಲಿ, ಚಳಿಗಾಲದಲ್ಲಿ 7 ದಿನದವರೆಗೆ ಸಿದ್ಧ.' },
      { en: 'Apply 200 L per acre with irrigation water every 15 days.', hi: 'हर 15 दिन सिंचाई के पानी के साथ 200 लीटर प्रति एकड़ दें।', kn: 'ಪ್ರತಿ 15 ದಿನಕ್ಕೆ ನೀರಾವರಿ ನೀರಿನೊಂದಿಗೆ ಎಕರೆಗೆ 200 ಲೀಟರ್ ನೀಡಿ.' },
    ],
    shelfLife: { en: 'Use within 7 days of being ready', hi: 'तैयार होने के 7 दिन में उपयोग करें', kn: 'ಸಿದ್ಧವಾದ 7 ದಿನದೊಳಗೆ ಬಳಸಿ' },
    caution: null,
  },
};

export interface OrganicSpec {
  agentIds: string[];
  effectiveness: { relativePct: number; onsetDays: number; note: L };
  recipeIds: string[];
  traps: { name: L; detail: L; perAcre: number | null; unit: string }[];
  companions: { name: L; benefit: L }[];
  cultural: L[];
  /** INR per acre for one season of the organic programme (inputs + extra labour). */
  costLines: { label: L; perAcre: number }[];
}

const YELLOW_TRAPS = {
  name: { en: 'Yellow sticky traps', hi: 'पीले चिपचिपे ट्रैप', kn: 'ಹಳದಿ ಅಂಟು ಬಲೆ' },
  detail: { en: 'For whitefly and aphids. Hang just above the canopy.', hi: 'सफेद मक्खी और माहू के लिए। फसल के ठीक ऊपर टांगें।', kn: 'ಬಿಳಿನೊಣ ಮತ್ತು ಹೇನಿಗಾಗಿ. ಬೆಳೆಯ ಸ್ವಲ್ಪ ಮೇಲೆ ತೂಗುಹಾಕಿ.' },
  perAcre: 10,
  unit: 'traps',
};

const LABOUR: L = { en: 'Extra labour for preparation & spraying', hi: 'तैयारी व छिड़काव का अतिरिक्त श्रम', kn: 'ತಯಾರಿ ಮತ್ತು ಸಿಂಪಡಣೆಗೆ ಹೆಚ್ಚುವರಿ ಕೂಲಿ' };

export const ORGANIC: Record<string, OrganicSpec> = {
  tomato_early_blight: {
    agentIds: ['trichoderma_soil', 'pseudomonas_foliar', 'nske', 'beauveria'],
    effectiveness: {
      relativePct: 65,
      onsetDays: 7,
      note: {
        en: 'Slower and preventive. Works best when started early and repeated every 7–10 days. It will not rescue a badly infected crop on its own.',
        hi: 'धीमा और बचावात्मक। जल्दी शुरू करने और हर 7–10 दिन दोहराने पर सबसे अच्छा काम करता है। अकेले बहुत बीमार फसल को नहीं बचा पाएगा।',
        kn: 'ನಿಧಾನ ಮತ್ತು ತಡೆಗಟ್ಟುವ ವಿಧಾನ. ಬೇಗ ಆರಂಭಿಸಿ ಪ್ರತಿ 7–10 ದಿನ ಪುನರಾವರ್ತಿಸಿದರೆ ಉತ್ತಮ. ತೀವ್ರ ಸೋಂಕಿನ ಬೆಳೆಯನ್ನು ಒಂಟಿಯಾಗಿ ಉಳಿಸಲಾರದು.',
      },
    },
    recipeIds: ['nske', 'trichoderma_fym'],
    traps: [
      YELLOW_TRAPS,
      {
        name: { en: 'Helicoverpa pheromone traps', hi: 'हेलिकोवर्पा फेरोमोन ट्रैप', kn: 'ಹೆಲಿಕೋವರ್ಪಾ ಫೆರೋಮೋನ್ ಬಲೆ' },
        detail: { en: 'Monitors fruit borer moths; change the lure every 3 weeks.', hi: 'फल छेदक पतंगों की निगरानी; हर 3 सप्ताह में ल्यूर बदलें।', kn: 'ಹಣ್ಣು ಕೊರಕ ಪತಂಗಗಳ ಮೇಲ್ವಿಚಾರಣೆ; ಪ್ರತಿ 3 ವಾರಕ್ಕೆ ಲ್ಯೂರ್ ಬದಲಿಸಿ.' },
        perAcre: 5,
        unit: 'traps',
      },
    ],
    companions: [
      {
        name: { en: 'African marigold border', hi: 'गेंदा की किनारे की पंक्ति', kn: 'ಚೆಂಡು ಹೂವಿನ ಅಂಚಿನ ಸಾಲು' },
        benefit: { en: 'Trap crop for fruit borer and reduces root-knot nematodes. One row for every 16 tomato rows.', hi: 'फल छेदक के लिए ट्रैप फसल और जड़-गांठ सूत्रकृमि घटाता है। हर 16 पंक्ति टमाटर पर 1 पंक्ति।', kn: 'ಹಣ್ಣು ಕೊರಕಕ್ಕೆ ಬಲೆ ಬೆಳೆ ಮತ್ತು ಬೇರು ಗಂಟು ಜಂತುಹುಳು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ. ಪ್ರತಿ 16 ಟೊಮೇಟೊ ಸಾಲಿಗೆ 1 ಸಾಲು.' },
      },
      {
        name: { en: 'Cowpea or coriander inter-rows', hi: 'लोबिया या धनिया की अंतर-पंक्तियां', kn: 'ಅಲಸಂದೆ ಅಥವಾ ಕೊತ್ತಂಬರಿ ಅಂತರ ಸಾಲು' },
        benefit: { en: 'Attracts ladybird beetles and other natural enemies; cowpea also adds nitrogen.', hi: 'लेडीबर्ड और अन्य मित्र कीटों को आकर्षित करता है; लोबिया नाइट्रोजन भी देता है।', kn: 'ಗುಲಗಂಜಿ ಹುಳು ಮತ್ತು ಇತರ ಮಿತ್ರ ಕೀಟಗಳನ್ನು ಆಕರ್ಷಿಸುತ್ತದೆ; ಅಲಸಂದೆ ಸಾರಜನಕವನ್ನೂ ನೀಡುತ್ತದೆ.' },
      },
    ],
    cultural: [
      { en: 'Pick off spotted lower leaves and bury or burn them away from the field.', hi: 'धब्बेदार निचली पत्तियां तोड़कर खेत से दूर गाड़ दें या जला दें।', kn: 'ಚುಕ್ಕೆಗಳಿರುವ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ಹೊಲದಿಂದ ದೂರ ಹೂಳಿ ಅಥವಾ ಸುಡಿ.' },
      { en: 'Mulch with straw so soil does not splash onto leaves.', hi: 'पुआल की पलवार करें ताकि मिट्टी पत्तियों पर न उछले।', kn: 'ಹುಲ್ಲಿನ ಹೊದಿಕೆ ಹಾಕಿ, ಮಣ್ಣು ಎಲೆಗಳ ಮೇಲೆ ಸಿಡಿಯದಂತೆ.' },
      { en: 'Water at the base (drip if possible), not over the leaves.', hi: 'पत्तियों पर नहीं, जड़ के पास पानी दें (संभव हो तो ड्रिप)।', kn: 'ಎಲೆಗಳ ಮೇಲೆ ಅಲ್ಲ, ಬುಡಕ್ಕೆ ನೀರು ಹಾಕಿ (ಸಾಧ್ಯವಾದರೆ ಹನಿ ನೀರಾವರಿ).' },
      { en: 'Stake plants for airflow; do not grow tomato, potato or brinjal here next season.', hi: 'हवा के लिए पौधों को सहारा दें; अगले मौसम यहां टमाटर, आलू या बैंगन न लगाएं।', kn: 'ಗಾಳಿಯಾಡಲು ಸಸ್ಯಗಳಿಗೆ ಕೋಲು ಕೊಡಿ; ಮುಂದಿನ ಋತುವಿನಲ್ಲಿ ಇಲ್ಲಿ ಟೊಮೇಟೊ, ಆಲೂಗಡ್ಡೆ ಅಥವಾ ಬದನೆ ಬೆಳೆಯಬೇಡಿ.' },
    ],
    costLines: [
      { label: { en: 'Bio-agents (Trichoderma, Pseudomonas, Beauveria)', hi: 'जैव-एजेंट (ट्राइकोडर्मा, स्यूडोमोनास, ब्यूवेरिया)', kn: 'ಜೈವಿಕ ಏಜೆಂಟ್‌ಗಳು (ಟ್ರೈಕೋಡರ್ಮಾ, ಸ್ಯೂಡೋಮೊನಾಸ್, ಬ್ಯೂವೇರಿಯಾ)' }, perAcre: 950 },
      { label: { en: 'Neem kernels & soap for NSKE', hi: 'NSKE हेतु नीम गिरी व साबुन', kn: 'NSKE ಗಾಗಿ ಬೇವಿನ ತಿರುಳು ಮತ್ತು ಸೋಪು' }, perAcre: 420 },
      { label: { en: 'Sticky & pheromone traps', hi: 'चिपचिपे व फेरोमोन ट्रैप', kn: 'ಅಂಟು ಮತ್ತು ಫೆರೋಮೋನ್ ಬಲೆಗಳು' }, perAcre: 380 },
      { label: LABOUR, perAcre: 900 },
    ],
  },
  tomato_septoria: {
    agentIds: ['pseudomonas_foliar', 'bacillus', 'trichoderma_soil'],
    effectiveness: {
      relativePct: 60,
      onsetDays: 7,
      note: {
        en: 'Safe to start while the diagnosis is being confirmed. Preventive – protects new leaves rather than curing spotted ones.',
        hi: 'निदान की पुष्टि होने तक शुरू करना सुरक्षित है। बचावात्मक – धब्बेदार पत्तियों को ठीक करने के बजाय नई पत्तियों को बचाता है।',
        kn: 'ರೋಗನಿರ್ಣಯ ದೃಢಪಡುವವರೆಗೆ ಆರಂಭಿಸಲು ಸುರಕ್ಷಿತ. ತಡೆಗಟ್ಟುವ ವಿಧಾನ – ಚುಕ್ಕೆ ಎಲೆಗಳನ್ನು ಗುಣಪಡಿಸುವ ಬದಲು ಹೊಸ ಎಲೆಗಳನ್ನು ರಕ್ಷಿಸುತ್ತದೆ.',
      },
    },
    recipeIds: ['trichoderma_fym'],
    traps: [YELLOW_TRAPS],
    companions: [
      {
        name: { en: 'African marigold border', hi: 'गेंदा की किनारे की पंक्ति', kn: 'ಚೆಂಡು ಹೂವಿನ ಅಂಚಿನ ಸಾಲು' },
        benefit: { en: 'Trap crop and natural-enemy refuge.', hi: 'ट्रैप फसल और मित्र कीटों का आश्रय।', kn: 'ಬಲೆ ಬೆಳೆ ಮತ್ತು ಮಿತ್ರ ಕೀಟಗಳ ಆಶ್ರಯ.' },
      },
    ],
    cultural: [
      { en: 'Retake a clear photo of one affected leaf in daylight to confirm the problem.', hi: 'समस्या की पुष्टि के लिए दिन के उजाले में एक प्रभावित पत्ती की साफ फोटो फिर लें।', kn: 'ಸಮಸ್ಯೆ ದೃಢಪಡಿಸಲು ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ ಒಂದು ಬಾಧಿತ ಎಲೆಯ ಸ್ಪಷ್ಟ ಚಿತ್ರ ಮತ್ತೆ ತೆಗೆಯಿರಿ.' },
      { en: 'Remove spotted lower leaves and avoid working in the field when leaves are wet.', hi: 'धब्बेदार निचली पत्तियां हटाएं और पत्तियां गीली हों तब खेत में काम न करें।', kn: 'ಚುಕ್ಕೆ ಎಲೆಗಳನ್ನು ತೆಗೆಯಿರಿ ಮತ್ತು ಎಲೆಗಳು ಒದ್ದೆಯಾಗಿರುವಾಗ ಹೊಲದಲ್ಲಿ ಕೆಲಸ ಮಾಡಬೇಡಿ.' },
    ],
    costLines: [
      { label: { en: 'Bio-agents', hi: 'जैव-एजेंट', kn: 'ಜೈವಿಕ ಏಜೆಂಟ್‌ಗಳು' }, perAcre: 820 },
      { label: { en: 'Sticky traps', hi: 'चिपचिपे ट्रैप', kn: 'ಅಂಟು ಬಲೆಗಳು' }, perAcre: 200 },
      { label: LABOUR, perAcre: 700 },
    ],
  },
  potato_late_blight: {
    agentIds: ['bacillus', 'pseudomonas_foliar', 'trichoderma_soil'],
    effectiveness: {
      relativePct: 45,
      onsetDays: 5,
      note: {
        en: 'Late blight spreads very fast in cool, wet weather. Organic sprays can slow it but rarely stop an outbreak. If more than 1 in 10 plants are affected, talk to your agriculture officer before relying on organic options alone.',
        hi: 'ठंडे, गीले मौसम में पछेती अंगमारी बहुत तेजी से फैलती है। जैविक छिड़काव इसे धीमा कर सकते हैं पर प्रकोप को कम ही रोकते हैं। 10 में से 1 से अधिक पौधे प्रभावित हों तो केवल जैविक पर निर्भर होने से पहले कृषि अधिकारी से बात करें।',
        kn: 'ತಂಪು, ತೇವದ ಹವಾಮಾನದಲ್ಲಿ ಅಂಗಮಾರಿ ಅತಿ ವೇಗವಾಗಿ ಹರಡುತ್ತದೆ. ಸಾವಯವ ಸಿಂಪಡಣೆ ನಿಧಾನಗೊಳಿಸಬಹುದು, ಆದರೆ ಹರಡುವಿಕೆಯನ್ನು ವಿರಳವಾಗಿ ನಿಲ್ಲಿಸುತ್ತದೆ. 10ರಲ್ಲಿ 1ಕ್ಕಿಂತ ಹೆಚ್ಚು ಸಸ್ಯಗಳು ಬಾಧಿತವಾಗಿದ್ದರೆ, ಸಾವಯವ ಆಯ್ಕೆಯನ್ನೇ ಅವಲಂಬಿಸುವ ಮೊದಲು ಕೃಷಿ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ.',
      },
    },
    recipeIds: ['bordeaux', 'trichoderma_fym'],
    traps: [],
    companions: [],
    cultural: [
      { en: 'Pull out and destroy badly affected plants immediately; do not leave them in the field.', hi: 'बहुत प्रभावित पौधों को तुरंत उखाड़कर नष्ट करें; खेत में न छोड़ें।', kn: 'ತೀವ್ರ ಬಾಧಿತ ಸಸ್ಯಗಳನ್ನು ತಕ್ಷಣ ಕಿತ್ತು ನಾಶ ಮಾಡಿ; ಹೊಲದಲ್ಲಿ ಬಿಡಬೇಡಿ.' },
      { en: 'Earth up the rows well so spores cannot wash down to the tubers.', hi: 'मेड़ों पर अच्छी मिट्टी चढ़ाएं ताकि बीजाणु कंदों तक न पहुंचें।', kn: 'ಸಾಲುಗಳಿಗೆ ಚೆನ್ನಾಗಿ ಮಣ್ಣು ಏರಿಸಿ, ಬೀಜಕಗಳು ಗೆಡ್ಡೆಗಳಿಗೆ ತಲುಪದಂತೆ.' },
      { en: 'Stop sprinkler irrigation; water in the morning only.', hi: 'स्प्रिंकलर सिंचाई बंद करें; केवल सुबह पानी दें।', kn: 'ಸ್ಪ್ರಿಂಕ್ಲರ್ ನೀರಾವರಿ ನಿಲ್ಲಿಸಿ; ಬೆಳಿಗ್ಗೆ ಮಾತ್ರ ನೀರು ಹಾಕಿ.' },
      { en: 'Cut and remove haulms 10–15 days before harvest; use certified disease-free seed next season.', hi: 'खुदाई से 10–15 दिन पहले डंठल काटकर हटाएं; अगले मौसम प्रमाणित रोगमुक्त बीज लें।', kn: 'ಕೊಯ್ಲಿಗೆ 10–15 ದಿನ ಮೊದಲು ಕಾಂಡಗಳನ್ನು ಕತ್ತರಿಸಿ ತೆಗೆಯಿರಿ; ಮುಂದಿನ ಋತುವಿಗೆ ಪ್ರಮಾಣಿತ ರೋಗಮುಕ್ತ ಬೀಜ ಬಳಸಿ.' },
    ],
    costLines: [
      { label: { en: 'Bio-agents (Bacillus, Pseudomonas, Trichoderma)', hi: 'जैव-एजेंट (बैसिलस, स्यूडोमोनास, ट्राइकोडर्मा)', kn: 'ಜೈವಿಕ ಏಜೆಂಟ್‌ಗಳು (ಬ್ಯಾಸಿಲಸ್, ಸ್ಯೂಡೋಮೊನಾಸ್, ಟ್ರೈಕೋಡರ್ಮಾ)' }, perAcre: 1100 },
      { label: { en: 'Copper sulphate & lime (Bordeaux)', hi: 'नीला थोथा व चूना (बोर्डो)', kn: 'ಮೈಲುತುತ್ತ ಮತ್ತು ಸುಣ್ಣ (ಬೋರ್ಡೋ)' }, perAcre: 520 },
      { label: LABOUR, perAcre: 1000 },
    ],
  },
  chilli_healthy: {
    agentIds: ['trichoderma_soil', 'beauveria', 'azadirachtin'],
    effectiveness: {
      relativePct: 80,
      onsetDays: 0,
      note: {
        en: 'No spray is needed for disease right now. These preventive steps keep pests below damaging levels and build soil health.',
        hi: 'अभी रोग के लिए किसी छिड़काव की जरूरत नहीं। ये बचाव कदम कीटों को नुकसान स्तर से नीचे रखते हैं और मिट्टी का स्वास्थ्य बढ़ाते हैं।',
        kn: 'ಈಗ ರೋಗಕ್ಕಾಗಿ ಯಾವುದೇ ಸಿಂಪಡಣೆ ಬೇಕಿಲ್ಲ. ಈ ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು ಕೀಟಗಳನ್ನು ಹಾನಿ ಮಟ್ಟಕ್ಕಿಂತ ಕೆಳಗಿಡುತ್ತವೆ ಮತ್ತು ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಹೆಚ್ಚಿಸುತ್ತವೆ.',
      },
    },
    recipeIds: ['jeevamrut', 'nske'],
    traps: [
      {
        name: { en: 'Blue sticky traps', hi: 'नीले चिपचिपे ट्रैप', kn: 'ನೀಲಿ ಅಂಟು ಬಲೆ' },
        detail: { en: 'For thrips – the main early-season pest in chilli.', hi: 'थ्रिप्स के लिए – मिर्च में शुरुआती मौसम का मुख्य कीट।', kn: 'ಥ್ರಿಪ್ಸ್‌ಗಾಗಿ – ಮೆಣಸಿನಲ್ಲಿ ಆರಂಭಿಕ ಋತುವಿನ ಮುಖ್ಯ ಕೀಟ.' },
        perAcre: 10,
        unit: 'traps',
      },
      YELLOW_TRAPS,
    ],
    companions: [
      {
        name: { en: 'Maize border (2 rows)', hi: 'मक्का की किनारे की पंक्ति (2 पंक्ति)', kn: 'ಮೆಕ್ಕೆಜೋಳದ ಅಂಚಿನ ಸಾಲು (2 ಸಾಲು)' },
        benefit: { en: 'Barrier that reduces whitefly and thrips entering the field (they carry leaf curl virus).', hi: 'बाधा जो खेत में सफेद मक्खी और थ्रिप्स का प्रवेश घटाती है (ये पत्ती मरोड़ वायरस फैलाते हैं)।', kn: 'ಬಿಳಿನೊಣ ಮತ್ತು ಥ್ರಿಪ್ಸ್ ಹೊಲಕ್ಕೆ ಬರುವುದನ್ನು ಕಡಿಮೆ ಮಾಡುವ ತಡೆ (ಇವು ಎಲೆ ಮುರುಟು ವೈರಸ್ ಹರಡುತ್ತವೆ).' },
      },
      {
        name: { en: 'Marigold', hi: 'गेंदा', kn: 'ಚೆಂಡು ಹೂವು' },
        benefit: { en: 'Trap crop for fruit borer and refuge for natural enemies.', hi: 'फल छेदक के लिए ट्रैप फसल और मित्र कीटों का आश्रय।', kn: 'ಹಣ್ಣು ಕೊರಕಕ್ಕೆ ಬಲೆ ಬೆಳೆ ಮತ್ತು ಮಿತ್ರ ಕೀಟಗಳ ಆಶ್ರಯ.' },
      },
    ],
    cultural: [
      { en: 'Check 20 plants across the field twice a week; record pests seen.', hi: 'सप्ताह में दो बार खेत भर के 20 पौधे जांचें; दिखे कीट लिखें।', kn: 'ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ ಹೊಲದಾದ್ಯಂತ 20 ಸಸ್ಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ; ಕಂಡ ಕೀಟಗಳನ್ನು ಬರೆದಿಡಿ.' },
      { en: 'Remove and destroy any plant showing leaf curl to stop it spreading.', hi: 'पत्ती मरोड़ दिखाने वाला पौधा तुरंत हटाकर नष्ट करें ताकि फैलाव रुके।', kn: 'ಎಲೆ ಮುರುಟು ತೋರುವ ಸಸ್ಯವನ್ನು ತೆಗೆದು ನಾಶ ಮಾಡಿ, ಹರಡುವುದನ್ನು ತಡೆಯಲು.' },
    ],
    costLines: [
      { label: { en: 'Bio-agents (Trichoderma, Beauveria)', hi: 'जैव-एजेंट (ट्राइकोडर्मा, ब्यूवेरिया)', kn: 'ಜೈವಿಕ ಏಜೆಂಟ್‌ಗಳು (ಟ್ರೈಕೋಡರ್ಮಾ, ಬ್ಯೂವೇರಿಯಾ)' }, perAcre: 620 },
      { label: { en: 'Azadirachtin', hi: 'एज़ाडिरेक्टिन', kn: 'ಅಜಾಡಿರಾಕ್ಟಿನ್' }, perAcre: 450 },
      { label: { en: 'Sticky traps', hi: 'चिपचिपे ट्रैप', kn: 'ಅಂಟು ಬಲೆಗಳು' }, perAcre: 400 },
      { label: LABOUR, perAcre: 600 },
    ],
  },
};

/** Generic soil-only advice when the leaf could not be classified. */
export const ORGANIC_FALLBACK: OrganicSpec = {
  agentIds: [],
  effectiveness: {
    relativePct: 0,
    onsetDays: 0,
    note: {
      en: 'We could not read the leaf photo, so no pest or disease protocol is shown. The soil steps below are still valid.',
      hi: 'हम पत्ती की फोटो नहीं पढ़ पाए, इसलिए कीट या रोग उपाय नहीं दिखाए गए। नीचे दिए मिट्टी के कदम अब भी मान्य हैं।',
      kn: 'ಎಲೆಯ ಚಿತ್ರವನ್ನು ಓದಲಾಗಲಿಲ್ಲ, ಆದ್ದರಿಂದ ಕೀಟ ಅಥವಾ ರೋಗ ಕ್ರಮ ತೋರಿಸಿಲ್ಲ. ಕೆಳಗಿನ ಮಣ್ಣಿನ ಕ್ರಮಗಳು ಈಗಲೂ ಮಾನ್ಯ.',
    },
  },
  recipeIds: ['jeevamrut'],
  traps: [],
  companions: [],
  cultural: [
    { en: 'Retake the leaf photo: one leaf, close up, in daylight, filling most of the frame.', hi: 'पत्ती की फोटो फिर लें: एक पत्ती, पास से, दिन के उजाले में, फ्रेम भरते हुए।', kn: 'ಎಲೆಯ ಚಿತ್ರ ಮತ್ತೆ ತೆಗೆಯಿರಿ: ಒಂದು ಎಲೆ, ಹತ್ತಿರದಿಂದ, ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ, ಚೌಕಟ್ಟು ತುಂಬುವಂತೆ.' },
  ],
  costLines: [{ label: LABOUR, perAcre: 300 }],
};
