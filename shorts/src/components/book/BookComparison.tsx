import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../config/brand";
import { BookCover } from "./BookCover";

interface BookComparisonProps {
  bookA: { title: string; author: string | null; coverImageUrl: string | null };
  bookB: { title: string; author: string | null; coverImageUrl: string | null };
}

export const BookComparison: React.FC<BookComparisonProps> = ({
  bookA,
  bookB,
}) => {
  const frame = useCurrentFrame();

  const slideA = interpolate(frame, [0, 20], [-300, 0], {
    extrapolateRight: "clamp",
  });
  const slideB = interpolate(frame, [10, 30], [300, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `translateX(${slideA}px)`,
        }}
      >
        <BookCover coverImageUrl={bookA.coverImageUrl} title={bookA.title} width={180} height={250} />
        <span style={{ color: brandColors.text, fontSize: 24, fontFamily: fonts.sans, fontWeight: 600 }}>
          {bookA.title}
        </span>
        <span style={{ color: brandColors.textMuted, fontSize: 18, fontFamily: fonts.sans }}>
          {bookA.author}
        </span>
      </div>

      <span
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: brandColors.primary,
          fontFamily: fonts.english,
        }}
      >
        VS
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `translateX(${slideB}px)`,
        }}
      >
        <BookCover coverImageUrl={bookB.coverImageUrl} title={bookB.title} width={180} height={250} />
        <span style={{ color: brandColors.text, fontSize: 24, fontFamily: fonts.sans, fontWeight: 600 }}>
          {bookB.title}
        </span>
        <span style={{ color: brandColors.textMuted, fontSize: 18, fontFamily: fonts.sans }}>
          {bookB.author}
        </span>
      </div>
    </div>
  );
};
