import type { Lang, TransitionSpeed } from '@/types';
import type { TransitionPlanDto } from '@/services/schemas';
import type { MockFarm } from '../data/reference';
import { cropById } from '../data/reference';
import { translator, type L } from '../data/localize';
import { fill } from './advisory';

const SHARES: Record<TransitionSpeed, [number, number][]> = {
  conservative: [[85, 15], [60, 40], [15, 85]],
  balanced: [[75, 25], [40, 60], [0, 100]],
  aggressive: [[50, 50], [15, 85], [0, 100]],
};

export const SOC_TARGET = 0.75;
/** Max yield loss (%) if a degraded field went fully organic overnight. */
const MAX_DIP = 22;
/** Full organic programme cost relative to conventional cost. */
const ORGANIC_COST_RATIO = 0.62;
const OVERHEAD = [3500, 1500, 0, 0, 0, 0];

const RABI: L = { en: 'Rabi', hi: 'रबी', kn: 'ಹಿಂಗಾರು' };
const KHARIF: L = { en: 'Kharif', hi: 'खरीफ', kn: 'ಮುಂಗಾರು' };
const YEAR: L = { en: 'Year', hi: 'वर्ष', kn: 'ವರ್ಷ' };

const YEAR_TITLES: L[] = [
  { en: 'Reduce & learn', hi: 'घटाएं और सीखें', kn: 'ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಕಲಿಯಿರಿ' },
  { en: 'Shift the balance', hi: 'संतुलन बदलें', kn: 'ಸಮತೋಲನ ಬದಲಿಸಿ' },
  { en: 'Organic & IPM', hi: 'जैविक और IPM', kn: 'ಸಾವಯವ ಮತ್ತು IPM' },
];

const YEAR_FOCUS: L[][] = [
  [
    { en: 'Bio-inputs make up {org}% of crop protection', hi: 'फसल सुरक्षा में {org}% जैव-सामग्री', kn: 'ಬೆಳೆ ರಕ್ಷಣೆಯಲ್ಲಿ {org}% ಜೈವಿಕ ಸಾಮಗ್ರಿ' },
    { en: 'Start Jeevamrut and Trichoderma-enriched FYM', hi: 'जीवामृत और ट्राइकोडर्मा समृद्ध खाद शुरू करें', kn: 'ಜೀವಾಮೃತ ಮತ್ತು ಟ್ರೈಕೋಡರ್ಮಾ ಸಮೃದ್ಧ ಗೊಬ್ಬರ ಆರಂಭಿಸಿ' },
    { en: 'Monitor pests with traps before spraying', hi: 'छिड़कने से पहले ट्रैप से कीट निगरानी', kn: 'ಸಿಂಪಡಿಸುವ ಮೊದಲು ಬಲೆಗಳಿಂದ ಕೀಟ ಮೇಲ್ವಿಚಾರಣೆ' },
  ],
  [
    { en: 'Bio-inputs lead ({org}%), chemicals only as back-up', hi: 'जैव-सामग्री आगे ({org}%), रसायन केवल बैक-अप', kn: 'ಜೈವಿಕ ಸಾಮಗ್ರಿ ಮುಂದೆ ({org}%), ರಾಸಾಯನಿಕ ಬ್ಯಾಕ್-ಅಪ್ ಮಾತ್ರ' },
    { en: 'Green manure and vermicompost every season', hi: 'हर मौसम हरी खाद और केंचुआ खाद', kn: 'ಪ್ರತಿ ಋತು ಹಸಿರೆಲೆ ಗೊಬ್ಬರ ಮತ್ತು ಎರೆಹುಳು ಗೊಬ್ಬರ' },
    { en: 'Join a PGS-India farmer group', hi: 'PGS-India किसान समूह से जुड़ें', kn: 'PGS-India ರೈತ ಗುಂಪಿಗೆ ಸೇರಿ' },
  ],
  [
    { en: '{org}% organic / IPM crop protection', hi: '{org}% जैविक / IPM फसल सुरक्षा', kn: '{org}% ಸಾವಯವ / IPM ಬೆಳೆ ರಕ್ಷಣೆ' },
    { en: 'Certification and premium market', hi: 'प्रमाणन और प्रीमियम बाजार', kn: 'ಪ್ರಮಾಣೀಕರಣ ಮತ್ತು ಪ್ರೀಮಿಯಂ ಮಾರುಕಟ್ಟೆ' },
    { en: 'Soil organic carbon above 0.75%', hi: 'मिट्टी जैविक कार्बन 0.75% से अधिक', kn: 'ಮಣ್ಣಿನ ಸಾವಯವ ಇಂಗಾಲ 0.75%ಕ್ಕಿಂತ ಹೆಚ್ಚು' },
  ],
];

