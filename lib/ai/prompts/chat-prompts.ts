/**
 * AI 챗봇 프롬프트 정의
 *
 * 관리자 설정에 따라 동적으로 프롬프트를 생성합니다.
 */

import type { ChatContext, ChatMode } from "@/types/ai";
import type { ContextSettings } from "@/types/ai";

/**
 * 동적 시스템 프롬프트 생성 (관리자 설정 기반)
 */
export function generateDynamicSystemPrompt(
  template: string,
  context: ChatContext,
  contextSettings: ContextSettings,
  mode?: ChatMode
): string {
  let prompt = template;

  // 페르소나 정보 추가
  if (contextSettings.includePersona && context.persona) {
    prompt += generatePersonaSection(context);
  }

  // 사용자 수준 섹션 추가
  if (context.persona?.reading_stats) {
    prompt += generateUserLevelSection(context);
  }

  // 최근 읽은 책 정보 추가
  if (contextSettings.includeRecentBooks && context.recentBooks && context.recentBooks.length > 0) {
    prompt += generateRecentBooksSection(context, contextSettings.maxRecentBooks);
  }

  // 최근 기록 정보 추가
  if (contextSettings.includeRecentNotes && context.recentNotes && context.recentNotes.length > 0) {
    prompt += generateRecentNotesSection(context, contextSettings.maxRecentNotes);
  }

  // 독서 목표 정보 추가
  if (contextSettings.includeReadingGoal && context.readingGoal) {
    prompt += generateReadingGoalSection(context);
  }

  // 장기 기억 섹션 추가
  if (context.memories && context.memories.length > 0) {
    prompt += generateMemorySection(context);
  }

  // 대화 모드 지시문 추가
  if (mode && mode !== "general") {
    prompt += generateModeInstruction(mode);
  }

  // 링크 형식 사용 지시 추가
  prompt += `\n\n## 응답 형식 규칙
- 책을 언급할 때는 반드시 [[book:ID:「제목」]] 형식을 사용하세요
- 기록을 언급할 때는 반드시 [[note:ID:타입]] 형식을 사용하세요
- 위에 제공된 책/기록 정보에 있는 ID만 사용하세요
- 새로운 책을 추천할 때 (위 목록에 없는 책)은 [[recommend:「제목」:저자명]] 형식을 사용하세요
- 이 형식을 사용하면 추천된 책이 자동으로 사용자의 서재에 등록됩니다
- 이 형식을 사용하면 사용자가 클릭하여 해당 정보로 바로 이동할 수 있습니다

위 정보를 바탕으로 사용자에게 맞춤형 응답을 제공하세요.`;

  return prompt;
}

/**
 * 사용자 수준 판별 타입
 */
type UserLevel = "beginner" | "steady" | "passionate";

/**
 * 사용자 수준 자동 판별
 * totalBooks/totalNotes 기반으로 3단계 판별
 */
function determineUserLevel(context: ChatContext): UserLevel {
  const totalBooks = context.persona?.reading_stats?.totalBooks ?? 0;
  const totalNotes = context.persona?.reading_stats?.totalNotes ?? 0;

  if (totalBooks <= 5 && totalNotes <= 10) return "beginner";
  if (totalBooks <= 20 && totalNotes <= 50) return "steady";
  return "passionate";
}

/**
 * 사용자 수준별 프롬프트 섹션 생성
 */
