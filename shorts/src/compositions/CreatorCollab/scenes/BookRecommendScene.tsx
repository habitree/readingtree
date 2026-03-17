import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TextReveal } from "../../../components/text/TextReveal";

interface BookRecommendSceneProps {
  bookTitle: string;
  bookAuthor: string;
  recommendQuote: string;
}

/**
 * 책 추천 씬 — 인용구 + 책 정보
 */
export const BookRecommendScene: React.FC<BookRecommendSceneProps> = ({
  bookTitle,
  bookAuthor,
  recommendQuote,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bookSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const bookY = interpolate(bookSlide, [0, 1], [40, 0]);
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
          gap: 36,
          transform: `translateY(${bookY}px)`,
          opacity,
        }}
      >
        {/* 책 커버 placeholder */}
        <div
          style={{
            width: 160,
            height: 230,
            borderRadius: 8,
            background: `linear-gradient(160deg, ${brandColors.forest[700]} 0%, ${brandColors.forest[900]} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            border: `1px solid ${brandColors.forest[600]}30`,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontFamily: fonts.serif,
              color: brandColors.forest[200],
              fontWeight: 300,
            }}
          >
            {bookTitle[0]}
          </span>
        </div>

        {/* 책 제목 + 저자 */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              fontFamily: fonts.serif,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {bookTitle}
          </div>
          <div
            style={{
              fontSize: 20,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            {bookAuthor}
          </div>
        </div>

        {/* 추천 인용구 */}
        <div
          style={{
            maxWidth: 800,
            padding: "0 40px",
          }}
        >
          <TextReveal
            text={recommendQuote}
            fontSize={30}
            startFrame={40}
            mode="line"
            color="rgba(255,255,255,0.75)"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
