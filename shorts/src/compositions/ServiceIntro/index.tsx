import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { HeroScene } from "./scenes/HeroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { FeatureShowScene } from "./scenes/FeatureShowScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { ServiceIntroProps } from "../../types/service-intro";

/**
 * ReadTree 서비스 소개 영상 - 45초
 *
 * Scene 1 (0~5초,   0~150f):  히어로 - 로고 + 태그라인
 * Scene 2 (5~12초,  150~360f): 문제 제기 - 흩어진 독서 기록의 고통
 * Scene 3 (12~30초, 360~900f): 솔루션 - 4가지 핵심 기능 순차 소개
 * Scene 4 (30~38초, 900~1140f): 기능 하이라이트 - 핵심 UX 강조
 * Scene 5 (38~45초, 1140~1350f): 클로징 - CTA + 슬로건
 */
export const ServiceIntro: React.FC<ServiceIntroProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={150}>
        <HeroScene tagline={props.tagline} />
      </Sequence>

      <Sequence from={150} durationInFrames={210}>
        <ProblemScene painPoints={props.painPoints} />
      </Sequence>

      <Sequence from={360} durationInFrames={540}>
        <SolutionScene features={props.features} />
      </Sequence>

      <Sequence from={900} durationInFrames={240}>
        <FeatureShowScene stats={props.stats} />
      </Sequence>

      <Sequence from={1140} durationInFrames={210}>
        <ClosingScene ctaText={props.ctaText} />
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={1350}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