function generateUserLevelSection(context: ChatContext): string {
  const level = determineUserLevel(context);
  const totalBooks = context.persona?.reading_stats?.totalBooks ?? 0;

  const levelConfig: Record<UserLevel, { label: string; description: string }> = {
    beginner: {
      label: "초보 독서가",
      description: `이 사용자는 독서 초보입니다 (총 ${totalBooks}권 읽음).
- 톤: 따뜻하고 격려하는 말투를 사용하세요
- 답변 길이: 짧게 (3~5문장)
- 질문 레벨: 사실 확인 + 해석 위주
- 추천: 접근하기 쉬운 책, 짧은 책 위주
- 독서 자체에 대한 흥미를 유발해주세요`,
    },
    steady: {
      label: "꾸준한 독서가",
      description: `이 사용자는 꾸준히 읽는 독서가입니다 (총 ${totalBooks}권 읽음).
- 톤: 친근하지만 분석적인 말투
- 답변 길이: 중간 (5~8문장)
- 질문 레벨: 해석 + 연결 위주
- 추천: 장르 확장, 깊이 있는 책 포함
- 독서 패턴에 대한 인사이트를 제공해주세요`,
    },
    passionate: {
      label: "열정적 독서가",
      description: `이 사용자는 열정적인 독서가입니다 (총 ${totalBooks}권 읽음).
- 톤: 지적 파트너 말투
- 답변 길이: 깊이 있게 (8~12문장)
- 질문 레벨: 연결 + 평가 위주
- 추천: 도전적인 책, 다양한 관점의 책
- 심화 분석과 비교 관점을 제공해주세요`,
    },
  };

  const config = levelConfig[level];
  return `\n\n## 사용자 수준: ${config.label}
${config.description}`;
}

/**
 * 페르소나 섹션 생성
 */
function generatePersonaSection(context: ChatContext): string {
  let section = `\n\n## 사용자 페르소나`;

  if (context.persona?.persona_summary) {
    section += `\n${context.persona.persona_summary}`;
  }

  if (context.persona?.reading_pace) {
    const paceLabels: Record<string, string> = {
      fast: "빠른 독서가 (책을 빠르게 읽는 편)",
      steady: "꾸준한 독서가 (일정한 속도로 읽는 편)",
      slow: "음미하는 독서가 (천천히 깊이 읽는 편)",
    };
    section += `\n- 독서 속도: ${paceLabels[context.persona.reading_pace] || context.persona.reading_pace}`;
  }

  if (context.persona?.note_style) {
    const styleLabels: Record<string, string> = {
      "quote-focused": "인용구 수집가 (좋은 문구를 기록하는 것을 좋아함)",
      "reflection-focused": "사색적 기록가 (자신의 생각을 많이 기록함)",
      "visual": "시각적 기록가 (사진/이미지로 기록하는 것을 좋아함)",
      "balanced": "균형잡힌 기록가 (다양한 방식으로 기록함)",
    };
    section += `\n- 기록 스타일: ${styleLabels[context.persona.note_style] || context.persona.note_style}`;
  }

  if (context.persona?.activity_pattern) {
    const patternLabels: Record<string, string> = {
      morning: "아침형 (오전에 주로 독서)",
      afternoon: "낮형 (오후에 주로 독서)",
      evening: "저녁형 (저녁에 주로 독서)",
      night: "밤형 (밤에 주로 독서)",
    };
    section += `\n- 활동 시간: ${patternLabels[context.persona.activity_pattern] || context.persona.activity_pattern}`;
  }

  if (context.persona?.category_preferences && context.persona.category_preferences.length > 0) {
    const topCategories = context.persona.category_preferences.slice(0, 3);
    const categoryStr = topCategories.map((c: any) => c.category).join(", ");
    section += `\n- 선호 장르: ${categoryStr}`;
  }

  return section;
}

/**
 * 최근 읽은 책 섹션 생성
 * 책 정보에 ID를 포함하여 AI가 링크 형식으로 응답할 수 있도록 함
 */
function generateRecentBooksSection(context: ChatContext, maxBooks: number): string {
  let section = `\n\n## 최근 읽은 책`;
  const books = context.recentBooks?.slice(0, maxBooks) || [];

  books.forEach((book, index) => {
    const status = book.status === "completed" ? "완독" : "읽는 중";
    // ID를 포함하여 AI가 [[book:id:「제목」]] 형식으로 응답할 수 있도록 함
    section += `\n${index + 1}. [[book:${book.id}:「${book.title}」]] - ${book.author || "저자 미상"} (${status})`;
  });

  return section;
}

/**
 * 최근 기록 섹션 생성
 * 기록 정보에 ID를 포함하여 AI가 링크 형식으로 응답할 수 있도록 함
 */
