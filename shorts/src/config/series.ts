/**
 * 5가지 쇼츠 시리즈 메타데이터
 */

export interface SeriesConfig {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  durationSeconds: number;
}

export const SERIES: Record<string, SeriesConfig> = {
  "daily-quote": {
    id: "DailyQuote",
    name: "daily-quote",
    nameKo: "오늘의 문장",
    description: "인상 깊은 문장 한 줄과 책 정보를 소개하는 감성 쇼츠",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 750, // 25초
    durationSeconds: 25,
  },
  "book-review": {
    id: "BookReview",
    name: "book-review",
    nameKo: "1분 북리뷰",
    description: "완독 많은 인기 책의 핵심을 1분 안에 전달",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 1800, // 60초
    durationSeconds: 60,
  },
  "reading-tip": {
    id: "ReadingTip",
    name: "reading-tip",
    nameKo: "독서 꿀팁",
    description: "독서 습관, 기록법, 독서모임 팁 등 실용 콘텐츠",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 900, // 30초
    durationSeconds: 30,
  },
  "book-vs-book": {
    id: "BookVsBook",
    name: "book-vs-book",
    nameKo: "이 책 vs 저 책",
    description: "비슷한 주제의 두 책을 비교하며 선택을 돕는 콘텐츠",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 1200, // 40초
    durationSeconds: 40,
  },
  "app-preview": {
    id: "AppPreview",
    name: "app-preview",
    nameKo: "앱 미리보기",
    description: "ReadTree 앱의 주요 기능을 소개하는 프로모션 쇼츠",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 900, // 30초
    durationSeconds: 30,
  },
  "service-intro": {
    id: "ServiceIntro",
    name: "service-intro",
    nameKo: "서비스 소개",
    description: "ReadTree 서비스의 핵심 가치와 기능을 소개하는 영상",
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 1350, // 45초
    durationSeconds: 45,
  },
} as const;

export const SERIES_PRIORITY = [
  "daily-quote",
  "book-review",
  "reading-tip",
  "book-vs-book",
  "app-preview",
] as const;
