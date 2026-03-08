"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * 공유 페이지에서 ref 파라미터를 감지하여 쿠키에 저장
 * 렌더링 없이 조용히 동작하는 트래커 컴포넌트
 */
export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ref)) return;

    // 쿠키에 저장 (30일 유효)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `rt_ref=${ref}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

    // 소스 정보도 저장 (어떤 콘텐츠를 통해 왔는지)
    const path = window.location.pathname;
    let sourceType = "note";
    let sourceId = "";

    if (path.startsWith("/share/notes/")) {
      sourceType = "note";
      sourceId = path.split("/share/notes/")[1]?.split("?")[0] || "";
    } else if (path.startsWith("/share/reports/")) {
      sourceType = "report";
      sourceId = path.split("/share/reports/")[1]?.split("?")[0] || "";
    }

    if (sourceType && sourceId) {
      document.cookie = `rt_ref_source=${sourceType}:${sourceId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