function generateRecentNotesSection(context: ChatContext, maxNotes: number): string {
  let section = `\n\n## 최근 기록 (일부)`;
  const typeLabels: Record<string, string> = {
    quote: "인용구",
    memo: "메모",
    photo: "사진",
    transcription: "필사",
  };

  const notes = context.recentNotes?.slice(0, maxNotes) || [];
  notes.forEach((note) => {
    const type = typeLabels[note.type] || note.type;
    const content = note.content
      ? (note.content.length > 50 ? note.content.substring(0, 50) + "..." : note.content)
      : "(내용 없음)";
    // ID를 포함하여 AI가 [[note:id:타입]] 형식으로 응답할 수 있도록 함
    // book_id도 포함하여 책 페이지에서 기록을 볼 수 있도록 함
    const bookRef = note.book_id ? `[[book:${note.book_id}:「${note.book_title}」]]` : `「${note.book_title}」`;
    section += `\n- [[note:${note.id}:${type}]] ${bookRef}: ${content}`;
  });

  return section;
}

/**
 * 독서 목표 섹션 생성
 */
function generateReadingGoalSection(context: ChatContext): string {
  let section = `\n\n## 올해 독서 목표`;
  section += `\n- 목표: ${context.readingGoal?.goal}권`;
  section += `\n- 완독: ${context.readingGoal?.completed}권`;
  section += `\n- 진행률: ${context.readingGoal?.progress}%`;
  return section;
}

/**
 * 기존 시스템 프롬프트 생성 (하위 호환성)
 */
