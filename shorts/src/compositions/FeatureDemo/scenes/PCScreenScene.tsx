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

interface PCScreenSceneProps {
  screenshotPC: string;
  featureTitle: string;
  description: string;
}

export const PCScreenScene: React.FC<PCScreenSceneProps> = ({
  screenshotPC,
  featureTitle,
  description,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 라벨
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // PC 스크린샷 3D 등장
  const pcSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const rotateX = interpolate(pcSpring, [0, 1], [8, 2]);
  const pcScale = interpolate(pcSpring, [0, 1], [0.9, 1]);
  const pcOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 글래스 카드 설명
  const descSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const descY = interpolate(descSpring, [0, 1], [30, 0]);
  const descOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateRight: "clamp",
  });

  // fadeout
  const fadeOut = interpolate(frame, [230, 250], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* DESKTOP VIEW 라벨 */}
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
            background: brandColors.primary,
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
          DESKTOP VIEW
        </span>
      </div>

      {/* PC 스크린샷 - 3D perspective */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 30,
          right: 30,
          perspective: 800,
          opacity: pcOpacity,
        }}
      >
        <div
          style={{
            transformOrigin: "center top",
            transform: `rotateX(${rotateX}deg) scale(${pcScale})`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 50px 120px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* 브라우저 탑바 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px",
              background: "rgba(20,30,25,0.98)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#ff5f57",
              }}
            />
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#febc2e",
              }}
            />
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#28c840",
              }}
            />
            <div
              style={{
                flex: 1,
                marginLeft: 16,
                padding: "5px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.35)",
                fontSize: 12,
                fontFamily: fonts.english,
              }}
            >
              readtree.app
            </div>
          </div>
          <Img
            src={staticFile(screenshotPC)}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>

      {/* 하단: 글래스 카드 설명 */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 30,
          right: 30,
          marginTop: -40,
          opacity: descOpacity,
          transform: `translateY(${descY}px)`,
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
            padding: "24px 32px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              color: brandColors.primary,
              fontSize: 26,
              fontFamily: fonts.serif,
              fontWeight: 700,
              display: "block",
              marginBottom: 10,
            }}
          >
            {featureTitle}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 21,
              fontFamily: fonts.sans,
              lineHeight: 1.6,
              display: "block",
              whiteSpace: "pre-line",
            }}
          >
            {description}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
