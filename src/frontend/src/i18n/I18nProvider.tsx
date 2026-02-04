import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';
import { getStoredLanguage, setStoredLanguage, translate } from './i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // Initialize with detected language (includes stored preference or browser language)
  const [language, setLanguageState] = useState<Language>(() => getStoredLanguage());

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setStoredLanguage(newLanguage);
  };

  const t = (key: string, params?: Record<string, string>) => {
    return translate(language, key, params);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18nContext() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}
