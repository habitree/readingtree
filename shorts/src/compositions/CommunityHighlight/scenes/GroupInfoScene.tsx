import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface GroupInfoSceneProps {
  groupName: string;
  topic: string;
  memberCount: number;
  currentBook: string;
}

/**
 * 모임 정보 씬 — 프로필 카드
 */
export const GroupInfoScene: React.FC<GroupInfoSceneProps> = ({
  groupName,
  topic,
  memberCount,
  currentBook,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const cardY = interpolate(cardSlide, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          transform: `translateY(${cardY}px)`,
          opacity,
          padding: "0 60px",
        }}
      >
        {/* 모임 아바타 */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            background: `linear-gradient(135deg, ${brandColors.forest[500]} 0%, ${brandColors.forest[700]} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 30px ${brandColors.forest[500]}40`,
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontFamily: fonts.serif,
              color: "white",
              fontWeight: 700,
            }}
          >
            {groupName[0]}
          </span>
        </div>

        {/* 모임 이름 */}
        <span
          style={{
            fontSize: 38,
            fontWeight: 800,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
          }}
        >
          {groupName}
        </span>

        {/* 주제 */}
        <span
          style={{
            fontSize: 22,
            fontFamily: fonts.sans,
            color: brandColors.forest[400],
            background: `${brandColors.forest[500]}15`,
            border: `1px solid ${brandColors.forest[500]}30`,
            borderRadius: 20,
            padding: "6px 20px",
          }}
        >
          {topic}
        </span>

        {/* 메타 정보 */}
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                fontFamily: fonts.english,
                color: brandColors.forest[400],
                display: "block",
              }}
            >
              {memberCount}
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: fonts.sans,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              멤버
            </span>
          </div>
        </div>

        {/* 현재 읽는 책 */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: "14px 24px",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.4)",
              display: "block",
              marginBottom: 6,
            }}
          >
            이번 달 읽는 책
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: fonts.serif,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {currentBook}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
