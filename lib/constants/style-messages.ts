/**
 * 스타일 메시지 상수 (따뜻한 스타일 고정)
 *
 * 친근하고 응원하는 톤앤매너의 메시지를 제공합니다.
 */

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
// 따뜻한 스타일 메시지 정의
// =============================================================================

export const STYLE_MESSAGES: StyleMessages = {
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

// =============================================================================
// 인사말 이모지
// =============================================================================

export const GREETING_EMOJIS: Record<keyof TimeGreeting, string> = {
  morning: "☀️",
  afternoon: "📚",
  evening: "🌅",
  night: "🌙",
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
export function formatStreakMessage(count: number): string {
  const level = getStreakLevel(count);
  const template = STYLE_MESSAGES.streak[level];
  return template.replace("{count}", String(count));
}
