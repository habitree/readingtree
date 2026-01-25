"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTreeGrowthStage, type TreeGrowthStage } from "@/types/points";

interface ReadingTreeProps {
  level: number;
  health?: number; // 0-100
  isWatering?: boolean;
  className?: string;
}

/**
 * 레벨별 나무 성장 시각화 컴포넌트
 *
 * 디자인 원칙:
 * - 자연스러운 성장 곡선
 * - 레벨에 따른 시각적 피드백
 * - 물주기 시 애니메이션
 */
export function ReadingTree({ level, health = 100, isWatering = false, className }: ReadingTreeProps) {
  const stage = useMemo(() => getTreeGrowthStage(level), [level]);

  // 건강도에 따른 색상 조정
  const healthFactor = health / 100;
  const adjustedLeafColor = useMemo(() => {
    if (health >= 80) return stage.leafColor;
    if (health >= 50) return adjustColor(stage.leafColor, -20); // 약간 어둡게
    if (health >= 30) return "#9CA38F"; // 시든 색
    return "#8B8B7A"; // 매우 시든 색
  }, [health, stage.leafColor]);

  return (
    <div className={cn("relative", className)}>
      {/* 배경 원 (땅) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-gradient-to-t from-amber-800/30 to-amber-600/20 rounded-full blur-sm" />

      {/* 나무 SVG */}
      <motion.svg
        viewBox="0 0 200 300"
        className="w-full h-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 파티클 효과 */}
        {stage.particleEffect !== "none" && (
          <Particles effect={stage.particleEffect} />
        )}

        {/* 줄기 (레벨에 따라 두께/높이 변화) */}
        <Trunk
          level={level}
          color={stage.trunkColor}
          height={stage.height}
          isWatering={isWatering}
        />

        {/* 잎 */}
        {stage.hasLeaves && (
          <Leaves
            level={level}
            color={adjustedLeafColor}
            height={stage.height}
            glowEffect={stage.glowEffect}
            isWatering={isWatering}
          />
        )}

        {/* 꽃 */}
        {stage.hasFlowers && (
          <Flowers level={level} height={stage.height} />
        )}

        {/* 열매 */}
        {stage.hasFruits && (
          <Fruits level={level} height={stage.height} />
        )}

        {/* 물주기 애니메이션 */}
        {isWatering && <WaterDrops />}
      </motion.svg>

      {/* 빛나는 효과 (고레벨) */}
      {stage.glowEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl"
            style={{ backgroundColor: `${stage.leafColor}40` }}
          />
        </motion.div>
      )}
    </div>
  );
}

/**
 * 줄기 컴포넌트
 */
