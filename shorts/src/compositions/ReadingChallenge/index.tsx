import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { QuestionHookScene } from "./scenes/QuestionHookScene";
import { StatsScene } from "./scenes/StatsScene";
import { CompareScene } from "./scenes/CompareScene";
import { ReadingChallengeProps } from "../../types/reading-challenge";

/**
 * 독서 챌린지 (Reading Challenge) - 25초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — 질문형 후킹
 * Scene 2 (3~15초, 90~450f): 통계 인포그래픽
 * Scene 3 (15~20초, 450~600f): 한국인 평균 비교
 * Scene 4 (20~25초, 600~750f): CTA
 */
export const ReadingChallenge: React.FC<ReadingChallengeProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <QuestionHookScene title={props.challengeTitle} />
      </Sequence>

      <Sequence from={90} durationInFrames={360}>
        <StatsScene
          booksRead={props.booksRead}
          booksGoal={props.booksGoal}
          totalPages={props.totalPages}
          genres={props.genres}
        />
      </Sequence>

      <Sequence from={450} durationInFrames={150}>
        <CompareScene percentile={props.percentile} />
      </Sequence>

      <Sequence from={600} durationInFrames={150}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay
            text={props.ctaText}
            subText="챌린지 참여하고 나무 키우기"
          />
        </AbsoluteFill>
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={750}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
