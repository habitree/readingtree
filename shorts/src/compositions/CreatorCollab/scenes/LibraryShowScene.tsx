import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TreesIcon } from "../../../components/core/TreesIcon";

interface LibraryShowSceneProps {
  creatorName: string;
  libraryCount: number;
}

/**
 * 서재 공개 씬 — 크리에이터의 Habitree 서재
 */
export const LibraryShowScene: React.FC<LibraryShowSceneProps> = ({
  creatorName,
  libraryCount,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const countValue = Math.round(
    interpolate(frame, [20, 60], [0, libraryCount], {
      extrapolateRight: "clamp",
    })
  );

  const treeScale = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: 3,
            opacity: labelOpacity,
          }}
        >
          {creatorName}님의 서재
        </span>

        {/* 서재 통계 */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              fontFamily: fonts.english,
              color: brandColors.forest[400],
              display: "block",
            }}
          >
            {countValue}
          </span>
          <span
            style={{
              fontSize: 24,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            권의 책을 기록했어요
          </span>
        </div>

        {/* 나무 아이콘 */}
        <div style={{ transform: `scale(${treeScale})` }}>
          <TreesIcon size={64} color={brandColors.forest[400]} strokeWidth={1.5} />
        </div>

        {/* 함께 읽기 유도 */}
        <div
          style={{
            background: `${brandColors.forest[500]}15`,
            borderRadius: 16,
            padding: "16px 32px",
            border: `1px solid ${brandColors.forest[500]}25`,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
            }}
          >
            {creatorName}님과 함께 읽어보세요
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
