import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/store';
import { InboxProvider } from '@/features/inbox/context/InboxContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

/** Gom mọi provider (theme, language i18n, store, inbox socket...) tại đây. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppProvider>
          <InboxProvider>
            <ThemedStatusBar />
            {children}
          </InboxProvider>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
