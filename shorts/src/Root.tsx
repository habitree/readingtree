import React from "react";
import { Composition } from "remotion";
import { DailyQuote } from "./compositions/DailyQuote";
import { ServiceIntro } from "./compositions/ServiceIntro";
import { FeatureDemo } from "./compositions/FeatureDemo";
import { ServiceShowcase } from "./compositions/ServiceShowcase";
import { UserStory } from "./compositions/UserStory";
import { BooktokStyle } from "./compositions/BooktokStyle";
import { ReadingChallenge } from "./compositions/ReadingChallenge";
import { PainPoint } from "./compositions/PainPoint";
import { CommunityHighlight } from "./compositions/CommunityHighlight";
import { CreatorCollab } from "./compositions/CreatorCollab";
import { SERIES } from "./config/series";
import { DailyQuoteProps } from "./types/daily-quote";
import { ServiceIntroProps } from "./types/service-intro";
import { FeatureDemoProps } from "./types/feature-demo";
import { ServiceShowcaseProps } from "./types/service-showcase";
import { UserStoryProps } from "./types/user-story";
import { BooktokStyleProps } from "./types/booktok-style";
import { ReadingChallengeProps } from "./types/reading-challenge";
import { PainPointProps } from "./types/pain-point";
import { CommunityHighlightProps } from "./types/community-highlight";
import { CreatorCollabProps } from "./types/creator-collab";

const dailyQuoteSample: DailyQuoteProps = {
  seriesId: "daily-quote",
  quoteText: "새로운 길을 찾는 사람은\n외로워야 하고,\n고독한 시간을 보내야 한다.",
  bookTitle: "데미안",
  author: "헤르만 헤세",
  pageNumber: 45,
  coverImageUrl: null,
  audioUrl: "audio/tts/daily-quote.mp3",
};

const serviceIntroSample: ServiceIntroProps = {
  seriesId: "service-intro",
  tagline: "독서 기록이\n사라지지 않는 시대",
  painPoints: [
    "메모장에 흩어진 독서 기록",
    "다시 찾을 수 없는 인상 깊은 문장",
    "책 단위로 정리되지 않는 기록들",
    "공유하기 어려운 독서 경험",
  ],
  features: [
    {
      title: "사진 한 장으로 기록",
      description: "책 속 문장을 촬영하면\nAI가 자동으로 텍스트를 추출합니다",
      icon: "scan",
    },
    {
      title: "책별 자동 정리",
      description: "필사, 메모, 사진이\n해당 책의 기록에 자동 연결됩니다",
      icon: "sort",
    },
    {
      title: "문장 단위 검색",
      description: "저장한 문장을 제목, 주제, 내용으로\n언제든 다시 찾을 수 있습니다",
      icon: "search",
    },
    {
      title: "카드뉴스로 공유",
      description: "클릭 한 번으로\n감성 카드뉴스를 만들어 공유합니다",
      icon: "share",
    },
  ],
  stats: [
    { label: "지원 기능", value: "5+" },
    { label: "비용", value: "무료" },
    { label: "기록 방식", value: "4가지" },
  ],
  ctaText: "지금 시작하기",
  audioUrl: "audio/tts/service-intro.mp3",
};

// 기능별 데모: 내 서재 (sample 페이지)
const featureDemoSample: FeatureDemoProps = {
  seriesId: "feature-demo",
  featureTitle: "나만의 독서나무",
  featureSubtitle: "읽은 만큼 자라나는 나의 독서 기록",
  featureDescription:
    "독서 기록과 통계, 독서나무 성장, 독서 그룹까지\n한눈에 확인할 수 있는 대시보드",
  screenshotPC: "screenshots/pc/sample.png",
  screenshotMobile: "screenshots/mobile/sample.png",
  highlights: [
    "독서나무가 레벨에 따라 성장",
    "이번 주 독서 현황 한눈에",
    "읽고 있는 책 진행률 표시",
    "독서 달력으로 기록 확인",
  ],
  ctaText: "무료로 시작하기",
  audioUrl: "audio/tts/feature-demo-library.mp3",
};


