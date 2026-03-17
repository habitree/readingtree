import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface QuestionHookSceneProps {
  title: string;
}

/**
 * 질문 후킹 씬 — "이번 달 당신의 독서량은?"
 */
export const QuestionHookScene: React.FC<QuestionHookSceneProps> = ({
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const questionMarkOpacity = interpolate(frame, [30, 50], [0, 0.2], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 큰 물음표 배경 */}
      <span
        style={{
          position: "absolute",
          fontSize: 400,
          fontWeight: 900,
          fontFamily: fonts.english,
          color: brandColors.forest[500],
          opacity: questionMarkOpacity,
        }}
      >
        ?
      </span>

      <span
        style={{
          fontSize: 50,
          fontWeight: 800,
          fontFamily: fonts.sans,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          transform: `scale(${scale})`,
          padding: "0 60px",
          lineHeight: 1.4,
          position: "relative",
        }}
      >
        {title}
      </span>
    </AbsoluteFill>
  );
};
