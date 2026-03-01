/**
 * 포인트 시스템 타입 정의 (단순화 버전)
 *
 * 설계 원칙:
 * - 단순함이 최고 (Less is More) - 인지 부하 최소화
 * - 연속 기록 숫자 자체가 가장 강력한 동기부여 (Loss Aversion)
 * - 즉각적이고 일관된 피드백 (Immediate Gratification)
 * - 내적 동기 강화 - 독서 자체의 즐거움에 집중
 */

/**
 * 포인트 액션 타입 (간소화)
 */
export type PointActionType =
  // 독서 활동
  | "note_create"
  | "note_quote"
  | "note_memo"
  | "note_photo"
  | "note_transcription"
  | "note_progress"
  | "book_add"
  | "book_complete"
  // 연속 기록
  | "daily_first_activity"
  // 스트릭 마일스톤 (3개만 유지)
  | "streak_7_days"
  | "streak_30_days"
  | "streak_100_days"
  // 미션
  | "mission_complete"
  | "all_missions_complete"
  // 소셜
  | "note_share"
  // 특별 보상
  | "first_book"
  | "first_note"
  // 소비
  | "ai_chat_spend"
  | "ocr_spend"
  | "ai_report_spend"
  | "point_refund"
  // 웰컴
  | "welcome_bonus"
  // 시스템
  | "admin_adjust";

/**
 * 포인트 액션 카테고리
 */
export type PointCategory =
  | "reading"
  | "streak"
  | "mission"
  | "social"
  | "special"
  | "system";

/**
 * 포인트 액션 설정
 */
