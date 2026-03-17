import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { CTAOverlay } from "../../components/core/CTAOverlay";
import { EmotionHookScene } from "./scenes/EmotionHookScene";
import { QuoteHighlightScene } from "./scenes/QuoteHighlightScene";
import { ReviewScene } from "./scenes/ReviewScene";
import { BooktokStyleProps } from "../../types/booktok-style";

/**
 * BookTok 감성 리뷰 (Booktok Style) - 30초 영상
 *
 * Scene 1 (0~3초, 0~90f): Hook — 감정 충격 한 줄
 * Scene 2 (3~12초, 90~360f): 핵심 인용구/장면
 * Scene 3 (12~22초, 360~660f): 리뷰 + 별점 + 감정 태그
 * Scene 4 (22~30초, 660~900f): CTA
 */
export const BooktokStyle: React.FC<BooktokStyleProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="paper" />

      <Sequence from={0} durationInFrames={90}>
        <EmotionHookScene hookText={props.hookText} />
      </Sequence>

      <Sequence from={90} durationInFrames={270}>
        <QuoteHighlightScene quoteText={props.quoteText} />
      </Sequence>

      <Sequence from={360} durationInFrames={300}>
        <ReviewScene
          reviewText={props.reviewText}
          rating={props.rating}
          emotionTags={props.emotionTags}
          bookTitle={props.bookTitle}
          author={props.author}
          coverImageUrl={props.coverImageUrl}
        />
      </Sequence>

      <Sequence from={660} durationInFrames={240}>
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <CTAOverlay
            text="이 책 기록하러 가기"
            subText="감동을 기록으로 남기세요"
          />
        </AbsoluteFill>
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
