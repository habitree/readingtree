"use client";

import { cn } from "@/lib/utils";

interface GrowthTreeProps {
  /** 성장 단계 0~5 */
  level: number;
  className?: string;
}

const TRUNK_HEIGHTS = [12, 14, 16, 18, 20, 22];
const CANOPY_SIZES = [0, 14, 18, 22, 26, 30];

/**
 * CSS 기반 미니 나무 장식 컴포넌트 (히어로 카드 우상단)
 * streak 기반 성장 단계에 따라 나무가 자람
 */
export function GrowthTree({ level, className }: GrowthTreeProps) {
  const clampedLevel = Math.max(0, Math.min(5, level));
  const trunkH = TRUNK_HEIGHTS[clampedLevel];
  const canopySize = CANOPY_SIZES[clampedLevel];

  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col items-center justify-end", className)}
      style={{ width: 36, height: 44 }}
    >
      {/* 수관 (나뭇잎 덩어리) */}
      {clampedLevel > 0 && (
        <div
          className="bg-forest-400 dark:bg-forest-500"
          style={{
            width: canopySize,
            height: canopySize * 0.85,
            borderRadius: "60% 40% 50% 30% / 55% 45% 50% 40%",
            marginBottom: -4,
          }}
        />
      )}
      {/* 줄기 */}
      <div
        className="bg-amber-700 dark:bg-amber-600 rounded-sm"
        style={{ width: 4, height: trunkH }}
      />
      {/* 땅 */}
      <div
        className="bg-forest-200 dark:bg-forest-800 rounded-full"
        style={{ width: 16, height: 3, marginTop: 1 }}
      />
    </div>
  );
}
