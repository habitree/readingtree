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
 * 레벨별 나무 성장 시각화 컴포넌트 (수채화 스타일)
 *
 * 디자인 원칙:
 * - 수채화/손그림 스타일의 자연스러운 SVG
 * - 레벨에 따른 시각적 피드백
 * - 물주기 시 반응 애니메이션
 * - 부드러운 색상 전환과 텍스처
 */
export function ReadingTree({ level, health = 100, isWatering = false, className }: ReadingTreeProps) {
  const stage = useMemo(() => getTreeGrowthStage(level), [level]);

  // 건강도에 따른 색상 조정
  const healthFactor = health / 100;
  const adjustedLeafColor = useMemo(() => {
    if (health >= 80) return stage.leafColor;
    if (health >= 50) return adjustColor(stage.leafColor, -20);
    if (health >= 30) return "#9CA38F";
    return "#8B8B7A";
  }, [health, stage.leafColor]);

  return (
    <div className={cn("relative tree-container", className)}>
      {/* 배경 원 (땅) - 수채화 스타일 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-10 bg-gradient-to-t from-amber-800/20 via-amber-600/15 to-transparent rounded-full blur-md" />

      {/* 흙/잔디 표현 */}
      <svg
        viewBox="0 0 200 20"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-5"
      >
        <defs>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B7355" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6B4423" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="10" rx="80" ry="8" fill="url(#groundGradient)" />
        {/* 잔디 표현 */}
        {level >= 3 && (
          <>
            <path d="M60,10 Q62,5 64,10" stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d="M80,10 Q82,3 84,10" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path d="M120,10 Q122,4 124,10" stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d="M140,10 Q142,6 144,10" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.5" />
          </>
        )}
      </svg>

      {/* 나무 SVG */}
      <motion.svg
        viewBox="0 0 200 300"
        className="w-full h-full tree-sway"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <defs>
          {/* 수채화 효과 필터 */}
          <filter id="watercolor" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.5" />
          </filter>

          {/* 강한 수채화 효과 (고레벨용) */}
          <filter id="watercolorStrong" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.8" />
          </filter>

          {/* 빛나는 효과 필터 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 오로라 효과 (최고 레벨) */}
          <filter id="aurora" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" type="hueRotate" values="0">
              <animate attributeName="values" from="0" to="360" dur="10s" repeatCount="indefinite" />
            </feColorMatrix>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 잎 그라디언트 */}
          <radialGradient id="leafGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={adjustColor(adjustedLeafColor, 30)} stopOpacity="0.95" />
            <stop offset="50%" stopColor={adjustedLeafColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={adjustColor(adjustedLeafColor, -20)} stopOpacity="0.85" />
          </radialGradient>

          {/* 줄기 그라디언트 */}
          <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={adjustColor(stage.trunkColor, -15)} />
            <stop offset="30%" stopColor={stage.trunkColor} />
            <stop offset="70%" stopColor={adjustColor(stage.trunkColor, 10)} />
            <stop offset="100%" stopColor={adjustColor(stage.trunkColor, -10)} />
          </linearGradient>

          {/* 꽃 그라디언트 */}
          <radialGradient id="flowerGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff5f5" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffc0cb" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ff69b4" stopOpacity="0.8" />
          </radialGradient>

          {/* 열매 그라디언트 */}
          <radialGradient id="fruitGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ff6b6b" stopOpacity="1" />
            <stop offset="50%" stopColor="#ee4444" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#cc2222" stopOpacity="0.9" />
          </radialGradient>

          {/* 황금빛 그라디언트 (레벨 10) */}
          <radialGradient id="goldenGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="1" />
            <stop offset="40%" stopColor="#ffd700" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#daa520" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* 파티클 효과 */}
        {stage.particleEffect !== "none" && (
          <Particles effect={stage.particleEffect} level={level} />
        )}

        {/* 줄기 */}
        <WatercolorTrunk
          level={level}
          color={stage.trunkColor}
          height={stage.height}
          isWatering={isWatering}
        />

        {/* 잎 */}
        {stage.hasLeaves && (
          <WatercolorLeaves
            level={level}
            color={adjustedLeafColor}
            height={stage.height}
            glowEffect={stage.glowEffect}
            isWatering={isWatering}
          />
        )}

        {/* 꽃 */}
        {stage.hasFlowers && (
          <WatercolorFlowers level={level} height={stage.height} isWatering={isWatering} />
        )}

        {/* 열매 */}
        {stage.hasFruits && (
          <WatercolorFruits level={level} height={stage.height} />
        )}

        {/* 물주기 애니메이션 */}
        {isWatering && <WaterDrops />}
      </motion.svg>

      {/* 빛나는 효과 (고레벨) */}
      {stage.glowEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className={cn(
              "absolute top-1/4 left-1/2 -translate-x-1/2 rounded-full blur-3xl",
              level >= 9 ? "w-32 h-32" : "w-24 h-24"
            )}
            style={{ backgroundColor: `${stage.leafColor}30` }}
          />
        </motion.div>
      )}

      {/* 오로라 효과 (레벨 9-10) */}
      {level >= 9 && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 aurora-effect" />
        </motion.div>
      )}
    </div>
  );
}

