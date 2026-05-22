import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enChat from "./locales/en/chat.json";
import enCommon from "./locales/en/common.json";
import enConsole from "./locales/en/console.json";
import enLayout from "./locales/en/layout.json";
import enOffice from "./locales/en/office.json";
import enPanels from "./locales/en/panels.json";
import ptBrChat from "./locales/pt-BR/chat.json";
import ptBrCommon from "./locales/pt-BR/common.json";
import ptBrConsole from "./locales/pt-BR/console.json";
import ptBrLayout from "./locales/pt-BR/layout.json";
import ptBrOffice from "./locales/pt-BR/office.json";
import ptBrPanels from "./locales/pt-BR/panels.json";
import zhChat from "./locales/zh/chat.json";
import zhCommon from "./locales/zh/common.json";
import zhConsole from "./locales/zh/console.json";
import zhLayout from "./locales/zh/layout.json";
import zhOffice from "./locales/zh/office.json";
import zhPanels from "./locales/zh/panels.json";

export const supportedLngs = ["zh", "en", "pt-BR"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const namespaces = ["common", "layout", "office", "panels", "chat", "console"] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zhCommon,
        layout: zhLayout,
        office: zhOffice,
        panels: zhPanels,
        chat: zhChat,
        console: zhConsole,
      },
      en: {
        common: enCommon,
        layout: enLayout,
        office: enOffice,
        panels: enPanels,
        chat: enChat,
        console: enConsole,
      },
      "pt-BR": {
        common: ptBrCommon,
        layout: ptBrLayout,
        office: ptBrOffice,
        panels: ptBrPanels,
        chat: ptBrChat,
        console: ptBrConsole,
      },
    },
    supportedLngs: [...supportedLngs],
    fallbackLng: "zh",
    defaultNS: "common",
    ns: [...namespaces],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
