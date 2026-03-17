import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface NameDropSceneProps {
  creatorName: string;
  creatorBio: string;
}

/**
 * 네임드 드롭 후킹 씬 — "@크리에이터 님의 올해 최고의 책은?"
 */
export const NameDropScene: React.FC<NameDropSceneProps> = ({
  creatorName,
  creatorBio,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const bioOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const questionOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
  });
  const questionY = interpolate(frame, [50, 70], [15, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* 크리에이터 아바타 */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            background: `linear-gradient(135deg, ${brandColors.forest[400]} 0%, ${brandColors.forest[600]} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${nameScale})`,
            boxShadow: `0 6px 24px ${brandColors.forest[500]}40`,
          }}
        >
          <span style={{ fontSize: 40, color: "white", fontWeight: 700 }}>
            {creatorName[0]}
          </span>
        </div>

        {/* 이름 */}
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            transform: `scale(${nameScale})`,
          }}
        >
          @{creatorName}
        </span>

        {/* 소개 */}
        <span
          style={{
            fontSize: 20,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.5)",
            opacity: bioOpacity,
          }}
        >
          {creatorBio}
        </span>

        {/* 질문 */}
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            fontFamily: fonts.sans,
            color: brandColors.forest[300],
            textAlign: "center",
            opacity: questionOpacity,
            transform: `translateY(${questionY}px)`,
            marginTop: 16,
            padding: "0 60px",
            lineHeight: 1.4,
          }}
        >
          올해 최고의 책은?
        </span>
      </div>
    </AbsoluteFill>
  );
};