type Cat = 'soil' | 'bio' | 'chemical' | 'monitoring' | 'market';
const TASKS: { id: string; category: Cat; label: L }[][] = [
  [
    { id: 's1-soil-test', category: 'soil', label: { en: 'Get a fresh soil test and save the card', hi: 'नई मिट्टी जांच कराएं और कार्ड सहेजें', kn: 'ಹೊಸ ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿ ಚೀಟಿ ಉಳಿಸಿ' } },
    { id: 's1-jeevamrut', category: 'bio', label: { en: 'Start Jeevamrut: 200 L per acre every 15 days', hi: 'जीवामृत शुरू करें: हर 15 दिन 200 लीटर प्रति एकड़', kn: 'ಜೀವಾಮೃತ ಆರಂಭಿಸಿ: ಪ್ರತಿ 15 ದಿನ ಎಕರೆಗೆ 200 ಲೀಟರ್' } },
    { id: 's1-tricho', category: 'bio', label: { en: 'Apply Trichoderma-enriched FYM at planting', hi: 'रोपाई पर ट्राइकोडर्मा समृद्ध खाद डालें', kn: 'ನಾಟಿಯಲ್ಲಿ ಟ್ರೈಕೋಡರ್ಮಾ ಸಮೃದ್ಧ ಗೊಬ್ಬರ ಹಾಕಿ' } },
    { id: 's1-traps', category: 'monitoring', label: { en: 'Install yellow sticky traps (10 per acre)', hi: 'पीले चिपचिपे ट्रैप लगाएं (10 प्रति एकड़)', kn: 'ಹಳದಿ ಅಂಟು ಬಲೆ ಹಾಕಿ (ಎಕರೆಗೆ 10)' } },
    { id: 's1-replace', category: 'chemical', label: { en: 'Replace {k} of every 4 chemical sprays with bio sprays', hi: 'हर 4 रासायनिक छिड़काव में से {k} को जैव छिड़काव से बदलें', kn: 'ಪ್ರತಿ 4 ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆಯಲ್ಲಿ {k} ಅನ್ನು ಜೈವಿಕ ಸಿಂಪಡಣೆಯಿಂದ ಬದಲಿಸಿ' } },
    { id: 's1-records', category: 'monitoring', label: { en: 'Keep a spray and harvest diary', hi: 'छिड़काव और कटाई की डायरी रखें', kn: 'ಸಿಂಪಡಣೆ ಮತ್ತು ಕೊಯ್ಲಿನ ದಿನಚರಿ ಇಡಿ' } },
  ],
  [
    { id: 's2-green-manure', category: 'soil', label: { en: 'Grow sunhemp or dhaincha green manure before planting', hi: 'रोपाई से पहले सनई या ढैंचा हरी खाद उगाएं', kn: 'ನಾಟಿಗೆ ಮೊದಲು ಸೆಣಬು ಅಥವಾ ಡಯಾಂಚ ಹಸಿರೆಲೆ ಗೊಬ್ಬರ ಬೆಳೆಸಿ' } },
    { id: 's2-vermi', category: 'soil', label: { en: 'Set up a vermicompost bed', hi: 'केंचुआ खाद की क्यारी बनाएं', kn: 'ಎರೆಹುಳು ಗೊಬ್ಬರದ ತೊಟ್ಟಿ ಸಿದ್ಧಪಡಿಸಿ' } },
    { id: 's2-nske', category: 'bio', label: { en: 'Use NSKE as the first spray for sucking pests', hi: 'रस चूसक कीटों के लिए पहला छिड़काव NSKE का करें', kn: 'ರಸ ಹೀರುವ ಕೀಟಗಳಿಗೆ ಮೊದಲ ಸಿಂಪಡಣೆ NSKE' } },
    { id: 's2-scout', category: 'monitoring', label: { en: 'Scout 20 plants twice a week; spray only above threshold', hi: 'सप्ताह में दो बार 20 पौधे देखें; सीमा पार होने पर ही छिड़कें', kn: 'ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ 20 ಸಸ್ಯ ಪರಿಶೀಲಿಸಿ; ಮಿತಿ ಮೀರಿದಾಗ ಮಾತ್ರ ಸಿಂಪಡಿಸಿ' } },
  ],
  [
    { id: 's3-reduce', category: 'chemical', label: { en: 'Keep chemical sprays to {chem}% of the programme – emergencies only', hi: 'रासायनिक छिड़काव कार्यक्रम का {chem}% तक – केवल आपात स्थिति में', kn: 'ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆ ಕಾರ್ಯಕ್ರಮದ {chem}% ಮಾತ್ರ – ತುರ್ತು ಸಂದರ್ಭಕ್ಕೆ' } },
    { id: 's3-pgs', category: 'market', label: { en: 'Register your farmer group with PGS-India', hi: 'अपने किसान समूह को PGS-India में पंजीकृत करें', kn: 'ನಿಮ್ಮ ರೈತ ಗುಂಪನ್ನು PGS-India ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ' } },
    { id: 's3-companion', category: 'bio', label: { en: 'Plant marigold and maize border rows', hi: 'गेंदा और मक्का की किनारे की पंक्तियां लगाएं', kn: 'ಚೆಂಡು ಹೂ ಮತ್ತು ಮೆಕ್ಕೆಜೋಳದ ಅಂಚಿನ ಸಾಲು ನೆಡಿ' } },
    { id: 's3-soil-test', category: 'soil', label: { en: 'Repeat soil test and check the OC trend', hi: 'मिट्टी जांच दोहराएं और OC रुझान देखें', kn: 'ಮಣ್ಣು ಪರೀಕ್ಷೆ ಪುನರಾವರ್ತಿಸಿ ಮತ್ತು OC ಪ್ರವೃತ್ತಿ ನೋಡಿ' } },
  ],
  [
    { id: 's4-bio-store', category: 'bio', label: { en: 'Multiply Trichoderma on-farm for your group', hi: 'अपने समूह के लिए खेत पर ट्राइकोडर्मा बढ़ाएं', kn: 'ನಿಮ್ಮ ಗುಂಪಿಗಾಗಿ ಹೊಲದಲ್ಲೇ ಟ್ರೈಕೋಡರ್ಮಾ ವೃದ್ಧಿಸಿ' } },
    { id: 's4-market', category: 'market', label: { en: 'Find a local organic buyer or FPO', hi: 'स्थानीय जैविक खरीदार या FPO खोजें', kn: 'ಸ್ಥಳೀಯ ಸಾವಯವ ಖರೀದಿದಾರ ಅಥವಾ FPO ಹುಡುಕಿ' } },
    { id: 's4-mulch', category: 'soil', label: { en: 'Mulch all beds with crop residue', hi: 'सभी क्यारियों में फसल अवशेष की पलवार करें', kn: 'ಎಲ್ಲಾ ಮಡಿಗಳಿಗೆ ಬೆಳೆ ಉಳಿಕೆಯ ಹೊದಿಕೆ ಹಾಕಿ' } },
  ],
  [
    { id: 's5-stop-chem', category: 'chemical', label: { en: 'Synthetic pesticides at {chem}% – IPM and bio-inputs first', hi: 'कृत्रिम कीटनाशक {chem}% – पहले IPM और जैव-सामग्री', kn: 'ಕೃತಕ ಕೀಟನಾಶಕ {chem}% – ಮೊದಲು IPM ಮತ್ತು ಜೈವಿಕ ಸಾಮಗ್ರಿ' } },
    { id: 's5-cert', category: 'market', label: { en: 'PGS-India peer review and record check', hi: 'PGS-India सहकर्मी समीक्षा और रिकॉर्ड जांच', kn: 'PGS-India ಸಹವರ್ತಿ ಪರಿಶೀಲನೆ ಮತ್ತು ದಾಖಲೆ ಪರಿಶೀಲನೆ' } },
    { id: 's5-soil-test', category: 'soil', label: { en: 'Soil test – confirm OC is rising', hi: 'मिट्टी जांच – OC बढ़ने की पुष्टि करें', kn: 'ಮಣ್ಣು ಪರೀಕ್ಷೆ – OC ಏರುತ್ತಿದೆ ಎಂದು ದೃಢಪಡಿಸಿ' } },
  ],
  [
    { id: 's6-label', category: 'market', label: { en: 'Sell with the organic / PGS label', hi: 'जैविक / PGS लेबल के साथ बेचें', kn: 'ಸಾವಯವ / PGS ಲೇಬಲ್‌ನೊಂದಿಗೆ ಮಾರಾಟ ಮಾಡಿ' } },
    { id: 's6-review', category: 'monitoring', label: { en: 'Compare yield and profit with Year 1; plan the next 3 years', hi: 'उपज और लाभ की वर्ष 1 से तुलना करें; अगले 3 वर्ष की योजना बनाएं', kn: 'ಇಳುವರಿ ಮತ್ತು ಲಾಭವನ್ನು ವರ್ಷ 1 ರೊಂದಿಗೆ ಹೋಲಿಸಿ; ಮುಂದಿನ 3 ವರ್ಷ ಯೋಜಿಸಿ' } },
  ],
];

