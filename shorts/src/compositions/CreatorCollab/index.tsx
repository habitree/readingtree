import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { NameDropScene } from "./scenes/NameDropScene";
import { BookRecommendScene } from "./scenes/BookRecommendScene";
import { LibraryShowScene } from "./scenes/LibraryShowScene";
import { CreatorCollabProps } from "../../types/creator-collab";

/**
 * 크리에이터 콜라보 (Creator Collab) - 40초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — 네임드 드롭
 * Scene 2 (3~15초, 90~450f): 책 추천 + 인용
 * Scene 3 (15~28초, 450~840f): 서재 공개
 * Scene 4 (28~40초, 840~1200f): CTA
 */
export const CreatorCollab: React.FC<CreatorCollabProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <NameDropScene
          creatorName={props.creatorName}
          creatorBio={props.creatorBio}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={360}>
        <BookRecommendScene
          bookTitle={props.bookTitle}
          bookAuthor={props.bookAuthor}
          recommendQuote={props.recommendQuote}
        />
      </Sequence>

      <Sequence from={450} durationInFrames={390}>
        <LibraryShowScene
          creatorName={props.creatorName}
          libraryCount={props.libraryCount}
        />
      </Sequence>

      <Sequence from={840} durationInFrames={360}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay
            text={props.ctaText}
            subText="나만의 독서 브랜드를 만들어보세요"
          />
        </AbsoluteFill>
      </Sequence>

      <AudioLayer
        bgmSrc={props.bgmUrl ? staticFile(props.bgmUrl) : undefined}
        ttsSrc={props.audioUrl ? staticFile(props.audioUrl) : undefined}
        totalFrames={1200}
      />

      <Watermark />
    </AbsoluteFill>
  );
};
