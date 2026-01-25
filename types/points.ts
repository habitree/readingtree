/**
 * 포인트 시스템 타입 정의
 */

/**
 * 포인트 액션 타입
 */
export type PointActionType =
  // 독서 활동
  | "note_create"
  | "note_quote"
  | "note_memo"
  | "note_photo"
  | "note_transcription"
  | "book_add"
  | "book_complete"
  | "book_progress_update"
  // 스트릭/습관
  | "daily_first_activity"
  | "streak_3_days"
  | "streak_7_days"
  | "streak_14_days"
  | "streak_30_days"
  | "streak_100_days"
  | "streak_365_days"
  // 미션/챌린지
  | "mission_complete"
  | "all_missions_complete"
  // 소셜 활동
  | "group_join"
  | "group_create"
  | "note_share"
  // 특별 보상
  | "first_book"
  | "first_note"
  | "monthly_goal_achieve"
  | "yearly_goal_achieve"
  // 시스템
  | "point_used"
  | "point_expired"
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
 * 사용자 포인트 정보
 */
export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_points: number;
  current_level: number;
  streak_bonus_multiplier: number;
  last_activity_date: string | null;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

/**
 * 포인트 거래 내역
 */
export interface PointTransaction {
  id: string;
  user_id: string;
  action_type: PointActionType;
  points: number;
  multiplier: number;
  final_points: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number;
  metadata: Record<string, any> | null;
  created_at: string;
}

/**
 * 레벨 정보
 */
