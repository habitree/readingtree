import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { fonts, brandColors } from "../../../config/brand";

interface MobileScreenSceneProps {
  screenshotMobile: string;
  highlights: string[];
}

export const MobileScreenScene: React.FC<MobileScreenSceneProps> = ({
  screenshotMobile,
  highlights,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 모바일 폰 등장 (아래에서 위로 + 살짝 스케일)
  const phoneSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const phoneY = interpolate(phoneSpring, [0, 1], [80, 0]);
  const phoneScale = interpolate(phoneSpring, [0, 1], [0.9, 1]);
  const phoneOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // fadeout
  const fadeOut = interpolate(frame, [260, 280], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* MOBILE VIEW 라벨 */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          opacity: labelOpacity,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: brandColors.accent,
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 18,
            fontFamily: fonts.english,
            fontWeight: 600,
            letterSpacing: 4,
          }}
        >
          MOBILE VIEW
        </span>
      </div>

      {/* 중앙: 폰 프레임 + 스크린샷 */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: phoneOpacity,
          transform: `translateY(${phoneY}px) scale(${phoneScale})`,
        }}
      >
        <div
          style={{
            width: 420,
            borderRadius: 52,
            overflow: "hidden",
            boxShadow:
              "0 40px 100px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.1)",
            background: "#0a0a0a",
            padding: "14px 0 0",
          }}
        >
          {/* Dynamic Island 노치 */}
          <div
            style={{
              width: 130,
              height: 32,
              borderRadius: 16,
              background: "#111",
              margin: "0 auto 8px",
            }}
          />
          <Img
            src={staticFile(screenshotMobile)}
            style={{
              width: "100%",
              display: "block",
              borderRadius: "0 0 40px 40px",
            }}
          />
        </div>
      </div>

      {/* 하단: 글래스 카드 하이라이트 목록 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 40,
          right: 40,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "rgba(15, 25, 18, 0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 20,
            border: "1px solid rgba(54, 166, 120, 0.12)",
            padding: "24px 30px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {highlights.map((text, i) => {
            const delay = 35 + i * 20;
            const itemOpacity = interpolate(
              frame,
              [delay, delay + 15],
              [0, 1],
              { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
            );
            const itemX = interpolate(frame, [delay, delay + 15], [20, 0], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: brandColors.primary,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 24,
                    fontFamily: fonts.sans,
                    lineHeight: 1.3,
                  }}
                >
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
