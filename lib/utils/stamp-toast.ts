"use client";

import { toast } from "sonner";

interface ShowSaveToastOptions {
  /** 저장된 reading_log id (사후 첨부 액션의 타깃) */
  logId: string;
  /** 사진이 함께 저장됐는가 (true면 "공유하기" 액션, false면 "사진 추가") */
  hasImage: boolean;
  /** 적립 포인트 (있으면 description 에 표시) */
  pointsEarned?: number;
  /** 토스트 제목 — 기본값은 "기록을 남겼어요!" 또는 "스탬프를 남겼어요!" */
  title?: string;
  /** "사진 추가" 클릭 시 호출 (UI 라우팅 결정은 caller 가) */
  onAddPhoto?: (logId: string) => void;
  /** "공유하기" 클릭 시 호출 */
  onShare?: (logId: string) => void;
}

/**
 * 기록/스탬프 저장 성공 토스트 통합 헬퍼.
 * - 사진 없음 → 액션 "사진 추가" (사후 첨부 흐름 진입)
 * - 사진 있음 → 액션 "공유하기"
 * 사용처: createReadingStamp, saveReadingSession, attachStampToLog 호출 후
 */
export function showSaveSuccessToast({
  logId,
  hasImage,
  pointsEarned,
  title,
  onAddPhoto,
  onShare,
}: ShowSaveToastOptions) {
  const defaultTitle = hasImage ? "스탬프를 남겼어요!" : "기록을 남겼어요!";
  const description = pointsEarned ? `+${pointsEarned}P 적립` : undefined;

  const action = hasImage
    ? onShare
      ? { label: "공유하기", onClick: () => onShare(logId) }
      : undefined
    : onAddPhoto
      ? { label: "사진 추가", onClick: () => onAddPhoto(logId) }
      : undefined;

  toast.success(title ?? defaultTitle, {
    description,
    action,
    duration: 6000,
  });
}
