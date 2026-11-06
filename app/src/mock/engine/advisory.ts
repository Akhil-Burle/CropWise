import type { AreaUnit, Lang, NutrientKey } from '@/types';
import type { DualAdvisoryDto } from '@/services/schemas';
import type { MockAnalysis } from '../db';
import { cropById } from '../data/reference';
import { diseaseById } from '../data/diseases';
import { translator, type L } from '../data/localize';
import { LEAF_OUTCOMES } from '../data/scenarios';
import {
  AGENTS,
  CHEMICAL,
  CHEMICAL_COMMON,
  ORGANIC,
  ORGANIC_FALLBACK,
  PPE,
  RECIPES,
  TOXICITY,
  type OrganicSpec,
} from '../data/protocols';
import { AMENDMENTS } from '../data/amendments';
import { KNAPSACK_L, STAGE_WATER_FACTOR, doseFromPerAcre, perUnitFactor, quantity, roundMoney, toAcres } from './dosage';
import { classify, NORMS } from './soil';
import { soilReadings } from './analysis';

/** Organic foliar programmes use a slightly lower spray volume than chemical protocols. */
const ORGANIC_WATER_L_PER_ACRE = 200;
const LABOUR_PER_SPRAY_ACRE = 450;
const PPE_SHARE_PER_ACRE = 150;

const NUTRIENT_NAME: Record<NutrientKey, L> = {
  N: { en: 'Nitrogen (N)', hi: 'नाइट्रोजन (N)', kn: 'ಸಾರಜನಕ (N)' },
  P: { en: 'Phosphorus (P)', hi: 'फॉस्फोरस (P)', kn: 'ರಂಜಕ (P)' },
  K: { en: 'Potassium (K)', hi: 'पोटाश (K)', kn: 'ಪೊಟ್ಯಾಶ್ (K)' },
  pH: { en: 'Soil pH', hi: 'मिट्टी pH', kn: 'ಮಣ್ಣಿನ pH' },
  EC: { en: 'Salinity (EC)', hi: 'लवणता (EC)', kn: 'ಲವಣಾಂಶ (EC)' },
  OC: { en: 'Organic carbon (OC)', hi: 'जैविक कार्बन (OC)', kn: 'ಸಾವಯವ ಇಂಗಾಲ (OC)' },
};

const STATUS_WORD: Record<'deficient' | 'excess', L> = {
  deficient: { en: 'low', hi: 'कम', kn: 'ಕಡಿಮೆ' },
  excess: { en: 'high', hi: 'अधिक', kn: 'ಹೆಚ್ಚು' },
};

const STAGE_NAME: Record<MockAnalysis['growthStage'], L> = {
  vegetative: { en: 'Vegetative', hi: 'वानस्पतिक', kn: 'ಸಸ್ಯಕ' },
  flowering: { en: 'Flowering', hi: 'फूल', kn: 'ಹೂಬಿಡುವ' },
  fruiting: { en: 'Fruiting', hi: 'फल', kn: 'ಫಲ' },
};

const SEVERITY: Record<'none' | 'low' | 'moderate' | 'high', L> = {
  none: { en: 'no', hi: 'कोई नहीं', kn: 'ಯಾವುದೂ ಇಲ್ಲ' },
  low: { en: 'low', hi: 'कम', kn: 'ಕಡಿಮೆ' },
  moderate: { en: 'moderate', hi: 'मध्यम', kn: 'ಮಧ್ಯಮ' },
  high: { en: 'high', hi: 'अधिक', kn: 'ಹೆಚ್ಚು' },
};

