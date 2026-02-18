/**
 * 스타일 메시지 상수 (사유의 정원 테마)
 *
 * 절제된 톤으로 사용자의 사고가 자라도록 방해하지 않는 메시지를 제공합니다.
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
// 사유의 정원 스타일 메시지 정의
// =============================================================================

export const STYLE_MESSAGES: StyleMessages = {
  greeting: {
    morning: "고요한 아침이에요",
    afternoon: "조용한 오후에요",
    evening: "하루가 저물고 있어요",
    night: "조용한 밤이에요",
  },
  streak: {
    none: "정원이 기다리고 있어요",
    starting: "작은 싹이 돋았어요",
    building: "{count}일째 가꾸고 있어요",
    strong: "{count}일째, 조용히 자라고 있어요",
    exceptional: "{count}일의 흔적이 쌓이고 있어요",
  },
  empty: {
    noRecords: "아직 비어 있는 정원이에요",
    noBooks: "어떤 씨앗을 심어볼까요",
    noNotes: "여백이 기다리고 있어요",
    noGoal: "자신만의 속도로 괜찮아요",
  },
  action: {
    addBook: "새 책 담기",
    writeNote: "기록 남기기",
    setGoal: "목표 세우기",
    viewMore: "더 보러가기",
  },
  motivational: {
    default: "천천히, 자유롭게",
    quoteFocused: "어떤 문장이 머물고 있나요",
    reflectionFocused: "떠오르는 생각이 있다면",
    visualFocused: "눈에 담긴 장면이 있나요",
  },
};

// =============================================================================
// 인사말 이모지
// =============================================================================

export const GREETING_EMOJIS: Record<keyof TimeGreeting, string> = {
  morning: "",
  afternoon: "",
  evening: "",
  night: "",
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
