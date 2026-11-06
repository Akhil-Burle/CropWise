import type { ISODate, Lang } from './common';

export type Role = 'farmer' | 'agronomist' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  roles: Role[];
  village: string | null;
  district: string | null;
  state: string | null;
  preferredLang: Lang | null;
}

export interface Session {
  user: User;
  /** Null when the backend manages expiry itself (e.g. http-only cookies). */
  expiresAt: ISODate | null;
}

export interface OtpChallenge {
  challengeId: string;
  phoneMasked: string;
  expiresInSec: number;
  resendInSec: number;
  /** Only populated by non-production data sources so a demo can be completed. */
  demoCode: string | null;
}

export interface RegisterInput {
  name: string;
  phone: string;
  role: Extract<Role, 'farmer' | 'agronomist'>;
  state: string;
  district: string;
  lang: Lang;
}

export interface DemoAccount {
  id: string;
  name: string;
  role: Role;
  description: string;
}

export type NotificationChannel = 'sms' | 'push' | 'whatsapp';

export interface NotificationPrefs {
  sprayReminders: boolean;
  phiAlerts: boolean;
  weatherAlerts: boolean;
  learningTips: boolean;
  channel: NotificationChannel;
}

export interface Profile {
  user: User;
  notifications: NotificationPrefs;
}

export interface ProfileUpdate {
  name?: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  preferredLang?: Lang;
}

export interface DataExport {
  fileName: string;
  mimeType: string;
  content: string;
}
