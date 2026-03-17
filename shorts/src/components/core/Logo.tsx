import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../../config/brand";
import { TreesIcon } from "./TreesIcon";

interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

/**
 * ReadTree 로고 - 서비스 헤더와 동일한 Trees 아이콘 + "ReadTree" 텍스트
 * forest-600 (#24855e) 컬러의 Lucide Trees 아이콘 사용
 */
export const Logo: React.FC<LogoProps> = ({
  size = 56,
  showText = true,
  color = "#24855e",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 1.2 },
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const glowOpacity = interpolate(frame, [5, 25], [0, 0.5], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {/* 아이콘 뒤 글로우 */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 2,
            height: size * 2,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(36, 133, 94, 0.2) 0%, transparent 70%)",
            opacity: glowOpacity,
          }}
        />
        <TreesIcon size={size} color={color} strokeWidth={2} />
      </div>
      {showText && (
        <span
          style={{
            color: "rgba(255, 255, 255, 0.95)",
            fontSize: size * 0.64,
            fontWeight: 700,
            fontFamily: fonts.english,
            letterSpacing: 1,
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          ReadTree
        </span>
      )}
    </div>
  );
};