// 기능별 데모: 로그인/가입
const featureDemoLogin: FeatureDemoProps = {
  seriesId: "feature-demo",
  featureTitle: "간편한 시작",
  featureSubtitle: "카카오톡 한 번이면 바로 시작",
  featureDescription:
    "카카오톡 또는 구글 계정으로\n3초 만에 가입하고 바로 기록을 시작하세요",
  screenshotPC: "screenshots/pc/login.png",
  screenshotMobile: "screenshots/mobile/login.png",
  highlights: [
    "카카오톡으로 3초 가입",
    "구글 계정도 지원",
    "별도 회원가입 절차 없음",
    "로그인 없이 둘러보기 가능",
  ],
  ctaText: "지금 시작하기",
  audioUrl: "audio/tts/feature-demo-login.mp3",
};

// 기능별 데모: 포인트/프라이싱
const featureDemoPricing: FeatureDemoProps = {
  seriesId: "feature-demo",
  featureTitle: "합리적인 포인트",
  featureSubtitle: "AI 기능도 부담 없이",
  featureDescription:
    "기본 기능은 무료, AI 채팅과 OCR 필사 등\n프리미엄 기능은 포인트로 이용하세요",
  screenshotPC: "screenshots/pc/pricing.png",
  screenshotMobile: "screenshots/mobile/pricing.png",
  highlights: [
    "기본 독서 기록은 완전 무료",
    "첫 충전 시 포인트 2배",
    "라이트/스탠다드/프리미엄 선택",
    "AI 채팅, OCR 필사 무제한",
  ],
  ctaText: "무료로 시작하기",
  audioUrl: "audio/tts/feature-demo-pricing.mp3",
};

// v3 신규 시리즈 샘플 데이터
const userStorySample: UserStoryProps = {
  seriesId: "user-story",
  userName: "서연",
  beforeText: "메모장에 흩어진 독서 기록\n다시 찾을 수 없는 문장들\n읽었는데 기억나지 않는 책",
  afterText: "책별로 정리된 나만의 서재\n언제든 다시 찾는 인상 깊은 문장\n독서나무와 함께 성장하는 기록",
  transitionText: "그런데\nReadTree를 만나고\n모든 게 달라졌어요",
  duration: "3개월",
  beforeStat: "0권",
  afterStat: "23권",
  ctaText: "무료로 시작하기",
  audioUrl: "audio/tts/user-story.mp3",
};

const booktokStyleSample: BooktokStyleProps = {
  seriesId: "booktok-style",
  hookText: "이 책 읽고\n한참을 멍하니\n앉아 있었습니다",
  quoteText: "우리가 빛의 속도로\n갈 수 없다면,\n그 이유를 알고 싶었다.",
  reviewText: "SF를 넘어 인간 존엄에 대한 묵직한 질문",
  rating: 5,
  emotionTags: ["감동", "SF", "휴머니즘", "여운"],
  bookTitle: "우리가 빛의 속도로 갈 수 없다면",
  author: "김초엽",
  coverImageUrl: null,
  audioUrl: "audio/tts/booktok-style.mp3",
};

const readingChallengeSample: ReadingChallengeProps = {
  seriesId: "reading-challenge",
  challengeTitle: "이번 달\n당신의 독서량은?",
  booksRead: 7,
  booksGoal: 10,
  totalPages: 2340,
  genres: [
    { name: "소설", count: 3 },
    { name: "자기계발", count: 2 },
    { name: "에세이", count: 1 },
    { name: "과학", count: 1 },
  ],
  percentile: 12,
  ctaText: "나도 챌린지 참여하기",
  audioUrl: "audio/tts/reading-challenge.mp3",
};

const painPointSample: PainPointProps = {
  seriesId: "pain-point",
  hookQuestion: "독서 기록\n메모장에 하는 사람?",
  painPoints: [
    "메모장에 흩어진 기록",
    "어떤 책이었는지 기억 안 남",
    "인상 깊은 문장 다시 못 찾음",
    "읽은 책 수도 모름",
  ],
  solutionText: "이 앱 하나면\n독서 기록 끝",
  ctaText: "무료로 시작하기",
  audioUrl: "audio/tts/pain-point.mp3",
};

const communityHighlightSample: CommunityHighlightProps = {
  seriesId: "community-highlight",
  groupName: "철학하는 독서인",
  topic: "인문/철학",
  memberCount: 28,
  currentBook: "차라투스트라는 이렇게 말했다",
  highlights: [
    '"초인의 개념이 현대에도 유효한가?"에 대한 열띤 토론',
    '"위버멘쉬를 자기계발로 해석하는 건 오독" — 멤버 최진우',
    "이번 주 가장 많은 공감을 받은 메모 공유",
  ],
  ctaText: "독서모임 둘러보기",
  audioUrl: "audio/tts/community-highlight.mp3",
};

