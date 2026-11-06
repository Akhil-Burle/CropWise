import type { ArticleBlock, ArticleCategory, ArticleTone, Lang } from '@/types';
import type { L } from './localize';

export interface MockArticle {
  id: string;
  category: ArticleCategory;
  readMinutes: number;
  level: 'beginner' | 'intermediate';
  tone: ArticleTone;
  updatedAt: string;
  source: string | null;
  title: L;
  summary: L;
  blocks: { en: ArticleBlock[] } & Partial<Record<Exclude<Lang, 'en'>, ArticleBlock[]>>;
}

export const ARTICLES: MockArticle[] = [
  {
    id: 'guide-jeevamrut',
    category: 'guide',
    readMinutes: 4,
    level: 'beginner',
    tone: 'organic',
    updatedAt: '2026-08-14',
    source: 'Adapted from KVK training material (demo)',
    title: { en: 'How to make Jeevamrut', hi: 'जीवामृत कैसे बनाएं', kn: 'ಜೀವಾಮೃತ ತಯಾರಿಸುವುದು ಹೇಗೆ' },
    summary: {
      en: 'A fermented soil tonic from cow dung, urine, jaggery and pulse flour that feeds soil microbes.',
      hi: 'गोबर, गोमूत्र, गुड़ और बेसन से बना किण्वित मिट्टी टॉनिक जो मिट्टी के सूक्ष्मजीवों को पोषण देता है।',
      kn: 'ಸಗಣಿ, ಗೋಮೂತ್ರ, ಬೆಲ್ಲ ಮತ್ತು ಬೇಳೆ ಹಿಟ್ಟಿನಿಂದ ತಯಾರಿಸುವ ಹುದುಗಿಸಿದ ಮಣ್ಣಿನ ಟಾನಿಕ್, ಮಣ್ಣಿನ ಸೂಕ್ಷ್ಮಜೀವಿಗಳಿಗೆ ಆಹಾರ.',
    },
    blocks: {
      en: [
        { type: 'p', text: 'Jeevamrut does not feed the plant directly. It multiplies the bacteria and fungi in your soil, which then release nutrients slowly and improve soil structure.' },
        { type: 'ingredients', items: [
          { name: 'Fresh desi cow dung', quantity: '10 kg' },
          { name: 'Cow urine', quantity: '5–10 L' },
          { name: 'Jaggery', quantity: '2 kg' },
          { name: 'Pulse flour (besan)', quantity: '2 kg' },
          { name: 'Soil from your own farm bund', quantity: '1 handful' },
          { name: 'Water', quantity: '200 L' },
        ] },
        { type: 'steps', items: [
          'Place a 200 L plastic drum in the shade and fill it with water.',
          'Add dung, urine, jaggery, flour and the handful of soil.',
          'Stir clockwise with a stick for 2 minutes. Cover with a jute bag.',
          'Stir twice a day. It is ready in 48 hours in summer and up to 7 days in winter.',
          'Apply 200 L per acre with irrigation water, every 15 days.',
        ] },
        { type: 'tip', text: 'A pleasant fermented smell means it is working. A rotten smell means too much dung or no stirring.' },
        { type: 'warning', text: 'Do not mix Jeevamrut with chemical fungicides or apply on the same day as a chemical spray.' },
      ],
      hi: [
        { type: 'p', text: 'जीवामृत पौधे को सीधे पोषण नहीं देता। यह मिट्टी के जीवाणु और फफूंद को बढ़ाता है, जो धीरे-धीरे पोषक तत्व छोड़ते हैं और मिट्टी की बनावट सुधारते हैं।' },
        { type: 'ingredients', items: [
          { name: 'ताजा देसी गाय का गोबर', quantity: '10 किलो' },
          { name: 'गोमूत्र', quantity: '5–10 लीटर' },
          { name: 'गुड़', quantity: '2 किलो' },
          { name: 'बेसन', quantity: '2 किलो' },
          { name: 'अपने खेत की मेड़ की मिट्टी', quantity: '1 मुट्ठी' },
          { name: 'पानी', quantity: '200 लीटर' },
        ] },
        { type: 'steps', items: [
          '200 लीटर का प्लास्टिक ड्रम छाया में रखें और पानी भरें।',
          'गोबर, गोमूत्र, गुड़, बेसन और मुट्ठी भर मिट्टी डालें।',
          'डंडे से 2 मिनट घड़ी की दिशा में हिलाएं। जूट के बोरे से ढकें।',
          'दिन में दो बार हिलाएं। गर्मी में 48 घंटे और सर्दी में 7 दिन तक में तैयार।',
          'हर 15 दिन सिंचाई के पानी के साथ 200 लीटर प्रति एकड़ दें।',
        ] },
        { type: 'tip', text: 'हल्की किण्वित गंध का अर्थ है यह काम कर रहा है। सड़ी गंध का अर्थ है गोबर अधिक है या हिलाया नहीं गया।' },
        { type: 'warning', text: 'जीवामृत को रासायनिक फफूंदनाशक के साथ न मिलाएं और रासायनिक छिड़काव वाले दिन न डालें।' },
      ],
      kn: [
        { type: 'p', text: 'ಜೀವಾಮೃತ ನೇರವಾಗಿ ಸಸ್ಯಕ್ಕೆ ಆಹಾರ ನೀಡುವುದಿಲ್ಲ. ಇದು ಮಣ್ಣಿನ ಬ್ಯಾಕ್ಟೀರಿಯಾ ಮತ್ತು ಶಿಲೀಂಧ್ರಗಳನ್ನು ವೃದ್ಧಿಸುತ್ತದೆ; ಅವು ನಿಧಾನವಾಗಿ ಪೋಷಕಾಂಶ ಬಿಡುಗಡೆ ಮಾಡಿ ಮಣ್ಣಿನ ರಚನೆ ಸುಧಾರಿಸುತ್ತವೆ.' },
        { type: 'ingredients', items: [
          { name: 'ತಾಜಾ ದೇಸಿ ಹಸುವಿನ ಸಗಣಿ', quantity: '10 ಕೆಜಿ' },
          { name: 'ಗೋಮೂತ್ರ', quantity: '5–10 ಲೀಟರ್' },
          { name: 'ಬೆಲ್ಲ', quantity: '2 ಕೆಜಿ' },
          { name: 'ಕಡಲೆ ಹಿಟ್ಟು', quantity: '2 ಕೆಜಿ' },
          { name: 'ನಿಮ್ಮ ಹೊಲದ ಬದುವಿನ ಮಣ್ಣು', quantity: '1 ಹಿಡಿ' },
          { name: 'ನೀರು', quantity: '200 ಲೀಟರ್' },
        ] },
        { type: 'steps', items: [
          '200 ಲೀಟರ್ ಪ್ಲಾಸ್ಟಿಕ್ ಡ್ರಮ್ ಅನ್ನು ನೆರಳಿನಲ್ಲಿಟ್ಟು ನೀರು ತುಂಬಿ.',
          'ಸಗಣಿ, ಗೋಮೂತ್ರ, ಬೆಲ್ಲ, ಹಿಟ್ಟು ಮತ್ತು ಹಿಡಿ ಮಣ್ಣು ಸೇರಿಸಿ.',
          'ಕೋಲಿನಿಂದ 2 ನಿಮಿಷ ಗಡಿಯಾರದ ದಿಕ್ಕಿನಲ್ಲಿ ಕಲಕಿ. ಸೆಣಬಿನ ಚೀಲದಿಂದ ಮುಚ್ಚಿ.',
          'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಕಲಕಿ. ಬೇಸಿಗೆಯಲ್ಲಿ 48 ಗಂಟೆ, ಚಳಿಗಾಲದಲ್ಲಿ 7 ದಿನದವರೆಗೆ ಸಿದ್ಧ.',
          'ಪ್ರತಿ 15 ದಿನಕ್ಕೆ ನೀರಾವರಿ ನೀರಿನೊಂದಿಗೆ ಎಕರೆಗೆ 200 ಲೀಟರ್ ನೀಡಿ.',
        ] },
        { type: 'tip', text: 'ಹಗುರ ಹುದುಗಿದ ವಾಸನೆ ಬಂದರೆ ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ. ಕೊಳೆತ ವಾಸನೆ ಎಂದರೆ ಸಗಣಿ ಹೆಚ್ಚು ಅಥವಾ ಕಲಕಿಲ್ಲ.' },
        { type: 'warning', text: 'ಜೀವಾಮೃತವನ್ನು ರಾಸಾಯನಿಕ ಶಿಲೀಂಧ್ರನಾಶಕದೊಂದಿಗೆ ಬೆರೆಸಬೇಡಿ ಮತ್ತು ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆಯ ದಿನ ಹಾಕಬೇಡಿ.' },
      ],
    },
  },
  {
    id: 'guide-nske',
    category: 'guide',
    readMinutes: 3,
    level: 'beginner',
    tone: 'organic',
    updatedAt: '2026-07-02',
    source: 'Adapted from ICAR-NCIPM IPM package (demo)',
    title: { en: 'Neem seed kernel extract (NSKE 5%)', hi: 'नीम बीज गिरी अर्क (NSKE 5%)', kn: 'ಬೇವಿನ ಬೀಜ ತಿರುಳು ಸಾರ (NSKE 5%)' },
    summary: {
      en: 'A low-cost botanical spray that repels and disrupts sucking pests and caterpillars.',
      hi: 'कम लागत वाला वनस्पति छिड़काव जो रस चूसक कीटों और सुंडियों को भगाता और रोकता है।',
      kn: 'ರಸ ಹೀರುವ ಕೀಟ ಮತ್ತು ಮರಿಹುಳುಗಳನ್ನು ದೂರವಿಡುವ ಕಡಿಮೆ ವೆಚ್ಚದ ಸಸ್ಯಜನ್ಯ ಸಿಂಪಡಣೆ.',
    },
    blocks: {
      en: [
        { type: 'p', text: 'Neem kernels contain azadirachtin, which stops insects from feeding and growing. It works slowly over 3–5 days and is safest for bees when sprayed in the evening.' },
        { type: 'ingredients', items: [
          { name: 'Dried neem seed kernels (from ripe fallen seeds)', quantity: '5 kg' },
          { name: 'Water', quantity: '100 L' },
          { name: 'Khadi or bar soap', quantity: '100 g' },
        ] },
        { type: 'steps', items: [
          'Collect ripe neem seeds, dry them in shade and remove the outer shell.',
          'Pound 5 kg of kernels into a coarse powder.',
          'Tie in a muslin cloth and soak overnight in 10 L of water.',
          'Squeeze the bag well in the morning, add dissolved soap, filter, and make up to 100 L.',
          'Spray the same evening, covering the underside of leaves.',
        ] },
        { type: 'tip', text: 'Store kernels in a dry gunny bag – old or mouldy kernels lose strength.' },
      ],
    },
  },
  {
    id: 'guide-trichoderma',
    category: 'guide',
    readMinutes: 4,
    level: 'intermediate',
    tone: 'forest',
    updatedAt: '2026-06-18',
    source: null,
    title: { en: 'Multiply Trichoderma on your farm', hi: 'अपने खेत पर ट्राइकोडर्मा बढ़ाएं', kn: 'ನಿಮ್ಮ ಹೊಲದಲ್ಲೇ ಟ್ರೈಕೋಡರ್ಮಾ ವೃದ್ಧಿಸಿ' },
    summary: {
      en: 'Turn 1 kg of Trichoderma into enough enriched manure for an acre in 15 days.',
      hi: '15 दिन में 1 किलो ट्राइकोडर्मा से एक एकड़ के लिए समृद्ध खाद बनाएं।',
      kn: '15 ದಿನದಲ್ಲಿ 1 ಕೆಜಿ ಟ್ರೈಕೋಡರ್ಮಾದಿಂದ ಒಂದು ಎಕರೆಗೆ ಸಾಕಾಗುವ ಸಮೃದ್ಧ ಗೊಬ್ಬರ ತಯಾರಿಸಿ.',
    },
    blocks: {
      en: [
        { type: 'p', text: 'Trichoderma viride is a friendly fungus that attacks root-rot and wilt fungi in the soil. Multiplying it in farmyard manure (FYM) spreads it evenly and costs far less than buying more.' },
        { type: 'steps', items: [
          'Spread 100 kg of well-rotted FYM in a shaded spot.',
          'Sprinkle water until moist (a squeezed handful should not drip).',
          'Mix 1 kg Trichoderma powder evenly through the manure.',
          'Heap to about 1 m high and cover with wet gunny bags.',
          'Turn every 5–7 days and keep moist. After about 15 days a green-white growth appears.',
          'Apply at the root zone or mix into furrows at planting.',
        ] },
        { type: 'warning', text: 'Keep a 7-day gap between Trichoderma and any chemical fungicide.' },
      ],
    },
  },
  {
    id: 'guide-vermicompost',
    category: 'guide',
    readMinutes: 5,
    level: 'beginner',
    tone: 'clay',
    updatedAt: '2026-05-10',
    source: null,
    title: { en: 'Start a vermicompost bed', hi: 'केंचुआ खाद की क्यारी शुरू करें', kn: 'ಎರೆಹುಳು ಗೊಬ್ಬರದ ಮಡಿ ಆರಂಭಿಸಿ' },
    summary: {
      en: 'Earthworms turn farm waste into rich compost in about two months.',
      hi: 'केंचुए लगभग दो महीने में खेत के कचरे को उत्तम खाद में बदल देते हैं।',
      kn: 'ಎರೆಹುಳುಗಳು ಸುಮಾರು ಎರಡು ತಿಂಗಳಲ್ಲಿ ಹೊಲದ ತ್ಯಾಜ್ಯವನ್ನು ಸಮೃದ್ಧ ಗೊಬ್ಬರವಾಗಿ ಮಾಡುತ್ತವೆ.',
    },
    blocks: {
      en: [
        { type: 'list', items: [
          'Shaded bed: 3 m long × 1 m wide × 0.6 m high (brick, HDPE bag or pit).',
          'Bottom layer: 5 cm coarse crop residue for drainage.',
          'Middle: half-decomposed dung mixed with chopped crop waste.',
          'Worms: about 1 kg of Eisenia fetida (red wigglers) per bed.',
        ] },
        { type: 'steps', items: [
          'Fill the bed in layers and sprinkle water to about 60% moisture.',
          'Release worms on top and cover with a gunny bag.',
          'Keep moist; do not let water stand.',
          'Stop watering 5 days before harvest so worms move down.',
          'Harvest the top layer after 45–60 days, sieve, and reuse the worms.',
        ] },
        { type: 'tip', text: 'Avoid fresh dung, citrus peel and oily waste – heat and acidity drive the worms away.' },
      ],
    },
  },
  {
    id: 'safety-triangles',
    category: 'safety',
    readMinutes: 3,
    level: 'beginner',
    tone: 'chem',
    updatedAt: '2026-09-01',
    source: 'Based on Insecticides Rules, 1971 labelling (demo summary)',
    title: { en: 'What the colour triangle on a pesticide label means', hi: 'कीटनाशक लेबल पर रंगीन त्रिकोण का अर्थ', kn: 'ಕೀಟನಾಶಕ ಲೇಬಲ್‌ನ ಬಣ್ಣದ ತ್ರಿಕೋನದ ಅರ್ಥ' },
    summary: {
      en: 'Red, yellow, blue and green triangles tell you how poisonous a product is.',
      hi: 'लाल, पीला, नीला और हरा त्रिकोण बताता है कि उत्पाद कितना विषैला है।',
      kn: 'ಕೆಂಪು, ಹಳದಿ, ನೀಲಿ ಮತ್ತು ಹಸಿರು ತ್ರಿಕೋನಗಳು ಉತ್ಪನ್ನ ಎಷ್ಟು ವಿಷಕಾರಿ ಎಂದು ತಿಳಿಸುತ್ತವೆ.',
    },
    blocks: {
      en: [
        { type: 'p', text: 'Every pesticide sold in India must carry a diamond-shaped label whose lower triangle is coloured by toxicity. Look at it before you buy.' },
        { type: 'toxicity', items: [
          { class: 'red', label: 'Red – Extremely toxic', meaning: 'A few drops can be fatal. Avoid where alternatives exist.' },
          { class: 'yellow', label: 'Yellow – Highly toxic', meaning: 'Serious poisoning risk. Full PPE, never near children.' },
          { class: 'blue', label: 'Blue – Moderately toxic', meaning: 'Harmful. Gloves, mask and full sleeves every time.' },
          { class: 'green', label: 'Green – Slightly toxic', meaning: 'Lowest hazard, but still a poison. PPE still required.' },
        ] },
        { type: 'tip', text: 'If two products are registered for your problem, choose the one with the lower toxicity colour.' },
      ],
      hi: [
        { type: 'p', text: 'भारत में बिकने वाले हर कीटनाशक पर हीरे के आकार का लेबल होता है जिसका निचला त्रिकोण विषाक्तता के अनुसार रंगा होता है। खरीदने से पहले इसे देखें।' },
        { type: 'toxicity', items: [
          { class: 'red', label: 'लाल – अत्यंत विषैला', meaning: 'कुछ बूंदें भी जानलेवा हो सकती हैं। विकल्प हो तो बचें।' },
          { class: 'yellow', label: 'पीला – अधिक विषैला', meaning: 'गंभीर विषाक्तता का खतरा। पूरे सुरक्षा उपकरण, बच्चों से दूर।' },
          { class: 'blue', label: 'नीला – मध्यम विषैला', meaning: 'हानिकारक। हर बार दस्ताने, मास्क और पूरी बांह।' },
          { class: 'green', label: 'हरा – कम विषैला', meaning: 'सबसे कम खतरा, फिर भी जहर है। सुरक्षा उपकरण जरूरी।' },
        ] },
        { type: 'tip', text: 'यदि आपकी समस्या के लिए दो उत्पाद पंजीकृत हैं, तो कम विषाक्तता रंग वाला चुनें।' },
      ],
      kn: [
        { type: 'p', text: 'ಭಾರತದಲ್ಲಿ ಮಾರಾಟವಾಗುವ ಪ್ರತಿ ಕೀಟನಾಶಕದ ಮೇಲೆ ವಜ್ರಾಕಾರದ ಲೇಬಲ್ ಇರುತ್ತದೆ; ಅದರ ಕೆಳಗಿನ ತ್ರಿಕೋನ ವಿಷತ್ವಕ್ಕೆ ತಕ್ಕ ಬಣ್ಣದಲ್ಲಿರುತ್ತದೆ. ಖರೀದಿಸುವ ಮೊದಲು ನೋಡಿ.' },
        { type: 'toxicity', items: [
          { class: 'red', label: 'ಕೆಂಪು – ಅತ್ಯಂತ ವಿಷಕಾರಿ', meaning: 'ಕೆಲವು ಹನಿಗಳೂ ಮಾರಕವಾಗಬಹುದು. ಪರ್ಯಾಯವಿದ್ದರೆ ತಪ್ಪಿಸಿ.' },
          { class: 'yellow', label: 'ಹಳದಿ – ಹೆಚ್ಚು ವಿಷಕಾರಿ', meaning: 'ಗಂಭೀರ ವಿಷಬಾಧೆ ಅಪಾಯ. ಪೂರ್ಣ ರಕ್ಷಣಾ ಸಾಧನ, ಮಕ್ಕಳಿಂದ ದೂರ.' },
          { class: 'blue', label: 'ನೀಲಿ – ಮಧ್ಯಮ ವಿಷಕಾರಿ', meaning: 'ಹಾನಿಕಾರಕ. ಪ್ರತಿ ಬಾರಿ ಕೈಗವಸು, ಮಾಸ್ಕ್ ಮತ್ತು ಪೂರ್ಣ ತೋಳು.' },
          { class: 'green', label: 'ಹಸಿರು – ಸ್ವಲ್ಪ ವಿಷಕಾರಿ', meaning: 'ಕಡಿಮೆ ಅಪಾಯ, ಆದರೂ ವಿಷ. ರಕ್ಷಣಾ ಸಾಧನ ಅಗತ್ಯ.' },
        ] },
        { type: 'tip', text: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಗೆ ಎರಡು ಉತ್ಪನ್ನಗಳು ನೋಂದಾಯಿತವಾಗಿದ್ದರೆ, ಕಡಿಮೆ ವಿಷತ್ವ ಬಣ್ಣದ್ದನ್ನು ಆರಿಸಿ.' },
      ],
    },
  },
  {
    id: 'safety-labels',
    category: 'safety',
    readMinutes: 3,
    level: 'beginner',
    tone: 'chem',
    updatedAt: '2026-09-01',
    source: null,
    title: { en: 'Reading a pesticide label', hi: 'कीटनाशक लेबल पढ़ना', kn: 'ಕೀಟನಾಶಕ ಲೇಬಲ್ ಓದುವುದು' },
    summary: {
      en: 'Seven things to check on every pack before you pay.',
      hi: 'भुगतान से पहले हर पैक पर जांचने की सात बातें।',
      kn: 'ಹಣ ಕೊಡುವ ಮೊದಲು ಪ್ರತಿ ಪ್ಯಾಕ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಬೇಕಾದ ಏಳು ವಿಷಯಗಳು.',
    },
    blocks: {
      en: [
        { type: 'list', items: [
          'Active ingredient and its percentage (e.g. Mancozeb 75%).',
          'Formulation: WP (wettable powder), EC (emulsifiable concentrate), SC (suspension concentrate)…',
          'CIB&RC registration number – no number means do not buy.',
          'The crops and pests it is approved for. Using it on other crops is illegal and risky.',
          'Dose and water volume per acre or hectare.',
          'Pre-harvest interval (PHI) – days to wait before harvest.',
          'Batch number, manufacturing and expiry dates, and the antidote statement.',
        ] },
        { type: 'warning', text: 'Never buy pesticide from loose, unlabelled containers.' },
      ],
    },
  },
  {
    id: 'safety-ppe',
    category: 'safety',
    readMinutes: 2,
    level: 'beginner',
    tone: 'chem',
    updatedAt: '2026-09-03',
    source: null,
    title: { en: 'Protective gear (PPE) for spraying', hi: 'छिड़काव के लिए सुरक्षा उपकरण (PPE)', kn: 'ಸಿಂಪಡಣೆಗೆ ರಕ್ಷಣಾ ಸಾಧನ (PPE)' },
    summary: {
      en: 'The minimum kit that keeps poison off your skin, eyes and lungs.',
      hi: 'न्यूनतम किट जो जहर को त्वचा, आंखों और फेफड़ों से दूर रखती है।',
      kn: 'ವಿಷವನ್ನು ಚರ್ಮ, ಕಣ್ಣು ಮತ್ತು ಶ್ವಾಸಕೋಶದಿಂದ ದೂರವಿಡುವ ಕನಿಷ್ಠ ಕಿಟ್.',
    },
    blocks: {
      en: [
        { type: 'list', items: [
          'Nitrile or rubber gloves – cloth gloves soak up pesticide.',
          'Respirator mask (N95 or a cartridge mask) – a handkerchief does not protect.',
          'Splash goggles.',
          'Full-sleeve coverall or apron, worn over clothes.',
          'Rubber boots with trousers outside the boots.',
          'Head cover.',
        ] },
        { type: 'tip', text: 'Wash PPE separately from family clothes after every spray.' },
      ],
    },
  },
  {
    id: 'safety-storage',
    category: 'safety',
    readMinutes: 2,
    level: 'beginner',
    tone: 'chem',
    updatedAt: '2026-09-03',
    source: null,
    title: { en: 'Safe storage and disposal', hi: 'सुरक्षित भंडारण और निपटान', kn: 'ಸುರಕ್ಷಿತ ಸಂಗ್ರಹ ಮತ್ತು ವಿಲೇವಾರಿ' },
    summary: {
      en: 'Most poisonings at home happen from badly stored packs.',
      hi: 'घर पर ज्यादातर विषाक्तता गलत तरीके से रखे पैक से होती है।',
      kn: 'ಮನೆಯಲ್ಲಿ ಹೆಚ್ಚಿನ ವಿಷಬಾಧೆ ತಪ್ಪಾಗಿ ಇಟ್ಟ ಪ್ಯಾಕ್‌ಗಳಿಂದ ಆಗುತ್ತದೆ.',
    },
    blocks: {
      en: [
        { type: 'list', items: [
          'Keep pesticides in a locked box or room, outside the kitchen and away from animal feed.',
          'Always in the original container – never in drink bottles.',
          'Buy only what you need for this season.',
          'Triple-rinse empty packs, puncture them, and return to the dealer or bury away from water.',
          'Never wash sprayers in ponds, wells or streams.',
        ] },
      ],
    },
  },
  {
    id: 'safety-first-aid',
    category: 'safety',
    readMinutes: 2,
    level: 'beginner',
    tone: 'clay',
    updatedAt: '2026-09-05',
    source: null,
    title: { en: 'First aid for pesticide poisoning', hi: 'कीटनाशक विषाक्तता में प्राथमिक उपचार', kn: 'ಕೀಟನಾಶಕ ವಿಷಬಾಧೆಗೆ ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ' },
    summary: {
      en: 'What to do in the first 15 minutes – and what not to do.',
      hi: 'पहले 15 मिनट में क्या करें – और क्या न करें।',
      kn: 'ಮೊದಲ 15 ನಿಮಿಷದಲ್ಲಿ ಏನು ಮಾಡಬೇಕು – ಮತ್ತು ಏನು ಮಾಡಬಾರದು.',
    },
    blocks: {
      en: [
        { type: 'warning', text: 'Call 108 (ambulance) immediately and take the pesticide label or pack with you to the hospital.' },
        { type: 'steps', items: [
          'Move the person to fresh air and shade.',
          'Remove soaked clothes. Wash skin with soap and plenty of water for 15 minutes.',
          'Rinse eyes with clean running water for 15 minutes.',
          'If unconscious, lay them on their side. Do not give anything by mouth.',
          'Do not make the person vomit unless the label says so.',
        ] },
        { type: 'tip', text: 'Signs of poisoning: headache, sweating, blurred vision, vomiting, muscle twitching, breathing trouble.' },
      ],
    },
  },
  {
    id: 'ipm-explainer',
    category: 'ipm',
    readMinutes: 4,
    level: 'beginner',
    tone: 'ochre',
    updatedAt: '2026-08-20',
    source: null,
    title: { en: 'IPM in five steps', hi: 'पांच चरणों में IPM', kn: 'ಐದು ಹಂತಗಳಲ್ಲಿ IPM' },
    summary: {
      en: 'Integrated Pest Management: prevent first, watch closely, spray last.',
      hi: 'एकीकृत कीट प्रबंधन: पहले रोकें, ध्यान से देखें, छिड़काव अंत में।',
      kn: 'ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ: ಮೊದಲು ತಡೆಯಿರಿ, ಗಮನವಿಟ್ಟು ನೋಡಿ, ಕೊನೆಗೆ ಸಿಂಪಡಿಸಿ.',
    },
    blocks: {
      en: [
        { type: 'steps', items: [
          'Prevent: healthy seed, crop rotation, balanced soil, resistant varieties.',
          'Monitor: walk the field twice a week; use sticky and pheromone traps.',
          'Decide: act only when pests cross the economic threshold level (ETL).',
          'Bio & mechanical first: hand-picking, traps, neem, Trichoderma, Beauveria, natural enemies.',
          'Chemical last: the right registered product, right dose, with PPE and PHI respected.',
        ] },
        { type: 'p', text: 'IPM is not "no chemicals". It is using chemicals only when they are truly needed, which cuts cost, residue and resistance.' },
      ],
    },
  },
  {
    id: 'organic-why-phased',
    category: 'organic',
    readMinutes: 3,
    level: 'beginner',
    tone: 'organic',
    updatedAt: '2026-08-28',
    source: null,
    title: { en: 'Why switch to organic in phases?', hi: 'जैविक की ओर चरणों में क्यों बढ़ें?', kn: 'ಸಾವಯವಕ್ಕೆ ಹಂತ ಹಂತವಾಗಿ ಏಕೆ ಬದಲಾಗಬೇಕು?' },
    summary: {
      en: 'Stopping chemicals overnight can cut yield sharply. A 3-year plan protects income while soil recovers.',
      hi: 'रातोंरात रसायन बंद करने से उपज बहुत घट सकती है। 3 साल की योजना मिट्टी सुधरने तक आय बचाती है।',
      kn: 'ರಾತ್ರೋರಾತ್ರಿ ರಾಸಾಯನಿಕ ನಿಲ್ಲಿಸಿದರೆ ಇಳುವರಿ ತೀವ್ರವಾಗಿ ಕುಸಿಯಬಹುದು. 3 ವರ್ಷದ ಯೋಜನೆ ಮಣ್ಣು ಚೇತರಿಸುವವರೆಗೆ ಆದಾಯ ಕಾಪಾಡುತ್ತದೆ.',
    },
    blocks: {
      en: [
        { type: 'p', text: 'Soils that have received chemicals for years often have low organic carbon and weak microbial life. Bio-inputs need that life to work, so it has to be rebuilt first.' },
        { type: 'list', items: [
          'Year 1 – about 75% chemical, 25% bio: learn the methods on part of the programme.',
          'Year 2 – about 40% chemical, 60% bio: bio-inputs lead, chemicals are a back-up.',
          'Year 3 – 100% organic / IPM: eligible for PGS-India certification and premium prices.',
        ] },
        { type: 'tip', text: 'Track organic carbon on your soil card each year. Above 0.75% is the target.' },
      ],
    },
  },
  {
    id: 'soil-health-card',
    category: 'soil',
    readMinutes: 3,
    level: 'beginner',
    tone: 'clay',
    updatedAt: '2026-07-22',
    source: null,
    title: { en: 'Understanding your Soil Health Card', hi: 'अपना मृदा स्वास्थ्य कार्ड समझें', kn: 'ನಿಮ್ಮ ಮಣ್ಣು ಆರೋಗ್ಯ ಚೀಟಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ' },
    summary: {
      en: 'What N, P, K, pH, EC and organic carbon mean and what is "normal".',
      hi: 'N, P, K, pH, EC और जैविक कार्बन का क्या अर्थ है और "सामान्य" क्या है।',
      kn: 'N, P, K, pH, EC ಮತ್ತು ಸಾವಯವ ಇಂಗಾಲದ ಅರ್ಥ ಮತ್ತು "ಸಾಮಾನ್ಯ" ಯಾವುದು.',
    },
    blocks: {
      en: [
        { type: 'list', items: [
          'Nitrogen (N): low below 280, medium 280–560, high above 560 kg/ha.',
          'Phosphorus (P): low below 10, medium 10–25, high above 25 kg/ha.',
          'Potassium (K): low below 110, medium 110–280, high above 280 kg/ha.',
          'pH: below 6.5 acidic, 6.5–7.5 neutral, above 7.5 alkaline.',
          'EC (salinity): up to 1.0 dS/m is normal.',
          'Organic carbon (OC): low below 0.5%, medium 0.5–0.75%, high above 0.75%.',
        ] },
        { type: 'tip', text: 'Test every 2 years from the same spot, at the same time of year, to compare fairly.' },
      ],
    },
  },
];

export const GLOSSARY: { id: string; term: L; definition: L }[] = [
  { id: 'phi', term: { en: 'PHI (Pre-Harvest Interval)', hi: 'PHI (कटाई पूर्व अंतराल)', kn: 'PHI (ಕೊಯ್ಲು ಪೂರ್ವ ಅಂತರ)' }, definition: { en: 'Minimum days between the last spray and harvest so residues fall to safe levels.', hi: 'अंतिम छिड़काव और कटाई के बीच न्यूनतम दिन ताकि अवशेष सुरक्षित स्तर तक घटें।', kn: 'ಅವಶೇಷ ಸುರಕ್ಷಿತ ಮಟ್ಟಕ್ಕೆ ಇಳಿಯಲು ಕೊನೆಯ ಸಿಂಪಡಣೆ ಮತ್ತು ಕೊಯ್ಲಿನ ನಡುವಿನ ಕನಿಷ್ಠ ದಿನಗಳು.' } },
  { id: 'rei', term: { en: 'Re-entry interval', hi: 'पुनः प्रवेश अंतराल', kn: 'ಮರುಪ್ರವೇಶ ಅಂತರ' }, definition: { en: 'Hours to wait after spraying before people enter the field without PPE.', hi: 'छिड़काव के बाद बिना सुरक्षा उपकरण खेत में जाने से पहले प्रतीक्षा के घंटे।', kn: 'ಸಿಂಪಡಣೆಯ ನಂತರ ರಕ್ಷಣಾ ಸಾಧನವಿಲ್ಲದೆ ಹೊಲಕ್ಕೆ ಹೋಗುವ ಮೊದಲು ಕಾಯಬೇಕಾದ ಗಂಟೆಗಳು.' } },
  { id: 'cibrc', term: { en: 'CIB&RC', hi: 'CIB&RC', kn: 'CIB&RC' }, definition: { en: 'Central Insecticides Board & Registration Committee – registers pesticides for use in India.', hi: 'केंद्रीय कीटनाशी बोर्ड एवं पंजीकरण समिति – भारत में कीटनाशकों का पंजीकरण करती है।', kn: 'ಕೇಂದ್ರ ಕೀಟನಾಶಕ ಮಂಡಳಿ ಮತ್ತು ನೋಂದಣಿ ಸಮಿತಿ – ಭಾರತದಲ್ಲಿ ಕೀಟನಾಶಕಗಳನ್ನು ನೋಂದಾಯಿಸುತ್ತದೆ.' } },
  { id: 'ipm', term: { en: 'IPM', hi: 'IPM (एकीकृत कीट प्रबंधन)', kn: 'IPM (ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ)' }, definition: { en: 'Integrated Pest Management – combining prevention, monitoring, biological and chemical methods, with chemicals last.', hi: 'रोकथाम, निगरानी, जैविक और रासायनिक तरीकों का संयोजन, रसायन अंत में।', kn: 'ತಡೆಗಟ್ಟುವಿಕೆ, ಮೇಲ್ವಿಚಾರಣೆ, ಜೈವಿಕ ಮತ್ತು ರಾಸಾಯನಿಕ ವಿಧಾನಗಳ ಸಂಯೋಜನೆ, ರಾಸಾಯನಿಕ ಕೊನೆಗೆ.' } },
  { id: 'etl', term: { en: 'ETL (Economic Threshold Level)', hi: 'ETL (आर्थिक क्षति स्तर)', kn: 'ETL (ಆರ್ಥಿಕ ಮಿತಿ ಮಟ್ಟ)' }, definition: { en: 'The pest level at which control costs less than the damage it prevents.', hi: 'वह कीट स्तर जिस पर नियंत्रण की लागत रोके गए नुकसान से कम हो।', kn: 'ನಿಯಂತ್ರಣ ವೆಚ್ಚ ತಡೆಯುವ ಹಾನಿಗಿಂತ ಕಡಿಮೆಯಾಗುವ ಕೀಟ ಮಟ್ಟ.' } },
  { id: 'nske', term: { en: 'NSKE', hi: 'NSKE', kn: 'NSKE' }, definition: { en: 'Neem seed kernel extract – a home-made botanical pesticide, usually used at 5%.', hi: 'नीम बीज गिरी अर्क – घर पर बना वनस्पति कीटनाशक, आमतौर पर 5%।', kn: 'ಬೇವಿನ ಬೀಜ ತಿರುಳು ಸಾರ – ಮನೆಯಲ್ಲಿ ತಯಾರಿಸುವ ಸಸ್ಯಜನ್ಯ ಕೀಟನಾಶಕ, ಸಾಮಾನ್ಯವಾಗಿ 5%.' } },
  { id: 'azadirachtin', term: { en: 'Azadirachtin', hi: 'एज़ाडिरेक्टिन', kn: 'ಅಜಾಡಿರಾಕ್ಟಿನ್' }, definition: { en: 'The active compound in neem that stops insects feeding and moulting.', hi: 'नीम का सक्रिय तत्व जो कीटों का खाना और विकास रोकता है।', kn: 'ಕೀಟಗಳ ಆಹಾರ ಸೇವನೆ ಮತ್ತು ಬೆಳವಣಿಗೆ ತಡೆಯುವ ಬೇವಿನ ಸಕ್ರಿಯ ಅಂಶ.' } },
  { id: 'trichoderma', term: { en: 'Trichoderma viride', hi: 'ट्राइकोडर्मा विरिडी', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ' }, definition: { en: 'A beneficial soil fungus that suppresses root rot, wilt and damping-off.', hi: 'लाभकारी मिट्टी फफूंद जो जड़ सड़न, उकठा और आर्द्र गलन को दबाती है।', kn: 'ಬೇರು ಕೊಳೆ, ಸೊರಗು ಮತ್ತು ಸಸಿ ಕೊಳೆ ತಡೆಯುವ ಉಪಯುಕ್ತ ಮಣ್ಣಿನ ಶಿಲೀಂಧ್ರ.' } },
  { id: 'beauveria', term: { en: 'Beauveria bassiana', hi: 'ब्यूवेरिया बैसियाना', kn: 'ಬ್ಯೂವೇರಿಯಾ ಬ್ಯಾಸಿಯಾನಾ' }, definition: { en: 'An insect-killing fungus used against whitefly, thrips, borers and caterpillars.', hi: 'कीट मारने वाली फफूंद, सफेद मक्खी, थ्रिप्स, छेदक और सुंडियों के विरुद्ध।', kn: 'ಬಿಳಿನೊಣ, ಥ್ರಿಪ್ಸ್, ಕೊರಕ ಮತ್ತು ಮರಿಹುಳುಗಳ ವಿರುದ್ಧ ಬಳಸುವ ಕೀಟ ಕೊಲ್ಲುವ ಶಿಲೀಂಧ್ರ.' } },
  { id: 'ec', term: { en: 'EC (Electrical Conductivity)', hi: 'EC (विद्युत चालकता)', kn: 'EC (ವಿದ್ಯುತ್ ವಾಹಕತೆ)' }, definition: { en: 'Measures salt in soil (dS/m). Above 1.0 can stress roots.', hi: 'मिट्टी में लवण मापता है (dS/m)। 1.0 से अधिक जड़ों पर दबाव डालता है।', kn: 'ಮಣ್ಣಿನ ಲವಣ ಅಳೆಯುತ್ತದೆ (dS/m). 1.0 ಮೀರಿದರೆ ಬೇರುಗಳಿಗೆ ಒತ್ತಡ.' } },
  { id: 'oc', term: { en: 'Organic carbon (OC)', hi: 'जैविक कार्बन (OC)', kn: 'ಸಾವಯವ ಇಂಗಾಲ (OC)' }, definition: { en: 'Share of carbon from organic matter in soil (%). Key sign of soil health; target above 0.75%.', hi: 'मिट्टी में जैविक पदार्थ से कार्बन का हिस्सा (%)। मिट्टी स्वास्थ्य का मुख्य संकेत; लक्ष्य 0.75% से अधिक।', kn: 'ಮಣ್ಣಿನಲ್ಲಿ ಸಾವಯವ ಪದಾರ್ಥದ ಇಂಗಾಲದ ಪಾಲು (%). ಮಣ್ಣಿನ ಆರೋಗ್ಯದ ಮುಖ್ಯ ಸೂಚಕ; ಗುರಿ 0.75%ಕ್ಕಿಂತ ಹೆಚ್ಚು.' } },
  { id: 'wp', term: { en: 'WP / EC / SC formulations', hi: 'WP / EC / SC फॉर्मूलेशन', kn: 'WP / EC / SC ಸೂತ್ರೀಕರಣ' }, definition: { en: 'Wettable powder, emulsifiable concentrate, suspension concentrate – how the product is mixed with water.', hi: 'घुलनशील पाउडर, इमल्सीफायेबल सांद्र, सस्पेंशन सांद्र – उत्पाद पानी में कैसे मिलता है।', kn: 'ತೇವಗೊಳ್ಳುವ ಪುಡಿ, ಎಮಲ್ಸಿಫೈಯಬಲ್ ಸಾಂದ್ರ, ಸಸ್ಪೆನ್ಷನ್ ಸಾಂದ್ರ – ಉತ್ಪನ್ನ ನೀರಿನಲ್ಲಿ ಹೇಗೆ ಬೆರೆಯುತ್ತದೆ.' } },
  { id: 'jeevamrut', term: { en: 'Jeevamrut', hi: 'जीवामृत', kn: 'ಜೀವಾಮೃತ' }, definition: { en: 'Fermented microbial soil tonic made from cow dung, urine, jaggery and pulse flour.', hi: 'गोबर, गोमूत्र, गुड़ और बेसन से बना किण्वित सूक्ष्मजीव मिट्टी टॉनिक।', kn: 'ಸಗಣಿ, ಗೋಮೂತ್ರ, ಬೆಲ್ಲ ಮತ್ತು ಬೇಳೆ ಹಿಟ್ಟಿನಿಂದ ತಯಾರಿಸುವ ಹುದುಗಿಸಿದ ಸೂಕ್ಷ್ಮಜೀವಿ ಮಣ್ಣಿನ ಟಾನಿಕ್.' } },
  { id: 'pgs', term: { en: 'PGS-India', hi: 'PGS-India', kn: 'PGS-India' }, definition: { en: 'Participatory Guarantee System – a low-cost, group-based organic certification for small farmers.', hi: 'सहभागी गारंटी प्रणाली – छोटे किसानों के लिए कम लागत, समूह-आधारित जैविक प्रमाणन।', kn: 'ಭಾಗವಹಿಸುವ ಖಾತರಿ ವ್ಯವಸ್ಥೆ – ಸಣ್ಣ ರೈತರಿಗೆ ಕಡಿಮೆ ವೆಚ್ಚದ, ಗುಂಪು ಆಧಾರಿತ ಸಾವಯವ ಪ್ರಮಾಣೀಕರಣ.' } },
  { id: 'kvk', term: { en: 'KVK (Krishi Vigyan Kendra)', hi: 'KVK (कृषि विज्ञान केंद्र)', kn: 'KVK (ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ)' }, definition: { en: 'District farm science centre that gives free advice, training and testing.', hi: 'जिला कृषि विज्ञान केंद्र जो मुफ्त सलाह, प्रशिक्षण और जांच देता है।', kn: 'ಉಚಿತ ಸಲಹೆ, ತರಬೇತಿ ಮತ್ತು ಪರೀಕ್ಷೆ ನೀಡುವ ಜಿಲ್ಲಾ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ.' } },
  { id: 'vermicompost', term: { en: 'Vermicompost', hi: 'केंचुआ खाद', kn: 'ಎರೆಹುಳು ಗೊಬ್ಬರ' }, definition: { en: 'Compost made by earthworms; richer and faster than ordinary compost.', hi: 'केंचुओं से बनी खाद; साधारण खाद से अधिक पोषक और जल्दी तैयार।', kn: 'ಎರೆಹುಳುಗಳಿಂದ ತಯಾರಾದ ಗೊಬ್ಬರ; ಸಾಮಾನ್ಯ ಗೊಬ್ಬರಕ್ಕಿಂತ ಸಮೃದ್ಧ ಮತ್ತು ಬೇಗ ಸಿದ್ಧ.' } },
];

export const MYTHS: { id: string; myth: L; fact: L }[] = [
  {
    id: 'm1',
    myth: { en: 'More pesticide than the label says works better.', hi: 'लेबल से ज्यादा कीटनाशक बेहतर काम करता है।', kn: 'ಲೇಬಲ್‌ಗಿಂತ ಹೆಚ್ಚು ಕೀಟನಾಶಕ ಉತ್ತಮವಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.' },
    fact: { en: 'Overdosing wastes money, burns plants, leaves residues and breeds resistant pests.', hi: 'अधिक मात्रा से पैसा बर्बाद होता है, पौधे झुलसते हैं, अवशेष रहते हैं और कीट प्रतिरोधी बनते हैं।', kn: 'ಹೆಚ್ಚು ಪ್ರಮಾಣ ಹಣ ವ್ಯರ್ಥ, ಸಸ್ಯ ಸುಡುವಿಕೆ, ಅವಶೇಷ ಮತ್ತು ಪ್ರತಿರೋಧಕ ಕೀಟಗಳಿಗೆ ಕಾರಣ.' },
  },
  {
    id: 'm2',
    myth: { en: 'Organic farming means doing nothing about pests.', hi: 'जैविक खेती का अर्थ है कीटों के लिए कुछ न करना।', kn: 'ಸಾವಯವ ಕೃಷಿ ಎಂದರೆ ಕೀಟಗಳಿಗೆ ಏನೂ ಮಾಡದಿರುವುದು.' },
    fact: { en: 'Organic farming uses active controls – bio-agents, botanicals, traps and cultural practices – applied early.', hi: 'जैविक खेती सक्रिय नियंत्रण अपनाती है – जैव-एजेंट, वनस्पति, ट्रैप और कृषि पद्धतियां – जल्दी लागू।', kn: 'ಸಾವಯವ ಕೃಷಿ ಸಕ್ರಿಯ ನಿಯಂತ್ರಣ ಬಳಸುತ್ತದೆ – ಜೈವಿಕ ಏಜೆಂಟ್, ಸಸ್ಯಜನ್ಯ, ಬಲೆ ಮತ್ತು ಬೇಸಾಯ ಕ್ರಮಗಳು – ಬೇಗ.' },
  },
  {
    id: 'm3',
    myth: { en: 'Neem and bio-pesticides are completely harmless.', hi: 'नीम और जैव-कीटनाशक पूरी तरह हानिरहित हैं।', kn: 'ಬೇವು ಮತ್ತು ಜೈವಿಕ ಕೀಟನಾಶಕಗಳು ಸಂಪೂರ್ಣ ನಿರುಪದ್ರವಿ.' },
    fact: { en: 'They are much safer, but can still irritate skin and eyes. Wear gloves and wash hands.', hi: 'ये बहुत सुरक्षित हैं, पर त्वचा और आंखों में जलन कर सकते हैं। दस्ताने पहनें और हाथ धोएं।', kn: 'ಇವು ಹೆಚ್ಚು ಸುರಕ್ಷಿತ, ಆದರೆ ಚರ್ಮ ಮತ್ತು ಕಣ್ಣಿಗೆ ಉರಿ ಉಂಟುಮಾಡಬಹುದು. ಕೈಗವಸು ಧರಿಸಿ, ಕೈ ತೊಳೆಯಿರಿ.' },
  },
  {
    id: 'm4',
    myth: { en: 'If the vegetable looks clean, it is safe to harvest right after spraying.', hi: 'सब्जी साफ दिखे तो छिड़काव के तुरंत बाद तोड़ना सुरक्षित है।', kn: 'ತರಕಾರಿ ಸ್ವಚ್ಛವಾಗಿ ಕಂಡರೆ ಸಿಂಪಡಣೆಯ ತಕ್ಷಣ ಕೊಯ್ಯುವುದು ಸುರಕ್ಷಿತ.' },
    fact: { en: 'Residues are invisible. Always wait for the pre-harvest interval (PHI) on the label.', hi: 'अवशेष दिखते नहीं। हमेशा लेबल पर लिखे कटाई पूर्व अंतराल (PHI) तक रुकें।', kn: 'ಅವಶೇಷ ಕಾಣುವುದಿಲ್ಲ. ಯಾವಾಗಲೂ ಲೇಬಲ್‌ನ ಕೊಯ್ಲು ಪೂರ್ವ ಅಂತರ (PHI) ವರೆಗೆ ಕಾಯಿರಿ.' },
  },
  {
    id: 'm5',
    myth: { en: 'Yields always fall permanently when you go organic.', hi: 'जैविक अपनाने पर उपज हमेशा के लिए घट जाती है।', kn: 'ಸಾವಯವಕ್ಕೆ ಬದಲಾದರೆ ಇಳುವರಿ ಶಾಶ್ವತವಾಗಿ ಕುಸಿಯುತ್ತದೆ.' },
    fact: { en: 'A small dip in the first 1–2 years is common; yields usually recover as soil organic carbon rises.', hi: 'पहले 1–2 साल हल्की गिरावट आम है; जैविक कार्बन बढ़ने पर उपज आमतौर पर लौट आती है।', kn: 'ಮೊದಲ 1–2 ವರ್ಷ ಸ್ವಲ್ಪ ಕುಸಿತ ಸಾಮಾನ್ಯ; ಸಾವಯವ ಇಂಗಾಲ ಏರಿದಂತೆ ಇಳುವರಿ ಸಾಮಾನ್ಯವಾಗಿ ಚೇತರಿಸುತ್ತದೆ.' },
  },
  {
    id: 'm6',
    myth: { en: 'A handkerchief over the nose is enough protection.', hi: 'नाक पर रूमाल पर्याप्त सुरक्षा है।', kn: 'ಮೂಗಿಗೆ ಕರವಸ್ತ್ರ ಕಟ್ಟಿದರೆ ಸಾಕು.' },
    fact: { en: 'Cloth absorbs spray and holds it against your face. Use a proper respirator mask.', hi: 'कपड़ा छिड़काव सोखकर चेहरे पर रखता है। सही रेस्पिरेटर मास्क लगाएं।', kn: 'ಬಟ್ಟೆ ಸಿಂಪಡಣೆಯನ್ನು ಹೀರಿ ಮುಖದ ಮೇಲೆ ಹಿಡಿದಿಡುತ್ತದೆ. ಸರಿಯಾದ ರೆಸ್ಪಿರೇಟರ್ ಮಾಸ್ಕ್ ಬಳಸಿ.' },
  },
];

export const QUIZ: { id: string; question: L; options: { id: string; text: L }[]; correct: string; explanation: L }[] = [
  {
    id: 'q1',
    question: { en: 'What does a RED triangle on a pesticide label mean?', hi: 'कीटनाशक लेबल पर लाल त्रिकोण का क्या अर्थ है?', kn: 'ಕೀಟನಾಶಕ ಲೇಬಲ್‌ನ ಕೆಂಪು ತ್ರಿಕೋನದ ಅರ್ಥವೇನು?' },
    options: [
      { id: 'a', text: { en: 'Organic product', hi: 'जैविक उत्पाद', kn: 'ಸಾವಯವ ಉತ್ಪನ್ನ' } },
      { id: 'b', text: { en: 'Extremely toxic', hi: 'अत्यंत विषैला', kn: 'ಅತ್ಯಂತ ವಿಷಕಾರಿ' } },
      { id: 'c', text: { en: 'Slightly toxic', hi: 'कम विषैला', kn: 'ಸ್ವಲ್ಪ ವಿಷಕಾರಿ' } },
    ],
    correct: 'b',
    explanation: { en: 'Red = extremely toxic, yellow = highly, blue = moderately, green = slightly toxic.', hi: 'लाल = अत्यंत, पीला = अधिक, नीला = मध्यम, हरा = कम विषैला।', kn: 'ಕೆಂಪು = ಅತ್ಯಂತ, ಹಳದಿ = ಹೆಚ್ಚು, ನೀಲಿ = ಮಧ್ಯಮ, ಹಸಿರು = ಸ್ವಲ್ಪ ವಿಷಕಾರಿ.' },
  },
  {
    id: 'q2',
    question: { en: 'You sprayed a product with a 7-day PHI on Monday. When is the earliest safe harvest?', hi: 'आपने सोमवार को 7 दिन PHI वाला उत्पाद छिड़का। सबसे जल्दी सुरक्षित कटाई कब?', kn: 'ನೀವು ಸೋಮವಾರ 7 ದಿನ PHI ಇರುವ ಉತ್ಪನ್ನ ಸಿಂಪಡಿಸಿದಿರಿ. ಬೇಗನೆಯ ಸುರಕ್ಷಿತ ಕೊಯ್ಲು ಯಾವಾಗ?' },
    options: [
      { id: 'a', text: { en: 'The next day', hi: 'अगले दिन', kn: 'ಮರುದಿನ' } },
      { id: 'b', text: { en: 'Next Monday', hi: 'अगले सोमवार', kn: 'ಮುಂದಿನ ಸೋಮವಾರ' } },
      { id: 'c', text: { en: 'When the leaves look dry', hi: 'जब पत्तियां सूखी दिखें', kn: 'ಎಲೆಗಳು ಒಣಗಿದಂತೆ ಕಂಡಾಗ' } },
    ],
    correct: 'b',
    explanation: { en: 'Count 7 full days from the spray date. Residues are invisible, so appearance does not tell you.', hi: 'छिड़काव तिथि से पूरे 7 दिन गिनें। अवशेष दिखते नहीं, इसलिए रूप से पता नहीं चलता।', kn: 'ಸಿಂಪಡಣೆ ದಿನದಿಂದ ಪೂರ್ಣ 7 ದಿನ ಎಣಿಸಿ. ಅವಶೇಷ ಕಾಣುವುದಿಲ್ಲ, ರೂಪದಿಂದ ತಿಳಿಯುವುದಿಲ್ಲ.' },
  },
  {
    id: 'q3',
    question: { en: 'Which is a beneficial fungus used against soil-borne diseases?', hi: 'मिट्टी जनित रोगों के विरुद्ध कौन सी लाभकारी फफूंद उपयोग होती है?', kn: 'ಮಣ್ಣಿನಿಂದ ಹರಡುವ ರೋಗಗಳ ವಿರುದ್ಧ ಬಳಸುವ ಉಪಯುಕ್ತ ಶಿಲೀಂಧ್ರ ಯಾವುದು?' },
    options: [
      { id: 'a', text: { en: 'Trichoderma viride', hi: 'ट्राइकोडर्मा विरिडी', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ವಿರಿಡೆ' } },
      { id: 'b', text: { en: 'Alternaria solani', hi: 'अल्टरनेरिया सोलानी', kn: 'ಆಲ್ಟರ್ನೇರಿಯಾ ಸೊಲಾನಿ' } },
      { id: 'c', text: { en: 'Phytophthora infestans', hi: 'फाइटोफ्थोरा इन्फेस्टान्स', kn: 'ಫೈಟೋಫ್ಥೋರಾ ಇನ್ಫೆಸ್ಟಾನ್ಸ್' } },
    ],
    correct: 'a',
    explanation: { en: 'Trichoderma is a friendly fungus. The other two cause early blight and late blight.', hi: 'ट्राइकोडर्मा मित्र फफूंद है। बाकी दो अगेती और पछेती अंगमारी करते हैं।', kn: 'ಟ್ರೈಕೋಡರ್ಮಾ ಮಿತ್ರ ಶಿಲೀಂಧ್ರ. ಉಳಿದೆರಡು ಆರಂಭಿಕ ಮತ್ತು ತಡವಾದ ಅಂಗಮಾರಿ ಉಂಟುಮಾಡುತ್ತವೆ.' },
  },
  {
    id: 'q4',
    question: { en: 'What is the target soil organic carbon for healthy soil?', hi: 'स्वस्थ मिट्टी के लिए जैविक कार्बन का लक्ष्य क्या है?', kn: 'ಆರೋಗ್ಯಕರ ಮಣ್ಣಿಗೆ ಸಾವಯವ ಇಂಗಾಲದ ಗುರಿ ಎಷ್ಟು?' },
    options: [
      { id: 'a', text: { en: 'Below 0.5%', hi: '0.5% से कम', kn: '0.5%ಕ್ಕಿಂತ ಕಡಿಮೆ' } },
      { id: 'b', text: { en: 'Above 0.75%', hi: '0.75% से अधिक', kn: '0.75%ಕ್ಕಿಂತ ಹೆಚ್ಚು' } },
      { id: 'c', text: { en: 'Exactly 7%', hi: 'ठीक 7%', kn: 'ನಿಖರವಾಗಿ 7%' } },
    ],
    correct: 'b',
    explanation: { en: 'OC above 0.75% is rated high on the Soil Health Card and supports good soil life.', hi: 'मृदा स्वास्थ्य कार्ड पर 0.75% से अधिक OC उच्च माना जाता है और अच्छे मिट्टी जीवन को सहारा देता है।', kn: 'ಮಣ್ಣು ಆರೋಗ್ಯ ಚೀಟಿಯಲ್ಲಿ 0.75%ಕ್ಕಿಂತ ಹೆಚ್ಚು OC ಉನ್ನತ ಮತ್ತು ಉತ್ತಮ ಮಣ್ಣಿನ ಜೀವಕ್ಕೆ ಸಹಾಯಕ.' },
  },
  {
    id: 'q5',
    question: { en: 'Best time of day to spray neem (NSKE)?', hi: 'नीम (NSKE) छिड़कने का सबसे अच्छा समय?', kn: 'ಬೇವು (NSKE) ಸಿಂಪಡಿಸಲು ಉತ್ತಮ ಸಮಯ?' },
    options: [
      { id: 'a', text: { en: 'Hot noon sun', hi: 'तेज दोपहर की धूप', kn: 'ಬಿಸಿ ಮಧ್ಯಾಹ್ನ' } },
      { id: 'b', text: { en: 'Late evening', hi: 'देर शाम', kn: 'ತಡ ಸಂಜೆ' } },
      { id: 'c', text: { en: 'During rain', hi: 'बारिश के दौरान', kn: 'ಮಳೆಯ ಸಮಯದಲ್ಲಿ' } },
    ],
    correct: 'b',
    explanation: { en: 'Sunlight breaks neem down quickly and bees are less active in the evening.', hi: 'धूप में नीम जल्दी नष्ट होता है और शाम को मधुमक्खियां कम सक्रिय होती हैं।', kn: 'ಬಿಸಿಲಿನಲ್ಲಿ ಬೇವು ಬೇಗ ಹಾಳಾಗುತ್ತದೆ ಮತ್ತು ಸಂಜೆ ಜೇನುನೊಣಗಳು ಕಡಿಮೆ ಸಕ್ರಿಯ.' },
  },
  {
    id: 'q6',
    question: { en: 'Pesticide splashed in someone\'s eyes. What first?', hi: 'किसी की आंख में कीटनाशक गिरा। पहले क्या करें?', kn: 'ಯಾರದೋ ಕಣ್ಣಿಗೆ ಕೀಟನಾಶಕ ಸಿಡಿದಿದೆ. ಮೊದಲು ಏನು?' },
    options: [
      { id: 'a', text: { en: 'Rub the eyes', hi: 'आंखें मलें', kn: 'ಕಣ್ಣು ಉಜ್ಜಿ' } },
      { id: 'b', text: { en: 'Rinse with clean running water for 15 minutes', hi: '15 मिनट साफ बहते पानी से धोएं', kn: '15 ನಿಮಿಷ ಶುದ್ಧ ಹರಿಯುವ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ' } },
      { id: 'c', text: { en: 'Put milk in the eyes', hi: 'आंखों में दूध डालें', kn: 'ಕಣ್ಣಿಗೆ ಹಾಲು ಹಾಕಿ' } },
    ],
    correct: 'b',
    explanation: { en: 'Flush with clean water for 15 minutes, then see a doctor with the label.', hi: '15 मिनट साफ पानी से धोएं, फिर लेबल के साथ डॉक्टर को दिखाएं।', kn: '15 ನಿಮಿಷ ಶುದ್ಧ ನೀರಿನಿಂದ ತೊಳೆದು, ನಂತರ ಲೇಬಲ್‌ನೊಂದಿಗೆ ವೈದ್ಯರನ್ನು ಕಾಣಿರಿ.' },
  },
];