export interface PointLevel {
  id: string;
  level: number;
  required_points: number;
  title: string;
  description: string | null;
  badge_icon: string | null;
  streak_bonus: number;
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
  | "streak"           // 스트릭 유지
  | "time_goal";       // 시간 목표

/**
 * 보너스 미션 타입 (모든 일일 미션 완료 후 해금)
 */
export type BonusMissionType =
  | "extra_note"       // 추가 기록 작성
  | "quote_collect"    // 인용구 수집
  | "deep_reading"     // 깊이 읽기 (긴 메모)
  | "photo_capture"    // 사진 기록
  | "share_wisdom"     // 지혜 나누기
  | "lucky_box";       // 럭키박스 (랜덤 보상)

/**
 * 보너스 미션 상세 정보
 */
export interface BonusMission {
  id: string;
  type: BonusMissionType;
  title: string;
  description: string;
  status: "locked" | "available" | "in_progress" | "completed";
  reward: {
    min: number;       // 최소 보상
    max: number;       // 최대 보상 (가변 보상)
    actual?: number;   // 실제 획득한 보상
  };
  icon: string;
  action_url?: string;
  expires_at?: string; // 제한 시간 (희소성)
  difficulty: "easy" | "medium" | "hard";
  requirement?: {
    type: string;
    target: number;
    current: number;
  };
  // 심리학적 요소
  rarity: "common" | "rare" | "epic" | "legendary"; // 희소성 표시
  completedBy?: number; // 오늘 완료한 사용자 수 (사회적 증거)
}

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
 * 포인트 적립 결과
 */
export interface EarnPointsResult {
  success: boolean;
  points_earned: number;
  final_points: number;
  multiplier_applied: number;
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
  action_url?: string; // 클릭 시 이동할 URL
  completed_at?: string;
}

/**
 * 포인트 액션 기본값 (클라이언트 사이드 폴백용)
 */
export const POINT_ACTION_DEFAULTS: Record<PointActionType, { base_points: number; description: string; category: PointCategory }> = {
  // 독서 활동
  note_create: { base_points: 10, description: "노트 작성", category: "reading" },
  note_quote: { base_points: 15, description: "인용구 기록", category: "reading" },
  note_memo: { base_points: 10, description: "메모 작성", category: "reading" },
  note_photo: { base_points: 12, description: "사진 기록", category: "reading" },
  note_transcription: { base_points: 20, description: "필사 기록", category: "reading" },
  book_add: { base_points: 5, description: "책 추가", category: "reading" },
  book_complete: { base_points: 50, description: "책 완독", category: "reading" },
  book_progress_update: { base_points: 3, description: "진행률 업데이트", category: "reading" },

  // 스트릭/습관
  daily_first_activity: { base_points: 5, description: "오늘 첫 활동", category: "streak" },
  streak_3_days: { base_points: 20, description: "3일 연속 달성", category: "streak" },
  streak_7_days: { base_points: 50, description: "7일 연속 달성", category: "streak" },
  streak_14_days: { base_points: 100, description: "14일 연속 달성", category: "streak" },
  streak_30_days: { base_points: 200, description: "30일 연속 달성", category: "streak" },
  streak_100_days: { base_points: 500, description: "100일 연속 달성", category: "streak" },
  streak_365_days: { base_points: 1000, description: "365일 연속 달성", category: "streak" },

  // 미션/챌린지
  mission_complete: { base_points: 10, description: "일일 미션 완료", category: "mission" },
  all_missions_complete: { base_points: 30, description: "모든 일일 미션 완료", category: "mission" },

  // 소셜 활동
  group_join: { base_points: 10, description: "모임 가입", category: "social" },
  group_create: { base_points: 30, description: "모임 생성", category: "social" },
  note_share: { base_points: 5, description: "노트 공유", category: "social" },

  // 특별 보상
  first_book: { base_points: 30, description: "첫 번째 책 등록", category: "special" },
  first_note: { base_points: 20, description: "첫 번째 노트 작성", category: "special" },
  monthly_goal_achieve: { base_points: 100, description: "월간 목표 달성", category: "special" },
  yearly_goal_achieve: { base_points: 500, description: "연간 목표 달성", category: "special" },

  // 시스템
  point_used: { base_points: 0, description: "포인트 사용", category: "system" },
  point_expired: { base_points: 0, description: "포인트 만료", category: "system" },
  admin_adjust: { base_points: 0, description: "관리자 조정", category: "system" },
};

/**
 * 레벨 기본값
 */
export const LEVEL_DEFAULTS: PointLevel[] = [
  { id: "1", level: 1, required_points: 0, title: "새싹 독서가", description: "독서 여정을 시작한 새싹", badge_icon: "Sprout", streak_bonus: 1.00, created_at: "" },
  { id: "2", level: 2, required_points: 100, title: "호기심 독서가", description: "독서에 흥미를 느끼기 시작", badge_icon: "Sparkles", streak_bonus: 1.05, created_at: "" },
  { id: "3", level: 3, required_points: 300, title: "성장하는 독서가", description: "꾸준히 성장하는 중", badge_icon: "TrendingUp", streak_bonus: 1.10, created_at: "" },
  { id: "4", level: 4, required_points: 600, title: "열정 독서가", description: "독서에 대한 열정이 가득", badge_icon: "Flame", streak_bonus: 1.15, created_at: "" },
  { id: "5", level: 5, required_points: 1000, title: "숙련 독서가", description: "독서 습관이 자리잡음", badge_icon: "Star", streak_bonus: 1.20, created_at: "" },
  { id: "6", level: 6, required_points: 1500, title: "마스터 독서가", description: "독서의 즐거움을 아는 마스터", badge_icon: "Crown", streak_bonus: 1.25, created_at: "" },
  { id: "7", level: 7, required_points: 2500, title: "전문 독서가", description: "깊이 있는 독서를 즐김", badge_icon: "Award", streak_bonus: 1.30, created_at: "" },
  { id: "8", level: 8, required_points: 4000, title: "현자 독서가", description: "지혜가 쌓인 독서가", badge_icon: "BookOpen", streak_bonus: 1.35, created_at: "" },
  { id: "9", level: 9, required_points: 6000, title: "대가 독서가", description: "독서의 대가", badge_icon: "Trophy", streak_bonus: 1.40, created_at: "" },
  { id: "10", level: 10, required_points: 10000, title: "전설의 독서가", description: "전설적인 독서 기록", badge_icon: "Gem", streak_bonus: 1.50, created_at: "" },
];

/**
 * 레벨별 스타일 정보 (심리학적 색상 + 디자인)
 * - 초기 레벨 (1-3): 녹색 계열 → 안정감, 성장
 * - 중급 레벨 (4-6): 따뜻한 색 → 열정, 권위
 * - 고급 레벨 (7-10): 특별한 색 → 희소성, 특별함
 */
export interface LevelStyle {
  color: string;        // Tailwind 색상 클래스
  bgColor: string;      // 배경색
  borderColor: string;  // 테두리색
  textColor: string;    // 텍스트색
  emoji: string;        // 이모지
  effect: "none" | "subtle" | "glow" | "premium"; // 애니메이션 효과
}

export const LEVEL_STYLES: Record<number, LevelStyle> = {
  1: {
    color: "#86efac",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300",
    emoji: "🌱",
    effect: "none",
  },
  2: {
    color: "#fde047",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    textColor: "text-yellow-700 dark:text-yellow-300",
    emoji: "✨",
    effect: "none",
  },
  3: {
    color: "#4ade80",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    textColor: "text-emerald-700 dark:text-emerald-300",
    emoji: "📈",
    effect: "none",
  },
  4: {
    color: "#fb923c",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-300 dark:border-orange-700",
    textColor: "text-orange-700 dark:text-orange-300",
    emoji: "🔥",
    effect: "subtle",
  },
  5: {
    color: "#facc15",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-300 dark:border-amber-700",
    textColor: "text-amber-700 dark:text-amber-300",
    emoji: "⭐",
    effect: "subtle",
  },
  6: {
    color: "#c084fc",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
    textColor: "text-purple-700 dark:text-purple-300",
    emoji: "👑",
    effect: "subtle",
  },
  7: {
    color: "#60a5fa",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
    textColor: "text-blue-700 dark:text-blue-300",
    emoji: "🏅",
    effect: "glow",
  },
  8: {
    color: "#2dd4bf",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    borderColor: "border-teal-300 dark:border-teal-700",
    textColor: "text-teal-700 dark:text-teal-300",
    emoji: "📖",
    effect: "glow",
  },
  9: {
    color: "#f472b6",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    borderColor: "border-pink-300 dark:border-pink-700",
    textColor: "text-pink-700 dark:text-pink-300",
    emoji: "🏆",
    effect: "glow",
  },
  10: {
    color: "#e879f9",
    bgColor: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    borderColor: "border-fuchsia-300 dark:border-fuchsia-700",
    textColor: "text-fuchsia-700 dark:text-fuchsia-300",
    emoji: "💎",
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
 * 보너스 미션 정의 (심리학적 동기부여 요소 포함)
 */
export interface BonusMissionDefinition {
  type: BonusMissionType;
  title: string;
  description: string;
  icon: string;
  action_url: string;
  reward: { min: number; max: number };
  difficulty: "easy" | "medium" | "hard";
  rarity: "common" | "rare" | "epic" | "legendary";
  durationMinutes?: number; // 제한 시간 (희소성)
}

export const BONUS_MISSION_DEFINITIONS: BonusMissionDefinition[] = [
  {
    type: "extra_note",
    title: "추가 기록 도전",
    description: "오늘 하루 1개 더 기록해보세요",
    icon: "PenLine",
    action_url: "/notes/new",
    reward: { min: 15, max: 25 },
    difficulty: "easy",
    rarity: "common",
  },
  {
    type: "quote_collect",
    title: "명언 수집가",
    description: "인상 깊은 구절을 기록하세요",
    icon: "Quote",
    action_url: "/notes/new",
    reward: { min: 20, max: 35 },
    difficulty: "easy",
    rarity: "common",
  },
  {
    type: "deep_reading",
    title: "깊이 읽기",
    description: "100자 이상의 생각을 기록하세요",
    icon: "Brain",
    action_url: "/notes/new",
    reward: { min: 25, max: 50 },
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "photo_capture",
    title: "순간 포착",
    description: "책과 함께한 순간을 사진으로 남기세요",
    icon: "Camera",
    action_url: "/notes/new",
    reward: { min: 20, max: 40 },
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "share_wisdom",
    title: "지혜 나눔",
    description: "기록을 공개로 설정하여 다른 독서가와 나누세요",
    icon: "Share2",
    action_url: "/notes/new",
    reward: { min: 30, max: 60 },
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "lucky_box",
    title: "🎁 럭키박스",
    description: "무엇이 나올까요? 기록하고 열어보세요!",
    icon: "Gift",
    action_url: "/notes/new",
    reward: { min: 10, max: 100 }, // 가변 보상 (슬롯머신 효과)
    difficulty: "easy",
    rarity: "legendary",
    durationMinutes: 30, // 30분 제한 (희소성)
  },
];

/**
 * 희소성별 색상 스타일
 */
export const RARITY_STYLES = {
  common: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-600",
    text: "text-slate-700 dark:text-slate-300",
    badge: "bg-slate-500",
  },
  rare: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-500",
  },
  epic: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-500",
  },
  legendary: {
    bg: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
};

/**
 * 심리학적 동기부여 메시지
 */
export const MOTIVATION_MESSAGES = {
  // Near-miss 효과 (거의 달성)
  nearMiss: [
    "거의 다 왔어요! 조금만 더!",
    "마지막 한 걸음만 남았어요!",
    "포기하기엔 너무 아까워요!",
  ],
  // 손실 회피 (스트릭 보호)
  lossAversion: [
    "🔥 {streak}일 연속 기록이 사라질 수 있어요!",
    "오늘 기록하지 않으면 연속 기록이 끊겨요",
    "지금까지의 노력이 물거품이 될 수 있어요",
  ],
  // 사회적 증거
  socialProof: [
    "오늘 {count}명이 이 미션을 완료했어요",
    "상위 {percent}%의 독서가들이 도전 중!",
    "지금 {active}명이 함께 읽고 있어요",
  ],
  // 성취감
  achievement: [
    "대단해요! 오늘도 성공!",
    "꾸준함이 실력이에요!",
    "한 걸음 더 성장했어요!",
  ],
  // 보너스 해금
  bonusUnlock: [
    "🎉 보너스 미션이 해금되었어요!",
    "✨ 특별 보상을 받을 수 있어요!",
    "🎁 추가 미션에 도전해보세요!",
  ],
};
