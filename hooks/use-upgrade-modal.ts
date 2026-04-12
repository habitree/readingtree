import { create } from "zustand";

interface UpgradeModalState {
  /** 모달 열림 여부 */
  open: boolean;
  /** 한도에 도달한 기능명 */
  feature: string;
  /** 서버에서 받은 에러 메시지 */
  message: string;
  /** 한도 도달 기능 키 (ai_chat | ocr | ai_report) */
  featureKey: string | null;
  /** 업그레이드 모달 열기 */
  showUpgradeModal: (data: { feature: string; message: string }) => void;
  /** 업그레이드 모달 닫기 */
  closeUpgradeModal: () => void;
}

/**
 * 업그레이드 유도 모달 전역 상태
 * 한도 도달 시 showUpgradeModal()로 트리거
 */
export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  open: false,
  feature: "",
  message: "",
  featureKey: null,

  showUpgradeModal: (data) =>
    set({
      open: true,
      feature: data.feature,
      message: data.message,
      featureKey: extractFeatureFromError(data.message),
    }),

  closeUpgradeModal: () =>
    set({ open: false, feature: "", message: "", featureKey: null }),
}));

/** 에러 메시지가 기능 한도 관련인지 판별 */
export function isUpgradeLimitError(message: string): boolean {
  return (
    message.includes("한도") ||
    message.includes("포인트로 추가")
  );
}

/** 에러 메시지에서 기능 키 추출 */
export function extractFeatureFromError(message: string): string | null {
  if (message.includes("AI 채팅")) return "ai_chat";
  if (message.includes("OCR")) return "ocr";
  if (message.includes("AI 리포트") || message.includes("AI 독서 리포트")) return "ai_report";
  if (message.includes("모임 생성")) return "groups_create";
  if (message.includes("모임 참여")) return "groups_join";
  if (message.includes("서재")) return "bookshelf_create";
  if (message.includes("기록 한도")) return "notes_create";
  return null;
}
