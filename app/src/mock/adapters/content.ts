import type { AdminService, ChatService, LearnService } from '@/services/contracts';
import { decode, decodeList, decodePage } from '@/services/decode';
import { appError } from '@/services/errors';
import {
  AdminAnalyticsSchema,
  ArticleSchema,
  ArticleSummarySchema,
  BookmarkSchema,
  ChatMessageSchema,
  FarmerSummarySchema,
  GlossaryTermSchema,
  HelplineSchema,
  MythFactSchema,
  QuizAnswerSchema,
  QuizQuestionSchema,
  RuleEntrySchema,
  ExpertNoteSchema,
  ReviewItemSchema,
  FarmerDetailSchema,
} from '@/services/schemas';
import {
  toAdminAnalytics,
  toArticle,
  toArticleSummary,
  toBookmark,
  toChatMessage,
  toFarmerSummary,
  toGlossaryTerm,
  toHelpline,
  toMythFact,
  toQuizAnswer,
  toQuizQuestion,
  toRuleEntry,
  toExpertNote,
  toReviewItem,
  toFarmerDetail,
} from '@/services/mappers';
import { summarize } from '../engine/analysis';
import { renderTreatment } from '../engine/treatments';
import type { Lang } from '@/types';
import { commit, currentUserId, db } from '../db';
import { translator } from '../data/localize';
import { ARTICLES, GLOSSARY, MYTHS, QUIZ, type MockArticle } from '../data/learn';
import { ANALYTICS, CHAT_FALLBACK, CHAT_GREETING, CHAT_RULES, CHAT_SUGGESTIONS, FARMERS, HELPLINES } from '../data/support';
import { AGENTS, CHEMICAL, ORGANIC, RECIPES, TOXICITY } from '../data/protocols';
import { cropById } from '../data/reference';
import { diseaseById } from '../data/diseases';
import { fail, respond, uid } from '../latency';
import { matches, paginate } from '../paginate';
import { dayOffset } from '../engine/dates';

/* ---------------- Learn ---------------- */

function summaryDto(a: MockArticle, lang: Lang) {
  const tr = translator(lang);
  return {
    id: a.id,
    title: tr.t(a.title),
    summary: tr.t(a.summary),
    category: a.category,
    readMinutes: a.readMinutes,
    level: a.level,
    tone: a.tone,
    bookmarked: db.bookmarks.includes(a.id),
    contentLang: lang !== 'en' && !(a.blocks as Record<string, unknown>)[lang] ? 'en' : tr.served(),
  };
}

export const mockLearn: LearnService = {
  async listArticles(params) {
    const items = ARTICLES.filter((a) => !params.category || a.category === params.category)
      .filter((a) => !params.bookmarkedOnly || db.bookmarks.includes(a.id))
      .map((a) => summaryDto(a, params.lang))
      .filter((s, i) => matches(params.search, s.title, s.summary, ARTICLES[i]?.title.en));
    return decodePage(ArticleSummarySchema, await respond(paginate(items, params)), toArticleSummary);
  },

  async getArticle(id, lang) {
    const a = ARTICLES.find((x) => x.id === id);
    if (!a) return fail('NOT_FOUND', 'Article not found');
    const blocks = (lang !== 'en' && (a.blocks as Partial<Record<Lang, typeof a.blocks.en>>)[lang]) || a.blocks.en;
    const raw = { ...summaryDto(a, lang), blocks, updatedAt: a.updatedAt, source: a.source };
    return decode(ArticleSchema, await respond(raw), toArticle);
  },

  async toggleBookmark(articleId) {
    if (!ARTICLES.some((a) => a.id === articleId)) return fail('NOT_FOUND', 'Article not found');
    const has = db.bookmarks.includes(articleId);
    db.bookmarks = has ? db.bookmarks.filter((b) => b !== articleId) : [...db.bookmarks, articleId];
    commit();
    return decode(BookmarkSchema, await respond({ bookmarked: !has }, 120, 250), toBookmark);
  },

  async listGlossary({ lang, search }) {
    const raw = GLOSSARY.map((g) => {
      const tr = translator(lang);
      return { id: g.id, term: tr.t(g.term), definition: tr.t(g.definition), contentLang: tr.served() };
    }).filter((g, i) => matches(search, g.term, g.definition, GLOSSARY[i]?.term.en));
    return decodeList(GlossaryTermSchema, await respond(raw), toGlossaryTerm);
  },

  async listMyths(lang) {
    const raw = MYTHS.map((m) => {
      const tr = translator(lang);
      return { id: m.id, myth: tr.t(m.myth), fact: tr.t(m.fact), contentLang: tr.served() };
    });
    return decodeList(MythFactSchema, await respond(raw), toMythFact);
  },

  async getQuiz(lang) {
    const raw = QUIZ.map((q) => {
      const tr = translator(lang);
      return { id: q.id, question: tr.t(q.question), options: q.options.map((o) => ({ id: o.id, text: tr.t(o.text) })), contentLang: tr.served() };
    });
    return decodeList(QuizQuestionSchema, await respond(raw), toQuizQuestion);
  },

  async checkAnswer({ questionId, optionId, lang }) {
    const q = QUIZ.find((x) => x.id === questionId);
    if (!q) return fail('NOT_FOUND', 'Question not found');
    const { t } = translator(lang);
    const raw = { correct: q.correct === optionId, correctOptionId: q.correct, explanation: t(q.explanation) };
    return decode(QuizAnswerSchema, await respond(raw, 150, 350), toQuizAnswer);
  },
};

