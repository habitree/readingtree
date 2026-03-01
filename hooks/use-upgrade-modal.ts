import { create } from "zustand";

interface UpgradeModalState {
  /** 모달 열림 여부 */
  open: boolean;
  /** 한도에 도달한 기능명 */
  feature: string;
  /** 서버에서 받은 에러 메시지 */
  message: string;
  /** 업그레이드 모달 열기 */
  showUpgradeModal: (data: { feature: string; message: string }) => void;
  /** 업그레이드 모달 닫기 */
  closeUpgradeModal: () => void;
}

/**
 * 구독 업그레이드 유도 모달 전역 상태
 * 한도 도달 시 showUpgradeModal()로 트리거
 */
export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  open: false,
  feature: "",
  message: "",

  showUpgradeModal: (data) =>
    set({ open: true, feature: data.feature, message: data.message }),

  closeUpgradeModal: () =>
    set({ open: false, feature: "", message: "" }),
}));

/** 에러 메시지가 구독 한도 관련인지 판별 */
export function isUpgradeLimitError(message: string): boolean {
  return (
    message.includes("한도") ||
    message.includes("구독을 업그레이드") ||
    message.includes("이상 구독에서")
  );
}