export function generateSystemPrompt(context: ChatContext): string {
  let prompt = `당신은 "독서친구"라는 이름의 친근하고 지적인 AI 독서 도우미입니다.
사용자의 독서 여정을 함께하며 책 추천, 독서 조언, 기록 분석을 도와줍니다.

## 기본 성격
- 친근하고 따뜻한 말투를 사용합니다
- 독서에 대한 열정을 가지고 있습니다
- 사용자의 독서 성향을 이해하고 맞춤형 조언을 제공합니다
- 한국어로 대화합니다

## 주요 기능
1. **책 추천**: 사용자의 독서 성향과 최근 읽은 책을 바탕으로 맞춤 추천
2. **독서 코칭**: 독서 습관 개선, 목표 달성을 위한 조언
3. **기록 분석**: 사용자의 독서 기록 패턴을 분석하고 인사이트 제공

## 응답 규칙
- 간결하고 핵심적인 답변을 제공합니다
- 필요한 경우 목록이나 구조화된 형식을 사용합니다
- 사용자의 감정에 공감하며 응원합니다
- 책 제목은 「」로 감싸서 표시합니다`;

  // 페르소나 정보 추가
  if (context.persona) {
    prompt += `\n\n## 사용자 페르소나`;

    if (context.persona.persona_summary) {
      prompt += `\n${context.persona.persona_summary}`;
    }

    if (context.persona.reading_pace) {
      const paceLabels: Record<string, string> = {
        fast: "빠른 독서가 (책을 빠르게 읽는 편)",
        steady: "꾸준한 독서가 (일정한 속도로 읽는 편)",
        slow: "음미하는 독서가 (천천히 깊이 읽는 편)",
      };
      prompt += `\n- 독서 속도: ${paceLabels[context.persona.reading_pace] || context.persona.reading_pace}`;
    }

    if (context.persona.note_style) {
      const styleLabels: Record<string, string> = {
        "quote-focused": "인용구 수집가 (좋은 문구를 기록하는 것을 좋아함)",
        "reflection-focused": "사색적 기록가 (자신의 생각을 많이 기록함)",
        "visual": "시각적 기록가 (사진/이미지로 기록하는 것을 좋아함)",
        "balanced": "균형잡힌 기록가 (다양한 방식으로 기록함)",
      };
      prompt += `\n- 기록 스타일: ${styleLabels[context.persona.note_style] || context.persona.note_style}`;
    }

    if (context.persona.activity_pattern) {
      const patternLabels: Record<string, string> = {
        morning: "아침형 (오전에 주로 독서)",
        afternoon: "낮형 (오후에 주로 독서)",
        evening: "저녁형 (저녁에 주로 독서)",
        night: "밤형 (밤에 주로 독서)",
      };
      prompt += `\n- 활동 시간: ${patternLabels[context.persona.activity_pattern] || context.persona.activity_pattern}`;
    }

    if (context.persona.category_preferences && context.persona.category_preferences.length > 0) {
      const topCategories = context.persona.category_preferences.slice(0, 3);
      const categoryStr = topCategories.map(c => c.category).join(", ");
      prompt += `\n- 선호 장르: ${categoryStr}`;
    }
  }

  // 최근 읽은 책 정보 추가 (ID 포함)
  if (context.recentBooks && context.recentBooks.length > 0) {
    prompt += `\n\n## 최근 읽은 책`;
    context.recentBooks.forEach((book, index) => {
      const status = book.status === "completed" ? "완독" : "읽는 중";
      prompt += `\n${index + 1}. [[book:${book.id}:「${book.title}」]] - ${book.author || "저자 미상"} (${status})`;
    });
  }

  // 최근 기록 정보 추가 (ID 포함)
  if (context.recentNotes && context.recentNotes.length > 0) {
    prompt += `\n\n## 최근 기록 (일부)`;
    const typeLabels: Record<string, string> = {
      quote: "인용구",
      memo: "메모",
      photo: "사진",
      transcription: "필사",
    };
    context.recentNotes.slice(0, 5).forEach((note) => {
      const type = typeLabels[note.type] || note.type;
      const content = note.content
        ? (note.content.length > 50 ? note.content.substring(0, 50) + "..." : note.content)
        : "(내용 없음)";
      const bookRef = note.book_id ? `[[book:${note.book_id}:「${note.book_title}」]]` : `「${note.book_title}」`;
      prompt += `\n- [[note:${note.id}:${type}]] ${bookRef}: ${content}`;
    });
  }

  // 독서 목표 정보 추가
  if (context.readingGoal) {
    prompt += `\n\n## 올해 독서 목표`;
    prompt += `\n- 목표: ${context.readingGoal.goal}권`;
    prompt += `\n- 완독: ${context.readingGoal.completed}권`;
    prompt += `\n- 진행률: ${context.readingGoal.progress}%`;
  }

  // 링크 형식 사용 지시 추가
  prompt += `\n\n## 응답 형식 규칙
- 책을 언급할 때는 반드시 [[book:ID:「제목」]] 형식을 사용하세요
- 기록을 언급할 때는 반드시 [[note:ID:타입]] 형식을 사용하세요
- 위에 제공된 책/기록 정보에 있는 ID만 사용하세요
- 새로운 책을 추천할 때 (위 목록에 없는 책)은 [[recommend:「제목」:저자명]] 형식을 사용하세요
- 이 형식을 사용하면 추천된 책이 자동으로 사용자의 서재에 등록됩니다
- 이 형식을 사용하면 사용자가 클릭하여 해당 정보로 바로 이동할 수 있습니다

위 정보를 바탕으로 사용자에게 맞춤형 응답을 제공하세요.`;

  return prompt;
}

/**
 * 대화 시작 인사말
 */
export const WELCOME_MESSAGE = `안녕하세요! 저는 당신의 독서친구예요. 📚

책 추천이 필요하거나, 독서 목표 달성에 대한 조언이 필요하거나,
읽은 책에 대해 이야기하고 싶을 때 언제든 말씀해주세요.

무엇을 도와드릴까요?`;

/**
 * 예시 질문들 (레거시, 하위 호환용)
 */
export const EXAMPLE_QUESTIONS = [
  "요즘 뭘 읽을지 고민이야",
  "이 책이랑 비슷한 책 추천해줘",
  "독서 목표 달성이 어려워",
  "지난달에 읽은 책들 정리해줘",
  "가볍게 읽을 책 있을까?",
  "내가 밑줄 친 부분들에서 공통점이 뭐야?",
];

/**
 * 대화 모드별 프롬프트 지시문 생성
 */
