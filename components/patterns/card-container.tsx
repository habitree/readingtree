"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { elevation, radius, transition } from "@/lib/design-tokens";
import { useTranslation } from "@/lib/i18n";

// ============================================================================
// CardImageSlot - 카드 이미지 영역
// ============================================================================

export interface CardImageSlotProps {
  /** 이미지 URL */
  src?: string | null;
  /** 이미지 alt 텍스트 */
  alt: string;
  /** 이미지 비율 (기본: 3/4) */
  aspectRatio?: "3/4" | "1/1" | "16/9" | "4/3";
  /** 이미지 없을 때 표시할 fallback */
  fallback?: React.ReactNode;
  /** next/image sizes 속성 */
  sizes?: string;
  className?: string;
}

const aspectRatioMap = {
  "3/4": "aspect-[3/4]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
} as const;

function CardImageSlot({
  src,
  alt,
  aspectRatio = "3/4",
  fallback,
  sizes = "(max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw",
  className,
}: CardImageSlotProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        aspectRatioMap[aspectRatio],
        className
      )}
      role="img"
      aria-label={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", transition.fast)}
          sizes={sizes}
        />
      ) : (
        fallback ?? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <span className="text-xs text-muted-foreground">{t("books.noImage")}</span>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================================
// CardContainer - Slot 기반 카드 래퍼
// ============================================================================

export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 링크 URL (클릭 가능한 카드) */
  href?: string;
  /** 접근성 라벨 */
  ariaLabel?: string;
  /** 카드 변형 */
  variant?: "default" | "compact" | "horizontal";
  /** 호버 효과 활성화 */
  hoverable?: boolean;
  /** 이미지 영역 (CardImageSlot 등) */
  imageSlot?: React.ReactNode;
  /** 배지 영역 (우측 상단 절대 위치) */
  badgeSlot?: React.ReactNode;
  /** 콘텐츠 영역 (본문) */
  contentSlot?: React.ReactNode;
  /** 하단 영역 (태그, 날짜 등) */
  footerSlot?: React.ReactNode;
  /** 삭제 버튼 (절대 위치, 호버 시 표시) */
  deleteSlot?: React.ReactNode;
  /** 오버레이 위 추가 요소 */
  overlaySlot?: React.ReactNode;
}

function CardContainer({
  href,
  ariaLabel,
  variant = "default",
  hoverable = true,
  imageSlot,
  badgeSlot,
  contentSlot,
  footerSlot,
  deleteSlot,
  overlaySlot,
  className,
  children,
  ...props
}: CardContainerProps) {
  const isHorizontal = variant === "horizontal";

  const cardInner = (
    <Card
      className={cn(
        "h-full overflow-hidden",
        hoverable && "hover:shadow-lg cursor-pointer",
        hoverable && transition.base,
        className
      )}
    >
      <CardContent className="p-0">
        <div className={cn(isHorizontal && "flex")}>
          {/* 이미지 영역 */}
          {imageSlot && (
            <div
              className={cn(
                "relative overflow-hidden",
                isHorizontal ? "shrink-0 w-20 sm:w-24" : `w-full ${radius.md}`,
                !isHorizontal && "rounded-b-none"
              )}
            >
              {imageSlot}
              {/* 이미지 위 배지 */}
              {badgeSlot && !isHorizontal && (
                <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-[1]">
                  {badgeSlot}
                </div>
              )}
              {/* 이미지 위 오버레이 */}
              {overlaySlot}
            </div>
          )}

          {/* 콘텐츠 영역 */}
          <div
            className={cn(
              "flex-1 min-w-0",
              variant === "compact"
                ? "p-1.5 sm:p-2 space-y-0.5 sm:space-y-1"
                : "p-3 sm:p-4",
              isHorizontal && "flex flex-col"
            )}
          >
            {/* 가로 레이아웃에서는 배지를 콘텐츠 상단에 */}
            {isHorizontal && badgeSlot && (
              <div className="flex items-center gap-1.5 mb-2">
                {badgeSlot}
              </div>
            )}
            {contentSlot}
            {footerSlot && (
              <div
                className={cn(
                  isHorizontal && "mt-auto pt-2 border-t border-border/50"
                )}
              >
                {footerSlot}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* 추가 children (호환성) */}
      {children}
    </Card>
  );

  // 삭제 버튼 래퍼
  const deleteOverlay = deleteSlot && (
    <div
      className={cn(
        "absolute top-0.5 right-0.5 sm:top-2 sm:right-2 z-10",
        transition.fast,
        // 모바일: 축소 + 반투명, 터치 시 불투명
        "scale-75 sm:scale-100",
        "opacity-50 active:opacity-100",
        // 데스크톱: 호버 시 표시
        "sm:opacity-0 sm:group-hover:opacity-100"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {deleteSlot}
    </div>
  );

  return (
    <div className="relative group" {...props}>
      {href ? (
        <Link href={href} aria-label={ariaLabel} className="block h-full">
          {cardInner}
        </Link>
      ) : (
        cardInner
      )}
      {deleteOverlay}
    </div>
  );
}

export { CardContainer, CardImageSlot };
