import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
    client = new OpenAI({ apiKey });
  }
  return client;
}

const SYSTEM_PREFIX = `당신은 ReadTree 독서 앱의 숏폼 영상 나레이션 작가입니다.
모든 스크립트는 한국어로 작성하며, TTS 음성으로 읽힐 자연스러운 구어체를 사용합니다.
줄바꿈, 마크다운, 특수문자 없이 순수 텍스트만 출력하세요.`;

function buildPrompt(
  series: string,
  context: Record<string, unknown>
): string {
  switch (series) {
    case "daily-quote":
      return `${SYSTEM_PREFIX}

다음 문장과 책 정보를 바탕으로 25초 분량의 나레이션 스크립트를 작성하세요.

문장: "${context.quote}"
책: "${context.bookTitle}" - ${context.author}

구성: 문장 소개 → 감상 → 책 소개 → 앱 CTA
톤: 감성적이고 따뜻한
분량: 150자 이내`;

    case "book-review":
      return `${SYSTEM_PREFIX}

다음 책 정보를 바탕으로 60초 분량의 나레이션 스크립트를 작성하세요.

책: "${context.bookTitle}" - ${context.author}
완독 수: ${context.completedCount}명
핵심 구절: ${JSON.stringify(context.keyQuotes)}

구성: 후킹 질문 → 핵심 내용 요약 → 추천 이유 → CTA
톤: 신뢰감 있고 핵심을 짚는
분량: 400자 이내`;

    case "reading-tip":
      return `${SYSTEM_PREFIX}

다음 독서 팁을 바탕으로 30초 분량의 나레이션 스크립트를 작성하세요.

팁 제목: "${context.tipTitle}"
카테고리: ${context.category}
단계: ${JSON.stringify(context.tipSteps)}

구성: 문제 공감 → 3단계 팁 소개 → 마무리 격려 → CTA
톤: 실용적이고 친근한
분량: 200자 이내`;

    case "service-intro":
      return `${SYSTEM_PREFIX}

ReadTree 서비스 소개 영상의 45초 분량 나레이션 스크립트를 작성하세요.

태그라인: "${context.tagline}"
고충 포인트: ${JSON.stringify(context.painPoints)}
핵심 기능: ${JSON.stringify(context.features)}

구성: 독서인의 공감 → 기존 문제 → ReadTree 솔루션 4가지 → 핵심 수치 → CTA
톤: 공감에서 시작해 희망적 마무리
분량: 300자 이내`;

    case "feature-demo":
      return `${SYSTEM_PREFIX}

ReadTree 기능 데모 영상의 30초 분량 나레이션 스크립트를 작성하세요.

기능명: "${context.featureTitle}"
부제: "${context.featureSubtitle}"
설명: "${context.featureDescription}"
하이라이트: ${JSON.stringify(context.highlights)}

구성: 기능 소개 → PC 화면 설명 → 모바일 화면 설명 → CTA
톤: 깔끔하고 안내하는
분량: 200자 이내`;

    case "service-showcase":
      return `${SYSTEM_PREFIX}

ReadTree 전체 서비스 쇼케이스 영상의 50초 분량 나레이션 스크립트를 작성하세요.

태그라인: "${context.tagline}"
슬라이드: ${JSON.stringify(context.slides)}

구성: 후킹 질문 → 태그라인 → 각 슬라이드 한 줄씩 소개 → CTA
톤: 프리미엄하고 브랜드감 있는
분량: 350자 이내`;

    case "user-story":
      return `${SYSTEM_PREFIX}

사용자 변화 스토리 영상의 45초 분량 나레이션 스크립트를 작성하세요.

사용자: ${context.userName}
변화 기간: ${context.duration}
Before: "${context.beforeText}"
전환: "${context.transitionText}"
After: "${context.afterText}"
Before 수치: ${context.beforeStat} → After 수치: ${context.afterStat}

구성: 과거 고충 고백 → ReadTree 발견 → 변화된 모습 → 수치 변화 → CTA
톤: 진솔하고 감동적인 1인칭
분량: 300자 이내`;

    case "booktok-style":
      return `${SYSTEM_PREFIX}

BookTok 감성 리뷰 영상의 30초 분량 나레이션 스크립트를 작성하세요.

훅: "${context.hookText}"
인용구: "${context.quoteText}"
리뷰: "${context.reviewText}"
별점: ${context.rating}/5
감정 태그: ${JSON.stringify(context.emotionTags)}
책: "${context.bookTitle}" - ${context.author}

구성: 감정 충격 훅 → 인용구 낭독 → 짧은 감상 → 별점/태그 언급 → CTA
톤: 감성적이고 여운 있는
분량: 200자 이내`;

    case "reading-challenge":
      return `${SYSTEM_PREFIX}

독서 챌린지 영상의 25초 분량 나레이션 스크립트를 작성하세요.

챌린지 제목: "${context.challengeTitle}"
읽은 책: ${context.booksRead}/${context.booksGoal}권
총 페이지: ${context.totalPages}
장르 분포: ${JSON.stringify(context.genres)}
상위 퍼센트: ${context.percentile}%

구성: 질문형 후킹 → 통계 하이라이트 → 한국인 평균 비교 → 챌린지 참여 CTA
톤: 도전적이고 동기부여
분량: 150자 이내`;

    case "pain-point":
      return `${SYSTEM_PREFIX}

공감형 콘텐츠 영상의 20초 분량 나레이션 스크립트를 작성하세요.

훅 질문: "${context.hookQuestion}"
고충: ${JSON.stringify(context.painPoints)}
솔루션: "${context.solutionText}"

구성: 공감 질문 → 고충 나열 → 솔루션 한 줄 → CTA
톤: 공감에서 해결로 전환, 임팩트 있는
분량: 120자 이내`;

    case "community-highlight":
      return `${SYSTEM_PREFIX}

독서모임 하이라이트 영상의 35초 분량 나레이션 스크립트를 작성하세요.

모임명: "${context.groupName}"
주제: ${context.topic}
멤버 수: ${context.memberCount}명
현재 읽는 책: "${context.currentBook}"
하이라이트: ${JSON.stringify(context.highlights)}

구성: 모임 소개 → 현재 읽는 책 → 토론 하이라이트 1~2개 → 참여 유도 CTA
톤: 활기차고 지적 호기심 자극
분량: 250자 이내`;

    case "creator-collab":
      return `${SYSTEM_PREFIX}

크리에이터 콜라보 영상의 40초 분량 나레이션 스크립트를 작성하세요.

크리에이터: ${context.creatorName}
소개: "${context.creatorBio}"
추천 책: "${context.bookTitle}" - ${context.bookAuthor}
추천 코멘트: "${context.recommendQuote}"
서재 권수: ${context.libraryCount}권

구성: 크리에이터 등장 → 책 추천 이유 → 인상적인 코멘트 인용 → 서재 소개 → CTA
톤: 팬미팅 같은 친밀함
분량: 280자 이내`;

    case "book-vs-book":
      return `${SYSTEM_PREFIX}

이 책 vs 저 책 영상의 40초 분량 나레이션 스크립트를 작성하세요.

책A: "${context.bookATitle}" - ${context.bookAAuthor}
책B: "${context.bookBTitle}" - ${context.bookBAuthor}
공통 주제: ${context.commonTopic}
비교 포인트: ${JSON.stringify(context.comparisonPoints)}

구성: 주제 제시 → 책A 핵심 소개 → 책B 핵심 소개 → 차이점 비교 → 선택 기준 제시 → CTA
톤: 중립적이고 분석적인
분량: 280자 이내`;

    case "app-preview":
      return `${SYSTEM_PREFIX}

앱 미리보기 영상의 30초 분량 나레이션 스크립트를 작성하세요.

앱 기능: ${JSON.stringify(context.features)}
핵심 포인트: ${JSON.stringify(context.highlights)}

구성: 앱 소개 → 주요 화면 순서대로 설명 → 무료 강조 → CTA
톤: 깔끔하고 프로페셔널한
분량: 200자 이내`;

    default:
      throw new Error(`No script prompt defined for series: ${series}`);
  }
}

export async function generateScript(
  series: string,
  context: Record<string, unknown>
): Promise<string> {
  const systemPrompt = buildPrompt(series, context);

  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "나레이션 스크립트를 작성해주세요." },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");
  return content;
}
