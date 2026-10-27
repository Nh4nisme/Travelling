import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/store';

/** Gom mọi provider (theme, query client, i18n...) tại đây. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <AppProvider><StatusBar style="dark" />{children}</AppProvider>;
}
