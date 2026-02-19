"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/lib/i18n";

/**
 * 언어 설정 초기화 컴포넌트
 * localStorage에서 저장된 locale을 읽어 document.lang 속성을 동기화
 */
export function LanguageInitializer() {
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
