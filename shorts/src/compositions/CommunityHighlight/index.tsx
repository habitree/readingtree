import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { RankingHookScene } from "./scenes/RankingHookScene";
import { GroupInfoScene } from "./scenes/GroupInfoScene";
import { HighlightsScene } from "./scenes/HighlightsScene";
import { CommunityHighlightProps } from "../../types/community-highlight";

/**
 * 독서모임 하이라이트 (Community Highlight) - 35초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — 랭킹/호기심
 * Scene 2 (3~12초, 90~360f): 모임 정보 카드
 * Scene 3 (12~25초, 360~750f): 토론 하이라이트
 * Scene 4 (25~35초, 750~1050f): CTA
 */
export const CommunityHighlight: React.FC<CommunityHighlightProps> = (
  props
) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <RankingHookScene />
      </Sequence>

      <Sequence from={90} durationInFrames={270}>
        <GroupInfoScene
          groupName={props.groupName}
          topic={props.topic}
          memberCount={props.memberCount}
          currentBook={props.currentBook}
        />
      </Sequence>

      <Sequence from={360} durationInFrames={390}>
        <HighlightsScene highlights={props.highlights} />
      </Sequence>

      <Sequence from={750} durationInFrames={300}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay
            text={props.ctaText}
            subText="함께 읽으면 더 깊어지는 독서"
          />
        </AbsoluteFill>
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={1050}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
