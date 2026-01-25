"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LEVEL_STYLES, getTreeGrowthStage } from "@/types/points";
import { ReadingTree } from "./reading-tree";

interface ReadingTreeImageProps {
  level: number;
  health?: number;
  isWatering?: boolean;
  className?: string;
}

/**
 * AI 생성 이미지 기반 나무 컴포넌트
 *
 * 특징:
 * - DALL-E 3로 생성된 고품질 수채화 스타일 나무 이미지
 * - 물주기 시 시각적 애니메이션 효과
 * - 건강도에 따른 색상 필터
 * - 이미지 로드 실패 시 SVG 폴백
 */
export function ReadingTreeImage({
  level,
  health = 100,
  isWatering = false,
  className,
}: ReadingTreeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];
  const stage = getTreeGrowthStage(level);

  // 이미지 로드 실패 시 SVG 폴백
  if (hasError) {
    return (
      <ReadingTree
        level={level}
        health={health}
        isWatering={isWatering}
        className={className}
      />
    );
  }

  // 건강도에 따른 필터 (낮으면 grayscale)
  const healthFilter = health < 50
    ? `grayscale(${(50 - health) * 1.5}%) brightness(${70 + health * 0.3}%)`
    : "none";

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* 배경 글로우 효과 (고레벨) */}
      {levelStyle.effect !== "none" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              width: "60%",
              height: "60%",
              backgroundColor: `${levelStyle.color}40`,
            }}
          />
        </motion.div>
      )}

      {/* 물주기 물방울 효과 */}
      <AnimatePresence>
        {isWatering && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-3 bg-blue-400 rounded-full opacity-80"
                style={{
                  left: `${30 + i * 6}%`,
                  top: "10%",
                }}
                initial={{ y: 0, opacity: 0.8 }}
                animate={{ y: 200, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeIn",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* 메인 나무 이미지 */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        animate={
          isWatering
            ? { scale: [1, 1.05, 1], y: [0, -5, 0] }
            : levelStyle.effect === "premium"
            ? { scale: [1, 1.02, 1] }
            : {}
        }
        transition={{
          duration: isWatering ? 0.5 : 3,
          repeat: isWatering ? 2 : Infinity,
          ease: "easeInOut",
        }}
      >
        {/* 로딩 스켈레톤 */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-40 bg-muted/30 rounded-lg animate-pulse" />
          </div>
        )}

        <Image
          src={`/images/trees/level-${level}.webp`}
          alt={`${stage.name} - Level ${level}`}
          width={256}
          height={256}
          className={cn(
            "object-contain max-h-full transition-all duration-300",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100"
          )}
          style={{
            filter: healthFilter,
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          priority
        />

        {/* 황금빛 파티클 (레벨 10) */}
        {level === 10 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${10 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* 꽃잎 효과 (레벨 7) */}
        {level === 7 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-pink-300 rounded-full opacity-60"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${20 + Math.random() * 30}%`,
                }}
                animate={{
                  y: [0, 50],
                  x: [0, (Math.random() - 0.5) * 30],
                  opacity: [0.6, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* 물주기 완료 반짝임 효과 */}
      <AnimatePresence>
        {isWatering && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-cyan-200/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
