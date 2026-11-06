import { z } from 'zod';
import { LangSchema } from './common';

export const RoleSchema = z.enum(['farmer', 'agronomist', 'admin']);

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  roles: z.array(RoleSchema).min(1),
  village: z.string().nullish(),
  district: z.string().nullish(),
  state: z.string().nullish(),
  preferredLang: LangSchema.nullish(),
});

export const SessionSchema = z.object({
  user: UserSchema,
  expiresAt: z.string().nullish(),
});

export const OtpChallengeSchema = z.object({
  challengeId: z.string(),
  phoneMasked: z.string(),
  expiresInSec: z.number().int().positive(),
  resendInSec: z.number().int().nonnegative().nullish(),
  demoCode: z.string().nullish(),
});

export const DemoAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: RoleSchema,
  description: z.string().nullish(),
});

export const NotificationPrefsSchema = z.object({
  sprayReminders: z.boolean(),
  phiAlerts: z.boolean(),
  weatherAlerts: z.boolean(),
  learningTips: z.boolean(),
  channel: z.enum(['sms', 'push', 'whatsapp']),
});

export const ProfileSchema = z.object({
  user: UserSchema,
  notifications: NotificationPrefsSchema,
});

export const DataExportSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  content: z.string(),
});

export type UserDto = z.infer<typeof UserSchema>;
export type SessionDto = z.infer<typeof SessionSchema>;
export type OtpChallengeDto = z.infer<typeof OtpChallengeSchema>;
export type DemoAccountDto = z.infer<typeof DemoAccountSchema>;
export type ProfileDto = z.infer<typeof ProfileSchema>;
export type DataExportDto = z.infer<typeof DataExportSchema>;
