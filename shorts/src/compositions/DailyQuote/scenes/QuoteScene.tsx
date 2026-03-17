import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TextReveal } from "../../../components/text/TextReveal";
import { brandColors, fonts } from "../../../config/brand";

interface QuoteSceneProps {
  text: string;
}

/**
 * 메인 문장 씬 - 줄 단위 등장
 * 상하에 얇은 장식선 + 은은한 인용 부호
 * 숲속 고요한 분위기에 어울리는 세리프 타이포그래피
 */
export const QuoteScene: React.FC<QuoteSceneProps> = ({ text }) => {
  const frame = useCurrentFrame();

  // 상단 인용 부호 (아주 은은하게)
  const quoteMarkOpacity = interpolate(frame, [0, 20], [0, 0.15], {
    extrapolateRight: "clamp",
  });

  // 장식 라인
  const lineWidth = interpolate(frame, [5, 30], [0, 80], {
    extrapolateRight: "clamp",
  });

  // 하단 라인 (텍스트 등장 후)
  const bottomLineWidth = interpolate(frame, [180, 210], [0, 80], {
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
          gap: 32,
          maxWidth: 900,
        }}
      >
        {/* 상단 장식 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* 인용 부호 - 작고 우아하게 */}
          <span
            style={{
              fontSize: 72,
              color: brandColors.forest[400],
              fontFamily: `"Georgia", serif`,
              lineHeight: 1,
              opacity: quoteMarkOpacity,
            }}
          >
            {"\u201C"}
          </span>
          {/* 상단 라인 */}
          <div
            style={{
              width: lineWidth,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${brandColors.forest[400]}50, transparent)`,
            }}
          />
        </div>

        {/* 메인 텍스트 */}
        <TextReveal
          text={text}
          fontSize={46}
          startFrame={15}
          mode="line"
          color="rgba(255, 255, 255, 0.92)"
        />

        {/* 하단 장식 라인 */}
        <div
          style={{
            width: bottomLineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${brandColors.forest[400]}50, transparent)`,
            marginTop: 8,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
