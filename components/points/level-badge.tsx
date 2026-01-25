"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEVEL_STYLES, TREE_GROWTH_STAGES } from "@/types/points";

type BadgeSize = "xs" | "sm" | "md" | "lg";

interface LevelBadgeProps {
  level: number;
  size?: BadgeSize;
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
}

const sizeConfig: Record<BadgeSize, { width: number; height: number; viewBox: string }> = {
  xs: { width: 16, height: 16, viewBox: "0 0 32 32" },
  sm: { width: 24, height: 24, viewBox: "0 0 32 32" },
  md: { width: 32, height: 32, viewBox: "0 0 32 32" },
  lg: { width: 48, height: 48, viewBox: "0 0 32 32" },
};

/**
 * 레벨별 미니 나무 뱃지 컴포넌트
 *
 * 이모지를 대체하는 수채화 스타일 SVG 아이콘
 * - xs: 16px - 인라인 텍스트용
 * - sm: 24px - 리스트 아이템용
 * - md: 32px - 카드 헤더용
 * - lg: 48px - 강조 표시용
 */
export function LevelBadge({
  level,
  size = "sm",
  animated = true,
  showGlow = true,
  className,
}: LevelBadgeProps) {
  const config = sizeConfig[size];
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];
  const treeStage = TREE_GROWTH_STAGES[level] || TREE_GROWTH_STAGES[1];

  const shouldAnimate = animated && levelStyle.effect !== "none";
  const shouldGlow = showGlow && (levelStyle.effect === "glow" || levelStyle.effect === "premium");

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
      <svg
        width={config.width}
        height={config.height}
        viewBox={config.viewBox}
        className={cn(
          shouldGlow && "glow-effect",
          levelStyle.effect === "premium" && "premium-shimmer"
        )}
        style={shouldGlow ? { color: levelStyle.color } : undefined}
      >
        <defs>
          {/* 수채화 필터 */}
          <filter id={`wc-${level}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
            <feGaussianBlur stdDeviation="0.3" />
          </filter>

          {/* 잎 그라디언트 */}
          <radialGradient id={`leaf-${level}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={adjustColor(treeStage.leafColor, 25)} />
            <stop offset="100%" stopColor={treeStage.leafColor} />
          </radialGradient>

          {/* 줄기 그라디언트 */}
          <linearGradient id={`trunk-${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={adjustColor(treeStage.trunkColor, -10)} />
            <stop offset="100%" stopColor={adjustColor(treeStage.trunkColor, 10)} />
          </linearGradient>

          {/* 황금빛 그라디언트 */}
          {level === 10 && (
            <radialGradient id="golden-badge" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff9c4" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </radialGradient>
          )}
        </defs>

        {/* 배경 원 (땅) */}
        <ellipse cx="16" cy="29" rx="10" ry="2" fill="#8B7355" opacity="0.3" />

        {/* 레벨별 나무 렌더링 */}
        <TreeIcon level={level} treeStage={treeStage} />
      </svg>
    </motion.div>
  );
}

/**
 * 레벨별 나무 아이콘 렌더링
 */
function TreeIcon({
  level,
  treeStage,
}: {
  level: number;
  treeStage: typeof TREE_GROWTH_STAGES[1];
}) {
  // 레벨 1: 씨앗
  if (level === 1) {
    return (
      <g filter={`url(#wc-${level})`}>
        <ellipse cx="16" cy="26" rx="5" ry="3.5" fill={`url(#trunk-${level})`} />
        <ellipse cx="14.5" cy="25" rx="1.5" ry="1" fill={adjustColor(treeStage.trunkColor, 25)} opacity="0.5" />
      </g>
    );
  }

  // 레벨 2: 새싹
  if (level === 2) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q15.5,22 16,18"
          stroke={`url(#trunk-${level})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M16,19 Q12,16 11,18 Q12,22 16,20"
          fill={`url(#leaf-${level})`}
        />
        <path
          d="M16,19 Q20,16 21,18 Q20,22 16,20"
          fill={adjustColor(treeStage.leafColor, -10)}
        />
      </g>
    );
  }

  // 레벨 3: 떡잎
  if (level === 3) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q15,22 16,15"
          stroke={`url(#trunk-${level})`}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="16" cy="12" r="6" fill={`url(#leaf-${level})`} />
        <circle cx="12" cy="14" r="4" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <circle cx="20" cy="14" r="4" fill={adjustColor(treeStage.leafColor, -5)} opacity="0.9" />
      </g>
    );
  }

  // 레벨 4: 어린나무
  if (level === 4) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q15,20 16,12"
          stroke={`url(#trunk-${level})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M14,18 Q10,17 8,19"
          stroke={`url(#trunk-${level})`}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M18,18 Q22,17 24,19"
          stroke={`url(#trunk-${level})`}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="16" cy="10" rx="8" ry="6" fill={`url(#leaf-${level})`} />
        <ellipse cx="11" cy="12" rx="4" ry="3" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <ellipse cx="21" cy="12" rx="4" ry="3" fill={adjustColor(treeStage.leafColor, -5)} opacity="0.9" />
      </g>
    );
  }

  // 레벨 5: 나무
  if (level === 5) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q14.5,18 16,9"
          stroke={`url(#trunk-${level})`}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M14,16 Q9,15 6,18" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M18,16 Q23,15 26,18" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="16" cy="8" rx="9" ry="7" fill={`url(#leaf-${level})`} />
        <ellipse cx="9" cy="11" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 15)} opacity="0.9" />
        <ellipse cx="23" cy="11" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, -5)} opacity="0.9" />
        <ellipse cx="16" cy="13" rx="6" ry="4" fill={adjustColor(treeStage.leafColor, -10)} opacity="0.85" />
        {/* 빛나는 하이라이트 */}
        <ellipse cx="13" cy="6" rx="2" ry="1.5" fill="white" opacity="0.3" />
      </g>
    );
  }

  // 레벨 6: 큰나무
  if (level === 6) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q14,17 16,7"
          stroke={`url(#trunk-${level})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M13,15 Q7,14 4,17" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M19,15 Q25,14 28,17" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M14,12 Q9,11 6,13" stroke={`url(#trunk-${level})`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M18,12 Q23,11 26,13" stroke={`url(#trunk-${level})`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="16" cy="7" rx="10" ry="7" fill={`url(#leaf-${level})`} />
        <ellipse cx="7" cy="11" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 15)} opacity="0.9" />
        <ellipse cx="25" cy="11" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <ellipse cx="16" cy="13" rx="7" ry="4" fill={adjustColor(treeStage.leafColor, -15)} opacity="0.85" />
        <ellipse cx="12" cy="5" rx="2" ry="1.5" fill="white" opacity="0.35" />
      </g>
    );
  }

  // 레벨 7: 꽃나무
  if (level === 7) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q14,16 16,6"
          stroke={`url(#trunk-${level})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M13,14 Q6,13 3,16" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M19,14 Q26,13 29,16" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="16" cy="6" rx="10" ry="6" fill={`url(#leaf-${level})`} />
        <ellipse cx="6" cy="10" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <ellipse cx="26" cy="10" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 5)} opacity="0.9" />
        <ellipse cx="16" cy="12" rx="7" ry="4" fill={adjustColor(treeStage.leafColor, -10)} opacity="0.85" />
        {/* 꽃들 */}
        <circle cx="10" cy="7" r="2" fill="#FFB6C1" />
        <circle cx="10" cy="7" r="0.8" fill="#FFD700" />
        <circle cx="22" cy="8" r="2" fill="#FFC0CB" />
        <circle cx="22" cy="8" r="0.8" fill="#FFD700" />
        <circle cx="16" cy="4" r="2.2" fill="#FFB6C1" />
        <circle cx="16" cy="4" r="0.9" fill="#FFD700" />
        <ellipse cx="13" cy="4" rx="1.5" ry="1" fill="white" opacity="0.3" />
      </g>
    );
  }

  // 레벨 8: 열매나무
  if (level === 8) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q14,15 16,5"
          stroke={`url(#trunk-${level})`}
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M12,13 Q5,12 2,15" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M20,13 Q27,12 30,15" stroke={`url(#trunk-${level})`} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="16" cy="5" rx="11" ry="6" fill={`url(#leaf-${level})`} />
        <ellipse cx="5" cy="9" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 15)} opacity="0.9" />
        <ellipse cx="27" cy="9" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <ellipse cx="16" cy="11" rx="8" ry="4" fill={adjustColor(treeStage.leafColor, -10)} opacity="0.85" />
        {/* 열매들 */}
        <circle cx="9" cy="8" r="2.5" fill="#FF6347" />
        <ellipse cx="8" cy="7" rx="0.8" ry="0.6" fill="white" opacity="0.5" />
        <circle cx="23" cy="7" r="2.5" fill="#EE4444" />
        <ellipse cx="22" cy="6" rx="0.8" ry="0.6" fill="white" opacity="0.5" />
        <circle cx="16" cy="9" r="2.2" fill="#FF6B6B" />
        <ellipse cx="15" cy="8" rx="0.7" ry="0.5" fill="white" opacity="0.5" />
        {/* 꽃 */}
        <circle cx="13" cy="4" r="1.5" fill="#FFB6C1" />
        <circle cx="19" cy="5" r="1.5" fill="#FFC0CB" />
        <ellipse cx="12" cy="3" rx="1.5" ry="1" fill="white" opacity="0.3" />
      </g>
    );
  }

  // 레벨 9: 세계수
  if (level === 9) {
    return (
      <g filter={`url(#wc-${level})`}>
        <path
          d="M16,27 Q13,14 16,3"
          stroke={`url(#trunk-${level})`}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M11,12 Q4,11 1,14" stroke={`url(#trunk-${level})`} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M21,12 Q28,11 31,14" stroke={`url(#trunk-${level})`} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M13,8 Q7,7 4,9" stroke={`url(#trunk-${level})`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M19,8 Q25,7 28,9" stroke={`url(#trunk-${level})`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 청록색 잎 */}
        <ellipse cx="16" cy="4" rx="12" ry="6" fill={`url(#leaf-${level})`} />
        <ellipse cx="4" cy="9" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 15)} opacity="0.9" />
        <ellipse cx="28" cy="9" rx="5" ry="4" fill={adjustColor(treeStage.leafColor, 10)} opacity="0.9" />
        <ellipse cx="16" cy="10" rx="9" ry="4" fill={adjustColor(treeStage.leafColor, -15)} opacity="0.85" />
        {/* 열매 */}
        <circle cx="8" cy="7" r="2" fill="#FF6B6B" />
        <circle cx="24" cy="6" r="2" fill="#EE4444" />
        {/* 꽃 */}
        <circle cx="14" cy="3" r="1.5" fill="#FFB6C1" />
        <circle cx="20" cy="4" r="1.5" fill="#FFC0CB" />
        {/* 빛나는 효과 */}
        <ellipse cx="11" cy="2" rx="2" ry="1.5" fill="white" opacity="0.4" />
        {/* 오로라 파티클 */}
        <circle cx="6" cy="4" r="1" fill="#2dd4bf" opacity="0.6" />
        <circle cx="26" cy="5" r="1" fill="#ffd700" opacity="0.6" />
      </g>
    );
  }

  // 레벨 10: 황금숲
  return (
    <g filter={`url(#wc-${level})`}>
      <path
        d="M16,27 Q12,13 16,2"
        stroke="#B8860B"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M10,11 Q3,10 0,13" stroke="#B8860B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M22,11 Q29,10 32,13" stroke="#B8860B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M12,7 Q6,6 3,8" stroke="#DAA520" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20,7 Q26,6 29,8" stroke="#DAA520" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 황금빛 잎 */}
      <ellipse cx="16" cy="3" rx="13" ry="6" fill="url(#golden-badge)" />
      <ellipse cx="3" cy="8" rx="5" ry="4" fill="#FFD700" opacity="0.9" />
      <ellipse cx="29" cy="8" rx="5" ry="4" fill="#FFC107" opacity="0.9" />
      <ellipse cx="16" cy="9" rx="10" ry="4" fill="#DAA520" opacity="0.85" />
      {/* 황금 열매 */}
      <circle cx="7" cy="6" r="2" fill="#FFD700" />
      <ellipse cx="6" cy="5" rx="0.6" ry="0.4" fill="white" opacity="0.6" />
      <circle cx="25" cy="5" r="2" fill="#FFC107" />
      <ellipse cx="24" cy="4" rx="0.6" ry="0.4" fill="white" opacity="0.6" />
      <circle cx="16" cy="7" r="2.2" fill="#FFE082" />
      {/* 꽃 */}
      <circle cx="12" cy="2" r="1.8" fill="#fff5f5" />
      <circle cx="12" cy="2" r="0.7" fill="#FFD700" />
      <circle cx="21" cy="3" r="1.8" fill="#fff5f5" />
      <circle cx="21" cy="3" r="0.7" fill="#FFD700" />
      {/* 빛나는 효과 */}
      <ellipse cx="10" cy="1" rx="2.5" ry="1.5" fill="white" opacity="0.5" />
      {/* 마법 파티클 */}
      <circle cx="5" cy="3" r="1.2" fill="#FFD700" opacity="0.8" />
      <circle cx="27" cy="4" r="1.2" fill="#FFC107" opacity="0.8" />
      <circle cx="16" cy="0" r="1" fill="#FFFFFF" opacity="0.9" />
      {/* 별 */}
      <path d="M3,5 L3.5,4 L4,5 L3.5,4.5 Z" fill="#FFD700" opacity="0.8" />
      <path d="M29,6 L29.5,5 L30,6 L29.5,5.5 Z" fill="#FFD700" opacity="0.8" />
    </g>
  );
}

/**
 * 색상 조정 유틸리티
 */
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
