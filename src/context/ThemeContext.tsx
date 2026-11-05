import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { settingsStorage, type AppPreferences } from '@/services/settingsStorage';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColors = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  soft: string;
  primary: string;
  primaryLight: string;
  boxBg: string;
  dialogBg: string;
  star: string;
  danger: string;
  dangerSoft: string;
  statusBarStyle: 'light' | 'dark';
};

export const lightTheme: ThemeColors = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1B1F27',
  muted: '#8A8F9C',
  border: '#DADDE4',
  soft: '#F3F4F6',
  primary: '#00BCD4',
  primaryLight: '#C9F5FA',
  boxBg: '#FFFFFF',
  dialogBg: '#FFFFFF',
  star: '#F5B335',
  danger: '#D94A55',
  dangerSoft: '#FFEBEA',
  statusBarStyle: 'dark',
};

export const darkTheme: ThemeColors = {
  bg: '#121212',
  card: '#1E1E1E',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#2E3440',
  soft: '#1F2430',
  primary: '#00BCD4',
  primaryLight: '#004D56',
  boxBg: '#1E1E1E',
  dialogBg: '#1E1E1E',
  star: '#F5B335',
  danger: '#EF4444',
  dangerSoft: '#451A1A',
  statusBarStyle: 'light',
};

type ThemeContextType = {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  colors: lightTheme,
  setThemeMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      try {
        const prefs = await settingsStorage.getPreferences();
        if (prefs?.theme) {
          setThemeModeState(prefs.theme);
        }
      } catch {}
    })();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    setThemeModeState(newMode);
    try {
      const prefs = await settingsStorage.getPreferences();
      await settingsStorage.savePreferences({ ...prefs, theme: newMode });
    } catch {}
  };

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const value = useMemo<ThemeContextType>(() => {
    return {
      themeMode,
      isDark,
      colors,
      setThemeMode,
    };
  }, [themeMode, isDark, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