export function generateModeInstruction(mode: ChatMode): string {
  if (mode === "general") return "";

  const instructions: Record<Exclude<ChatMode, "general">, string> = {
    discuss: `\n\n## 현재 모드: 책 토론
- 소크라테스식 질문을 적극적으로 활용하세요
- 다양한 관점과 해석을 제시하세요
- 사용자의 의견에 대해 "왜 그렇게 생각해?" 등 깊이 있는 후속 질문을 하세요
- 저자의 의도, 시대적 배경, 다른 독자의 해석 등을 소개하세요
- 대립적이지 않은 지적 토론 분위기를 유지하세요`,

    recommend: `\n\n## 현재 모드: 책 추천
- 3단계 추천을 제공하세요: 맞춤 추천(취향 기반) / 도전 추천(새로운 장르) / 의외의 추천(예상 밖)
- 추천 이유를 구체적으로 설명하세요 (이 책이 이 사용자에게 맞는 이유)
- 사용자의 최근 읽은 책, 선호 장르, 독서 수준을 고려하세요
- [[recommend:「제목」:저자명]] 형식을 반드시 사용하세요`,

    coaching: `\n\n## 현재 모드: 독서 코칭
- 자기결정이론(SDT)에 기반하여 자율성/유능감/관계성을 지원하세요
- SMART 목표 설정을 도와주세요 (구체적/측정가능/달성가능/관련성/시간제한)
- 사용자의 독서 목표와 진행률을 참조하여 현실적인 조언을 하세요
- 작은 성취도 적극적으로 인정하고 칭찬하세요
- 강요하지 않고 선택지를 제시하세요`,

    quiz: `\n\n## 현재 모드: 독서 퀴즈
- 4가지 유형의 문제를 출제합니다: 내용 확인 / 해석 / 적용 / 비평
- 한 번에 1문제씩만 출제하세요
- 사용자의 답변에 대해 먼저 인정하고 해설을 제공하세요
- 틀렸을 경우 정답을 알려주기보다 힌트를 주고 다시 생각하게 하세요
- 사용자가 읽은 책 목록을 참고하여 출제하세요
- 재미있고 도전적이되 너무 어렵지 않게 출제하세요`,
  };

  return instructions[mode];
}

/**
 * 장기 기억 섹션 생성
 */
function generateMemorySection(context: ChatContext): string {
  if (!context.memories || context.memories.length === 0) return "";

  const typeLabels: Record<string, string> = {
    reading_preference: "독서 취향",
    interest: "관심 분야",
    goal: "독서 목표",
    emotion: "감정 상태",
    context: "상황 정보",
  };

  let section = `\n\n## 이 사용자에 대해 기억하고 있는 정보`;
  const grouped = new Map<string, string[]>();

  for (const mem of context.memories) {
    const label = typeLabels[mem.memory_type] || mem.memory_type;
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(mem.content);
  }

  for (const [label, items] of grouped) {
    section += `\n### ${label}`;
    for (const item of items) {
      section += `\n- ${item}`;
    }
  }

  section += `\n\n이 정보를 자연스럽게 활용하되, "지난번에 말씀하셨듯이" 등으로 기억하고 있음을 보여주세요.`;
  return section;
}

/**
 * 동적 퀵 액션 생성 (사용자 컨텍스트 + 모드 기반)
 */
