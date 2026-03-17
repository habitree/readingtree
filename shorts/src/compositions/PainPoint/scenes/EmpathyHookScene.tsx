import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../../../config/brand";

interface EmpathyHookSceneProps {
  question: string;
}

/**
 * 공감 후킹 씬 — "독서 기록 메모장에 하는 사람?"
 */
export const EmpathyHookScene: React.FC<EmpathyHookSceneProps> = ({
  question,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // 손 들기 이모지 애니메이션
  const emojiOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const emojiY = interpolate(frame, [30, 50], [20, 0], {
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
        }}
      >
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
          }}
        >
          {question}
        </span>

        <span
          style={{
            fontSize: 64,
            opacity: emojiOpacity,
            transform: `translateY(${emojiY}px)`,
          }}
        >
          {"\u{1F64B}"}
        </span>
      </div>
    </AbsoluteFill>
  );
};
