/**
 * 업그레이드 모달 맥락별 헤드라인·설명 매핑.
 *
 *   const copy = getUpgradeCopy("ai_chat");
 *   // { headline: "AI 채팅을 계속 이어가세요", description: "..." }
 */

export type UpgradeFeatureKey =
  | "ai_chat"
  | "ai_report"
  | "ocr"
  | "groups_create"
  | "groups_join"
  | "bookshelf_create"
  | "notes_create";

export type UpgradeCopy = {
  headline: string;
  description: string;
  ctaPrimary: string;
};

const DEFAULT_COPY: UpgradeCopy = {
  headline: "더 깊은 독서를 이어가세요",
  description: "포인트를 충전하면 이 기능을 계속 사용할 수 있어요.",
  ctaPrimary: "포인트 충전하기",
};

const UPGRADE_COPY: Record<UpgradeFeatureKey, UpgradeCopy> = {
  ai_chat: {
    headline: "AI 채팅을 계속 이어가세요",
    description: "내 독서 맥락을 이해하는 AI와의 대화를 이어가려면 포인트가 필요해요.",
    ctaPrimary: "포인트 충전하기",
  },
  ai_report: {
    headline: "새로운 AI 리포트를 생성할까요?",
    description: "기록을 분석해 인사이트 리포트를 만들려면 포인트가 필요해요.",
    ctaPrimary: "포인트 충전하기",
  },
  ocr: {
    headline: "책 페이지를 더 편하게 기록하세요",
    description: "사진을 찍으면 OCR이 필사를 자동 완성해드려요.",
    ctaPrimary: "포인트 충전하기",
  },
  groups_create: {
    headline: "새 모임을 시작해보세요",
    description: "포인트로 모임 생성 한도를 늘릴 수 있어요.",
    ctaPrimary: "포인트 충전하기",
  },
  groups_join: {
    headline: "더 많은 모임에 참여하세요",
    description: "포인트로 동시 참여 모임 수를 늘릴 수 있어요.",
    ctaPrimary: "포인트 충전하기",
  },
  bookshelf_create: {
    headline: "서재를 더 세분화해보세요",
    description: "포인트로 서재를 추가 생성할 수 있어요.",
    ctaPrimary: "포인트 충전하기",
  },
  notes_create: {
    headline: "기록을 계속 이어가세요",
    description: "포인트로 기록 한도를 늘릴 수 있어요.",
    ctaPrimary: "포인트 충전하기",
  },
};

export function getUpgradeCopy(featureKey: string | null | undefined): UpgradeCopy {
  if (!featureKey) return DEFAULT_COPY;
  return UPGRADE_COPY[featureKey as UpgradeFeatureKey] ?? DEFAULT_COPY;
}

/**
 * 쿨다운: 같은 feature_key로 X시간 이내 "나중에 하기"한 경우 재노출 방지.
 * sessionStorage 기반 (브라우저 탭 종료 시 리셋).
 */
const COOLDOWN_STORAGE_PREFIX = "upgradeModalDismissedAt_";
const COOLDOWN_HOURS = 4;

export function isUpgradeModalOnCooldown(featureKey: string | null | undefined): boolean {
  if (typeof window === "undefined" || !featureKey) return false;
  try {
    const raw = window.sessionStorage.getItem(COOLDOWN_STORAGE_PREFIX + featureKey);
    if (!raw) return false;
    const dismissedAt = Number.parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    const elapsedMs = Date.now() - dismissedAt;
    return elapsedMs < COOLDOWN_HOURS * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function markUpgradeModalDismissed(featureKey: string | null | undefined): void {
  if (typeof window === "undefined" || !featureKey) return;
  try {
    window.sessionStorage.setItem(
      COOLDOWN_STORAGE_PREFIX + featureKey,
      Date.now().toString(),
    );
  } catch {
    // ignore
  }
}
