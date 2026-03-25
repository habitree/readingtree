import { create } from "zustand";

export type Locale = "ko" | "en";

const STORAGE_KEY = "readtree-locale";

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  _hydrated: boolean;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  // SSR/클라이언트 모두 "ko"로 시작하여 hydration mismatch 방지
  // useEffect에서 localStorage 값으로 동기화
  locale: "ko",
  _hydrated: false,

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