export interface PointActionConfig {
  id: string;
  action_type: PointActionType;
  base_points: number;
  description: string;
  category: PointCategory;
  is_repeatable: boolean;
  daily_limit: number | null;
  is_active: boolean;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 사용자 포인트 정보 (배율 제거)
 */
export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_points: number;
  current_level: number;
  last_activity_date: string | null;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

/**
 * 포인트 거래 내역 (배율 제거)
 */
export interface PointTransaction {
  id: string;
  user_id: string;
  action_type: PointActionType;
  points: number;
  final_points: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

/**
 * 레벨 정보 (스트릭 보너스 제거)
 */
export interface PointLevel {
  id: string;
  level: number;
  required_points: number;
  title: string;
  description: string | null;
  badge_icon: string | null;
  created_at: string;
}

/**
 * 일일 미션
 */
export interface DailyMission {
  id: string;
  user_id: string;
  date: string;
  mission_type: DailyMissionType;
  status: "pending" | "completed";
  points_earned: number;
  completed_at: string | null;
  created_at: string;
}

/**
 * 일일 미션 타입
 */
export type DailyMissionType =
  | "first_read"       // 오늘 첫 독서 기록
  | "note"             // 메모 작성
  | "streak";          // 스트릭 유지

/**
 * 포인트 적립 요청
 */
export interface EarnPointsRequest {
  action_type: PointActionType;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * 포인트 적립 결과 (배율 제거)
 */
export interface EarnPointsResult {
  success: boolean;
  points_earned: number;
  new_total: number;
  new_level?: number;
  level_up?: boolean;
  achievements?: Achievement[];
  error?: string;
}

/**
 * 업적 정보
 */
export interface Achievement {
  type: "streak_milestone" | "level_up" | "first_time" | "special";
  title: string;
  description: string;
  points_bonus: number;
  icon: string;
}

/**
 * 사용자 포인트 대시보드 데이터
 */
export interface PointsDashboardData {
  userPoints: UserPoints | null;
  currentLevel: PointLevel | null;
  nextLevel: PointLevel | null;
  progressToNextLevel: number; // 0-100 퍼센트
  recentTransactions: PointTransaction[];
  todayEarned: number;
  weeklyEarned: number;
  monthlyEarned: number;
}

/**
 * 미션 상태 with 상세 정보
 */
export interface MissionWithDetails {
  id: string;
  type: DailyMissionType;
  title: string;
  description: string;
  status: "pending" | "completed";
  reward: number;
  icon: string;
  progress?: {
    current: number;
    target: number;
  };
  action_url?: string;
  completed_at?: string;
}

/**
 * 포인트 액션 기본값 (간소화 버전)
 *
 * 심리학적 보상 설계 원칙:
 * - 노력-보상 균형 (Effort-Reward Balance)
 * - 즉각적 만족 (Immediate Gratification)
 * - 손실 회피 (Loss Aversion) - 연속 기록의 가치
 */
export const POINT_ACTION_DEFAULTS: Record<PointActionType, { base_points: number; description: string; category: PointCategory }> = {
  // 독서 활동 (배율 없이 순수 포인트)
  note_create: { base_points: 10, description: "노트 작성", category: "reading" },
  note_quote: { base_points: 15, description: "인용구 기록", category: "reading" },
  note_memo: { base_points: 10, description: "메모 작성", category: "reading" },
  note_photo: { base_points: 12, description: "사진 기록", category: "reading" },
  note_transcription: { base_points: 15, description: "필사 기록", category: "reading" },
  note_progress: { base_points: 5, description: "진행 기록", category: "reading" },
  book_add: { base_points: 8, description: "책 추가", category: "reading" },
  book_complete: { base_points: 60, description: "책 완독", category: "reading" },

  // 연속 기록
  daily_first_activity: { base_points: 8, description: "오늘 첫 활동", category: "streak" },

  // 스트릭 마일스톤 (3개만 - 단순하지만 강력한 동기부여)
  streak_7_days: { base_points: 50, description: "7일 연속 달성", category: "streak" },
  streak_30_days: { base_points: 200, description: "30일 연속 달성", category: "streak" },
  streak_100_days: { base_points: 500, description: "100일 연속 달성", category: "streak" },

  // 미션
  mission_complete: { base_points: 12, description: "일일 미션 완료", category: "mission" },
  all_missions_complete: { base_points: 40, description: "모든 일일 미션 완료", category: "mission" },

  // 소셜
  note_share: { base_points: 8, description: "노트 공유", category: "social" },

  // 특별 보상 (첫 경험 강화)
  first_book: { base_points: 35, description: "첫 번째 책 등록", category: "special" },
  first_note: { base_points: 25, description: "첫 번째 노트 작성", category: "special" },

  // AI / OCR 소비
  ai_chat_spend: { base_points: 0, description: "AI 채팅 포인트 소비", category: "system" },
  ocr_spend: { base_points: 0, description: "OCR 포인트 소비", category: "system" },
  ai_report_spend: { base_points: 0, description: "AI 리포트 포인트 소비", category: "system" },
  point_refund: { base_points: 0, description: "포인트 환불", category: "system" },
  // 웰컴
  welcome_bonus: { base_points: 300, description: "가입 축하 보너스", category: "special" },

  // 시스템
  admin_adjust: { base_points: 0, description: "관리자 조정", category: "system" },
};

/**
 * 레벨 기본값 (나무 성장 컨셉, 배율 제거)
 *
 * 심리학적 설계:
 * - Flow Theory: 도전과 능력의 균형
 * - Endowed Progress Effect: 첫 활동 시 즉시 레벨 2 달성 가능
 * - 21일 습관 형성 법칙: 레벨 6 = 약 3주
 */
export const LEVEL_DEFAULTS: PointLevel[] = [
  { id: "1", level: 1, required_points: 0, title: "씨앗", description: "독서의 씨앗을 심었어요", badge_icon: "Nut", created_at: "" },
  { id: "2", level: 2, required_points: 50, title: "새싹", description: "작은 새싹이 돋아났어요", badge_icon: "Sprout", created_at: "" },
  { id: "3", level: 3, required_points: 150, title: "떡잎", description: "첫 잎이 자라나고 있어요", badge_icon: "Leaf", created_at: "" },
  { id: "4", level: 4, required_points: 350, title: "어린나무", description: "줄기가 튼튼해지고 있어요", badge_icon: "TreePine", created_at: "" },
  { id: "5", level: 5, required_points: 650, title: "나무", description: "어엿한 나무로 성장했어요", badge_icon: "TreeDeciduous", created_at: "" },
  { id: "6", level: 6, required_points: 1100, title: "큰나무", description: "풍성한 가지를 뻗고 있어요", badge_icon: "Trees", created_at: "" },
  { id: "7", level: 7, required_points: 1800, title: "꽃나무", description: "아름다운 꽃이 피었어요", badge_icon: "Flower2", created_at: "" },
  { id: "8", level: 8, required_points: 2800, title: "열매나무", description: "지혜의 열매가 맺혔어요", badge_icon: "Apple", created_at: "" },
  { id: "9", level: 9, required_points: 4200, title: "세계수", description: "하늘을 향해 뻗은 거대한 나무", badge_icon: "Palmtree", created_at: "" },
  { id: "10", level: 10, required_points: 6500, title: "황금숲", description: "전설의 황금빛 숲을 이뤘어요", badge_icon: "Mountain", created_at: "" },
];

/**
 * 레벨별 스타일 정보 (나무 성장 컨셉)
 */
export interface LevelStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  emoji: string;
  effect: "none" | "subtle" | "glow" | "premium";
}

export const LEVEL_STYLES: Record<number, LevelStyle> = {
  1: {
    color: "#a3785d",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-300 dark:border-amber-700",
    textColor: "text-amber-800 dark:text-amber-300",
    emoji: "🌰",
    effect: "none",
  },
  2: {
    color: "#86efac",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300",
    emoji: "🌱",
    effect: "none",
  },
  3: {
    color: "#4ade80",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-400 dark:border-green-600",
    textColor: "text-green-700 dark:text-green-300",
    emoji: "🌿",
    effect: "none",
  },
  4: {
    color: "#34d399",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-400 dark:border-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-300",
    emoji: "🪴",
    effect: "subtle",
  },
  5: {
    color: "#22c55e",
    bgColor: "bg-green-200 dark:bg-green-800/40",
    borderColor: "border-green-500 dark:border-green-500",
    textColor: "text-green-800 dark:text-green-200",
    emoji: "🌲",
    effect: "subtle",
  },
  6: {
    color: "#15803d",
    bgColor: "bg-green-200 dark:bg-green-800/50",
    borderColor: "border-green-600 dark:border-green-400",
    textColor: "text-green-900 dark:text-green-100",
    emoji: "🌳",
    effect: "subtle",
  },
  7: {
    color: "#f472b6",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    borderColor: "border-pink-400 dark:border-pink-600",
    textColor: "text-pink-700 dark:text-pink-300",
    emoji: "🌸",
    effect: "glow",
  },
  8: {
    color: "#f97316",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-400 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-300",
    emoji: "🍎",
    effect: "glow",
  },
  9: {
    color: "#2dd4bf",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    borderColor: "border-teal-400 dark:border-teal-600",
    textColor: "text-teal-700 dark:text-teal-300",
    emoji: "🌴",
    effect: "glow",
  },
  10: {
    color: "#fbbf24",
    bgColor: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40",
    borderColor: "border-amber-400 dark:border-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
    emoji: "🏞️",
    effect: "premium",
  },
};

/**
 * 레벨 스타일 가져오기 유틸리티
 */
export function getLevelStyle(level: number): LevelStyle {
  return LEVEL_STYLES[level] || LEVEL_STYLES[1];
}

/**
 * 포인트 소비 타입
 */
export type PointSpendType = "ai_chat" | "ocr_process" | "ai_report";

/**
 * 포인트 소비 비용 설정
 *
 * 비용 산정 기준: 실제 API 비용 대비 활동 유인 균형
 * - AI 채팅: ~0.5원/회 → 100P (일반 사용자 2.3일분)
 * - OCR: ~2.7원/회 → 80P (사용 빈도 높은 기능)
 * - AI 리포트: ~1.5원/회 → 150P (고가치 기능)
 */
export const POINT_SPEND_COSTS: Record<PointSpendType, number> = {
  ai_chat: 100,
  ocr_process: 80,
  ai_report: 150,
};

/**
 * 포인트 소비 결과
 */
export interface SpendPointsResult {
  success: boolean;
  points_spent: number;
  new_total: number;
  transaction_id?: string;
  error?: string;
}

/**
 * 포인트 잔액 확인 결과
 */
export interface CheckPointBalanceResult {
  canAfford: boolean;
  balance: number;
  cost: number;
}

/**
 * 독서 독려 문구 (간소화)
 */
export const READING_ENCOURAGEMENT_QUOTES = [
  { text: "오늘도 나무에게 생명을 주셨네요! 📚", category: "motivation" },
  { text: "당신의 독서가 나무를 자라게 해요 🌱", category: "motivation" },
  { text: "한 페이지가 모여 숲이 됩니다 🌲", category: "motivation" },
  { text: "독서하는 당신, 정말 멋져요! 💪", category: "motivation" },
  { text: "오늘 읽은 책에서 어떤 문장이 마음에 들었나요?", category: "prompt" },
  { text: "10분만 읽어도 나무가 기뻐해요!", category: "prompt" },
  { text: "나무가 쑥쑥 자라고 있어요! 🎉", category: "achievement" },
  { text: "꾸준함이 만드는 기적, 바로 당신이에요", category: "achievement" },
  { text: "책은 마음의 양식이다 - 키케로", category: "quote" },
  { text: "오늘 읽는 책이 내일의 나를 만든다", category: "quote" },
];

/**
 * 랜덤 독서 독려 문구 가져오기
 */
export function getRandomEncouragementQuote(category?: string): string {
  const quotes = category
    ? READING_ENCOURAGEMENT_QUOTES.filter(q => q.category === category)
    : READING_ENCOURAGEMENT_QUOTES;
  return quotes[Math.floor(Math.random() * quotes.length)].text;
}