function seasonLabels(lang: Lang, now = new Date()) {
  const { t } = translator(lang);
  const m = now.getMonth();
  let year = now.getFullYear();
  // Oct–Feb is Rabi, Jun–Sep Kharif; Mar–May plans from the coming Kharif.
  let isRabi = m >= 9 || m <= 1;
  if (m <= 1) year -= 1;
  const out: { short: string; long: string }[] = [];
  for (let i = 0; i < 6; i += 1) {
    if (isRabi) {
      const yy = String((year + 1) % 100).padStart(2, '0');
      out.push({ short: `${t(RABI)} ${String(year % 100).padStart(2, '0')}–${yy}`, long: `${t(RABI)} ${year}–${yy}` });
      year += 1;
    } else {
      out.push({ short: `${t(KHARIF)} ${String(year % 100).padStart(2, '0')}`, long: `${t(KHARIF)} ${year}` });
    }
    isRabi = !isRabi;
  }
  return out;
}

export function buildPlan(params: {
  farm: MockFarm;
  socStart: number;
  speed: TransitionSpeed;
  doneTaskIds: string[];
  lang: Lang;
}): TransitionPlanDto {
  const { farm, socStart, speed, doneTaskIds, lang } = params;
  const tr = translator(lang);
  const { t } = tr;
  const crop = cropById(farm.cropIds[0] ?? 'tomato');
  const acres = farm.areaUnit === 'hectare' ? farm.area * 2.471 : farm.area;
  const shares = SHARES[speed];
  const labels = seasonLabels(lang);

  const R = crop.revenuePerAcre;
  const C = crop.chemicalCostPerAcre;
  const chemNet = R - C;

  let soc = socStart;
  let cumChem = 0;
  let cumOrg = 0;
  let breakEven: { index: number; label: string } | null = null;
  let targetLabel: string | null = soc >= SOC_TARGET ? labels[0].short : null;
  let minYield = 100;

  const roi = [{ label: t({ en: 'Now', hi: 'अभी', kn: 'ಈಗ' }), chemical: 0, organic: 0, difference: 0 }];
  const yieldCurve = [{ label: roi[0].label, chemical: 100, transition: 100 }];
  const socCurve = [{ label: roi[0].label, value: Math.round(soc * 1000) / 1000 }];

  for (let s = 0; s < 6; s += 1) {
    const yearIdx = Math.floor(s / 2);
    const o = shares[yearIdx][1] / 100;
    const delta = (0.02 + 0.075 * o) * (1 - Math.max(0, soc - 0.6) / 1.2);
    soc = Math.min(1.2, soc + delta);
    const recovery = Math.min(1, Math.max(0, (soc - socStart) / 0.35));
    const yieldIdx = 100 - MAX_DIP * o * (1 - recovery) + 4 * recovery;
    minYield = Math.min(minYield, yieldIdx);
    const premium = yearIdx === 0 ? 0 : yearIdx === 1 ? 0.05 : o >= 1 ? 0.15 : 0.08;
    const cost = C * (1 - o) + ORGANIC_COST_RATIO * C * o + OVERHEAD[s];
    const orgNet = R * (yieldIdx / 100) * (1 + premium) - cost;
    cumChem += chemNet * acres;
    cumOrg += orgNet * acres;
    const diff = Math.round(cumOrg - cumChem);
    roi.push({ label: labels[s].short, chemical: Math.round(cumChem), organic: Math.round(cumOrg), difference: diff });
    yieldCurve.push({ label: labels[s].short, chemical: 100, transition: Math.round(yieldIdx * 10) / 10 });
    socCurve.push({ label: labels[s].short, value: Math.round(soc * 1000) / 1000 });
    if (!breakEven && diff >= 0) breakEven = { index: s + 1, label: labels[s].short };
    if (!targetLabel && soc >= SOC_TARGET) targetLabel = labels[s].short;
  }

  const years = shares.map(([chem, org], i) => ({
    year: i + 1,
    title: t(YEAR_TITLES[i]),
    chemicalPct: chem,
    organicPct: org,
    focus: YEAR_FOCUS[i].map((f) => fill(t(f), { org })),
  }));

  const k = Math.max(1, Math.round((shares[0][1] / 100) * 4));
  const seasons = TASKS.map((tasks, i) => ({
    id: `season-${i + 1}`,
    label: `${labels[i].long} · ${t(YEAR)} ${Math.floor(i / 2) + 1}`,
    current: i === 0,
    tasks: tasks.map((task) => ({
      id: task.id,
      category: task.category,
      label: fill(t(task.label), { k, chem: shares[Math.floor(i / 2)][0] }),
      done: doneTaskIds.includes(task.id),
    })),
  }));

  const firstDip = Math.round((100 - yieldCurve[1].transition) * 10) / 10;
  return {
    id: `plan-${farm.id}-${speed}`,
    farmId: farm.id,
    speed,
    currency: 'INR',
    years,
    roi,
    breakEven,
    yieldCurve,
    maxYieldDipPct: Math.max(0, Math.round((100 - minYield) * 10) / 10),
    soc: socCurve,
    socStart: Math.round(socStart * 100) / 100,
    socTarget: SOC_TARGET,
    socTargetReachedLabel: targetLabel,
    seasons,
    thisSeason: {
      title: `${labels[0].long} · ${t(YEAR)} 1`,
      chemicalPct: shares[0][0],
      organicPct: shares[0][1],
      changes: [
        fill(t({ en: 'Replace {k} of every 4 chemical sprays with bio sprays (NSKE, Trichoderma, Pseudomonas).', hi: 'हर 4 रासायनिक छिड़काव में से {k} को जैव छिड़काव (NSKE, ट्राइकोडर्मा, स्यूडोमोनास) से बदलें।', kn: 'ಪ್ರತಿ 4 ರಾಸಾಯನಿಕ ಸಿಂಪಡಣೆಯಲ್ಲಿ {k} ಅನ್ನು ಜೈವಿಕ ಸಿಂಪಡಣೆಯಿಂದ (NSKE, ಟ್ರೈಕೋಡರ್ಮಾ, ಸ್ಯೂಡೋಮೊನಾಸ್) ಬದಲಿಸಿ.' }), { k }),
        t({ en: 'Start Jeevamrut every 15 days and Trichoderma-enriched FYM at planting.', hi: 'हर 15 दिन जीवामृत और रोपाई पर ट्राइकोडर्मा समृद्ध खाद शुरू करें।', kn: 'ಪ್ರತಿ 15 ದಿನ ಜೀವಾಮೃತ ಮತ್ತು ನಾಟಿಯಲ್ಲಿ ಟ್ರೈಕೋಡರ್ಮಾ ಸಮೃದ್ಧ ಗೊಬ್ಬರ ಆರಂಭಿಸಿ.' }),
        t({ en: 'Put up sticky traps and check them before deciding to spray.', hi: 'चिपचिपे ट्रैप लगाएं और छिड़काव का निर्णय लेने से पहले उन्हें देखें।', kn: 'ಅಂಟು ಬಲೆ ಹಾಕಿ ಮತ್ತು ಸಿಂಪಡಿಸುವ ನಿರ್ಧಾರಕ್ಕೆ ಮೊದಲು ಅವುಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.' }),
        fill(t({ en: 'Expect about {dip}% lower yield this season while soil biology builds up.', hi: 'मिट्टी का जीवन बनने तक इस मौसम लगभग {dip}% कम उपज की अपेक्षा करें।', kn: 'ಮಣ್ಣಿನ ಜೀವ ವೃದ್ಧಿಯಾಗುವವರೆಗೆ ಈ ಋತುವಿನಲ್ಲಿ ಸುಮಾರು {dip}% ಕಡಿಮೆ ಇಳುವರಿ ನಿರೀಕ್ಷಿಸಿ.' }), { dip: firstDip }),
      ],
    },
    assumptions: [
      fill(t({ en: 'Based on {crop} on {acres} acres. Yield index 100 = your current conventional yield.', hi: '{acres} एकड़ पर {crop} के आधार पर। उपज सूचकांक 100 = आपकी वर्तमान पारंपरिक उपज।', kn: '{acres} ಎಕರೆಯಲ್ಲಿ {crop} ಆಧಾರದಲ್ಲಿ. ಇಳುವರಿ ಸೂಚ್ಯಂಕ 100 = ನಿಮ್ಮ ಈಗಿನ ಸಾಂಪ್ರದಾಯಿಕ ಇಳುವರಿ.' }), { crop: t(crop.name), acres: Math.round(acres * 10) / 10 }),
      t({ en: 'Organic price premium of 5% in Year 2 and up to 15% in Year 3 after PGS-India certification.', hi: 'वर्ष 2 में 5% और PGS-India प्रमाणन के बाद वर्ष 3 में 15% तक जैविक मूल्य प्रीमियम।', kn: 'ವರ್ಷ 2 ರಲ್ಲಿ 5% ಮತ್ತು PGS-India ಪ್ರಮಾಣೀಕರಣದ ನಂತರ ವರ್ಷ 3 ರಲ್ಲಿ 15% ವರೆಗೆ ಸಾವಯವ ಬೆಲೆ ಪ್ರೀಮಿಯಂ.' }),
      fill(t({ en: 'Input cost per acre per season: conventional ₹{c}, full organic ₹{o} (more labour, cheaper inputs).', hi: 'प्रति एकड़ प्रति मौसम लागत: पारंपरिक ₹{c}, पूर्ण जैविक ₹{o} (अधिक श्रम, सस्ती सामग्री)।', kn: 'ಎಕರೆಗೆ ಪ್ರತಿ ಋತು ವೆಚ್ಚ: ಸಾಂಪ್ರದಾಯಿಕ ₹{c}, ಪೂರ್ಣ ಸಾವಯವ ₹{o} (ಹೆಚ್ಚು ಕೂಲಿ, ಅಗ್ಗದ ಸಾಮಗ್ರಿ).' }), { c: C.toLocaleString('en-IN'), o: Math.round(C * ORGANIC_COST_RATIO).toLocaleString('en-IN') }),
      t({ en: 'Illustrative model only – real results depend on weather, market and management.', hi: 'केवल उदाहरण मॉडल – वास्तविक परिणाम मौसम, बाजार और प्रबंधन पर निर्भर हैं।', kn: 'ಕೇವಲ ಉದಾಹರಣಾ ಮಾದರಿ – ನಿಜವಾದ ಫಲಿತಾಂಶ ಹವಾಮಾನ, ಮಾರುಕಟ್ಟೆ ಮತ್ತು ನಿರ್ವಹಣೆಯನ್ನು ಅವಲಂಬಿಸಿದೆ.' }),
    ],
    contentLang: tr.served(),
  };
}