export function generateQuickActions(
  context: ChatContext,
  mode: ChatMode,
  sessionCount: number
): { label: string; message: string }[] {
  const actions: { label: string; message: string }[] = [];

  // 모드별 기본 액션
  if (mode === "quiz" && context.recentBooks?.length) {
    const book = context.recentBooks[0];
    actions.push({ label: `「${book.title}」 퀴즈`, message: `「${book.title}」에서 퀴즈 내줘!` });
  }

  if (mode === "discuss" && context.recentBooks?.length) {
    const book = context.recentBooks[0];
    actions.push({ label: `「${book.title}」 토론`, message: `「${book.title}」에 대해 이야기하고 싶어` });
  }

  // 읽고 있는 책이 있으면 관련 액션
  const readingBook = context.recentBooks?.find((b) => b.status === "reading");
  if (readingBook && mode === "general") {
    actions.push({
      label: `「${readingBook.title}」 이야기`,
      message: `요즘 「${readingBook.title}」 읽고 있어, 이야기하고 싶어`,
    });
  }

  // 독서 목표 관련
  if (context.readingGoal && mode !== "quiz") {
    const { completed, goal } = context.readingGoal;
    actions.push({
      label: `올해 목표 점검 (${completed}/${goal}권)`,
      message: `올해 독서 목표 진행 상황이 어떤지 같이 봐줘`,
    });
  }

  // 기본 액션들
  const defaults: Record<ChatMode, { label: string; message: string }[]> = {
    general: [
      { label: "책 추천받기", message: "요즘 뭘 읽을지 고민이야, 추천해줘" },
      { label: "가벼운 책", message: "가볍게 읽을 수 있는 책 있을까?" },
      { label: "독서 패턴 분석", message: "내 독서 패턴을 분석해줘" },
    ],
    discuss: [
      { label: "인상 깊은 구절 나누기", message: "최근에 읽은 책에서 인상 깊었던 구절을 이야기하고 싶어" },
      { label: "책 비교하기", message: "최근에 읽은 책들을 비교해서 이야기해볼까?" },
    ],
    recommend: [
      { label: "비슷한 책", message: "최근에 읽은 책이랑 비슷한 느낌의 책 추천해줘" },
      { label: "새로운 장르 도전", message: "평소에 안 읽던 장르에 도전해보고 싶어" },
      { label: "짧은 책", message: "빨리 읽을 수 있는 짧은 책 추천해줘" },
    ],
    coaching: [
      { label: "독서 습관 만들기", message: "독서 습관을 만들고 싶은데 어떻게 시작하면 좋을까?" },
      { label: "목표 세우기", message: "현실적인 독서 목표를 세우고 싶어" },
    ],
    quiz: [
      { label: "쉬운 퀴즈", message: "쉬운 독서 퀴즈부터 시작해볼게!" },
      { label: "어려운 퀴즈", message: "좀 어려운 퀴즈를 내줘!" },
    ],
  };

  // 현재 모드의 기본 액션에서 부족한 만큼 채우기 (최대 6개)
  const modeDefaults = defaults[mode] || defaults.general;
  for (const d of modeDefaults) {
    if (actions.length >= 6) break;
    // 중복 방지
    if (!actions.some((a) => a.message === d.message)) {
      actions.push(d);
    }
  }

  return actions.slice(0, 6);
}

/**
 * 온보딩 환영 메시지 (첫 사용자)
 */
export const ONBOARDING_WELCOME = `반가워요! 저는 독서친구예요.

함께 책 이야기를 나누고, 맞춤 추천도 해주고, 독서 목표도 같이 관리해줄 수 있어요.

어떤 걸 해볼까요?`;

/**
 * 온보딩 질문 (첫 사용자용 퀵 액션)
 */
export const ONBOARDING_QUESTIONS = [
  { label: "최근 읽은 책 이야기", message: "최근에 읽은 책에 대해 이야기하고 싶어" },
  { label: "책 추천받기", message: "나한테 맞는 책을 추천해줘" },
  { label: "독서 목표 세우기", message: "독서 목표를 세우고 싶어, 도와줘" },
  { label: "독서친구 뭘 할 수 있어?", message: "독서친구가 도와줄 수 있는 게 뭐가 있어?" },
];

/**
 * 점진적 기능 공개 수준 판별
 * Lv.1 (세션 0~2): 자유 대화, 책 추천
 * Lv.2 (세션 3~5): + 책 토론, 독서 코칭
 * Lv.3 (세션 6+): + 독서 퀴즈
 */
export function getFeatureLevel(sessionCount: number): 1 | 2 | 3 {
  if (sessionCount <= 2) return 1;
  if (sessionCount <= 5) return 2;
  return 3;
}

/**
 * 기능 수준별 사용 가능한 모드 목록
 */
export function getAvailableModes(featureLevel: 1 | 2 | 3): ChatMode[] {
  switch (featureLevel) {
    case 1:
      return ["general", "recommend"];
    case 2:
      return ["general", "recommend", "discuss", "coaching"];
    case 3:
      return ["general", "recommend", "discuss", "coaching", "quiz"];
  }
}