/**
 * 수채화 스타일 줄기 컴포넌트
 */
function WatercolorTrunk({
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
  const trunkWidth = Math.min(8 + level * 2.5, 28);
  const trunkHeight = 50 + (height * 1.2);

  // 레벨 1: 씨앗
  if (level === 1) {
    return (
      <motion.g
        animate={isWatering ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 0.4, repeat: isWatering ? 2 : 0 }}
      >
        {/* 씨앗 본체 - 수채화 스타일 */}
        <ellipse
          cx="100"
          cy="262"
          rx="14"
          ry="10"
          fill="url(#trunkGradient)"
          filter="url(#watercolor)"
        />
        {/* 씨앗 하이라이트 */}
        <ellipse
          cx="96"
          cy="259"
          rx="5"
          ry="3"
          fill={adjustColor(color, 30)}
          opacity="0.5"
        />
        {/* 씨앗 줄무늬 */}
        <path
          d="M95,255 Q100,265 95,272"
          stroke={adjustColor(color, -20)}
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
      </motion.g>
    );
  }

  // 레벨 2: 새싹
  if (level === 2) {
    return (
      <motion.g
        animate={isWatering ? { y: [0, -4, 0] } : {}}
        transition={{ duration: 0.4, repeat: isWatering ? 2 : 0 }}
        className="tree-sway-subtle"
      >
        {/* 새싹 줄기 */}
        <path
          d="M100,270 Q98,250 100,230"
          stroke="url(#trunkGradient)"
          strokeWidth={trunkWidth * 0.4}
          fill="none"
          strokeLinecap="round"
          filter="url(#watercolor)"
        />
        {/* 왼쪽 떡잎 - 수채화 스타일 */}
        <path
          d="M100,235 Q80,225 75,235 Q78,250 100,245"
          fill="#86efac"
          filter="url(#watercolor)"
          opacity="0.9"
        />
        {/* 오른쪽 떡잎 */}
        <path
          d="M100,235 Q120,225 125,235 Q122,250 100,245"
          fill="#4ade80"
          filter="url(#watercolor)"
          opacity="0.85"
        />
        {/* 떡잎 잎맥 */}
        <path
          d="M100,238 Q88,238 78,236"
          stroke="#22c55e"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M100,238 Q112,238 122,236"
          stroke="#22c55e"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
      </motion.g>
    );
  }

  // 레벨 3 이상: 나무
  return (
    <motion.g
      animate={isWatering ? { y: [0, -5, 0] } : {}}
      transition={{ duration: 0.5, repeat: isWatering ? 2 : 0 }}
    >
      {/* 메인 줄기 - 불규칙한 자연스러운 형태 */}
      <path
        d={`
          M${100 - trunkWidth/2 + 2},270
          Q${100 - trunkWidth/2 - 2},${270 - trunkHeight * 0.3} ${100 - trunkWidth/3 + 1},${270 - trunkHeight * 0.6}
          Q${100 - trunkWidth/4},${270 - trunkHeight * 0.8} ${100 - trunkWidth/5},${270 - trunkHeight}
          L${100 + trunkWidth/5},${270 - trunkHeight}
          Q${100 + trunkWidth/4},${270 - trunkHeight * 0.8} ${100 + trunkWidth/3 - 1},${270 - trunkHeight * 0.6}
          Q${100 + trunkWidth/2 + 2},${270 - trunkHeight * 0.3} ${100 + trunkWidth/2 - 2},270
          Z
        `}
        fill="url(#trunkGradient)"
        filter={level >= 7 ? "url(#watercolorStrong)" : "url(#watercolor)"}
      />

      {/* 나무 껍질 텍스처 */}
      {level >= 4 && (
        <g opacity="0.3">
          <path
            d={`M${97},${260} Q${95},${245} ${96},${230}`}
            stroke={adjustColor(color, -25)}
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d={`M${103},${255} Q${105},${240} ${104},${220}`}
            stroke={adjustColor(color, -25)}
            strokeWidth="1"
            fill="none"
          />
          {level >= 6 && (
            <>
              <path
                d={`M${95},${235} Q${93},${220} ${94},${205}`}
                stroke={adjustColor(color, -20)}
                strokeWidth="0.8"
                fill="none"
              />
              <ellipse cx="99" cy="250" rx="2" ry="4" fill={adjustColor(color, -30)} opacity="0.4" />
            </>
          )}
        </g>
      )}

      {/* 가지 (레벨 4 이상) */}
      {level >= 4 && (
        <>
          {/* 왼쪽 가지 */}
          <path
            d={`M${100 - trunkWidth/4},${270 - trunkHeight * 0.55}
                Q${75},${270 - trunkHeight * 0.5} ${60},${270 - trunkHeight * 0.35}`}
            stroke="url(#trunkGradient)"
            strokeWidth={trunkWidth * 0.25}
            fill="none"
            strokeLinecap="round"
            filter="url(#watercolor)"
          />
          {/* 오른쪽 가지 */}
          <path
            d={`M${100 + trunkWidth/4},${270 - trunkHeight * 0.55}
                Q${125},${270 - trunkHeight * 0.5} ${140},${270 - trunkHeight * 0.35}`}
            stroke="url(#trunkGradient)"
            strokeWidth={trunkWidth * 0.25}
            fill="none"
            strokeLinecap="round"
            filter="url(#watercolor)"
          />

          {/* 추가 가지 (레벨 6 이상) */}
          {level >= 6 && (
            <>
              <path
                d={`M${100 - trunkWidth/5},${270 - trunkHeight * 0.7}
                    Q${65},${270 - trunkHeight * 0.7} ${50},${270 - trunkHeight * 0.55}`}
                stroke="url(#trunkGradient)"
                strokeWidth={trunkWidth * 0.18}
                fill="none"
                strokeLinecap="round"
                filter="url(#watercolor)"
              />
              <path
                d={`M${100 + trunkWidth/5},${270 - trunkHeight * 0.7}
                    Q${135},${270 - trunkHeight * 0.7} ${150},${270 - trunkHeight * 0.55}`}
                stroke="url(#trunkGradient)"
                strokeWidth={trunkWidth * 0.18}
                fill="none"
                strokeLinecap="round"
                filter="url(#watercolor)"
              />
            </>
          )}
        </>
      )}

      {/* 뿌리 (레벨 5 이상) */}
      {level >= 5 && (
        <g opacity="0.6">
          <path
            d={`M${100 - trunkWidth/2 + 3},270 Q${85},275 ${75},278`}
            stroke={adjustColor(color, -10)}
            strokeWidth={trunkWidth * 0.15}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${100 + trunkWidth/2 - 3},270 Q${115},275 ${125},278`}
            stroke={adjustColor(color, -10)}
            strokeWidth={trunkWidth * 0.15}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </motion.g>
  );
}

/**
 * 수채화 스타일 잎 컴포넌트
 */
function WatercolorLeaves({
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
  const leafScale = 0.5 + (level * 0.12);
  const yOffset = 270 - height * 1.2 - 35;
  const isGolden = level === 10;

  // 레벨 2-3: 작은 잎 그룹
  if (level <= 3) {
    return (
      <motion.g
        animate={isWatering ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.5 }}
        style={{ transformOrigin: "100px 220px" }}
        className="leaves-sway"
      >
        {/* 중앙 잎 뭉치 */}
        <path
          d={`M100,${yOffset + 30}
              Q${75},${yOffset + 15} ${85},${yOffset - 5}
              Q${95},${yOffset - 15} ${100},${yOffset - 10}
              Q${105},${yOffset - 15} ${115},${yOffset - 5}
              Q${125},${yOffset + 15} ${100},${yOffset + 30}`}
          fill="url(#leafGradient)"
          filter="url(#watercolor)"
        />
        {/* 추가 잎 */}
        <ellipse
          cx="85"
          cy={yOffset + 20}
          rx={12 * leafScale}
          ry={10 * leafScale}
          fill={adjustColor(color, 10)}
          filter="url(#watercolor)"
          opacity="0.85"
        />
        <ellipse
          cx="115"
          cy={yOffset + 20}
          rx={12 * leafScale}
          ry={10 * leafScale}
          fill={adjustColor(color, 5)}
          filter="url(#watercolor)"
          opacity="0.85"
        />
      </motion.g>
    );
  }

  // 레벨 4 이상: 풍성한 나무 잎
  return (
    <motion.g
      animate={isWatering ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
      style={{ transformOrigin: "100px 150px" }}
      className="leaves-sway"
      filter={glowEffect ? "url(#glow)" : undefined}
    >
      {/* 메인 잎 덩어리들 - 불규칙한 구름 형태 */}

      {/* 중앙 상단 */}
      <path
        d={`M100,${yOffset - 10}
            Q${70},${yOffset - 5} ${65},${yOffset + 15}
            Q${60},${yOffset + 35} ${75},${yOffset + 45}
            Q${85},${yOffset + 50} ${100},${yOffset + 45}
            Q${115},${yOffset + 50} ${125},${yOffset + 45}
            Q${140},${yOffset + 35} ${135},${yOffset + 15}
            Q${130},${yOffset - 5} ${100},${yOffset - 10}`}
        fill={isGolden ? "url(#goldenGradient)" : "url(#leafGradient)"}
        filter={level >= 7 ? "url(#watercolorStrong)" : "url(#watercolor)"}
      />

      {/* 왼쪽 잎 덩어리 */}
      <path
        d={`M75,${yOffset + 10}
            Q${50},${yOffset + 5} ${45},${yOffset + 25}
            Q${40},${yOffset + 45} ${55},${yOffset + 55}
            Q${70},${yOffset + 60} ${85},${yOffset + 50}`}
        fill={isGolden ? adjustColor("#FFD700", -10) : adjustColor(color, 15)}
        filter="url(#watercolor)"
        opacity="0.9"
      />

      {/* 오른쪽 잎 덩어리 */}
      <path
        d={`M125,${yOffset + 10}
            Q${150},${yOffset + 5} ${155},${yOffset + 25}
            Q${160},${yOffset + 45} ${145},${yOffset + 55}
            Q${130},${yOffset + 60} ${115},${yOffset + 50}`}
        fill={isGolden ? adjustColor("#FFD700", 5) : adjustColor(color, 10)}
        filter="url(#watercolor)"
        opacity="0.9"
      />

      {/* 하단 잎 덩어리 */}
      <path
        d={`M100,${yOffset + 40}
            Q${75},${yOffset + 50} ${70},${yOffset + 60}
            Q${75},${yOffset + 75} ${100},${yOffset + 70}
            Q${125},${yOffset + 75} ${130},${yOffset + 60}
            Q${125},${yOffset + 50} ${100},${yOffset + 40}`}
        fill={isGolden ? adjustColor("#DAA520", 10) : adjustColor(color, -15)}
        filter="url(#watercolor)"
        opacity="0.85"
      />

      {/* 추가 잎 (레벨 6 이상) */}
      {level >= 6 && (
        <>
          <ellipse
            cx="50"
            cy={yOffset + 35}
            rx={18 * leafScale}
            ry={15 * leafScale}
            fill={isGolden ? "#FFD700" : color}
            filter="url(#watercolor)"
            opacity="0.8"
          />
          <ellipse
            cx="150"
            cy={yOffset + 35}
            rx={18 * leafScale}
            ry={15 * leafScale}
            fill={isGolden ? "#FFC107" : adjustColor(color, 5)}
            filter="url(#watercolor)"
            opacity="0.8"
          />
        </>
      )}

      {/* 빛나는 하이라이트 */}
      {glowEffect && (
        <>
          <ellipse
            cx="85"
            cy={yOffset + 5}
            rx={8 * leafScale}
            ry={6 * leafScale}
            fill="white"
            opacity="0.35"
            filter="url(#watercolor)"
          />
          <ellipse
            cx="110"
            cy={yOffset + 15}
            rx={6 * leafScale}
            ry={4 * leafScale}
            fill="white"
            opacity="0.25"
            filter="url(#watercolor)"
          />
        </>
      )}

      {/* 잎 디테일 - 작은 잎 클러스터 */}
      {level >= 5 && (
        <g opacity="0.7" className="leaves-flutter">
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 25 + Math.sin(i * 1.5) * 10;
            const x = 100 + Math.cos(angle) * radius;
            const y = yOffset + 30 + Math.sin(angle) * radius * 0.6;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx={4}
                ry={3}
                fill={isGolden ? "#FFE082" : adjustColor(color, 20)}
                transform={`rotate(${angle * 57.3}, ${x}, ${y})`}
              />
            );
          })}
        </g>
      )}
    </motion.g>
  );
}

/**
 * 수채화 스타일 꽃 컴포넌트
 */
function WatercolorFlowers({ level, height, isWatering }: { level: number; height: number; isWatering: boolean }) {
  const yOffset = 270 - height * 1.2 - 35;
  const flowerCount = Math.min(level - 5, 7);

  const flowers = useMemo(() => {
    const result = [];
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI + Math.PI / 6;
      const radius = 30 + (i % 3) * 12;
      const x = 100 + Math.cos(angle) * radius;
      const y = yOffset + 20 + Math.sin(angle) * radius * 0.5;
      result.push({ x, y, delay: i * 0.2 });
    }
    return result;
  }, [flowerCount, yOffset]);

  return (
    <g className="flowers-bloom">
      {flowers.map((flower, i) => (
        <motion.g
          key={i}
          animate={isWatering ? { scale: [1, 1.3, 1] } : { scale: [1, 1.1, 1] }}
          transition={{
            duration: isWatering ? 0.5 : 2.5,
            delay: flower.delay,
            repeat: isWatering ? 1 : Infinity,
          }}
          style={{ transformOrigin: `${flower.x}px ${flower.y}px` }}
        >
          {/* 꽃잎 5장 */}
          {[...Array(5)].map((_, j) => {
            const petalAngle = (j / 5) * Math.PI * 2;
            const px = flower.x + Math.cos(petalAngle) * 5;
            const py = flower.y + Math.sin(petalAngle) * 5;
            return (
              <ellipse
                key={j}
                cx={px}
                cy={py}
                rx="4"
                ry="6"
                fill="url(#flowerGradient)"
                transform={`rotate(${petalAngle * 57.3 + 90}, ${px}, ${py})`}
                filter="url(#watercolor)"
              />
            );
          })}
          {/* 꽃 중심 */}
          <circle cx={flower.x} cy={flower.y} r="3" fill="#FFD700" />
          <circle cx={flower.x - 0.5} cy={flower.y - 0.5} r="1" fill="#FFF8DC" opacity="0.7" />
        </motion.g>
      ))}
    </g>
  );
}

/**
 * 수채화 스타일 열매 컴포넌트
 */
function WatercolorFruits({ level, height }: { level: number; height: number }) {
  const yOffset = 270 - height * 1.2 - 35;
  const fruitCount = Math.min(level - 6, 5);

  const fruits = useMemo(() => {
    const result = [];
    for (let i = 0; i < fruitCount; i++) {
      const angle = (i / fruitCount) * Math.PI * 0.7 + Math.PI * 0.15;
      const radius = 35 + (i % 2) * 10;
      const x = 100 + Math.cos(angle) * radius;
      const y = yOffset + 35 + Math.sin(angle) * radius * 0.4;
      result.push({ x, y, delay: i * 0.4 });
    }
    return result;
  }, [fruitCount, yOffset]);

  return (
    <g className="fruits-sway">
      {fruits.map((fruit, i) => (
        <motion.g
          key={i}
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 2.5, delay: fruit.delay, repeat: Infinity }}
        >
          {/* 열매 본체 */}
          <ellipse
            cx={fruit.x}
            cy={fruit.y}
            rx="7"
            ry="8"
            fill="url(#fruitGradient)"
            filter="url(#watercolor)"
          />
          {/* 열매 하이라이트 */}
          <ellipse
            cx={fruit.x - 2}
            cy={fruit.y - 2}
            rx="2.5"
            ry="2"
            fill="white"
            opacity="0.5"
          />
          {/* 열매 꼭지 */}
          <path
            d={`M${fruit.x},${fruit.y - 8} Q${fruit.x + 2},${fruit.y - 12} ${fruit.x + 4},${fruit.y - 10}`}
            stroke="#228B22"
            strokeWidth="1.5"
            fill="none"
          />
          {/* 작은 잎 */}
          <ellipse
            cx={fruit.x + 4}
            cy={fruit.y - 10}
            rx="3"
            ry="2"
            fill="#32CD32"
            transform={`rotate(30, ${fruit.x + 4}, ${fruit.y - 10})`}
          />
        </motion.g>
      ))}
    </g>
  );
}

/**
 * 파티클 효과
 */
function Particles({ effect, level }: { effect: "subtle" | "sparkle" | "magical"; level: number }) {
  const particleCount = effect === "magical" ? 15 : effect === "sparkle" ? 10 : 5;
  const isGolden = level >= 9;

  const particles = useMemo(() => {
    return [...Array(particleCount)].map((_, i) => ({
      x: 30 + Math.random() * 140,
      startY: 40 + Math.random() * 180,
      size: effect === "magical" ? 2 + Math.random() * 2 : 1.5 + Math.random(),
      duration: 3 + Math.random() * 2,
      delay: i * 0.3,
    }));
  }, [particleCount, effect]);

  return (
    <g>
      {particles.map((p, i) => (
        <motion.g key={i}>
          {/* 메인 파티클 */}
          <motion.circle
            cx={p.x}
            cy={p.startY}
            r={p.size}
            fill={isGolden ? "#FFD700" : effect === "magical" ? "#FFD700" : "#FFFFFF"}
            opacity={0.7}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 0.9, 0.3],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* 빛나는 후광 (magical 효과) */}
          {effect === "magical" && (
            <motion.circle
              cx={p.x}
              cy={p.startY}
              r={p.size * 2}
              fill={isGolden ? "#FFD700" : "#FFFFFF"}
              opacity={0.2}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.6, 1],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.g>
      ))}

      {/* 별 파티클 (레벨 9-10) */}
      {level >= 9 && (
        <>
          {[...Array(5)].map((_, i) => {
            const x = 40 + Math.random() * 120;
            const y = 30 + Math.random() * 100;
            return (
              <motion.g
                key={`star-${i}`}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                }}
              >
                <path
                  d={`M${x},${y - 4} L${x + 1},${y - 1} L${x + 4},${y} L${x + 1},${y + 1} L${x},${y + 4} L${x - 1},${y + 1} L${x - 4},${y} L${x - 1},${y - 1} Z`}
                  fill="#FFD700"
                />
              </motion.g>
            );
          })}
        </>
      )}
    </g>
  );
}

/**
 * 물방울 애니메이션
 */
function WaterDrops() {
  return (
    <motion.g>
      {[...Array(7)].map((_, i) => (
        <motion.g key={i}>
          {/* 물방울 */}
          <motion.path
            d={`M${75 + i * 8},50 Q${77 + i * 8},45 ${75 + i * 8},40 Q${73 + i * 8},45 ${75 + i * 8},50`}
            fill="#87CEEB"
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: 220, opacity: 0, scale: 0.5 }}
            transition={{
              duration: 1.2,
              delay: i * 0.08,
              ease: "easeIn",
            }}
          />
          {/* 물방울 하이라이트 */}
          <motion.ellipse
            cx={74 + i * 8}
            cy={44}
            rx="1"
            ry="1.5"
            fill="white"
            opacity="0.6"
            initial={{ y: 0, opacity: 0.6 }}
            animate={{ y: 220, opacity: 0 }}
            transition={{
              duration: 1.2,
              delay: i * 0.08,
              ease: "easeIn",
            }}
          />
        </motion.g>
      ))}

      {/* 물 튀김 효과 */}
      {[...Array(5)].map((_, i) => (
        <motion.circle
          key={`splash-${i}`}
          cx={85 + i * 8}
          cy={265}
          r={2}
          fill="#87CEEB"
          opacity={0.6}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.6, 0] }}
          transition={{
            duration: 0.4,
            delay: 0.8 + i * 0.05,
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
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
