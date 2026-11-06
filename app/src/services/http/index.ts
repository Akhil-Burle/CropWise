/**
 * HTTP adapter stubs. Selected when VITE_DATA_SOURCE=http.
 *
 * Every method currently rejects with NOT_IMPLEMENTED so the UI shows its normal error state.
 * To implement a method:
 *   1. Call the backend with `request()` from ./client (or a GraphQL/RPC client of your choice).
 *   2. Pass the payload through `decode(<Schema>, raw, <mapper>)` (or `decodePage` / `decodeList`)
 *      from ../decode using the schemas in ../schemas and mappers in ../mappers.
 *   3. Let errors propagate – `request()` already rejects with AppError.
 * The backend contract (paths, verbs, payloads) is intentionally NOT decided here.
 */
import type {
  AdminService,
  AdvisoryService,
  AnalysisService,
  AuthService,
  ChatService,
  DemoService,
  FarmService,
  LearnService,
  ProfileService,
  Services,
  SoilService,
  TransitionService,
  TreatmentService,
  WeatherService,
} from '../contracts';
import { notImplemented } from '../errors';
import { tokenStore } from './client';
import { createUploadService, type UploadTransport } from '../upload/pipeline';

const todo = (method: string) => (): Promise<never> => Promise.reject(notImplemented(method));

const auth: AuthService = {
  // TODO: return [] in production, or the backend's demo accounts on staging.
  getDemoAccounts: () => Promise.resolve([]),
  // TODO: request an OTP for the phone number; decode with OtpChallengeSchema → toOtpChallenge.
  requestOtp: todo('auth.requestOtp'),
  // TODO: verify the OTP; store a bearer token with tokenStore.set() if the backend issues one;
  //       decode with SessionSchema → toSession.
  verifyOtp: todo('auth.verifyOtp'),
  // TODO: create the account then return its OTP challenge (OtpChallengeSchema).
  register: todo('auth.register'),
  // TODO: only on non-production backends; otherwise reject with FORBIDDEN.
  loginAsDemo: todo('auth.loginAsDemo'),
  // TODO: renew the session (cookie or refresh token); decode with SessionSchema.
  refresh: todo('auth.refresh'),
  // TODO: end the session server-side, then tokenStore.set(null).
  logout: () => Promise.resolve(),
  // TODO: return the signed-in user (UserSchema → toUser) or null when there is no session.
  getCurrentUser: async () => {
    // Restores the token saved in native storage so the Android app stays logged in.
    await tokenStore.restore();
    return null;
  },
};

const profile: ProfileService = {
  // TODO: ProfileSchema → toProfile for all three reads/writes below.
  getProfile: todo('profile.getProfile'),
  updateProfile: todo('profile.updateProfile'),
  updateNotifications: todo('profile.updateNotifications'),
  // TODO: DataExportSchema → toDataExport (or adapt to a download URL in the mapper).
  requestDataExport: todo('profile.requestDataExport'),
};

const farms: FarmService = {
  // TODO: decodePage(FarmSchema, raw, toFarm); map PageParams to the backend's paging style.
  list: todo('farms.list'),
  get: todo('farms.get'),
  create: todo('farms.create'),
  update: todo('farms.update'),
  remove: todo('farms.remove'),
  // TODO: decodeList(CropSchema, raw, toCrop) – pass lang.
  listCrops: todo('farms.listCrops'),
  // TODO: decodeList(RegionSchema, raw, toRegion).
  listRegions: todo('farms.listRegions'),
  // TODO: decodeList(SeasonTimelineItemSchema, raw, toSeasonItem).
  getSeasonTimeline: todo('farms.getSeasonTimeline'),
};

// TODO: implement ONE of these and pass it to createUploadService:
//  - multipart: build FormData with `body` and `meta`, then sendWithProgress({ method: 'POST', ... }).
//  - pre-signed: request a signed URL via request(), sendWithProgress({ method: 'PUT', body }),
//    then confirm the upload and return the UploadRef payload.
const uploadTransport: UploadTransport = () => Promise.reject(notImplemented('uploads.transport'));

const demo: DemoService = {
  // Samples and scenarios exist only for the mock data source.
  listSamples: () => Promise.resolve([]),
  listScenarios: () => Promise.resolve([]),
  useSample: todo('demo.useSample'),
  simulateSessionExpiry: () => Promise.resolve(),
  resetDemoData: () => Promise.resolve(),
};

