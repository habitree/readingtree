import { create } from "zustand";

export type Locale = "ko" | "en";

const STORAGE_KEY = "readtree-locale";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ko") return stored;
  } catch {}
  return "ko";
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  locale: getInitialLocale(),

  setLocale: (locale: Locale) => {
    set({ locale });
    try {
      localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    } catch {}
  },

  toggleLocale: () => {
    const next = get().locale === "ko" ? "en" : "ko";
    get().setLocale(next);
  },
}));
