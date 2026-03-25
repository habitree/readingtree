"use client";

import { useEffect, useState } from "react";
import { QuickCaptureSheet } from "./quick-capture-sheet";
import { QuickCaptureDialog } from "./quick-capture-dialog";

/**
 * Quick Capture 반응형 어댑터
 *
 * Hydration mismatch 방지:
 * - 초기 렌더(SSR+첫 hydration)에서는 아무것도 렌더링하지 않음
 * - useEffect에서 클라이언트 판별 후 올바른 컴포넌트 마운트
 * - Sheet/Dialog 모두 isOpen=false일 때 DOM을 그리지 않으므로
 *   초기 빈 렌더가 시각적 차이를 만들지 않음
 */
export function QuickCaptureAdapter() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    setMounted(true);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // SSR / 첫 hydration 시에는 아무것도 렌더링하지 않음
  // (Quick Capture는 isOpen=false 상태이므로 시각적 차이 없음)
  if (!mounted) return null;

  return isDesktop ? <QuickCaptureDialog /> : <QuickCaptureSheet />;
}
