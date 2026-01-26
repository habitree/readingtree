import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, PartyPopper, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 감정적 변형 타입
 * - default: 기본 중립적 스타일
 * - encouraging: 격려하는 따뜻한 스타일 (새로운 시작, 첫 행동)
 * - celebratory: 축하하는 스타일 (목표 달성, 완료)
 * - curious: 탐험을 유도하는 스타일 (새로운 기능 발견)
 */
export type EmptyStateVariant = "default" | "encouraging" | "celebratory" | "curious";

const variantStyles: Record<EmptyStateVariant, {
  iconBg: string;
  iconRing: string;
  iconColor: string;
  accentIcon?: LucideIcon;
  accentText?: string;
}> = {
  default: {
    iconBg: "bg-primary/10",
    iconRing: "ring-primary/5",
    iconColor: "text-primary",
  },
  encouraging: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconRing: "ring-green-100 dark:ring-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    accentIcon: Heart,
    accentText: "시작이 반이에요!",
  },
  celebratory: {
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconRing: "ring-amber-100 dark:ring-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentIcon: PartyPopper,
    accentText: "대단해요!",
  },
  curious: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconRing: "ring-blue-100 dark:ring-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentIcon: Compass,
    accentText: "탐험을 시작해보세요",
  },
};

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  actionVariant?: "default" | "outline" | "secondary";
  /** 감정적 변형: encouraging(격려), celebratory(축하), curious(탐험) */
  variant?: EmptyStateVariant;
  /** 다음 행동 제안 텍스트 */
  nextStepHint?: string;
  /** 일러스트레이션 이미지 URL (선택) */
  illustrationSrc?: string;
}

/**
 * 빈 상태 컴포넌트
 * 데이터가 없을 때 사용자에게 명확한 안내와 다음 행동을 제시합니다.
 * 
 * UX 원칙 (디자인 가이드 기반):
 * - 명확한 메시지 전달 (간결한 문구)
 * - 다음 행동 제시 (전체 너비 버튼)
 * - 시각적 아이콘으로 맥락 제공 (색상 구분)
 * - 적절한 여백 (8dp 그리드 시스템)
 * - 시각적 계층 구조
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionVariant = "default",
  variant = "default",
  nextStepHint,
  illustrationSrc,
  className,
  ...props
}: EmptyStateProps) {
  const styles = variantStyles[variant];
  const AccentIcon = styles.accentIcon;

  return (
    <div
      className={cn(
        // 8dp 그리드 시스템: py-12 (48px), px-4 (16px)
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {/* 일러스트레이션 (선택적) */}
      {illustrationSrc && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={illustrationSrc}
            alt=""
            className="h-32 w-auto opacity-80"
          />
        </div>
      )}

      {/* 감정적 악센트 텍스트 */}
      {AccentIcon && styles.accentText && (
        <div className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <AccentIcon className={cn("h-4 w-4", styles.iconColor)} />
          <span>{styles.accentText}</span>
        </div>
      )}

      {Icon && !illustrationSrc && (
        // 아이콘 배경: 변형에 따른 색상 구분
        <div className={cn(
          "mb-6 rounded-full p-5 ring-4",
          styles.iconBg,
          styles.iconRing
        )}>
          <Icon className={cn("h-10 w-10", styles.iconColor)} />
        </div>
      )}

      {/* 타이포그래피 위계: 제목은 크고 굵게 */}
      <h3 className="text-xl font-bold mb-3 text-foreground leading-tight">
        {title}
      </h3>

      {description && (
        // 본문: 적절한 줄 길이 (max-w-md = 약 28rem = 448px, 한글 약 20-30자)
        <p className="text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {/* 다음 행동 제안 힌트 (Emotional Design - 빈 상태를 격려의 기회로 전환) */}
      {nextStepHint && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 mb-6 bg-muted/50 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3 w-3" />
          <span>{nextStepHint}</span>
        </div>
      )}

      {/* CTA: 전체 너비 버튼 (UX 원칙 06) */}
      {action && (
        <div className={cn(!nextStepHint && "mt-4")}>
          {action.href ? (
            <Button
              asChild
              variant={actionVariant}
              fullWidth
              className="max-w-sm"
            >
              <Link href={action.href}>
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button
              variant={actionVariant}
              onClick={action.onClick}
              fullWidth
              className="max-w-sm"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

