import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface StatCounterProps {
  value: number;
  suffix: string;
  label: string;
  startFrame?: number;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  suffix,
  label,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const displayValue = Math.round(
    interpolate(localFrame, [0, 40], [0, value], {
      extrapolateRight: "clamp",
    })
  );

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: brandColors.primary,
          fontFamily: fonts.english,
        }}
      >
        {displayValue.toLocaleString()}
        {suffix}
      </span>
      <span
        style={{
          fontSize: 20,
          color: brandColors.textMuted,
          fontFamily: fonts.sans,
        }}
      >
        {label}
      </span>
    </div>
  );
};
