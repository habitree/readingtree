import { create } from "zustand";
import { isUpgradeModalOnCooldown, markUpgradeModalDismissed } from "@/lib/subscription/upgrade-copy";

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
  /** 업그레이드 모달 닫기 (쿨다운 마킹 포함) */
  closeUpgradeModal: () => void;
  /** 자발적 업그레이드 (프로필 CTA 등)용 직접 호출 */
  openForUpgrade: (featureKey: string, headline?: string) => void;
}

/**
 * 업그레이드 유도 모달 전역 상태
 * 한도 도달 시 showUpgradeModal()로 트리거. 4시간 쿨다운 적용.
 */
export const useUpgradeModal = create<UpgradeModalState>((set, get) => ({
  open: false,
  feature: "",
  message: "",
  featureKey: null,

  showUpgradeModal: (data) => {
    const featureKey = extractFeatureFromError(data.message);
    if (isUpgradeModalOnCooldown(featureKey)) {
      // 쿨다운 중이면 노출하지 않음 (스팸 방지)
      return;
    }
    set({
      open: true,
      feature: data.feature,
      message: data.message,
      featureKey,
    });
  },

  closeUpgradeModal: () => {
    const { featureKey } = get();
    markUpgradeModalDismissed(featureKey);
    set({ open: false, feature: "", message: "", featureKey: null });
  },

  openForUpgrade: (featureKey, headline) =>
    set({
      open: true,
      feature: headline ?? "프리미엄 업그레이드",
      message: "더 많은 AI 기능과 높은 한도를 사용해보세요.",
      featureKey,
    }),
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
