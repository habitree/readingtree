import React from "react";
import { AbsoluteFill } from "remotion";
import { CTAOverlay } from "../../../components/core/CTAOverlay";

/**
 * CTA 씬 - 앱 다운로드 유도
 * 프로젝트 슬로건 "독서 기록이 사라지지 않는 시대" 활용
 */
export const CTAScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CTAOverlay text="이 문장, ReadTree에 저장하기" />
    </AbsoluteFill>
  );
};
