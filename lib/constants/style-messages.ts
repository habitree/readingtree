/**
 * 스타일별 메시지 상수
 *
 * UI 스타일에 따른 모든 텍스트를 정의합니다.
 */

import type { UIStyleKey } from "@/types/style";

// =============================================================================
// 타입 정의
// =============================================================================

export interface TimeGreeting {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
}

export interface StreakMessage {
  none: string; // 0일
  starting: string; // 1-2일
  building: string; // 3-6일
  strong: string; // 7-13일
  exceptional: string; // 14일 이상
}

export interface EmptyStateMessage {
  noRecords: string;
  noBooks: string;
  noNotes: string;
  noGoal: string;
}

export interface ActionMessage {
  addBook: string;
  writeNote: string;
  setGoal: string;
  viewMore: string;
}

export interface MotivationalMessage {
  default: string;
  quoteFocused: string;
  reflectionFocused: string;
  visualFocused: string;
}

export interface StyleMessages {
  greeting: TimeGreeting;
  streak: StreakMessage;
  empty: EmptyStateMessage;
  action: ActionMessage;
  motivational: MotivationalMessage;
}

// =============================================================================
// 스타일별 메시지 정의
// =============================================================================

const minimalMessages: StyleMessages = {
  greeting: {
    morning: "아침",
    afternoon: "오후",
    evening: "저녁",
    night: "밤",
  },
  streak: {
    none: "시작하기",
    starting: "시작",
    building: "{count}일째",
    strong: "{count}일째",
    exceptional: "{count}일",
  },
  empty: {
    noRecords: "기록 없음",
    noBooks: "책 없음",
    noNotes: "노트 없음",
    noGoal: "목표 없음",
  },
  action: {
    addBook: "책 추가",
    writeNote: "기록하기",
    setGoal: "목표 설정",
    viewMore: "더보기",
  },
  motivational: {
    default: "기록은 남아요",
    quoteFocused: "오늘의 한 줄",
    reflectionFocused: "오늘의 기록",
    visualFocused: "오늘의 한 장면",
  },
};

const warmMessages: StyleMessages = {
  greeting: {
    morning: "좋은 아침이에요!",
    afternoon: "활기찬 오후예요!",
    evening: "수고했어요!",
    night: "편안한 밤 되세요!",
  },
  streak: {
    none: "오늘부터 시작해볼까요?",
    starting: "좋은 시작이에요!",
    building: "{count}일 연속이에요!",
    strong: "{count}일 연속 대단해요!",
    exceptional: "와, {count}일째 이어가고 있어요!",
  },
  empty: {
    noRecords: "첫 기록을 남겨볼까요?",
    noBooks: "어떤 책을 읽어볼까요?",
    noNotes: "오늘의 생각을 적어보세요!",
    noGoal: "목표를 세워볼까요?",
  },
  action: {
    addBook: "새 책 담기",
    writeNote: "기록 남기기",
    setGoal: "목표 세우기",
    viewMore: "더 보러가기",
  },
  motivational: {
    default: "오늘도 함께해요!",
    quoteFocused: "마음에 남는 문장을 찾아보세요!",
    reflectionFocused: "오늘의 생각을 적어보세요!",
    visualFocused: "책 속 장면을 담아보세요!",
  },
};

const professionalMessages: StyleMessages = {
  greeting: {
    morning: "안녕하세요",
    afternoon: "안녕하세요",
    evening: "안녕하세요",
    night: "안녕하세요",
  },
  streak: {
    none: "기록을 시작하세요",
    starting: "연속 기록 시작",
    building: "연속 {count}일 기록",
    strong: "연속 {count}일 기록 중",
    exceptional: "연속 {count}일 달성",
  },
  empty: {
    noRecords: "기록이 없습니다",
    noBooks: "등록된 책이 없습니다",
    noNotes: "작성된 노트가 없습니다",
    noGoal: "목표가 설정되지 않았습니다",
  },
  action: {
    addBook: "책 등록",
    writeNote: "기록 작성",
    setGoal: "목표 설정",
    viewMore: "전체 보기",
  },
  motivational: {
    default: "독서 기록을 관리하세요",
    quoteFocused: "인용구를 정리하세요",
    reflectionFocused: "독서 기록을 작성하세요",
    visualFocused: "이미지를 기록하세요",
  },
};

const poeticMessages: StyleMessages = {
  greeting: {
    morning: "새벽이 건넨 인사",
    afternoon: "햇살이 머무는 시간",
    evening: "노을이 물드는 시간",
    night: "별빛 아래 조용한 밤",
  },
  streak: {
    none: "첫 발자국을 기다리며",
    starting: "이야기가 시작되다",
    building: "{count}번째 페이지를 넘기는 중",
    strong: "{count}개의 밤을 함께하다",
    exceptional: "{count}편의 이야기를 쓰다",
  },
  empty: {
    noRecords: "첫 문장을 기다리는 중",
    noBooks: "새로운 이야기를 기다리며",
    noNotes: "여백이 말을 기다려요",
    noGoal: "꿈을 그려보세요",
  },
  action: {
    addBook: "새 이야기 담기",
    writeNote: "생각 한 줄",
    setGoal: "별을 향해",
    viewMore: "더 깊이",
  },
  motivational: {
    default: "문장들이 모여 이야기가 되어요",
    quoteFocused: "마음을 흔든 한 줄",
    reflectionFocused: "오늘 나에게 남은 것들",
    visualFocused: "눈에 담긴 순간",
  },
};

// =============================================================================
// 스타일별 메시지 맵
// =============================================================================

export const STYLE_MESSAGES: Record<UIStyleKey, StyleMessages> = {
  minimal: minimalMessages,
  warm: warmMessages,
  professional: professionalMessages,
  poetic: poeticMessages,
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 시간대 키 반환
 */
export function getTimeOfDay(): keyof TimeGreeting {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * 스트릭 레벨 반환
 */
export function getStreakLevel(count: number): keyof StreakMessage {
  if (count === 0) return "none";
  if (count <= 2) return "starting";
  if (count <= 6) return "building";
  if (count <= 13) return "strong";
  return "exceptional";
}

/**
 * 스트릭 메시지 생성
 */
export function formatStreakMessage(style: UIStyleKey, count: number): string {
  const level = getStreakLevel(count);
  const template = STYLE_MESSAGES[style].streak[level];
  return template.replace("{count}", String(count));
}

/**
 * 인사말 이모지
 */
export const GREETING_EMOJIS: Record<UIStyleKey, Record<keyof TimeGreeting, string>> = {
  minimal: {
    morning: "",
    afternoon: "",
    evening: "",
    night: "",
  },
  warm: {
    morning: "☀️",
    afternoon: "📚",
    evening: "🌅",
    night: "🌙",
  },
  professional: {
    morning: "",
    afternoon: "",
    evening: "",
    night: "",
  },
  poetic: {
    morning: "🌅",
    afternoon: "☀️",
    evening: "🌇",
    night: "✨",
  },
};
