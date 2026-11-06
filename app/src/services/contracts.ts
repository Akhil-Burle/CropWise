/**
 * Service interfaces – the ONLY contract between the UI and any data source.
 *
 * Rules every implementation must follow:
 *  - Resolve with the domain types from src/types (validated with the Zod schemas in ./schemas
 *    and converted with ./mappers).
 *  - Reject with an AppError (see ./errors). Never throw raw errors or HTTP responses.
 *  - Do all agronomic computation (dose per area, dilution, PHI dates, ROI, SOC projection,
 *    transition shares). The UI only renders what it receives.
 *  - Content methods take `lang` and return content in that language when available, setting
 *    `contentLang` to the language actually served.
 */
import type {
  AdminAnalytics,
  AdvisoryParams,
  AdvisoryReport,
  AnalysisInput,
  AnalysisJobStatus,
  AnalysisListParams,
  AnalysisResult,
  AnalysisSummary,
  AppError,
  Article,
  ArticleListParams,
  ArticleSummary,
  ChatMessage,
  Crop,
  DataExport,
  DemoAccount,
  DemoScenario,
  DualAdvisory,
  ExpertNote,
  FarmerDetail,
  ReviewItem,
  SendAdviceInput,
  Farm,
  FarmInput,
  FarmerListParams,
  FarmerSummary,
  GlossaryTerm,
  HarvestSafeResult,
  Helpline,
  ISODate,
  Lang,
  MythFact,
  NotificationPrefs,
  OtpChallenge,
  PageParams,
  Paginated,
  PhiAlert,
  Profile,
  ProfileUpdate,
  QuizAnswerResult,
  QuizQuestion,
  Region,
  RegisterInput,
  RuleEntry,
  RuleListParams,
  SampleAsset,
  SeasonTask,
  SeasonTimelineItem,
  Session,
  ShareMessage,
  SoilComparison,
  SoilReport,
  SoilTrend,
  SoilValueInput,
  TransitionPlan,
  TransitionSpeed,
  Treatment,
  TreatmentInput,
  TreatmentListParams,
  UploadKind,
  UploadRef,
  User,
  WeatherReport,
} from '@/types';

export interface AuthService {
  /** Accounts offered on the "Continue as demo user" buttons. Real sources may return []. */
  getDemoAccounts(lang: Lang): Promise<DemoAccount[]>;
  requestOtp(phone: string): Promise<OtpChallenge>;
  verifyOtp(challengeId: string, code: string): Promise<Session>;
  /** Creates the account and starts OTP verification for it. */
  register(input: RegisterInput): Promise<OtpChallenge>;
  loginAsDemo(accountId: string): Promise<Session>;
  /** Renew the session. Token storage (cookie or bearer) is the adapter's private concern. */
  refresh(): Promise<Session>;
  logout(): Promise<void>;
  /** Null when there is no valid session. */
  getCurrentUser(): Promise<User | null>;
}

export interface ProfileService {
  getProfile(): Promise<Profile>;
  updateProfile(update: ProfileUpdate): Promise<Profile>;
  updateNotifications(prefs: NotificationPrefs): Promise<Profile>;
  requestDataExport(): Promise<DataExport>;
}

export interface FarmService {
  list(params?: PageParams): Promise<Paginated<Farm>>;
  get(id: string): Promise<Farm>;
  create(input: FarmInput): Promise<Farm>;
  update(id: string, input: FarmInput): Promise<Farm>;
  remove(id: string): Promise<void>;
  listCrops(lang: Lang): Promise<Crop[]>;
  listRegions(): Promise<Region[]>;
  getSeasonTimeline(farmId: string, lang: Lang): Promise<SeasonTimelineItem[]>;
}

