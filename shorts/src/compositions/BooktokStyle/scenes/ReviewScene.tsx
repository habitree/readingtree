import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface ReviewSceneProps {
  reviewText: string;
  rating: number;
  emotionTags: string[];
  bookTitle: string;
  author: string;
  coverImageUrl: string | null;
}

/**
 * 리뷰 씬 — 별점 + 감정 태그 + 책 정보
 */
export const ReviewScene: React.FC<ReviewSceneProps> = ({
  reviewText,
  rating,
  emotionTags,
  bookTitle,
  author,
  coverImageUrl,
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

  const tagOpacity = interpolate(frame, [50, 70], [0, 1], {
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
          transform: `translateY(${cardY}px)`,
          opacity,
        }}
      >
        {/* 책 커버 (작게) */}
        {coverImageUrl ? (
          <Img
            src={coverImageUrl}
            width={100}
            height={144}
            style={{
              borderRadius: 6,
              objectFit: "cover",
              boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 144,
              borderRadius: 6,
              background: `linear-gradient(160deg, ${brandColors.paper[700]} 0%, ${brandColors.paper[950]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
            }}
          >
            <span
              style={{
                fontSize: 40,
                fontFamily: fonts.serif,
                color: brandColors.paper[300],
              }}
            >
              {bookTitle[0]}
            </span>
          </div>
        )}

        {/* 책 제목 + 저자 */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              fontFamily: fonts.serif,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {bookTitle}
          </div>
          <div
            style={{
              fontSize: 18,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 6,
            }}
          >
            {author}
          </div>
        </div>

        {/* 별점 */}
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: 32,
                color:
                  i < rating
                    ? brandColors.paper[500]
                    : "rgba(255,255,255,0.15)",
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* 한 줄 리뷰 */}
        <span
          style={{
            fontSize: 34,
            fontWeight: 600,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            padding: "0 60px",
            lineHeight: 1.5,
          }}
        >
          {reviewText}
        </span>

        {/* 감정 태그 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: tagOpacity,
          }}
        >
          {emotionTags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 18,
                fontFamily: fonts.sans,
                color: brandColors.paper[300],
                background: `${brandColors.paper[500]}15`,
                border: `1px solid ${brandColors.paper[500]}30`,
                borderRadius: 20,
                padding: "4px 16px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
