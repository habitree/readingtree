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
import { TreesIcon } from "../../../components/core/TreesIcon";

interface BookInfoSceneProps {
  title: string;
  author: string;
  pageNumber: number | null;
  coverImageUrl: string | null;
}

/**
 * 책 정보 씬 - 미니멀하고 따뜻한 디자인
 * 표지 fallback: 첫 글자 + 그라데이션 (작은 책 형태)
 * 로고 아이콘을 작게 배치하여 브랜드 연결
 */
export const BookInfoScene: React.FC<BookInfoSceneProps> = ({
  title,
  author,
  pageNumber,
  coverImageUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100, mass: 1.1 },
  });
  const translateY = interpolate(slideIn, [0, 1], [50, 0]);
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 디바이더 라인
  const lineWidth = interpolate(frame, [20, 45], [0, 60], {
    extrapolateRight: "clamp",
  });

  // 페이지 번호 등장
  const pageOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateY(${translateY}px)`,
          opacity,
          gap: 28,
        }}
      >
        {/* 책 표지 또는 fallback */}
        {coverImageUrl ? (
          <Img
            src={coverImageUrl}
            width={140}
            height={200}
            style={{
              borderRadius: 6,
              objectFit: "cover",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 200,
              borderRadius: 6,
              background: `linear-gradient(160deg, ${brandColors.forest[700]} 0%, ${brandColors.forest[900]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              border: `1px solid ${brandColors.forest[600]}40`,
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 300,
                color: brandColors.forest[200],
                fontFamily: fonts.serif,
              }}
            >
              {title[0]}
            </span>
          </div>
        )}

        {/* 책 제목 */}
        <span
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: 38,
            fontWeight: 700,
            fontFamily: fonts.serif,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {title}
        </span>

        {/* 디바이더 */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${brandColors.forest[400]}60, transparent)`,
          }}
        />

        {/* 저자 */}
        <span
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 22,
            fontFamily: fonts.sans,
            letterSpacing: 2,
          }}
        >
          {author}
        </span>

        {/* 페이지 번호 */}
        {pageNumber != null && (
          <span
            style={{
              color: brandColors.forest[400],
              fontSize: 16,
              fontFamily: fonts.sans,
              opacity: pageOpacity,
              letterSpacing: 1,
            }}
          >
            p.{pageNumber}
          </span>
        )}

        {/* 작은 Trees 로고 */}
        <div style={{ opacity: 0.2, marginTop: 8 }}>
          <TreesIcon size={24} color="#36a678" strokeWidth={1.5} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
