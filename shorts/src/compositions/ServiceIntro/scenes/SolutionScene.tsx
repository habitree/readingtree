import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TreesIcon } from "../../../components/core/TreesIcon";
import { ServiceFeature } from "../../../types/service-intro";

interface SolutionSceneProps {
  features: ServiceFeature[];
}

// 기능별 SVG 아이콘 (간결한 선 아이콘)
const featureIcons: Record<string, React.ReactNode> = {
  scan: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#36a678" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" /><path d="M7 8h6" /><path d="M7 16h8" />
    </svg>
  ),
  sort: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#36a678" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" /><path d="M4 12h12" /><path d="M4 18h8" />
      <path d="M18 14l3 3-3 3" />
    </svg>
  ),
  search: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#36a678" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  share: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#36a678" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
};

/**
 * 솔루션 씬 - 4가지 핵심 기능을 순차적으로 소개
 * 각 기능 카드가 하나씩 등장 (135프레임 = 4.5초씩)
 */
export const SolutionScene: React.FC<SolutionSceneProps> = ({ features }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 인트로 텍스트
  const introOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const introFadeOut = interpolate(frame, [80, 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 각 기능 카드 타이밍 (인트로 후)
  const cardStart = 110;
  const cardDuration = 107; // (540-110)/4 = ~107 프레임

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 인트로: ReadTree가 해결합니다 */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: introOpacity * introFadeOut,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <TreesIcon size={48} color="#36a678" strokeWidth={1.5} />
          <span
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 34,
              fontFamily: fonts.serif,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            ReadTree가{"\n"}해결합니다
          </span>
        </div>
      </AbsoluteFill>

      {/* 기능 카드들 */}
      {features.map((feature, i) => {
        const start = cardStart + i * cardDuration;
        const localFrame = Math.max(0, frame - start);
        const isActive = frame >= start && frame < start + cardDuration;

        const cardOpacity = interpolate(
          localFrame,
          [0, 15, cardDuration - 20, cardDuration],
          [0, 1, 1, 0],
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
        );
        const cardY = interpolate(localFrame, [0, 15], [40, 0], {
          extrapolateRight: "clamp",
        });

        // 숫자 카운터
        const numberScale = spring({
          frame: localFrame,
          fps,
          config: { damping: 12, stiffness: 150 },
        });

        if (!isActive && localFrame <= 0) return null;

        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "center",
              alignItems: "center",
              opacity: cardOpacity,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
                transform: `translateY(${cardY}px)`,
                padding: "0 80px",
              }}
            >
              {/* 번호 */}
              <span
                style={{
                  color: brandColors.forest[500],
                  fontSize: 18,
                  fontFamily: fonts.english,
                  fontWeight: 600,
                  letterSpacing: 3,
                  transform: `scale(${numberScale})`,
                }}
              >
                0{i + 1}
              </span>

              {/* 아이콘 */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: `rgba(54, 166, 120, 0.08)`,
                  border: `1px solid ${brandColors.forest[500]}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {featureIcons[feature.icon]}
              </div>

              {/* 기능명 */}
              <span
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 34,
                  fontFamily: fonts.sans,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {feature.title}
              </span>

              {/* 설명 */}
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 22,
                  fontFamily: fonts.sans,
                  fontWeight: 300,
                  textAlign: "center",
                  lineHeight: 1.6,
                  maxWidth: 700,
                }}
              >
                {feature.description}
              </span>
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
