import React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface BookCoverProps {
  coverImageUrl: string | null;
  title: string;
  width?: number;
  height?: number;
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverImageUrl,
  title,
  width = 200,
  height = 280,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 15 } });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      {coverImageUrl ? (
        <Img
          src={coverImageUrl}
          width={width}
          height={height}
          style={{
            borderRadius: 12,
            objectFit: "cover",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          }}
        />
      ) : (
        <div
          style={{
            width,
            height,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${brandColors.forest[600]} 0%, ${brandColors.forest[800]} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            padding: 20,
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: brandColors.text,
              fontFamily: fonts.serif,
              textAlign: "center",
              wordBreak: "keep-all",
            }}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};
