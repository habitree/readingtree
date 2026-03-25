"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { QuickCaptureSheet } from "./quick-capture-sheet";
import { QuickCaptureDialog } from "./quick-capture-dialog";

/**
 * Quick Capture 반응형 어댑터
 * - lg(1024px) 이상: Dialog (PC)
 * - lg 미만: Sheet (모바일)
 *
 * isOpen이 false일 때는 둘 다 렌더링하지 않으므로
 * SSR hydration mismatch 걱정 없음
 */
export function QuickCaptureAdapter() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <QuickCaptureDialog />;
  }

  return <QuickCaptureSheet />;
}
