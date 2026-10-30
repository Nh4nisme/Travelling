import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type NotificationSettings = {
  bookingUpdates: boolean;
  promotions: boolean;
  messages: boolean;
};

export type AppPreferences = {
  theme: 'light' | 'dark' | 'system';
  language: 'English' | 'Tiếng Việt';
};

const NOTIF_KEY = 'settings_notifications';
const PREFS_KEY = 'settings_preferences';

const DEFAULT_NOTIFS: NotificationSettings = {
  bookingUpdates: true,
  promotions: false,
  messages: true,
};

const DEFAULT_PREFS: AppPreferences = {
  theme: 'system',
  language: 'English',
};

export const settingsStorage = {
  async getNotifications(): Promise<NotificationSettings> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') raw = globalThis.localStorage?.getItem(NOTIF_KEY) ?? null;
      else raw = await SecureStore.getItemAsync(NOTIF_KEY);

      return raw ? { ...DEFAULT_NOTIFS, ...JSON.parse(raw) } : DEFAULT_NOTIFS;
    } catch {
      return DEFAULT_NOTIFS;
    }
  },

  async saveNotifications(settings: NotificationSettings): Promise<void> {
    try {
      const raw = JSON.stringify(settings);
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(NOTIF_KEY, raw);
      else await SecureStore.setItemAsync(NOTIF_KEY, raw);
    } catch {}
  },

  async getPreferences(): Promise<AppPreferences> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') raw = globalThis.localStorage?.getItem(PREFS_KEY) ?? null;
      else raw = await SecureStore.getItemAsync(PREFS_KEY);

      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  },

  async savePreferences(prefs: AppPreferences): Promise<void> {
    try {
      const raw = JSON.stringify(prefs);
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(PREFS_KEY, raw);
      else await SecureStore.setItemAsync(PREFS_KEY, raw);
    } catch {}
  },
};
