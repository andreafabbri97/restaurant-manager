import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import itTranslations from '../locales/it.json';
import enTranslations from '../locales/en.json';

export type Language = 'it' | 'en';
type TranslationKey = string;

const translations: Record<Language, Record<string, unknown>> = {
  it: itTranslations,
  en: enTranslations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('kebab_language');
    return (saved as Language) || 'it';
  });

  useEffect(() => {
    localStorage.setItem('kebab_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  // Funzione t() per ottenere traduzione
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Chiave non trovata, ritorna la chiave stessa
      }
    }

    if (typeof value !== 'string') return key;

    // Sostituisci parametri {{param}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramName) =>
        String(params[paramName] ?? `{{${paramName}}}`)
      );
    }

    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
