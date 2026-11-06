import type { AuthService, ProfileService } from '@/services/contracts';
import { decode, decodeList } from '@/services/decode';
import { appError } from '@/services/errors';
import { DataExportSchema, DemoAccountSchema, OtpChallengeSchema, ProfileSchema, SessionSchema, UserSchema } from '@/services/schemas';
import { toDataExport, toDemoAccount, toOtpChallenge, toProfile, toSession, toUser } from '@/services/mappers';
import type { Lang, User } from '@/types';
import { commit, currentUserId, db } from '../db';
import { DEMO_ACCOUNTS, type MockUser } from '../data/reference';
import { translator } from '../data/localize';
import { fail, respond, uid } from '../latency';

const DEMO_OTP = '123456';
const OTP_TTL_SEC = 300;

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

const mask = (phone: string) => `+91 ••••• •${phone.slice(-4)}`;

function userDto(u: MockUser): User {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    roles: u.roles,
    village: u.village,
    district: u.district,
    state: u.state,
    preferredLang: db.userLang[u.id] ?? null,
  };
}

function sessionFor(u: MockUser) {
  db.sessionUserId = u.id;
  commit();
  return { user: userDto(u), expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString() };
}

function startOtp(phone: string, registration: Parameters<AuthService['register']>[0] | null) {
  const challengeId = uid('otp');
  db.pendingOtp = { challengeId, phone, code: DEMO_OTP, expiresAt: Date.now() + OTP_TTL_SEC * 1000, registration };
  commit();
  return { challengeId, phoneMasked: mask(phone), expiresInSec: OTP_TTL_SEC, resendInSec: 30, demoCode: DEMO_OTP };
}

export const mockAuth: AuthService = {
  async getDemoAccounts(lang: Lang) {
    const { t } = translator(lang);
    const raw = DEMO_ACCOUNTS.map((a) => {
      const u = db.users.find((x) => x.id === a.userId)!;
      return { id: a.userId, name: u.name, role: a.role, description: t(a.description) };
    });
    return decodeList(DemoAccountSchema, await respond(raw, 150, 300), toDemoAccount);
  },

  async requestOtp(phoneInput) {
    const phone = normalisePhone(phoneInput);
    if (!phone) {
      await respond(null, 150, 300);
      throw appError('VALIDATION', 'Invalid phone', { retryable: false, fieldErrors: { phone: 'invalid' } });
    }
    return decode(OtpChallengeSchema, await respond(startOtp(phone, null)), toOtpChallenge);
  },

  async register(input) {
    const phone = normalisePhone(input.phone);
    const fieldErrors: Record<string, string> = {};
    if (!phone) fieldErrors.phone = 'invalid';
    else if (db.users.some((u) => u.phone === phone)) fieldErrors.phone = 'exists';
    if (input.name.trim().length < 2) fieldErrors.name = 'required';
    if (!input.district) fieldErrors.district = 'required';
    if (Object.keys(fieldErrors).length > 0 || !phone) {
      await respond(null, 200, 400);
      throw appError('VALIDATION', 'Registration invalid', { retryable: false, fieldErrors });
    }
    return decode(OtpChallengeSchema, await respond(startOtp(phone, input)), toOtpChallenge);
  },

  async verifyOtp(challengeId, code) {
    const pending = db.pendingOtp;
    if (!pending || pending.challengeId !== challengeId) return fail('OTP_EXPIRED', 'No active OTP');
    if (Date.now() > pending.expiresAt) return fail('OTP_EXPIRED', 'OTP expired');
    if (code.trim() !== pending.code) return fail('OTP_INVALID', 'Wrong code');

    let user = db.users.find((u) => u.phone === pending.phone);
    if (!user) {
      const reg = pending.registration;
      user = {
        id: uid('user'),
        name: reg?.name.trim() || 'New farmer',
        phone: pending.phone,
        roles: [reg?.role ?? 'farmer'],
        village: null,
        district: reg?.district ?? null,
        state: reg?.state ?? null,
      };
      db.users.push(user);
      if (reg) db.userLang[user.id] = reg.lang;
    }
    db.pendingOtp = null;
    return decode(SessionSchema, await respond(sessionFor(user)), toSession);
  },

  async loginAsDemo(accountId) {
    const user = db.users.find((u) => u.id === accountId);
    if (!user) return fail('NOT_FOUND', 'Demo account missing');
    return decode(SessionSchema, await respond(sessionFor(user), 300, 600), toSession);
  },

  async refresh() {
    const user = db.users.find((u) => u.id === db.sessionUserId);
    if (!user) return fail('UNAUTHORIZED', 'No session');
    return decode(SessionSchema, await respond(sessionFor(user), 100, 200), toSession);
  },

  async logout() {
    db.sessionUserId = null;
    commit();
    await respond(null, 100, 200);
  },

  async getCurrentUser() {
    const user = db.users.find((u) => u.id === db.sessionUserId);
    const raw = await respond(user ? userDto(user) : null, 120, 260);
    return raw ? decode(UserSchema, raw, toUser) : null;
  },
};

function me(): MockUser {
  const user = db.users.find((u) => u.id === currentUserId());
  if (!user) throw appError('UNAUTHORIZED', 'No session', { retryable: false });
  return user;
}

export const mockProfile: ProfileService = {
  async getProfile() {
    return decode(ProfileSchema, await respond({ user: userDto(me()), notifications: db.notifications }), toProfile);
  },

  async updateProfile(update) {
    const user = me();
    if (update.name !== undefined) {
      if (update.name.trim().length < 2) {
        await respond(null, 150, 300);
        throw appError('VALIDATION', 'Name too short', { retryable: false, fieldErrors: { name: 'required' } });
      }
      user.name = update.name.trim();
    }
    if (update.village !== undefined) user.village = update.village;
    if (update.district !== undefined) user.district = update.district;
    if (update.state !== undefined) user.state = update.state;
    if (update.preferredLang) db.userLang[user.id] = update.preferredLang;
    commit();
    return decode(ProfileSchema, await respond({ user: userDto(user), notifications: db.notifications }), toProfile);
  },

  async updateNotifications(prefs) {
    db.notifications = { ...prefs };
    commit();
    return decode(ProfileSchema, await respond({ user: userDto(me()), notifications: db.notifications }), toProfile);
  },

  async requestDataExport() {
    const user = me();
    const farms = db.farms.filter((f) => f.ownerId === user.id);
    const farmIds = new Set(farms.map((f) => f.id));
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Demo data export – generated from mock data.',
      user: userDto(user),
      farms,
      soilRecords: db.soilRecords.filter((s) => farmIds.has(s.farmId)),
      analyses: db.analyses.filter((a) => a.ownerId === user.id && !a.pending),
      treatments: db.treatments.filter((t) => farmIds.has(t.farmId)),
    };
    const raw = {
      fileName: `cropwise-export-${new Date().toISOString().slice(0, 10)}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(payload, null, 2),
    };
    return decode(DataExportSchema, await respond(raw, 600, 1200), toDataExport);
  },
};
