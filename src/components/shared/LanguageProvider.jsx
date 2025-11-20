import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { translations } from '@/utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const lang = languageSettings?.language || 'fr';
  
  const t = useMemo(() => (key) => {
    return translations[lang]?.[key] || translations.fr[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ t, lang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return {
      t: (key) => translations.fr[key] || key,
      lang: 'fr'
    };
  }
  return context;
}