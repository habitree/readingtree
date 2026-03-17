import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { TitleScene } from "./scenes/TitleScene";
import { PCScreenScene } from "./scenes/PCScreenScene";
import { MobileScreenScene } from "./scenes/MobileScreenScene";
import { CTAEndScene } from "./scenes/CTAEndScene";
import { FeatureDemoProps } from "../../types/feature-demo";

/**
 * 기능 데모 영상 - 30초 (900프레임)
 *
 * Scene 1 (0~4.3초,  0~130f):    타이틀 - 기능명 + 서브타이틀
 * Scene 2 (4.3~12.7초, 130~380f): PC 화면 - 데스크톱 스크린샷 + 설명
 * Scene 3 (12.7~22초, 380~660f):  모바일 화면 - 폰 프레임 + 하이라이트
 * Scene 4 (22~30초,  660~900f):   CTA - 클로징
 */
export const FeatureDemo: React.FC<FeatureDemoProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={150}>
        <TitleScene
          featureTitle={props.featureTitle}
          featureSubtitle={props.featureSubtitle}
        />
      </Sequence>

      <Sequence from={130} durationInFrames={270}>
        <PCScreenScene
          screenshotPC={props.screenshotPC}
          featureTitle={props.featureTitle}
          description={props.featureDescription}
        />
      </Sequence>

      <Sequence from={380} durationInFrames={300}>
        <MobileScreenScene
          screenshotMobile={props.screenshotMobile}
          highlights={props.highlights}
        />
      </Sequence>

      <Sequence from={660} durationInFrames={240}>
        <CTAEndScene ctaText={props.ctaText} />
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={900}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
