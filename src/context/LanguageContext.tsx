import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { translations, type Language, type Translations } from '@/constants/translations';
import { settingsStorage } from '@/services/settingsStorage';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isVietnamese: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: async () => {},
  t: translations.en,
  isVietnamese: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  useEffect(() => {
    (async () => {
      try {
        const prefs = await settingsStorage.getPreferences();
        if (prefs?.language) {
          setLanguageState(prefs.language);
        }
      } catch {}
    })();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      const prefs = await settingsStorage.getPreferences();
      await settingsStorage.savePreferences({ ...prefs, language: newLang });
    } catch {}
  };

  const value = useMemo<LanguageContextType>(() => {
    const activeTranslations =
      language === 'Tiếng Việt' ? translations['Tiếng Việt'] : translations.en;
    return {
      language,
      setLanguage,
      t: activeTranslations,
      isVietnamese: language === 'Tiếng Việt',
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
export const useTranslation = () => {
  const { t, language, setLanguage, isVietnamese } = useContext(LanguageContext);
  return { t, language, setLanguage, isVietnamese };
};
