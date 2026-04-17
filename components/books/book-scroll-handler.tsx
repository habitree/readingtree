"use client";

import { useEffect } from "react";

/**
 * 책 상세 페이지에서 해시를 처리하여 스크롤하는 컴포넌트
 * - #book-info → 책 정보 영역으로 스크롤
 * - #note-{id} → 해당 기록으로 ���크롤 + 하이라이트 애니메이션
 */
export function BookScrollHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    // 약간의 지연을 두고 스크롤 (페이지 로드 완료 후)
    setTimeout(() => {
      if (hash.startsWith("#note-")) {
        // 기록 카드로 스크롤 + 하이라���트
        const noteId = hash.slice(1); // "note-{id}"
        const element = document.getElementById(noteId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary/50", "transition-all", "duration-1000");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary/50");
          }, 2000);
        }
      } else {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 300);
  }, []);

  return null;
}
