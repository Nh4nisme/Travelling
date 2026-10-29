import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Conversation } from '../types';

const BASE_STORAGE_KEY = '@travelling_inbox_v2';

function getKey(scopeKey?: string) {
  const safeScope = (scopeKey ?? 'default').replace(/[^a-zA-Z0-9_]/g, '_');
  return `${BASE_STORAGE_KEY}_${safeScope}`;
}

export const inboxStorage = {
  async getConversations(scopeKey?: string): Promise<Conversation[] | null> {
    const key = getKey(scopeKey);
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = globalThis.localStorage?.getItem(key) ?? null;
      } else {
        raw = await SecureStore.getItemAsync(key);
      }
      if (!raw) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  },

  async saveConversations(conversations: Conversation[], scopeKey?: string): Promise<void> {
    const key = getKey(scopeKey);
    try {
      const serialized = JSON.stringify(conversations);
      if (Platform.OS === 'web') {
        globalThis.localStorage?.setItem(key, serialized);
      } else {
        await SecureStore.setItemAsync(key, serialized);
      }
    } catch {}
  },

  async clear(scopeKey?: string): Promise<void> {
    const key = getKey(scopeKey);
    try {
      if (Platform.OS === 'web') {
        globalThis.localStorage?.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {}
  },
};
