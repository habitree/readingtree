"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "readtree_anonymous_id";

/**
 * 비로그인 사용자를 식별하기 위한 로컬 UUID 관리
 * - localStorage에 저장, 없으면 새로 생성
 * - SSR에서는 null 반환 (hydration 불일치 방지)
 */
export function useAnonymousId(): string | null {
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
      }
      setAnonymousId(id);
    } catch {
      // localStorage 접근 실패 (프라이빗 브라우징 등) → null 유지
    }
  }, []);

  return anonymousId;
}
