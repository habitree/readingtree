"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/lib/i18n";

const STORAGE_KEY = "readtree-locale";

/**
 * 언어 설정 초기화 컴포넌트
 * hydration 완료 후 localStorage에서 저장된 locale을 복원
 * SSR에서는 항상 "ko"로 시작하여 hydration mismatch 방지
 */
export function LanguageInitializer() {
  const { locale, setLocale, _hydrated } = useLanguageStore();

  // hydration 후 localStorage에서 실제 locale 복원
  useEffect(() => {
    if (_hydrated) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ko") {
        if (stored !== locale) {
          setLocale(stored);
        }
      }
    } catch {}
    useLanguageStore.setState({ _hydrated: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // document.lang 동기화
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