/* ---------------- Chat & helplines ---------------- */

function greeting(lang: Lang) {
  const { t } = translator(lang);
  return {
    id: 'greeting',
    role: 'assistant' as const,
    text: t(CHAT_GREETING),
    createdAt: new Date().toISOString(),
    suggestions: CHAT_SUGGESTIONS.map(t),
  };
}

export const mockChat: ChatService = {
  async listExpertNotes() {
    const raw = db.expertNotes.filter((n) => n.farmerId === currentUserId()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return decodeList(ExpertNoteSchema, await respond(raw, 120, 250), toExpertNote);
  },

  async markNoteRead(noteId) {
    const n = db.expertNotes.find((x) => x.id === noteId);
    if (n) n.read = true;
    commit();
    await respond(null, 80, 150);
  },

  async reportTranslation({ lang, screen, note }) {
    db.translationReports.push({ lang, screen, note, at: new Date().toISOString() });
    commit();
    await respond(null, 150, 300);
  },

  async getThread(lang) {
    const raw = [greeting(lang), ...db.chat];
    return decodeList(ChatMessageSchema, await respond(raw, 150, 300), toChatMessage);
  },

  async send(text, lang) {
    const clean = text.trim();
    if (!clean) return fail('VALIDATION', 'Empty message');
    db.chat.push({ id: uid('msg'), role: 'user', text: clean, createdAt: new Date().toISOString(), suggestions: [] });
    const { t } = translator(lang);
    const lower = clean.toLowerCase();
    const rule = CHAT_RULES.find((r) => r.keywords.some((k) => lower.includes(k.toLowerCase())));
    const reply = {
      id: uid('msg'),
      role: 'assistant' as const,
      text: t(rule?.reply ?? CHAT_FALLBACK),
      createdAt: new Date().toISOString(),
      suggestions: (rule?.suggestions ?? CHAT_SUGGESTIONS).map(t),
    };
    db.chat.push(reply);
    commit();
    return decode(ChatMessageSchema, await respond(reply, 900, 1600), toChatMessage);
  },

  async getHelplines(lang) {
    const raw = HELPLINES.map((h) => {
      const tr = translator(lang);
      return { id: h.id, name: tr.t(h.name), number: h.number, hours: tr.t(h.hours), description: tr.t(h.description), isDemo: h.isDemo, contentLang: tr.served() };
    });
    return decodeList(HelplineSchema, await respond(raw), toHelpline);
  },
};

/* ---------------- Admin ---------------- */

function realFarmerSummary(userId: string) {
  const u = db.users.find((x) => x.id === userId)!;
  const farms = db.farms.filter((f) => f.ownerId === userId);
  const last = db.analyses.filter((a) => a.ownerId === userId && !a.pending).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    village: u.village ?? '—',
    district: u.district ?? '—',
    state: u.state ?? '—',
    farmCount: farms.length,
    totalArea: Math.round(farms.reduce((s, f) => s + f.area, 0) * 10) / 10,
    lastAnalysisAt: last?.createdAt ?? null,
    adoption: 'mixed' as const,
  };
}

function requireStaff() {
  const user = db.users.find((u) => u.id === currentUserId());
  if (!user || !user.roles.some((r) => r === 'agronomist' || r === 'admin')) {
    throw appError('FORBIDDEN', 'Agronomist or admin role required', { retryable: false });
  }
}

const RULES_UPDATED = '2026-09-15';
const RULES_SOURCE = 'CropWise rules library v0.3 (demo data)';

