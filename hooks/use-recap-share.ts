/**
 * 월간 독서결산 공유 다이얼로그 전역 상태 (스탬프 use-stamp-share 미러).
 *
 * RecapView/RecapSection의 "공유" 버튼이 openShare(shareId)를 호출 →
 * LazyOverlays에 마운트된 RecapShareDialog가 반응. 본체는 lazy 청크.
 */

import { create } from "zustand";

interface RecapShareState {
  isOpen: boolean;
  /** 공유 대상 monthly_recaps.share_id */
  targetShareId: string | null;
  openShare: (shareId: string) => void;
  close: () => void;
}

export const useRecapShareStore = create<RecapShareState>((set) => ({
  isOpen: false,
  targetShareId: null,
  openShare: (shareId) => set({ isOpen: true, targetShareId: shareId }),
  close: () => set({ isOpen: false }),
}));
