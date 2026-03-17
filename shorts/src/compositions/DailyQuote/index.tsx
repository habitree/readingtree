import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Background } from "../../components/core/Background";
import { Watermark } from "../../components/core/Watermark";
import { AudioLayer } from "../../components/core/AudioLayer";
import { OpeningScene } from "./scenes/OpeningScene";
import { QuoteScene } from "./scenes/QuoteScene";
import { BookInfoScene } from "./scenes/BookInfoScene";
import { CTAScene } from "./scenes/CTAScene";
import { DailyQuoteProps } from "../../types/daily-quote";

/**
 * 오늘의 문장 (Daily Quote) - 25초 영상
 *
 * Scene 1 (0~3초, 0~90f): 오프닝 - 로고 + 시리즈 타이틀
 * Scene 2 (3~15초, 90~450f): 메인 문장 - 워드 바이 워드 텍스트 등장
 * Scene 3 (15~20초, 450~600f): 책 정보
 * Scene 4 (20~25초, 600~750f): CTA
 */
export const DailyQuote: React.FC<DailyQuoteProps> = (props) => {
  return (
    <AbsoluteFill>
      <Background theme="forest-dark" />

      <Sequence from={0} durationInFrames={90}>
        <OpeningScene />
      </Sequence>

      <Sequence from={90} durationInFrames={360}>
        <QuoteScene text={props.quoteText} />
      </Sequence>

      <Sequence from={450} durationInFrames={150}>
        <BookInfoScene
          title={props.bookTitle}
          author={props.author}
          pageNumber={props.pageNumber}
          coverImageUrl={props.coverImageUrl}
        />
      </Sequence>

      <Sequence from={600} durationInFrames={150}>
        <CTAScene />
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