const analysis: AnalysisService = {
  // TODO: JobRefSchema → toJobRef.
  submit: todo('analysis.submit'),
  // TODO: JobStatusSchema → toJobStatus. Polled by the processing screen via usePolling.
  getStatus: todo('analysis.getStatus'),
  // TODO: AnalysisResultSchema → toAnalysisResult. Partial results use soilError/diagnosisError.
  getResult: todo('analysis.getResult'),
  cancel: todo('analysis.cancel'),
  retry: todo('analysis.retry'),
  get: todo('analysis.get'),
  confirmSoil: todo('analysis.confirmSoil'),
  // TODO: decodePage(AnalysisSummarySchema, raw, toAnalysisSummary).
  list: todo('analysis.list'),
  remove: todo('analysis.remove'),
};

const soil: SoilService = {
  // TODO: decodePage(SoilReportSchema, raw, toSoilReport).
  listReports: todo('soil.listReports'),
  getLatest: todo('soil.getLatest'),
  // TODO: SoilTrendSchema → toSoilTrend.
  getTrend: todo('soil.getTrend'),
  // TODO: SoilComparisonSchema → toSoilComparison.
  compare: todo('soil.compare'),
};

const advisory: AdvisoryService = {
  // TODO: DualAdvisorySchema → toAdvisory. Doses must be computed server-side for params.area.
  getAdvisory: todo('advisory.getAdvisory'),
  save: todo('advisory.save'),
  // TODO: AdvisoryReportSchema → toAdvisoryReport. Return { kind: 'unavailable' } to use print fallback.
  getAdvisoryReport: () => Promise.resolve({ kind: 'unavailable' as const }),
  getShareMessage: todo('advisory.getShareMessage'),
};

const transition: TransitionService = {
  // TODO: TransitionPlanSchema → toTransitionPlan.
  getPlan: todo('transition.getPlan'),
  // TODO: SeasonTaskSchema → toSeasonTask.
  setTaskDone: todo('transition.setTaskDone'),
};

const treatments: TreatmentService = {
  // TODO: decodePage(TreatmentSchema, raw, toTreatment).
  list: todo('treatments.list'),
  create: todo('treatments.create'),
  markDone: todo('treatments.markDone'),
  skip: todo('treatments.skip'),
  setReminder: todo('treatments.setReminder'),
  // TODO: HarvestSafeSchema → toHarvestSafe.
  calculateHarvestSafe: todo('treatments.calculateHarvestSafe'),
  // TODO: decodeList(PhiAlertSchema, raw, toPhiAlert).
  getPhiAlerts: todo('treatments.getPhiAlerts'),
};

const learn: LearnService = {
  // TODO: decodePage(ArticleSummarySchema, raw, toArticleSummary).
  listArticles: todo('learn.listArticles'),
  // TODO: ArticleSchema → toArticle.
  getArticle: todo('learn.getArticle'),
  toggleBookmark: todo('learn.toggleBookmark'),
  listGlossary: todo('learn.listGlossary'),
  listMyths: todo('learn.listMyths'),
  getQuiz: todo('learn.getQuiz'),
  checkAnswer: todo('learn.checkAnswer'),
};

const chat: ChatService = {
  // TODO: decodeList(ExpertNoteSchema, raw, toExpertNote).
  listExpertNotes: todo('chat.listExpertNotes'),
  markNoteRead: todo('chat.markNoteRead'),
  reportTranslation: todo('chat.reportTranslation'),
  getThread: todo('chat.getThread'),
  send: todo('chat.send'),
  getHelplines: todo('chat.getHelplines'),
};

const weather: WeatherService = {
  // TODO: WeatherSchema → toWeather.
  getForFarm: todo('weather.getForFarm'),
};

const admin: AdminService = {
  listFarmers: todo('admin.listFarmers'),
  getAnalytics: todo('admin.getAnalytics'),
  listRules: todo('admin.listRules'),
  // TODO: FarmerDetailSchema → toFarmerDetail.
  getFarmer: todo('admin.getFarmer'),
  // TODO: decodePage(ReviewItemSchema, raw, toReviewItem).
  listReviewQueue: todo('admin.listReviewQueue'),
  // TODO: ExpertNoteSchema → toExpertNote.
  sendAdvice: todo('admin.sendAdvice'),
};

export function createHttpServices(): Services {
  return {
    auth,
    profile,
    farms,
    uploads: createUploadService(uploadTransport),
    demo,
    analysis,
    soil,
    advisory,
    transition,
    treatments,
    learn,
    chat,
    weather,
    admin,
  };
}
