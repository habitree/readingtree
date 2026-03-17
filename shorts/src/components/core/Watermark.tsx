import React from "react";
import { AbsoluteFill } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface WatermarkProps {
  text?: string;
  position?: "bottom-left" | "bottom-right";
}

export const Watermark: React.FC<WatermarkProps> = ({
  text = "@readtree.app",
  position = "bottom-right",
}) => {
  const isRight = position === "bottom-right";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: isRight ? "flex-end" : "flex-start",
        padding: 40,
      }}
    >
      <span
        style={{
          color: "rgba(255, 255, 255, 0.3)",
          fontSize: 16,
          fontFamily: fonts.english,
          letterSpacing: 1,
        }}
      >
        {text}
      </span>
    </AbsoluteFill>
  );
};