function Trunk({
  level,
  color,
  height,
  isWatering,
}: {
  level: number;
  color: string;
  height: number;
  isWatering: boolean;
}) {
  // 레벨에 따른 줄기 두께
  const trunkWidth = Math.min(8 + level * 2, 25);
  const trunkHeight = 50 + (height * 1.2);

  // 레벨 1-2: 씨앗/새싹
  if (level <= 2) {
    return (
      <motion.g
        animate={isWatering ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 0.3, repeat: isWatering ? 3 : 0 }}
      >
        {/* 씨앗/새싹 */}
        {level === 1 ? (
          // 씨앗
          <ellipse
            cx="100"
            cy="260"
            rx="12"
            ry="8"
            fill={color}
          />
        ) : (
          // 새싹
          <>
            <path
              d={`M100,270 Q100,250 100,${270 - trunkHeight * 0.3}`}
              stroke={color}
              strokeWidth={trunkWidth * 0.5}
              fill="none"
              strokeLinecap="round"
            />
            {/* 작은 잎 2개 */}
            <ellipse cx="90" cy="230" rx="15" ry="8" fill="#98FB98" transform="rotate(-30 90 230)" />
            <ellipse cx="110" cy="230" rx="15" ry="8" fill="#98FB98" transform="rotate(30 110 230)" />
          </>
        )}
      </motion.g>
    );
  }

  // 레벨 3 이상: 나무
  return (
    <motion.g
      animate={isWatering ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 0.5, repeat: isWatering ? 2 : 0 }}
    >
      {/* 메인 줄기 */}
      <path
        d={`
          M${100 - trunkWidth/2},270
          Q${100 - trunkWidth/2 - 3},${270 - trunkHeight/2} ${100 - trunkWidth/3},${270 - trunkHeight}
          L${100 + trunkWidth/3},${270 - trunkHeight}
          Q${100 + trunkWidth/2 + 3},${270 - trunkHeight/2} ${100 + trunkWidth/2},270
          Z
        `}
        fill={color}
      />

      {/* 나무 껍질 텍스처 */}
      {level >= 5 && (
        <>
          <line x1="97" y1="240" x2="95" y2="220" stroke={adjustColor(color, -20)} strokeWidth="1" />
          <line x1="103" y1="250" x2="105" y2="230" stroke={adjustColor(color, -20)} strokeWidth="1" />
        </>
      )}

      {/* 가지 (레벨 4 이상) */}
      {level >= 4 && (
        <>
          <path
            d={`M${100 - trunkWidth/4},${270 - trunkHeight * 0.6} Q${80},${270 - trunkHeight * 0.5} ${70},${270 - trunkHeight * 0.4}`}
            stroke={color}
            strokeWidth={trunkWidth * 0.3}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${100 + trunkWidth/4},${270 - trunkHeight * 0.6} Q${120},${270 - trunkHeight * 0.5} ${130},${270 - trunkHeight * 0.4}`}
            stroke={color}
            strokeWidth={trunkWidth * 0.3}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </motion.g>
  );
}

/**
 * 잎 컴포넌트
 */
function Leaves({
  level,
  color,
  height,
  glowEffect,
  isWatering,
}: {
  level: number;
  color: string;
  height: number;
  glowEffect: boolean;
  isWatering: boolean;
}) {
  // 레벨에 따른 잎 크기
  const leafScale = 0.5 + (level * 0.1);
  const yOffset = 270 - height * 1.2 - 30;

  // 레벨에 따라 잎 형태 결정
  if (level <= 3) {
    // 작은 원형 잎 그룹
    return (
      <motion.g
        animate={isWatering ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        <circle cx="100" cy={yOffset + 20} r={20 * leafScale} fill={color} />
        <circle cx="85" cy={yOffset + 35} r={15 * leafScale} fill={color} />
        <circle cx="115" cy={yOffset + 35} r={15 * leafScale} fill={color} />
      </motion.g>
    );
  }

  // 레벨 4 이상: 풍성한 나무 잎
  return (
    <motion.g
      animate={isWatering ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* 메인 잎 덩어리 */}
      <ellipse
        cx="100"
        cy={yOffset}
        rx={35 * leafScale}
        ry={30 * leafScale}
        fill={color}
      />
      <ellipse
        cx="75"
        cy={yOffset + 15}
        rx={25 * leafScale}
        ry={22 * leafScale}
        fill={adjustColor(color, 10)}
      />
      <ellipse
        cx="125"
        cy={yOffset + 15}
        rx={25 * leafScale}
        ry={22 * leafScale}
        fill={adjustColor(color, 10)}
      />
      <ellipse
        cx="100"
        cy={yOffset + 25}
        rx={30 * leafScale}
        ry={25 * leafScale}
        fill={adjustColor(color, -10)}
      />

      {/* 추가 잎 (고레벨) */}
      {level >= 6 && (
        <>
          <ellipse cx="60" cy={yOffset + 25} rx={18 * leafScale} ry={15 * leafScale} fill={color} />
          <ellipse cx="140" cy={yOffset + 25} rx={18 * leafScale} ry={15 * leafScale} fill={color} />
        </>
      )}

      {/* 빛나는 하이라이트 */}
      {glowEffect && (
        <ellipse
          cx="90"
          cy={yOffset - 5}
          rx={10 * leafScale}
          ry={8 * leafScale}
          fill="white"
          opacity="0.3"
        />
      )}
    </motion.g>
  );
}

/**
 * 꽃 컴포넌트
 */
function Flowers({ level, height }: { level: number; height: number }) {
  const yOffset = 270 - height * 1.2 - 30;
  const flowerCount = Math.min(level - 3, 5);

  const flowers = [];
  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI + Math.PI / 4;
    const radius = 25 + Math.random() * 15;
    const x = 100 + Math.cos(angle) * radius;
    const y = yOffset + 10 + Math.sin(angle) * radius * 0.6;

    flowers.push(
      <motion.g
        key={i}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
      >
        <circle cx={x} cy={y} r="4" fill="#FFB6C1" />
        <circle cx={x} cy={y} r="2" fill="#FFD700" />
      </motion.g>
    );
  }

  return <>{flowers}</>;
}

/**
 * 열매 컴포넌트
 */
function Fruits({ level, height }: { level: number; height: number }) {
  const yOffset = 270 - height * 1.2 - 30;
  const fruitCount = Math.min(level - 5, 4);

  const fruits = [];
  for (let i = 0; i < fruitCount; i++) {
    const angle = (i / fruitCount) * Math.PI * 0.8 + Math.PI * 0.1;
    const radius = 30 + Math.random() * 10;
    const x = 100 + Math.cos(angle) * radius;
    const y = yOffset + 20 + Math.sin(angle) * radius * 0.5;

    fruits.push(
      <motion.g
        key={i}
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
      >
        <circle cx={x} cy={y} r="6" fill="#FF6347" />
        <circle cx={x - 2} cy={y - 2} r="1.5" fill="white" opacity="0.5" />
      </motion.g>
    );
  }

  return <>{fruits}</>;
}

/**
 * 파티클 효과
 */
function Particles({ effect }: { effect: "subtle" | "sparkle" | "magical" }) {
  const particleCount = effect === "magical" ? 12 : effect === "sparkle" ? 8 : 4;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const x = 40 + Math.random() * 120;
    const startY = 50 + Math.random() * 150;
    const size = effect === "magical" ? 3 : 2;
    const color = effect === "magical" ? "#FFD700" : "#FFFFFF";

    particles.push(
      <motion.circle
        key={i}
        cx={x}
        cy={startY}
        r={size}
        fill={color}
        opacity={0.6}
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2 + Math.random() * 2,
          delay: i * 0.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  return <>{particles}</>;
}

/**
 * 물방울 애니메이션
 */
function WaterDrops() {
  return (
    <motion.g>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.ellipse
          key={i}
          cx={80 + i * 10}
          cy={50}
          rx="4"
          ry="6"
          fill="#87CEEB"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 200, opacity: 0 }}
          transition={{
            duration: 1,
            delay: i * 0.1,
            ease: "easeIn",
          }}
        />
      ))}
    </motion.g>
  );
}

/**
 * 색상 조정 유틸리티
 */
function adjustColor(color: string, amount: number): string {
  // 간단한 색상 밝기 조정
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