const creatorCollabSample: CreatorCollabProps = {
  seriesId: "creator-collab",
  creatorName: "책읽는민지",
  creatorBio: "BookTok 크리에이터 | 팔로워 12K",
  bookTitle: "아몬드",
  bookAuthor: "손원평",
  recommendQuote: "감정을 느끼지 못하는 소년의 이야기인데\n읽고 나면 오히려\n감정이 무엇인지 다시 생각하게 돼요",
  libraryCount: 156,
  ctaText: "함께 읽으러 가기",
  audioUrl: "audio/tts/creator-collab.mp3",
};

// 전체 서비스 쇼케이스
const serviceShowcaseSample: ServiceShowcaseProps = {
  seriesId: "service-showcase",
  tagline: "독서의 모든 순간을\nReadTree와 함께",
  audioUrl: "audio/tts/service-showcase.mp3",
  slides:
 [
    {
      title: "나만의 서재",
      description: "독서나무와 함께 성장하는 나의 독서 기록 대시보드",
      pcImage: "screenshots/pc/sample.png",
      mobileImage: "screenshots/mobile/sample.png",
    },
    {
      title: "서비스 소개",
      description: "ReadTree의 핵심 가치와 비전을 확인하세요",
      pcImage: "screenshots/pc/about.png",
      mobileImage: "screenshots/mobile/about.png",
    },
    {
      title: "간편한 시작",
      description: "카카오톡 또는 구글로 3초 만에 시작",
      pcImage: "screenshots/pc/login.png",
      mobileImage: "screenshots/mobile/login.png",
    },
    {
      title: "합리적인 가격",
      description: "기본 무료, AI 기능은 포인트로 부담 없이",
      pcImage: "screenshots/pc/pricing.png",
      mobileImage: "screenshots/mobile/pricing.png",
    },
  ],
  ctaText: "지금 시작하기",
};

export const RemotionRoot: React.FC = () => {
  const dq = SERIES["daily-quote"];

  return (
    <>
      <Composition
        id={dq.id}
        component={DailyQuote}
        durationInFrames={dq.durationInFrames}
        fps={dq.fps}
        width={dq.width}
        height={dq.height}
        defaultProps={dailyQuoteSample}
      />
      <Composition
        id="ServiceIntro"
        component={ServiceIntro}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={serviceIntroSample}
      />
      {/* 기능 데모: 내 서재 */}
      <Composition
        id="FeatureDemo-Library"
        component={FeatureDemo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={featureDemoSample}
      />
      {/* 기능 데모: 간편 로그인 */}
      <Composition
        id="FeatureDemo-Login"
        component={FeatureDemo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={featureDemoLogin}
      />
      {/* 기능 데모: 포인트/프라이싱 */}
      <Composition
        id="FeatureDemo-Pricing"
        component={FeatureDemo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={featureDemoPricing}
      />
      {/* 전체 서비스 쇼케이스 */}
      <Composition
        id="ServiceShowcase"
        component={ServiceShowcase}
        durationInFrames={1530}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={serviceShowcaseSample}
      />

      {/* ===== v3 신규 시리즈 ===== */}

      {/* 사용자 변화 스토리 (45초) */}
      <Composition
        id="UserStory"
        component={UserStory}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={userStorySample}
      />
      {/* BookTok 감성 리뷰 (30초) */}
      <Composition
        id="BooktokStyle"
        component={BooktokStyle}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={booktokStyleSample}
      />
      {/* 독서 챌린지 (25초) */}
      <Composition
        id="ReadingChallenge"
        component={ReadingChallenge}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={readingChallengeSample}
      />
      {/* 공감형 콘텐츠 (20초) */}
      <Composition
        id="PainPoint"
        component={PainPoint}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={painPointSample}
      />
      {/* 독서모임 하이라이트 (35초) */}
      <Composition
        id="CommunityHighlight"
        component={CommunityHighlight}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={communityHighlightSample}
      />
      {/* 크리에이터 콜라보 (40초) */}
      <Composition
        id="CreatorCollab"
        component={CreatorCollab}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={creatorCollabSample}
      />
    </>
  );
};
