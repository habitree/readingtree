/**
 * 스탬프 공유 다이얼로그 전역 상태.
 *
 * 진입점 3곳(/stamps 그리드, RecordSheet 종료/상세, 책 상세 ReadingTimeTab)이
 * 동일하게 `openShare(logId)`를 호출 → LazyOverlays에 마운트된 StampShareDialog가
 * 반응. 다이얼로그 본체는 lazy 청크.
 */

import { create } from "zustand";

interface StampShareState {
  isOpen: boolean;
  /** 공유 대상 reading_logs.id */
  targetLogId: string | null;
  /** 다이얼로그 진입 직후에 사용할 책 표시용 prefill (없어도 됨; 없으면 server fetch) */
  prefillBookTitle: string | null;
  openShare: (logId: string, opts?: { bookTitle?: string | null }) => void;
  close: () => void;
}

export const useStampShareStore = create<StampShareState>((set) => ({
  isOpen: false,
  targetLogId: null,
  prefillBookTitle: null,
  openShare: (logId, opts) =>
    set({
      isOpen: true,
      targetLogId: logId,
      prefillBookTitle: opts?.bookTitle ?? null,
    }),
  close: () => set({ isOpen: false }),
}));
