import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { EmpathyHookScene } from "./scenes/EmpathyHookScene";
import { PainListScene } from "./scenes/PainListScene";
import { SolutionRevealScene } from "./scenes/SolutionRevealScene";
import { PainPointProps } from "../../types/pain-point";

/**
 * 공감형 콘텐츠 (Pain Point) - 20초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — 공감 질문
 * Scene 2 (3~10초, 90~300f): 문제 상황 나열
 * Scene 3 (10~17초, 300~510f): 해결책 제시
 * Scene 4 (17~20초, 510~600f): CTA
 */
export const PainPoint: React.FC<PainPointProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <EmpathyHookScene question={props.hookQuestion} />
      </Sequence>

      <Sequence from={90} durationInFrames={210}>
        <PainListScene painPoints={props.painPoints} />
      </Sequence>

      <Sequence from={300} durationInFrames={210}>
        <SolutionRevealScene text={props.solutionText} />
      </Sequence>

      <Sequence from={510} durationInFrames={90}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay text={props.ctaText} />
        </AbsoluteFill>
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={600}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
