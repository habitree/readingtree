"use client";

import { useEffect } from "react";

/**
 * 작성 중인 변경이 저장되지 않았을 때 페이지 이탈 경고.
 *
 *   useBeforeUnload(isDirty, "저장하지 않은 변경이 있어요. 정말 나갈까요?");
 *
 * 현대 브라우저는 `event.returnValue` 설정 시 기본 경고 메시지를 보여준다.
 * 커스텀 문자열은 대부분 무시되지만 returnValue 할당만으로 경고는 떠요.
 */
export function useBeforeUnload(enabled: boolean, message?: string) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // returnValue는 legacy 브라우저 호환성용
      event.returnValue = message ?? "";
      return message ?? "";
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled, message]);
}
