/**
 * Device layer. Screens call `platform.*` and never check whether they run in a browser or
 * in the Android app. The implementation is chosen once, here, at startup.
 * Native plugins are imported lazily so the website never downloads them.
 */
import { Capacitor } from '@capacitor/core';
import type { Lang } from '@/types';

export interface ReminderInput {
  id: number;
  title: string;
  body: string;
  at: Date;
}

export interface Platform {
  isNative: boolean;
  name: 'web' | 'android' | 'ios';
  camera: {
    /** Native camera on Android. Returns null on web (use the file input) or when cancelled. */
    takePhoto(): Promise<File | null>;
  };
  /** Small key/value store that survives app restarts (session hints, outbox, caches). */
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
  speech: {
    supported(): boolean;
    speak(text: string, lang: Lang): Promise<void>;
    stop(): Promise<void>;
  };
  notifications: {
    schedule(reminder: ReminderInput): Promise<void>;
    cancel(id: number): Promise<void>;
  };
}

const VOICE: Record<Lang, string> = {
  en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN',
  bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', ml: 'ml-IN', or: 'or-IN',
};

/* ---------------- Web ---------------- */

const webSpeech: Platform['speech'] = {
  supported: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  async speak(text, lang) {
    if (!webSpeech.supported()) return;
    window.speechSynthesis.cancel();
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = VOICE[lang];
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
      if (voice) u.voice = voice;
      u.rate = 0.92;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  },
  async stop() {
    if (webSpeech.supported()) window.speechSynthesis.cancel();
  },
};

const web: Platform = {
  isNative: false,
  name: 'web',
  camera: { takePhoto: async () => null },
  storage: {
    get: async (k) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
    set: async (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* storage full – ignore */
      }
    },
    remove: async (k) => localStorage.removeItem(k),
  },
  speech: webSpeech,
  notifications: { schedule: async () => undefined, cancel: async () => undefined },
};

/* ---------------- Android (Capacitor) ---------------- */

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

const native: Platform = {
  isNative: true,
  name: Capacitor.getPlatform() === 'ios' ? 'ios' : 'android',
  camera: {
    async takePhoto() {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 80,
          width: 1600,
          correctOrientation: true,
        });
        return photo.dataUrl ? dataUrlToFile(photo.dataUrl, `photo-${Date.now()}.${photo.format || 'jpg'}`) : null;
      } catch {
        return null; // user cancelled or denied permission
      }
    },
  },
  storage: {
    async get(key) {
      const { Preferences } = await import('@capacitor/preferences');
      return (await Preferences.get({ key })).value;
    },
    async set(key, value) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
    },
    async remove(key) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
    },
  },
  speech: {
    supported: () => true,
    async speak(text, lang) {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({ text, lang: VOICE[lang], rate: 0.92 });
      } catch {
        // No offline voice for this language on the phone. TODO: Bhashini TTS via the backend.
        await webSpeech.speak(text, lang);
      }
    },
    async stop() {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      await TextToSpeech.stop().catch(() => undefined);
    },
  },
  notifications: {
    async schedule({ id, title, body, at }) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;
      await LocalNotifications.schedule({ notifications: [{ id, title, body, schedule: { at } }] });
    },
    async cancel(id) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id }] });
    },
  },
};

export const platform: Platform = Capacitor.isNativePlatform() ? native : web;
