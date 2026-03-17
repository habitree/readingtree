import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { HookScene } from "./scenes/HookScene";
import { IntroScene } from "./scenes/IntroScene";
import { DualScreenSlide } from "./scenes/DualScreenSlide";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { ServiceShowcaseProps } from "../../types/service-showcase";

/**
 * 전체 서비스 쇼케이스 영상 - 50초 (1500프레임) 고도화 버전
 *
 * Scene 0 (0~3초,    0~90f):   훅 - "독서 기록, 어디에 하고 계세요?"
 * Scene 1 (3~7.3초,  90~220f): 인트로 - 로고 + 태그라인
 * Scene 2~N: 각 슬라이드 (8초, 270f) - 3D PC + 모바일 겹침 + 글래스 카드
 * 마지막 (8초, 240f): CTA 클로징
 */
export const ServiceShowcase: React.FC<ServiceShowcaseProps> = (props) => {
  const slideFrames = 270;
  const slidesStart = 210;
  const ctaStart = slidesStart + props.slides.length * slideFrames;

  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      {/* 훅: 강렬한 질문 */}
      <Sequence from={0} durationInFrames={100}>
        <HookScene />
      </Sequence>

      {/* 인트로: 로고 + 태그라인 */}
      <Sequence from={90} durationInFrames={140}>
        <IntroScene tagline={props.tagline} />
      </Sequence>

      {/* 기능별 슬라이드 */}
      {props.slides.map((slide, i) => (
        <Sequence
          key={i}
          from={slidesStart + i * slideFrames}
          durationInFrames={slideFrames + 10}
        >
          <DualScreenSlide
            title={slide.title}
            description={slide.description}
            pcImage={slide.pcImage}
            mobileImage={slide.mobileImage}
            index={i}
          />
        </Sequence>
      ))}

      {/* CTA 클로징 */}
      <Sequence from={ctaStart} durationInFrames={240}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay text={props.ctaText} />
        </AbsoluteFill>
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={ctaStart + 240}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
