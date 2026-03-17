import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../config/brand";
import { TreesIcon } from "./TreesIcon";

interface CTAOverlayProps {
  text: string;
  subText?: string;
}

/**
 * CTA 오버레이 - Trees 아이콘 로고 + 프로젝트 슬로건
 */
export const CTAOverlay: React.FC<CTAOverlayProps> = ({
  text,
  subText = "독서 기록이 사라지지 않는 시대",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [35, 55], [12, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        opacity,
      }}
    >
      {/* 메인 CTA 버튼 */}
      <div
        style={{
          background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.forest[600]} 100%)`,
          borderRadius: 60,
          padding: "22px 56px",
          transform: `scale(${scale})`,
          boxShadow: `0 8px 40px rgba(54, 166, 120, 0.3)`,
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: 600,
            fontFamily: fonts.sans,
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {text}
        </span>
      </div>

      {/* 앱 정보: Trees 아이콘 + ReadTree */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TreesIcon size={36} color="#36a678" strokeWidth={2} />
          <span
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: 28,
              fontWeight: 700,
              fontFamily: fonts.english,
              letterSpacing: 2,
            }}
          >
            ReadTree
          </span>
        </div>
        {/* 프로젝트 슬로건 */}
        <span
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 17,
            fontFamily: fonts.sans,
            letterSpacing: 1,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          {subText}
        </span>
      </div>
    </div>
  );
};
