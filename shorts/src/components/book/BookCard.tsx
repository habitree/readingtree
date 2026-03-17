import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface BookCardProps {
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  pageNumber?: number | null;
}

export const BookCard: React.FC<BookCardProps> = ({
  title,
  author,
  coverImageUrl,
  pageNumber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const translateY = interpolate(slideIn, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          borderRadius: 20,
          padding: "32px 40px",
          border: `1px solid rgba(54, 166, 120, 0.2)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {coverImageUrl ? (
          <Img
            src={coverImageUrl}
            width={120}
            height={170}
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 170,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${brandColors.forest[700]} 0%, ${brandColors.forest[900]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 48,
                color: brandColors.forest[300],
                fontFamily: fonts.serif,
              }}
            >
              {title[0]}
            </span>
          </div>
        )}

        <span
          style={{
            color: brandColors.text,
            fontSize: 36,
            fontWeight: 700,
            fontFamily: fonts.sans,
            textAlign: "center",
          }}
        >
          {title}
        </span>

        <span
          style={{
            color: brandColors.textMuted,
            fontSize: 24,
            fontFamily: fonts.sans,
          }}
        >
          {author}
          {pageNumber != null && ` · p.${pageNumber}`}
        </span>
      </div>
    </div>
  );
};
