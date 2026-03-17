import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { HookScene } from "./scenes/HookScene";
import { BeforeScene } from "./scenes/BeforeScene";
import { TransitionScene } from "./scenes/TransitionScene";
import { AfterScene } from "./scenes/AfterScene";
import { UserStoryProps } from "../../types/user-story";

/**
 * 사용자 변화 스토리 (User Story) - 45초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — "3개월 전의 저는..."
 * Scene 2 (3~12초, 90~360f): Before — 문제 상황
 * Scene 3 (12~18초, 360~540f): Transition — "Habitree를 만나고..."
 * Scene 4 (18~35초, 540~1050f): After — 변화된 모습
 * Scene 5 (35~45초, 1050~1350f): CTA
 */
export const UserStory: React.FC<UserStoryProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <HookScene userName={props.userName} duration={props.duration} />
      </Sequence>

      <Sequence from={90} durationInFrames={270}>
        <BeforeScene text={props.beforeText} stat={props.beforeStat} />
      </Sequence>

      <Sequence from={360} durationInFrames={180}>
        <TransitionScene text={props.transitionText} />
      </Sequence>

      <Sequence from={540} durationInFrames={510}>
        <AfterScene text={props.afterText} stat={props.afterStat} />
      </Sequence>

      <Sequence from={1050} durationInFrames={300}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay
            text={props.ctaText}
            subText="당신의 독서도 변할 수 있어요"
          />
        </AbsoluteFill>
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
