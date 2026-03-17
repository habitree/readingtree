import React from "react";
import { AbsoluteFill } from "remotion";
import { CTAOverlay } from "../../../components/core/CTAOverlay";

interface CTAEndSceneProps {
  ctaText: string;
}

export const CTAEndScene: React.FC<CTAEndSceneProps> = ({ ctaText }) => {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <CTAOverlay text={ctaText} />
    </AbsoluteFill>
  );
};
