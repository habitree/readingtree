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

interface DualScreenSlideProps {
  title: string;
  description: string;
  pcImage: string;
  mobileImage: string;
  index: number;
}

/**
 * 고도화된 듀얼 스크린 슬라이드
 *
 * 레이아웃 (1080x1920 세로):
 * - 상단: 넘버 + 타이틀 (약 120px)
 * - 중앙 상부: PC 스크린샷 (3D perspective 기울기, 화면 85% 너비)
 * - 중앙 하부: 모바일 스크린샷 (폰 프레임, PC 위에 겹쳐서 우측 하단에 올라옴)
 * - 하단: 글래스모피즘 카드 위 설명 텍스트
 */
export const DualScreenSlide: React.FC<DualScreenSlideProps> = ({
  title,
  description,
  pcImage,
  mobileImage,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 타이틀 등장 (위에서 아래로)
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [-30, 0]);
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // PC 스크린샷 (3D 원근감으로 등장)
  const pcSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const pcRotateX = interpolate(pcSpring, [0, 1], [6, 1]);
  const pcScale = interpolate(pcSpring, [0, 1], [0.85, 1]);
  const pcOpacity = interpolate(frame, [8, 28], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 모바일 스크린샷 (우측 하단에서 올라오며 겹침)
  const mobileSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const mobileY = interpolate(mobileSpring, [0, 1], [120, 0]);
  const mobileX = interpolate(mobileSpring, [0, 1], [60, 0]);
  const mobileOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 설명 글래스 카드 등장
  const descSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const descY = interpolate(descSpring, [0, 1], [40, 0]);
  const descOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  // fadeout
  const fadeOut = interpolate(frame, [240, 260], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // 인덱스별 accent
  const numColor = index % 2 === 0 ? brandColors.primary : brandColors.accent;

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* 상단: 넘버 + 타이틀 */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 14,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: numColor,
            fontSize: 72,
            fontFamily: fonts.english,
            fontWeight: 900,
            opacity: 0.2,
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 42,
            fontFamily: fonts.serif,
            fontWeight: 700,
          }}
        >
          {title}
        </span>
      </div>

      {/* 중앙: PC + 모바일 겹침 레이아웃 */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* PC 스크린샷 - 3D perspective */}
        <div
          style={{
            width: 980,
            perspective: 800,
            opacity: pcOpacity,
          }}
        >
          <div
            style={{
              transformOrigin: "center top",
              transform: `rotateX(${pcRotateX}deg) scale(${pcScale})`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
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
              src={staticFile(pcImage)}
              style={{ width: "100%", display: "block" }}
            />
          </div>
        </div>

        {/* 모바일 스크린샷 - PC 위에 겹쳐서 우측 하단 */}
        <div
          style={{
            position: "absolute",
            right: 20,
            top: 280,
            width: 300,
            opacity: mobileOpacity,
            transform: `translateY(${mobileY}px) translateX(${mobileX}px)`,
            zIndex: 5,
          }}
        >
          <div
            style={{
              borderRadius: 40,
              overflow: "hidden",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,255,255,0.12)",
              background: "#0a0a0a",
              padding: "10px 0 0",
            }}
          >
            {/* Dynamic Island 스타일 노치 */}
            <div
              style={{
                width: 90,
                height: 24,
                borderRadius: 12,
                background: "#111",
                margin: "0 auto 6px",
              }}
            />
            <Img
              src={staticFile(mobileImage)}
              style={{
                width: "100%",
                display: "block",
                borderRadius: "0 0 28px 28px",
              }}
            />
          </div>
        </div>
      </div>

      {/* 하단: 글래스모피즘 설명 카드 */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 40,
          right: 40,
          opacity: descOpacity,
          transform: `translateY(${descY}px)`,
          zIndex: 15,
        }}
      >
        <div
          style={{
            background: "rgba(15, 25, 18, 0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 24,
            border: "1px solid rgba(54, 166, 120, 0.15)",
            padding: "28px 36px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: numColor,
              }}
            />
            <span
              style={{
                color: numColor,
                fontSize: 22,
                fontFamily: fonts.sans,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {title}
            </span>
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 24,
              fontFamily: fonts.sans,
              lineHeight: 1.6,
              display: "block",
            }}
          >
            {description}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
