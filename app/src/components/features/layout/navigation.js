import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Phone,
  Sprout,
  BookOpen,
  CalendarDays,
  History,
  LayoutDashboard,
  Library,
  MessageCircle,
  Recycle,
  ScanLine,
  Settings,
  TestTube,
  Tractor,
  Users,
} from 'lucide-react';

/** Navigation map shared by the desktop sidebar, mobile bottom bar and "More" sheet. */
export const NAV_GROUPS = [
  {
    id: 'work',
    items: [
      { to: '/app', end: true, icon: LayoutDashboard, labelKey: 'nav.dashboard', tour: 'nav-dashboard' },
      { to: '/app/analysis/new', icon: ScanLine, labelKey: 'nav.newAnalysis', tour: 'nav-analysis' },
      { to: '/app/reports', icon: History, labelKey: 'nav.reports' },
      { to: '/app/tracker', icon: CalendarDays, labelKey: 'nav.tracker' },
    ],
  },
  {
    id: 'plan',
    items: [
      { to: '/app/transition', icon: Recycle, labelKey: 'nav.transition', tour: 'nav-transition' },
      { to: '/app/soil', icon: TestTube, labelKey: 'nav.soil' },
      { to: '/app/farms', icon: Tractor, labelKey: 'nav.farms' },
    ],
  },
  {
    id: 'learn',
    items: [
      { to: '/app/learn', icon: BookOpen, labelKey: 'nav.learn' },
      { to: '/app/help', icon: MessageCircle, labelKey: 'nav.help' },
    ],
  },
  {
    id: 'admin',
    roles: ['agronomist', 'admin'],
    items: [
      { to: '/app/admin', end: true, icon: BarChart3, labelKey: 'nav.adminOverview' },
      { to: '/app/admin/farmers', icon: Users, labelKey: 'nav.adminFarmers' },
      { to: '/app/admin/review', icon: ClipboardCheck, labelKey: 'nav.adminReview' },
      { to: '/app/admin/rules', icon: Library, labelKey: 'nav.adminRules' },
    ],
  },
];

export const SETTINGS_ITEM = { to: '/app/settings', icon: Settings, labelKey: 'nav.settings' };

export const BOTTOM_ITEMS = [
  { to: '/app', end: true, icon: LayoutDashboard, labelKey: 'nav.home' },
  { to: '/app/analysis/new', icon: ScanLine, labelKey: 'nav.analyse', tour: 'nav-analysis' },
  { to: '/app/tracker', icon: CalendarDays, labelKey: 'nav.tracker' },
  { to: '/app/learn', icon: BookOpen, labelKey: 'nav.learn' },
];

/** The farmer app: few, large, plain items. */
export const FARMER_NAV = [
  { to: '/app', end: true, icon: LayoutDashboard, labelKey: 'nav.home', tour: 'nav-dashboard' },
  { to: '/app/check', icon: ScanLine, labelKey: 'farmer.tiles.check', tour: 'nav-analysis' },
  { to: '/app/tracker', icon: CalendarCheck, labelKey: 'farmer.tiles.sprays' },
  { to: '/app/learn', icon: BookOpen, labelKey: 'nav.learn' },
  { to: '/app/help', icon: Phone, labelKey: 'farmer.tiles.help' },
];

export const FARMER_EXTRA = [
  { to: '/app/transition', icon: Sprout, labelKey: 'farmer.tiles.plan', tour: 'nav-transition' },
  { to: '/app/reports', icon: History, labelKey: 'farmer.tiles.history' },
  { to: '/app/farms', icon: Tractor, labelKey: 'nav.farms' },
];