function buildRules(lang: Lang) {
  const { t } = translator(lang);
  const label = (en: string, hi: string, kn: string) => t({ en, hi, kn });
  const chemical = Object.entries(CHEMICAL).map(([diseaseId, c]) => {
    const d = diseaseById(diseaseId);
    return {
      id: `rule-chem-${diseaseId}`,
      type: 'chemical' as const,
      cropId: d.cropId,
      cropName: t(cropById(d.cropId).name),
      diseaseName: t(d.name),
      title: c.formulation,
      summary: `${c.concentration.value} ${c.concentration.unit}/L · ${c.waterLPerAcre} L/acre · PHI ${c.phiDays} d`,
      details: [
        { label: label('Active ingredient', 'सक्रिय तत्व', 'ಸಕ್ರಿಯ ಘಟಕ'), value: t(c.activeIngredient) },
        { label: label('Concentration', 'सांद्रता', 'ಸಾಂದ್ರತೆ'), value: `${c.concentration.value} ${c.concentration.unit} / L` },
        { label: label('Water (fruiting stage)', 'पानी (फल अवस्था)', 'ನೀರು (ಫಲ ಹಂತ)'), value: `${c.waterLPerAcre} L / acre` },
        { label: label('Toxicity class', 'विषाक्तता वर्ग', 'ವಿಷತ್ವ ವರ್ಗ'), value: t(TOXICITY[c.toxicity].label) },
        { label: 'PHI', value: `${c.phiDays} d` },
        { label: label('Re-entry interval', 'पुनः प्रवेश अंतराल', 'ಮರುಪ್ರವೇಶ ಅಂತರ'), value: `${c.reentryHours} h` },
        { label: label('Max applications', 'अधिकतम छिड़काव', 'ಗರಿಷ್ಠ ಸಿಂಪಡಣೆ'), value: `${c.maxApplications} × / ${c.intervalDays} d` },
      ],
      source: RULES_SOURCE,
      updatedAt: RULES_UPDATED,
    };
  });
  const organic = Object.entries(ORGANIC).map(([diseaseId, o]) => {
    const d = diseaseById(diseaseId);
    return {
      id: `rule-org-${diseaseId}`,
      type: 'organic' as const,
      cropId: d.cropId,
      cropName: t(cropById(d.cropId).name),
      diseaseName: t(d.name),
      title: label('Organic & IPM protocol', 'जैविक व IPM प्रोटोकॉल', 'ಸಾವಯವ ಮತ್ತು IPM ಶಿಷ್ಟಾಚಾರ'),
      summary: o.agentIds.map((id) => t(AGENTS[id].name)).join(' · '),
      details: [
        ...o.agentIds.map((id) => {
          const a = AGENTS[id];
          const dose = a.dosing.mode === 'foliar' ? `${a.dosing.perL} ${a.dosing.unit}/L` : `${a.dosing.perAcre} ${a.dosing.unit}/acre`;
          return { label: t(a.name), value: `${dose} · ${t(a.frequency)}` };
        }),
        { label: label('Relative effectiveness', 'सापेक्ष प्रभावशीलता', 'ಸಾಪೇಕ್ಷ ಪರಿಣಾಮಕಾರಿತ್ವ'), value: `${o.effectiveness.relativePct}%` },
        { label: label('Recipes', 'विधियां', 'ವಿಧಾನಗಳು'), value: o.recipeIds.map((r) => t(RECIPES[r].title)).join(', ') || '—' },
        { label: label('Traps', 'ट्रैप', 'ಬಲೆಗಳು'), value: o.traps.map((tp) => t(tp.name)).join(', ') || '—' },
      ],
      source: RULES_SOURCE,
      updatedAt: RULES_UPDATED,
    };
  });
  return [...chemical, ...organic];
}

