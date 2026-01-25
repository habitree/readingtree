"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEVEL_STYLES } from "@/types/points";
import { LevelBadge } from "./level-badge";

type BadgeSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<BadgeSize, { width: number; height: number }> = {
  xs: { width: 16, height: 16 },
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
};

interface LevelBadgeImageProps {
  level: number;
  size?: BadgeSize;
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
}

/**
 * 이미지 기반 레벨 뱃지 컴포넌트
 *
 * AI 생성 이미지를 사용하여 고품질 나무 뱃지 표시
 * 이미지 로드 실패 시 기존 SVG LevelBadge로 폴백
 *
 * 사용법:
 * 1. AI로 레벨별 나무 이미지 10종 생성 (Midjourney, DALL-E 등)
 * 2. public/images/trees/ 디렉토리에 level-1.webp ~ level-10.webp 저장
 */
export function LevelBadgeImage({
  level,
  size = "sm",
  animated = true,
  showGlow = true,
  className,
}: LevelBadgeImageProps) {
  const [hasError, setHasError] = useState(false);
  const { width, height } = sizeMap[size];
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];

  const shouldAnimate = animated && levelStyle.effect !== "none";
  const shouldGlow = showGlow && (levelStyle.effect === "glow" || levelStyle.effect === "premium");

  // 이미지 로드 실패 시 SVG 폴백
  if (hasError) {
    return (
      <LevelBadge
        level={level}
        size={size}
        animated={animated}
        showGlow={showGlow}
        className={className}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center level-badge-hover",
        className
      )}
      animate={
        shouldAnimate && levelStyle.effect === "premium"
          ? { scale: [1, 1.05, 1] }
          : shouldAnimate && levelStyle.effect === "glow"
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={{
        duration: levelStyle.effect === "premium" ? 2 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Image
        src={`/images/trees/level-${level}.webp`}
        alt={`Level ${level} tree`}
        width={width}
        height={height}
        className={cn(
          "object-contain",
          shouldGlow && "drop-shadow-[0_0_8px_var(--glow-color)]"
        )}
        style={{
          // @ts-ignore - CSS custom property
          "--glow-color": `${levelStyle.color}80`,
        }}
        onError={() => setHasError(true)}
        priority={size === "lg"}
      />
    </motion.div>
  );
}

/**
 * 레벨 뱃지 자동 선택 컴포넌트
 *
 * 이미지가 있으면 이미지 사용, 없으면 SVG 사용
 * 성능 최적화를 위해 이미지 우선 시도
 */
export function LevelBadgeAuto({
  level,
  size = "sm",
  animated = true,
  showGlow = true,
  preferImage = true,
  className,
}: LevelBadgeImageProps & { preferImage?: boolean }) {
  if (preferImage) {
    return (
      <LevelBadgeImage
        level={level}
        size={size}
        animated={animated}
        showGlow={showGlow}
        className={className}
      />
    );
  }

  return (
    <LevelBadge
      level={level}
      size={size}
      animated={animated}
      showGlow={showGlow}
      className={className}
    />
  );
}
