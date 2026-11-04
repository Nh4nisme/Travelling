import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/store';
import { InboxProvider } from '@/features/inbox/context/InboxContext';

/** Gom mọi provider (theme, query client, i18n...) tại đây. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <InboxProvider>
        <StatusBar style="dark" />
        {children}
      </InboxProvider>
    </AppProvider>
  );
}