export const fill = (text: string, vars: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

export function buildAdvisory(a: MockAnalysis, area: number, areaUnit: AreaUnit, lang: Lang): DualAdvisoryDto {
  const tr = translator(lang);
  const { t } = tr;
  const crop = cropById(a.cropId);
  const acres = toAcres(area, areaUnit);
  const unitFactor = perUnitFactor(areaUnit);

  const leaf = a.leafKey ? LEAF_OUTCOMES[a.leafKey] : undefined;
  const prediction = leaf?.kind === 'ok' ? leaf.prediction : null;
  const disease = prediction ? diseaseById(prediction.diseaseId) : null;
  const lowConfidence = prediction ? prediction.confidence < 0.7 : false;

  /* ---------- Chemical ---------- */
  const chemSpec = disease && !disease.healthy ? CHEMICAL[disease.id] : undefined;
  let chemical: DualAdvisoryDto['chemical'] = null;
  let chemicalCost: DualAdvisoryDto['cost']['chemical'] = null;
  if (chemSpec) {
    const waterPerAcre = chemSpec.waterLPerAcre * STAGE_WATER_FACTOR[a.growthStage];
    const dosePerAcre = chemSpec.concentration.value * waterPerAcre;
    const totalWater = waterPerAcre * acres;
    const tankCount = Math.max(1, Math.ceil(totalWater / KNAPSACK_L));
    const tox = TOXICITY[chemSpec.toxicity];
    chemical = {
      productName: chemSpec.productName,
      activeIngredient: t(chemSpec.activeIngredient),
      formulation: chemSpec.formulation,
      dose: doseFromPerAcre(dosePerAcre, chemSpec.concentration.unit, area, areaUnit),
      water: doseFromPerAcre(waterPerAcre, 'L', area, areaUnit),
      tank: {
        tankSizeL: KNAPSACK_L,
        tankCount,
        dosePerTank: quantity(chemSpec.concentration.value * KNAPSACK_L, chemSpec.concentration.unit),
      },
      toxicity: { class: chemSpec.toxicity, label: t(tox.label), description: t(tox.description) },
      phiDays: chemSpec.phiDays,
      reentryHours: chemSpec.reentryHours,
      sprayTiming: t(chemSpec.sprayTiming),
      maxApplications: chemSpec.maxApplications,
      intervalDays: chemSpec.intervalDays,
      ppe: chemSpec.ppe.map((icon) => ({ id: icon, label: t(PPE[icon]), icon, required: true })),
      storage: tr.list(CHEMICAL_COMMON.storage),
      disposal: tr.list(CHEMICAL_COMMON.disposal),
      firstAid: tr.list(CHEMICAL_COMMON.firstAid),
      warnings: tr.list([...chemSpec.extraWarnings, ...CHEMICAL_COMMON.warnings]),
      complianceNote: t(CHEMICAL_COMMON.compliance),
      rotationNote: chemSpec.rotationNote ? t(chemSpec.rotationNote) : null,
      requiresAcknowledgement: true,
    };
    const productKgPerAcre = dosePerAcre / 1000;
    const productCost = productKgPerAcre * chemSpec.productPricePerUnit * chemSpec.sprays;
    const labour = LABOUR_PER_SPRAY_ACRE * chemSpec.sprays;
    const lines = [
      { label: t({ en: `Product (${chemSpec.sprays} sprays)`, hi: `उत्पाद (${chemSpec.sprays} छिड़काव)`, kn: `ಉತ್ಪನ್ನ (${chemSpec.sprays} ಸಿಂಪಡಣೆ)` }), perAcre: productCost },
      { label: t({ en: 'Spraying labour', hi: 'छिड़काव श्रम', kn: 'ಸಿಂಪಡಣೆ ಕೂಲಿ' }), perAcre: labour },
      { label: t({ en: 'PPE (share per acre)', hi: 'सुरक्षा उपकरण (प्रति एकड़ हिस्सा)', kn: 'ರಕ್ಷಣಾ ಸಾಧನ (ಎಕರೆಗೆ ಪಾಲು)' }), perAcre: PPE_SHARE_PER_ACRE },
    ];
    const perAcreTotal = lines.reduce((s, l) => s + l.perAcre, 0);
    chemicalCost = {
      perArea: roundMoney(perAcreTotal * unitFactor),
      total: roundMoney(perAcreTotal * acres),
      lines: lines.map((l) => ({ label: l.label, amount: roundMoney(l.perAcre * acres) })),
    };
  }

  /* ---------- Organic ---------- */
  const orgSpec: OrganicSpec = disease ? ORGANIC[disease.id] ?? ORGANIC_FALLBACK : ORGANIC_FALLBACK;
  const organicWater = ORGANIC_WATER_L_PER_ACRE * STAGE_WATER_FACTOR[a.growthStage];
  const agents = orgSpec.agentIds.map((id) => {
    const s = AGENTS[id];
    const perAcre = s.dosing.mode === 'foliar' ? s.dosing.perL * organicWater : s.dosing.perAcre;
    return {
      id: s.id,
      name: t(s.name),
      type: s.type,
      dose: doseFromPerAcre(perAcre, s.dosing.unit, area, areaUnit),
      method: t(s.method),
      timing: t(s.timing),
      frequency: t(s.frequency),
    };
  });

  const readings = soilReadings(a);
  const deviations = (readings ?? [])
    .filter((r): r is { key: NutrientKey; value: number; confidence: number | null } => r.value !== null)
    .map((r) => ({ ...r, status: classify(r.key, r.value, 'en').status }))
    .filter((r) => r.status !== 'sufficient');

  const amendmentSpecs = deviations.flatMap((d) => AMENDMENTS.filter((m) => m.nutrient === d.key && m.when === d.status));
  const amendments = amendmentSpecs.map((m) => ({
    id: m.id,
    nutrient: m.nutrient,
    nutrientStatus: m.when,
    product: t(m.product),
    dose: doseFromPerAcre(m.perAcre, m.unit, area, areaUnit),
    timing: t(m.timing),
    note: t(m.note),
  }));

  const orgLines = orgSpec.costLines.map((l) => ({ label: t(l.label), perAcre: l.perAcre }));
  const orgPerAcre = orgLines.reduce((s, l) => s + l.perAcre, 0);
  const amendmentPerAcre = amendmentSpecs.reduce((s, m) => s + m.costPerAcre, 0);

  /* ---------- Rationale ---------- */
  const rationale: DualAdvisoryDto['rationale'] = [];
  if (prediction && disease) {
    rationale.push({
      source: 'diagnosis',
      title: t(disease.name),
      detail: fill(
        t({
          en: 'Leaf photo matched {name} with {conf}% confidence ({sev} severity).',
          hi: 'पत्ती की फोटो {name} से {conf}% विश्वास के साथ मिली ({sev} गंभीरता)।',
          kn: 'ಎಲೆಯ ಚಿತ್ರ {name} ಜೊತೆ {conf}% ವಿಶ್ವಾಸದಿಂದ ಹೊಂದಿಕೆಯಾಗಿದೆ ({sev} ತೀವ್ರತೆ).',
        }),
        { name: t(disease.name), conf: Math.round(prediction.confidence * 100), sev: t(SEVERITY[prediction.severity]) },
      ),
    });
    if (lowConfidence) {
      rationale.push({
        source: 'diagnosis',
        title: t({ en: 'Low confidence', hi: 'कम विश्वास', kn: 'ಕಡಿಮೆ ವಿಶ್ವಾಸ' }),
        detail: t({
          en: 'Confidence is below 70%, so organic steps are recommended first and the chemical option needs expert confirmation.',
          hi: 'विश्वास 70% से कम है, इसलिए पहले जैविक कदम सुझाए गए हैं और रासायनिक विकल्प के लिए विशेषज्ञ पुष्टि जरूरी है।',
          kn: 'ವಿಶ್ವಾಸ 70%ಕ್ಕಿಂತ ಕಡಿಮೆ ಇದೆ, ಆದ್ದರಿಂದ ಮೊದಲು ಸಾವಯವ ಕ್ರಮ ಸೂಚಿಸಲಾಗಿದೆ ಮತ್ತು ರಾಸಾಯನಿಕ ಆಯ್ಕೆಗೆ ತಜ್ಞರ ದೃಢೀಕರಣ ಬೇಕು.',
        }),
      });
    }
  }
  deviations.forEach((d) => {
    const linked = amendmentSpecs.filter((m) => m.nutrient === d.key).map((m) => t(m.product));
    rationale.push({
      source: 'soil',
      title: `${t(NUTRIENT_NAME[d.key])}: ${d.value} ${NORMS[d.key].unit}`.trim(),
      detail: fill(
        t({
          en: '{nutrient} is {state}. The organic plan adds: {products}.',
          hi: '{nutrient} {state} है। जैविक योजना में जोड़ा गया: {products}।',
          kn: '{nutrient} {state} ಇದೆ. ಸಾವಯವ ಯೋಜನೆಯಲ್ಲಿ ಸೇರಿಸಲಾಗಿದೆ: {products}.',
        }),
        {
          nutrient: t(NUTRIENT_NAME[d.key]),
          state: t(STATUS_WORD[d.status as 'deficient' | 'excess']),
          products: linked.join(', ') || '—',
        },
      ),
    });
  });
  if (disease?.id === 'tomato_early_blight' && deviations.some((d) => d.key === 'N')) {
    rationale.push({
      source: 'soil',
      title: t({ en: 'Soil and disease are linked', hi: 'मिट्टी और रोग जुड़े हैं', kn: 'ಮಣ್ಣು ಮತ್ತು ರೋಗ ಸಂಬಂಧಿತ' }),
      detail: t({
        en: 'Nitrogen-starved tomato plants get early blight more easily, so fixing nitrogen is part of disease control, not just nutrition.',
        hi: 'नाइट्रोजन की कमी वाले टमाटर के पौधों में अगेती अंगमारी आसानी से होती है, इसलिए नाइट्रोजन सुधारना रोग नियंत्रण का हिस्सा है।',
        kn: 'ಸಾರಜನಕ ಕೊರತೆಯ ಟೊಮೇಟೊ ಸಸ್ಯಗಳಿಗೆ ಆರಂಭಿಕ ಅಂಗಮಾರಿ ಸುಲಭವಾಗಿ ಬರುತ್ತದೆ, ಆದ್ದರಿಂದ ಸಾರಜನಕ ಸರಿಪಡಿಸುವುದು ರೋಗ ನಿಯಂತ್ರಣದ ಭಾಗ.',
      }),
    });
  }
  if (disease?.id === 'potato_late_blight' && deviations.some((d) => d.key === 'EC')) {
    rationale.push({
      source: 'soil',
      title: t({ en: 'Salt-stressed roots', hi: 'लवण से तनावग्रस्त जड़ें', kn: 'ಲವಣ ಒತ್ತಡದ ಬೇರುಗಳು' }),
      detail: t({
        en: 'High EC weakens roots and makes plants recover slowly after blight, so leaching and organic matter are included.',
        hi: 'अधिक EC जड़ों को कमजोर करता है और अंगमारी के बाद पौधे धीरे ठीक होते हैं, इसलिए लवण धुलाई और जैविक पदार्थ शामिल हैं।',
        kn: 'ಹೆಚ್ಚು EC ಬೇರುಗಳನ್ನು ದುರ್ಬಲಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಅಂಗಮಾರಿಯ ನಂತರ ಸಸ್ಯಗಳು ನಿಧಾನವಾಗಿ ಚೇತರಿಸುತ್ತವೆ, ಆದ್ದರಿಂದ ಲವಣ ತೊಳೆಯುವಿಕೆ ಮತ್ತು ಸಾವಯವ ಪದಾರ್ಥ ಸೇರಿಸಲಾಗಿದೆ.',
      }),
    });
  }
  rationale.push({
    source: 'stage',
    title: t(STAGE_NAME[a.growthStage]),
    detail: fill(
      t({
        en: '{stage} stage: spray volume is set to {water} L per acre for full canopy cover. Harvest timing makes the PHI important.',
        hi: '{stage} अवस्था: पूरी फसल ढकने के लिए छिड़काव मात्रा {water} लीटर प्रति एकड़ रखी गई है। कटाई के समय के कारण PHI महत्वपूर्ण है।',
        kn: '{stage} ಹಂತ: ಪೂರ್ಣ ಬೆಳೆ ಆವರಿಸಲು ಸಿಂಪಡಣೆ ಪ್ರಮಾಣ ಎಕರೆಗೆ {water} ಲೀಟರ್. ಕೊಯ್ಲಿನ ಸಮಯದಿಂದ PHI ಮುಖ್ಯ.',
      }),
      {
        stage: t(STAGE_NAME[a.growthStage]),
        water: Math.round((chemSpec?.waterLPerAcre ?? ORGANIC_WATER_L_PER_ACRE) * STAGE_WATER_FACTOR[a.growthStage]),
      },
    ),
  });

  const healthy = Boolean(disease?.healthy);
  return {
    id: `adv-${a.id}`,
    analysisId: a.id,
    cropName: t(crop.name),
    diseaseName: disease ? t(disease.name) : null,
    isHealthy: healthy,
    lowConfidence,
    area,
    areaUnit,
    chemical,
    chemicalUnavailableReason: chemical ? null : healthy ? 'healthy' : 'no_diagnosis',
    organic: {
      agents,
      effectiveness: { ...orgSpec.effectiveness, note: t(orgSpec.effectiveness.note) },
      recipes: orgSpec.recipeIds.map((id) => {
        const r = RECIPES[id];
        return {
          id: r.id,
          title: t(r.title),
          yields: t(r.yields),
          prepTime: t(r.prepTime),
          ingredients: r.ingredients.map((i) => ({ name: t(i.name), quantity: t(i.quantity) })),
          steps: tr.list(r.steps),
          shelfLife: t(r.shelfLife),
          caution: r.caution ? t(r.caution) : null,
        };
      }),
      traps: orgSpec.traps.map((tp) => ({
        name: t(tp.name),
        detail: t(tp.detail),
        perArea: tp.perAcre === null ? null : { value: Math.ceil(tp.perAcre * acres), unit: tp.unit },
      })),
      companionCrops: orgSpec.companions.map((c) => ({ name: t(c.name), benefit: t(c.benefit) })),
      amendments,
      culturalPractices: tr.list(orgSpec.cultural),
    },
    cost: {
      currency: 'INR',
      chemical: chemicalCost,
      organic: {
        perArea: roundMoney(orgPerAcre * unitFactor),
        total: roundMoney(orgPerAcre * acres),
        lines: orgLines.map((l) => ({ label: l.label, amount: roundMoney(l.perAcre * acres) })),
      },
      note: fill(
        t({
          en: 'Protection cost for this season only. Soil amendments are a separate long-term investment of about ₹{amend} for your field. Organic inputs can be made on the farm to cut cost further.',
          hi: 'केवल इस मौसम की सुरक्षा लागत। मिट्टी सुधार आपके खेत के लिए लगभग ₹{amend} का अलग दीर्घकालिक निवेश है। जैविक सामग्री खेत पर बनाकर लागत और घटाई जा सकती है।',
          kn: 'ಈ ಋತುವಿನ ರಕ್ಷಣಾ ವೆಚ್ಚ ಮಾತ್ರ. ಮಣ್ಣಿನ ಸುಧಾರಣೆ ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಸುಮಾರು ₹{amend} ಪ್ರತ್ಯೇಕ ದೀರ್ಘಾವಧಿ ಹೂಡಿಕೆ. ಸಾವಯವ ಸಾಮಗ್ರಿಗಳನ್ನು ಹೊಲದಲ್ಲೇ ತಯಾರಿಸಿ ವೆಚ್ಚ ಇನ್ನಷ್ಟು ಕಡಿಮೆ ಮಾಡಬಹುದು.',
        }),
        { amend: roundMoney(amendmentPerAcre * acres).toLocaleString('en-IN') },
      ),
    },
    rationale,
    disclaimer: t({
      en: 'Demo advisory generated from sample data – not for real agricultural use. Always consult your local Krishi Vigyan Kendra (KVK) or agriculture officer before applying any pesticide or input.',
      hi: 'नमूना डेटा से बनी डेमो सलाह – वास्तविक खेती के लिए नहीं। कोई भी कीटनाशक या सामग्री डालने से पहले अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से सलाह लें।',
      kn: 'ಮಾದರಿ ದತ್ತಾಂಶದಿಂದ ರಚಿಸಿದ ಡೆಮೊ ಸಲಹೆ – ನಿಜವಾದ ಕೃಷಿ ಬಳಕೆಗೆ ಅಲ್ಲ. ಯಾವುದೇ ಕೀಟನಾಶಕ ಅಥವಾ ಸಾಮಗ್ರಿ ಬಳಸುವ ಮೊದಲು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ (KVK) ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    }),
    saved: a.saved,
    generatedAt: new Date().toISOString(),
    contentLang: tr.served(),
  };
}
