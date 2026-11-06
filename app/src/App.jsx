import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from '@/components/ui/motion';
import { ServicesProvider } from '@/services';
import { useAuthBootstrap } from '@/hooks/useAuth';
import { useApplyPrefs } from '@/hooks/useEnvironment';
import { Toaster } from '@/components/ui';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import AppShell from '@/components/features/layout/AppShell';
import { FullScreenLoader, PublicOnly, RequireAuth, RequireRole } from '@/components/features/auth/Guards';
import LanguageGate from '@/components/features/layout/LanguageGate';
import { useIsFarmer } from '@/store/authStore';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Verify = lazy(() => import('@/pages/auth/Verify'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewAnalysis = lazy(() => import('@/pages/analysis/NewAnalysis'));
const Processing = lazy(() => import('@/pages/analysis/Processing'));
const OcrReview = lazy(() => import('@/pages/analysis/OcrReview'));
const Diagnosis = lazy(() => import('@/pages/analysis/Diagnosis'));
const Advisory = lazy(() => import('@/pages/analysis/Advisory'));
const Transition = lazy(() => import('@/pages/Transition'));
const Tracker = lazy(() => import('@/pages/Tracker'));
const SoilHistory = lazy(() => import('@/pages/SoilHistory'));
const Farms = lazy(() => import('@/pages/Farms'));
const Reports = lazy(() => import('@/pages/Reports'));
const Learn = lazy(() => import('@/pages/learn/Learn'));
const Article = lazy(() => import('@/pages/learn/Article'));
const Helpline = lazy(() => import('@/pages/Helpline'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminFarmers = lazy(() => import('@/pages/admin/AdminFarmers'));
const RulesLibrary = lazy(() => import('@/pages/admin/RulesLibrary'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const FarmerDetail = lazy(() => import('@/pages/admin/FarmerDetail'));
const ReviewQueue = lazy(() => import('@/pages/admin/ReviewQueue'));
const FarmerHome = lazy(() => import('@/farmer/FarmerHome'));
const FarmerCheck = lazy(() => import('@/farmer/FarmerCheck'));
const FarmerSprays = lazy(() => import('@/farmer/FarmerSprays'));
const FarmerPlan = lazy(() => import('@/farmer/FarmerPlan'));

/** Same route, simple screen for farmers, full screen for agronomists/admins. */
function ByRole({ farmer, expert }) {
  return useIsFarmer() ? farmer : expert;
}

const STAFF = ['agronomist', 'admin'];

function AppRoutes() {
  useAuthBootstrap();
  useApplyPrefs();
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
        </Route>
        <Route path="/app" element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<ByRole farmer={<FarmerHome />} expert={<Dashboard />} />} />
            <Route path="check" element={<FarmerCheck />} />
            <Route path="analysis/new" element={<NewAnalysis />} />
            <Route path="analysis/job/:jobId" element={<Processing />} />
            <Route path="analysis/:id/soil" element={<OcrReview />} />
            <Route path="analysis/:id/diagnosis" element={<Diagnosis />} />
            <Route path="analysis/:id/advisory" element={<Advisory />} />
            <Route path="transition" element={<ByRole farmer={<FarmerPlan />} expert={<Transition />} />} />
            <Route path="tracker" element={<ByRole farmer={<FarmerSprays />} expert={<Tracker />} />} />
            <Route path="soil" element={<SoilHistory />} />
            <Route path="farms" element={<Farms />} />
            <Route path="reports" element={<Reports />} />
            <Route path="learn" element={<Learn />} />
            <Route path="learn/:articleId" element={<Article />} />
            <Route path="help" element={<Helpline />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<RequireRole roles={STAFF} />}>
              <Route index element={<AdminOverview />} />
              <Route path="farmers" element={<AdminFarmers />} />
              <Route path="farmers/:farmerId" element={<FarmerDetail />} />
              <Route path="review" element={<ReviewQueue />} />
              <Route path="rules" element={<RulesLibrary />} />
            </Route>
            <Route path="*" element={<NotFound inApp />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App({ services }) {
  return (
    <ServicesProvider services={services}>
      <MotionConfig reducedMotion="always">
        <BrowserRouter>
          <ErrorBoundary>
            <LanguageGate>
              <AppRoutes />
            </LanguageGate>
          </ErrorBoundary>
          <Toaster />
        </BrowserRouter>
      </MotionConfig>
    </ServicesProvider>
  );
}
