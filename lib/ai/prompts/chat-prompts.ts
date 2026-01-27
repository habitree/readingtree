/**
 * AI 챗봇 프롬프트 정의
 *
 * 관리자 설정에 따라 동적으로 프롬프트를 생성합니다.
 */

import type { ChatContext } from "@/types/ai";
import type { ContextSettings } from "@/types/ai";

/**
 * 동적 시스템 프롬프트 생성 (관리자 설정 기반)
 */
export function generateDynamicSystemPrompt(
  template: string,
  context: ChatContext,
  contextSettings: ContextSettings
): string {
  let prompt = template;

  // 페르소나 정보 추가
  if (contextSettings.includePersona && context.persona) {
    prompt += generatePersonaSection(context);
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

  // 링크 형식 사용 지시 추가
  prompt += `\n\n## 응답 형식 규칙
- 책을 언급할 때는 반드시 [[book:ID:「제목」]] 형식을 사용하세요
- 기록을 언급할 때는 반드시 [[note:ID:타입]] 형식을 사용하세요
- 위에 제공된 책/기록 정보에 있는 ID만 사용하세요
- 이 형식을 사용하면 사용자가 클릭하여 해당 정보로 바로 이동할 수 있습니다

위 정보를 바탕으로 사용자에게 맞춤형 응답을 제공하세요.`;

  return prompt;
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
 * 예시 질문들
 */
export const EXAMPLE_QUESTIONS = [
  "요즘 뭘 읽을지 고민이야",
  "이 책이랑 비슷한 책 추천해줘",
  "독서 목표 달성이 어려워",
  "지난달에 읽은 책들 정리해줘",
  "가볍게 읽을 책 있을까?",
  "내가 밑줄 친 부분들에서 공통점이 뭐야?",
];
