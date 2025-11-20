import React, { createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const translations = {
  fr: {
    dashboard: "Tableau de bord",
    jobs: "Jobs",
    serviceCalls: "Appels de Service",
    schedule: "Horaire",
    calendar: "Calendrier",
    customers: "Clients",
    team: "Équipe",
    timeTracking: "Gestion du Temps",
    documents: "Documents",
    forms: "Formulaires",
    automations: "Automatisations",
    reports: "Rapports",
    profitability: "Rentabilité",
    costsManagement: "Gestion Coûts",
    gpsTracking: "Suivi GPS",
    quotations: "Soumissions",
    invoices: "Factures",
    assets: "Actifs",
    priceLists: "Listes de Prix",
    materials: "Matériaux",
    settings: "Paramètres",
    roles: "Rôles",
  },
  
  en: {
    dashboard: "Dashboard",
    jobs: "Jobs",
    serviceCalls: "Service Calls",
    schedule: "Schedule",
    calendar: "Calendar",
    customers: "Customers",
    team: "Team",
    timeTracking: "Time Tracking",
    documents: "Documents",
    forms: "Forms",
    automations: "Automations",
    reports: "Reports",
    profitability: "Profitability",
    costsManagement: "Costs Management",
    gpsTracking: "GPS Tracking",
    quotations: "Quotations",
    invoices: "Invoices",
    assets: "Assets",
    priceLists: "Price Lists",
    materials: "Materials",
    settings: "Settings",
    roles: "Roles",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { data: languageSettings } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: async () => {
      const settings = await base44.entities.LanguageSettings.list();
      return settings[0] || { language: 'fr' };
    },
  });

  const lang = languageSettings?.language || 'fr';
  
  const t = (key) => translations[lang]?.[key] || translations.fr[key] || key;

  return (
    <LanguageContext.Provider value={{ t, lang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { t: (key) => key, lang: 'fr' };
  }
  return context;
};