export const mockAdmin: AdminService = {
  async listFarmers(params) {
    requireStaff();
    const rows = [{ ...realFarmerSummary('user-ramesh'), lastAnalysisDaysAgo: 0 }, ...FARMERS]
      .filter((f) => !params.district || f.district === params.district)
      .filter((f) => !params.adoption || f.adoption === params.adoption)
      .filter((f) => matches(params.search, f.name, f.village, f.district, f.phone))
      .map((f) => ({
        id: f.id,
        name: f.name,
        phone: f.phone,
        village: f.village,
        district: f.district,
        state: f.state,
        farmCount: f.farmCount,
        totalArea: f.totalArea,
        lastAnalysisAt: 'lastAnalysisAt' in f ? (f.lastAnalysisAt as string | null) : f.lastAnalysisDaysAgo === null ? null : dayOffset(-f.lastAnalysisDaysAgo),
        adoption: f.adoption,
      }))
      .sort((a, b) => (params.sort === 'name' ? a.name.localeCompare(b.name) : (b.lastAnalysisAt ?? '').localeCompare(a.lastAnalysisAt ?? '')));
    return decodePage(FarmerSummarySchema, await respond(paginate(rows, params)), toFarmerSummary);
  },

  async getAnalytics(lang) {
    requireStaff();
    const { t } = translator(lang);
    const raw = {
      totals: ANALYTICS.totals,
      byDisease: ANALYTICS.byDisease.map((d) => {
        const dis = diseaseById(d.id);
        return { name: `${t(cropById(dis.cropId).name)} · ${t(dis.name)}`, count: d.count };
      }),
      byDistrict: ANALYTICS.byDistrict,
      adoption: ANALYTICS.adoption,
      monthly: ANALYTICS.monthly.map((m) => ({ month: t(m.month), analyses: m.analyses, organicActions: m.organicActions })),
      isDemo: true,
    };
    return decode(AdminAnalyticsSchema, await respond(raw, 400, 800), toAdminAnalytics);
  },

  async getFarmer(farmerId, lang) {
    requireStaff();
    const real = db.users.find((u) => u.id === farmerId);
    const { t } = translator(lang);
    if (real) {
      const farms = db.farms.filter((f) => f.ownerId === real.id);
      const farmIds = new Set(farms.map((f) => f.id));
      const analyses = db.analyses.filter((a) => a.ownerId === real.id && !a.pending).map((a) => summarize(a, lang));
      const raw = {
        farmer: realFarmerSummary(real.id),
        farms: farms.map((f) => ({ id: f.id, name: f.name, village: f.village, area: f.area, cropNames: f.cropIds.map((c) => t(cropById(c).name)) })),
        analyses,
        treatments: db.treatments.filter((tr) => farmIds.has(tr.farmId)).map((tr) => renderTreatment(tr, lang)),
        notes: db.expertNotes.filter((n) => n.farmerId === real.id),
      };
      return decode(FarmerDetailSchema, await respond(raw), toFarmerDetail);
    }
    const f = FARMERS.find((x) => x.id === farmerId);
    if (!f) return fail('NOT_FOUND', 'Farmer not found');
    const raw = {
      farmer: { ...f, lastAnalysisAt: f.lastAnalysisDaysAgo === null ? null : dayOffset(-f.lastAnalysisDaysAgo) },
      farms: [{ id: `${f.id}-farm`, name: `${f.village} plot`, village: f.village, area: f.totalArea, cropNames: [t(cropById('tomato').name)] }],
      analyses: [],
      treatments: [],
      notes: db.expertNotes.filter((n) => n.farmerId === f.id),
    };
    return decode(FarmerDetailSchema, await respond(raw), toFarmerDetail);
  },

  async listReviewQueue(params) {
    requireStaff();
    const rows = db.analyses
      .filter((a) => !a.pending)
      .map((a) => ({ a, s: summarize(a, params.lang) }))
      .filter(({ s }) => s.status !== 'complete')
      .map(({ a, s }) => {
        const owner = db.users.find((u) => u.id === a.ownerId);
        const farm = db.farms.find((f) => f.id === a.farmId);
        const reason: 'low_confidence' | 'soil_unconfirmed' | 'partial' =
          s.status === 'partial' ? 'partial' : typeof s.confidence === 'number' && s.confidence < 0.7 ? 'low_confidence' : 'soil_unconfirmed';
        return {
          analysisId: a.id,
          farmerId: a.ownerId,
          farmerName: owner?.name ?? '—',
          village: farm?.village ?? '—',
          cropName: s.cropName,
          diseaseName: s.diseaseName ?? null,
          confidence: s.confidence ?? null,
          reason,
          createdAt: s.createdAt,
        };
      })
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    return decodePage(ReviewItemSchema, await respond(paginate(rows, params)), toReviewItem);
  },

  async sendAdvice({ farmerId, analysisId, text }) {
    requireStaff();
    if (text.trim().length < 3) {
      await respond(null, 100, 200);
      throw appError('VALIDATION', 'Message too short', { retryable: false, fieldErrors: { text: 'required' } });
    }
    const me = db.users.find((u) => u.id === currentUserId());
    const note = { id: uid('note'), farmerId, analysisId, fromName: me?.name ?? 'Agronomist', text: text.trim(), createdAt: new Date().toISOString(), read: false };
    db.expertNotes.push(note);
    commit();
    return decode(ExpertNoteSchema, await respond(note), toExpertNote);
  },

  async listRules(params) {
    requireStaff();
    const rows = buildRules(params.lang)
      .filter((r) => !params.type || r.type === params.type)
      .filter((r) => !params.cropId || r.cropId === params.cropId)
      .filter((r) => matches(params.search, r.title, r.summary, r.diseaseName, r.cropName))
      .map(({ cropId: _cropId, ...rest }) => rest);
    return decodePage(RuleEntrySchema, await respond(paginate(rows, params)), toRuleEntry);
  },
};
