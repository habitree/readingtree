"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface TypingIndicatorProps {
  /** 작은 크기 (인라인 사용) */
  small?: boolean;
  /** 아바타 표시 여부 */
  showAvatar?: boolean;
  className?: string;
}

/**
 * 타이핑 인디케이터 - AI가 응답을 생성 중임을 나타내는 3점 애니메이션
 *
 * 심리학적 효과:
 * - 응답 대기 시간 인지 감소 (perceived latency)
 * - AI가 "생각하고 있다"는 인간적 느낌 부여
 */
export function TypingIndicator({
  small = false,
  showAvatar = true,
  className,
}: TypingIndicatorProps) {
  const dotSize = small ? "h-1.5 w-1.5" : "h-2 w-2";
  const containerPadding = small ? "px-3 py-2" : "px-4 py-3";

  return (
    <div className={cn("flex gap-3 p-4", !showAvatar && "pl-0", className)}>
      {/* AI 아바타 */}
      {showAvatar && (
        <Avatar className={cn("shrink-0", small ? "h-6 w-6" : "h-8 w-8")}>
          <AvatarFallback className="bg-primary/10">
            <Bot className={cn(small ? "h-3 w-3" : "h-4 w-4", "text-primary")} />
          </AvatarFallback>
        </Avatar>
      )}

      {/* 타이핑 점 컨테이너 */}
      <div
        className={cn(
          "rounded-2xl bg-muted inline-flex items-center gap-1",
          containerPadding
        )}
      >
        {/* 3개의 점 애니메이션 */}
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(dotSize, "rounded-full bg-muted-foreground/60")}
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 인라인 타이핑 인디케이터 (텍스트 옆에 표시)
 */
export function InlineTypingIndicator({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 ml-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1 w-1 rounded-full bg-current"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/**
 * 텍스트와 함께 표시되는 타이핑 상태
 */
export function TypingStatus({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const resolvedText = text ?? t("chat.thinking");
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Bot className="h-4 w-4 text-primary animate-pulse" />
      <span>{resolvedText}</span>
      <InlineTypingIndicator />
    </div>
  );
}
