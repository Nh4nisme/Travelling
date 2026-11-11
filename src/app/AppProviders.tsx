import { useEffect, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/store';
import { InboxProvider } from '@/features/inbox/context/InboxContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { notificationService } from '@/services/notificationService';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function NotificationInitializer() {
  useEffect(() => {
    void notificationService.requestPermission();
  }, []);
  return null;
}

/** Gom mọi provider (theme, language i18n, store, inbox socket...) tại đây. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppProvider>
          <InboxProvider>
            <ThemedStatusBar />
            <NotificationInitializer />
            {children}
          </InboxProvider>
        </AppProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