export interface UploadConstraints {
  acceptedMimeTypes: string[];
  maxBytes: number;
  /** Images larger than this (px, longest edge) are compressed client-side before upload. */
  maxDimension: number;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface UploadService {
  constraints(kind: UploadKind): UploadConstraints;
  /** Synchronous pre-flight check so the UI can reject a file before uploading. */
  validate(file: File, kind: UploadKind): AppError | null;
  /** Validates, compresses images, then uploads (multipart or pre-signed URL – adapter's choice). */
  upload(file: File, kind: UploadKind, options?: UploadOptions): Promise<UploadRef>;
}

export interface DemoService {
  listSamples(kind: UploadKind, lang: Lang): Promise<SampleAsset[]>;
  listScenarios(lang: Lang): Promise<DemoScenario[]>;
  /** Turns a bundled sample into an UploadRef usable in AnalysisInput. */
  useSample(sampleId: string): Promise<UploadRef>;
  /** Makes the next authenticated call fail with UNAUTHORIZED (to demo session expiry). */
  simulateSessionExpiry(): Promise<void>;
  resetDemoData(): Promise<void>;
}

export interface AnalysisService {
  submit(input: AnalysisInput): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<AnalysisJobStatus>;
  /** Available once status is `completed`. May contain partial results (soil or leaf failed). */
  getResult(jobId: string, lang: Lang): Promise<AnalysisResult>;
  cancel(jobId: string): Promise<void>;
  /** Re-runs a failed or cancelled job with the same input. */
  retry(jobId: string): Promise<{ jobId: string }>;
  get(analysisId: string, lang: Lang): Promise<AnalysisResult>;
  /** Farmer-confirmed or corrected soil values. Returns the result with re-classified values. */
  confirmSoil(analysisId: string, values: SoilValueInput[], lang: Lang): Promise<AnalysisResult>;
  list(params: AnalysisListParams): Promise<Paginated<AnalysisSummary>>;
  remove(analysisId: string): Promise<void>;
}

export interface SoilService {
  listReports(farmId: string, params: PageParams & { lang: Lang }): Promise<Paginated<SoilReport>>;
  /** Latest report for a farm, or across the user's farms when farmId is null. */
  getLatest(farmId: string | null, lang: Lang): Promise<SoilReport | null>;
  getTrend(farmId: string): Promise<SoilTrend>;
  compare(reportAId: string, reportBId: string, lang: Lang): Promise<SoilComparison>;
}

export interface AdvisoryService {
  /** Doses are computed for `area` in `areaUnit`. Call again whenever the area changes. */
  getAdvisory(params: AdvisoryParams): Promise<DualAdvisory>;
  save(advisoryId: string): Promise<{ saved: boolean }>;
  /** Server-generated PDF when available; `unavailable` means the UI should use its print fallback. */
  getAdvisoryReport(advisoryId: string, lang: Lang): Promise<AdvisoryReport>;
  getShareMessage(advisoryId: string, lang: Lang): Promise<ShareMessage>;
}

export interface TransitionService {
  getPlan(params: { farmId: string; speed: TransitionSpeed; lang: Lang }): Promise<TransitionPlan>;
  setTaskDone(params: { planId: string; taskId: string; done: boolean; lang: Lang }): Promise<SeasonTask>;
}

export interface TreatmentService {
  list(params: TreatmentListParams): Promise<Paginated<Treatment>>;
  create(input: TreatmentInput, lang: Lang): Promise<Treatment>;
  /** The service recomputes status and the harvest-safe date from PHI. */
  markDone(id: string, doneDate: ISODate, lang: Lang): Promise<Treatment>;
  skip(id: string, lang: Lang): Promise<Treatment>;
  setReminder(id: string, enabled: boolean, lang: Lang): Promise<Treatment>;
  calculateHarvestSafe(params: { applicationDate: ISODate; phiDays: number }): Promise<HarvestSafeResult>;
  getPhiAlerts(lang: Lang): Promise<PhiAlert[]>;
}

export interface LearnService {
  listArticles(params: ArticleListParams): Promise<Paginated<ArticleSummary>>;
  getArticle(id: string, lang: Lang): Promise<Article>;
  toggleBookmark(articleId: string): Promise<{ bookmarked: boolean }>;
  listGlossary(params: { lang: Lang; search?: string }): Promise<GlossaryTerm[]>;
  listMyths(lang: Lang): Promise<MythFact[]>;
  getQuiz(lang: Lang): Promise<QuizQuestion[]>;
  checkAnswer(params: { questionId: string; optionId: string; lang: Lang }): Promise<QuizAnswerResult>;
}

export interface ChatService {
  /** Advice sent to the signed-in farmer by an agronomist. */
  listExpertNotes(): Promise<ExpertNote[]>;
  markNoteRead(noteId: string): Promise<void>;
  /** "Report wrong translation" from any screen. */
  reportTranslation(input: { lang: Lang; screen: string; note: string }): Promise<void>;
  getThread(lang: Lang): Promise<ChatMessage[]>;
  /** Sends the user's message and resolves with the assistant's reply. */
  send(text: string, lang: Lang): Promise<ChatMessage>;
  getHelplines(lang: Lang): Promise<Helpline[]>;
}

export interface WeatherService {
  getForFarm(farmId: string, lang: Lang): Promise<WeatherReport>;
}

export interface AdminService {
  listFarmers(params: FarmerListParams): Promise<Paginated<FarmerSummary>>;
  getAnalytics(lang: Lang): Promise<AdminAnalytics>;
  listRules(params: RuleListParams): Promise<Paginated<RuleEntry>>;
  getFarmer(farmerId: string, lang: Lang): Promise<FarmerDetail>;
  /** Analyses that need an expert's eyes (low confidence, unconfirmed soil, partial). */
  listReviewQueue(params: PageParams & { lang: Lang }): Promise<Paginated<ReviewItem>>;
  sendAdvice(input: SendAdviceInput): Promise<ExpertNote>;
}

export interface Services {
  auth: AuthService;
  profile: ProfileService;
  farms: FarmService;
  uploads: UploadService;
  demo: DemoService;
  analysis: AnalysisService;
  soil: SoilService;
  advisory: AdvisoryService;
  transition: TransitionService;
  treatments: TreatmentService;
  learn: LearnService;
  chat: ChatService;
  weather: WeatherService;
  admin: AdminService;
}
