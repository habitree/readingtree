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
 *
 * ============================================
 * 심리학적 보상 설계 원칙
 * ============================================
 *
 * 1. Effort-Reward Balance (노력-보상 균형):
 *    - 노력 대비 적절한 보상으로 내적 동기 유지
 *    - 필사(20) > 인용(15) > 사진(12) > 메모(10) 순서로 노력 반영
 *
 * 2. Immediate Gratification (즉각적 만족):
 *    - 모든 활동에 즉시 포인트 제공
 *    - 일일 첫 활동 보너스로 매일 접속 유도
 *
 * 3. Escalating Commitment (점진적 몰입):
 *    - 스트릭 마일스톤이 기하급수적으로 증가
 *    - 포기 시 손실이 커져 지속 동기 강화
 *
 * 4. Social Reinforcement (사회적 강화):
 *    - 공유/모임 활동에 적절한 보상
 *    - 사회적 연결이 장기 retention 핵심
 *
 * 5. Peak Experience Design (정점 경험):
 *    - 책 완독(50점), 월간 목표(100점) 등 큰 성취에 높은 보상
 *    - Peak-End Rule: 정점 경험이 전체 만족도 결정
 */
export const POINT_ACTION_DEFAULTS: Record<PointActionType, { base_points: number; description: string; category: PointCategory }> = {
  // 독서 활동 (노력 수준에 비례한 보상)
  note_create: { base_points: 10, description: "노트 작성", category: "reading" },
  note_quote: { base_points: 15, description: "인용구 기록", category: "reading" },
  note_memo: { base_points: 10, description: "메모 작성", category: "reading" },
  note_photo: { base_points: 12, description: "사진 기록", category: "reading" },
  note_transcription: { base_points: 20, description: "필사 기록", category: "reading" },
  book_add: { base_points: 8, description: "책 추가", category: "reading" },  // 5→8: 첫 시작 격려
  book_complete: { base_points: 60, description: "책 완독", category: "reading" }, // 50→60: 완독 성취감 강화
  book_progress_update: { base_points: 3, description: "진행률 업데이트", category: "reading" },

  // 스트릭/습관 (기하급수적 증가로 손실 회피 강화)
  daily_first_activity: { base_points: 8, description: "오늘 첫 활동", category: "streak" }, // 5→8: 매일 접속 강화
  streak_3_days: { base_points: 25, description: "3일 연속 달성", category: "streak" },  // 20→25
  streak_7_days: { base_points: 60, description: "7일 연속 달성", category: "streak" },  // 50→60
  streak_14_days: { base_points: 120, description: "14일 연속 달성", category: "streak" }, // 100→120
  streak_30_days: { base_points: 250, description: "30일 연속 달성", category: "streak" }, // 200→250
  streak_100_days: { base_points: 600, description: "100일 연속 달성", category: "streak" }, // 500→600
  streak_365_days: { base_points: 1500, description: "365일 연속 달성", category: "streak" }, // 1000→1500

  // 미션/챌린지 (일일 참여 유도)
  mission_complete: { base_points: 12, description: "일일 미션 완료", category: "mission" }, // 10→12
  all_missions_complete: { base_points: 40, description: "모든 일일 미션 완료", category: "mission" }, // 30→40

  // 소셜 활동 (사회적 연결 강화)
  group_join: { base_points: 15, description: "모임 가입", category: "social" }, // 10→15
  group_create: { base_points: 40, description: "모임 생성", category: "social" }, // 30→40
  note_share: { base_points: 8, description: "노트 공유", category: "social" }, // 5→8

  // 특별 보상 (첫 경험 강화 - Endowed Progress)
  first_book: { base_points: 35, description: "첫 번째 책 등록", category: "special" }, // 30→35
  first_note: { base_points: 25, description: "첫 번째 노트 작성", category: "special" }, // 20→25
  monthly_goal_achieve: { base_points: 120, description: "월간 목표 달성", category: "special" }, // 100→120
  yearly_goal_achieve: { base_points: 600, description: "연간 목표 달성", category: "special" }, // 500→600

  // 시스템
  point_used: { base_points: 0, description: "포인트 사용", category: "system" },
  point_expired: { base_points: 0, description: "포인트 만료", category: "system" },
  admin_adjust: { base_points: 0, description: "관리자 조정", category: "system" },
};

/**
 * 레벨 기본값 (나무 성장 컨셉)
 * 씨앗 → 새싹 → 떡잎 → 어린나무 → 나무 → 큰나무 → 꽃나무 → 열매나무 → 세계수 → 황금숲
 *
 * ============================================
 * 심리학적 설계 원칙 (Psychological Design Principles)
 * ============================================
 *
 * 1. Flow Theory (Csikszentmihalyi):
 *    - 도전과 능력의 균형 유지
 *    - 각 레벨 간 난이도 증가율을 40-60% 범위로 제한
 *    - S-curve 적용: 초반 빠름 → 중반 안정 → 후반 도전적
 *
 * 2. Endowed Progress Effect (Nunes & Drèze):
 *    - 첫 활동 시 즉시 레벨 2 달성 가능 (50점)
 *    - "이미 시작된" 느낌으로 완료율 82% 향상
 *
 * 3. 21일 습관 형성 법칙 (Habit Loop):
 *    - 레벨 6 = 약 3주 (습관 형성 완료 시점)
 *    - 이 시점에서 스트릭 보너스 1.25x로 강화
 *
 * 4. Variable Ratio Schedule:
 *    - 레벨업 보너스를 예측 불가능하게 설계
 *    - 높은 레벨일수록 보너스 폭 증가
 *
 * 5. Near-miss Effect:
 *    - 레벨 간 격차를 "거의 달성" 느낌이 드는 수준으로 조정
 *    - 하루 활동으로 10-20% 진행되는 체감
 *
 * 6. Loss Aversion (Kahneman):
 *    - 스트릭 끊김 시 보너스 배율 감소로 손실 체감
 *    - 고레벨일수록 손실 비용 증가
 *
 * ============================================
 * 달성 시간 설계 (보통 사용자 50점/일 기준)
 * ============================================
 * 레벨 2:  50점 →  1일  (첫날 성취감)
 * 레벨 3: 150점 →  3일  (3일 스트릭과 동시)
 * 레벨 4: 350점 →  7일  (1주일 마일스톤)
 * 레벨 5: 650점 → 13일  (2주 습관 시작)
 * 레벨 6: 1100점 → 22일 (3주 습관 형성)
 * 레벨 7: 1800점 → 36일 (5주, 1개월+)
 * 레벨 8: 2800점 → 56일 (8주, 2개월)
 * 레벨 9: 4200점 → 84일 (12주, 3개월)
 * 레벨 10: 6500점 → 130일 (약 4개월, 희소성)
 *
 * 레벨 간 증가율: 50% → 133% → 86% → 69% → 64% → 56% → 50% → 55%
 * (급격한 증가 없이 완만한 S-curve 형성)
 */
export const LEVEL_DEFAULTS: PointLevel[] = [
  { id: "1", level: 1, required_points: 0, title: "씨앗", description: "독서의 씨앗을 심었어요", badge_icon: "Nut", streak_bonus: 1.00, created_at: "" },
  { id: "2", level: 2, required_points: 50, title: "새싹", description: "작은 새싹이 돋아났어요", badge_icon: "Sprout", streak_bonus: 1.05, created_at: "" },
  { id: "3", level: 3, required_points: 150, title: "떡잎", description: "첫 잎이 자라나고 있어요", badge_icon: "Leaf", streak_bonus: 1.10, created_at: "" },
  { id: "4", level: 4, required_points: 350, title: "어린나무", description: "줄기가 튼튼해지고 있어요", badge_icon: "TreePine", streak_bonus: 1.15, created_at: "" },
  { id: "5", level: 5, required_points: 650, title: "나무", description: "어엿한 나무로 성장했어요", badge_icon: "TreeDeciduous", streak_bonus: 1.20, created_at: "" },
  { id: "6", level: 6, required_points: 1100, title: "큰나무", description: "풍성한 가지를 뻗고 있어요", badge_icon: "Trees", streak_bonus: 1.25, created_at: "" },
  { id: "7", level: 7, required_points: 1800, title: "꽃나무", description: "아름다운 꽃이 피었어요", badge_icon: "Flower2", streak_bonus: 1.30, created_at: "" },
  { id: "8", level: 8, required_points: 2800, title: "열매나무", description: "지혜의 열매가 맺혔어요", badge_icon: "Apple", streak_bonus: 1.40, created_at: "" },
  { id: "9", level: 9, required_points: 4200, title: "세계수", description: "하늘을 향해 뻗은 거대한 나무", badge_icon: "Palmtree", streak_bonus: 1.50, created_at: "" },
  { id: "10", level: 10, required_points: 6500, title: "황금숲", description: "전설의 황금빛 숲을 이뤘어요", badge_icon: "Mountain", streak_bonus: 1.60, created_at: "" },
];

/**
 * 레벨별 스타일 정보 (나무 성장 컨셉 + 자연 색상)
 * - 초기 (1-3): 씨앗~떡잎 - 갈색/연두/초록
 * - 성장 (4-6): 어린나무~큰나무 - 에메랄드/진초록/숲색
 * - 개화 (7-8): 꽃나무~열매나무 - 분홍/주황
 * - 전설 (9-10): 세계수~황금숲 - 청록/황금
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
  // 씨앗 - 갈색 (흙 속의 씨앗)
  1: {
    color: "#a3785d",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-300 dark:border-amber-700",
    textColor: "text-amber-800 dark:text-amber-300",
    emoji: "🌰",
    effect: "none",
  },
  // 새싹 - 연두색 (막 돋아난 새싹)
  2: {
    color: "#86efac",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-300 dark:border-green-700",
    textColor: "text-green-700 dark:text-green-300",
    emoji: "🌱",
    effect: "none",
  },
  // 떡잎 - 초록색 (첫 잎이 자라남)
  3: {
    color: "#4ade80",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-400 dark:border-green-600",
    textColor: "text-green-700 dark:text-green-300",
    emoji: "🌿",
    effect: "none",
  },
  // 어린나무 - 에메랄드 (줄기가 튼튼해짐)
  4: {
    color: "#34d399",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    borderColor: "border-emerald-400 dark:border-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-300",
    emoji: "🪴",
    effect: "subtle",
  },
  // 나무 - 진초록 (어엿한 나무)
  5: {
    color: "#22c55e",
    bgColor: "bg-green-200 dark:bg-green-800/40",
    borderColor: "border-green-500 dark:border-green-500",
    textColor: "text-green-800 dark:text-green-200",
    emoji: "🌲",
    effect: "subtle",
  },
  // 큰나무 - 숲색 (풍성한 가지)
  6: {
    color: "#15803d",
    bgColor: "bg-green-200 dark:bg-green-800/50",
    borderColor: "border-green-600 dark:border-green-400",
    textColor: "text-green-900 dark:text-green-100",
    emoji: "🌳",
    effect: "subtle",
  },
  // 꽃나무 - 분홍 (아름다운 꽃)
  7: {
    color: "#f472b6",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    borderColor: "border-pink-400 dark:border-pink-600",
    textColor: "text-pink-700 dark:text-pink-300",
    emoji: "🌸",
    effect: "glow",
  },
  // 열매나무 - 주황/빨강 (지혜의 열매)
  8: {
    color: "#f97316",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-400 dark:border-orange-600",
    textColor: "text-orange-700 dark:text-orange-300",
    emoji: "🍎",
    effect: "glow",
  },
  // 세계수 - 청록 (신비로운 거대 나무)
  9: {
    color: "#2dd4bf",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    borderColor: "border-teal-400 dark:border-teal-600",
    textColor: "text-teal-700 dark:text-teal-300",
    emoji: "🌴",
    effect: "glow",
  },
  // 황금숲 - 황금색 (전설의 숲)
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

/**
 * ============================================
 * 보너스 미션 심리학적 설계
 * ============================================
 *
 * 1. Variable Ratio Reinforcement (가변 비율 강화):
 *    - 슬롯머신 효과: 보상 범위를 넓게 설정
 *    - 예측 불가능성이 dopamine 분비 극대화
 *    - min:max 비율을 1:3~1:5로 설정
 *
 * 2. Scarcity Principle (희소성 원칙):
 *    - 시간 제한으로 긴급성 유발
 *    - Legendary 미션은 30분 제한
 *    - "지금 아니면 기회 상실" 심리
 *
 * 3. Ikea Effect (이케아 효과):
 *    - 노력이 들어간 결과물에 더 높은 가치 부여
 *    - deep_reading, photo_capture 등 노력 필요 미션
 *
 * 4. Social Proof (사회적 증거):
 *    - completedBy 필드로 다른 사용자 완료 수 표시
 *    - "100명이 완료했어요" → 나도 할 수 있다
 *
 * 5. Completion Bias (완료 편향):
 *    - 시작한 일은 끝내고 싶은 심리
 *    - 진행률 바로 "거의 완료" 상태 표시
 */
export const BONUS_MISSION_DEFINITIONS: BonusMissionDefinition[] = [
  {
    type: "extra_note",
    title: "추가 기록 도전",
    description: "오늘 하루 1개 더 기록해보세요",
    icon: "PenLine",
    action_url: "/notes/new",
    reward: { min: 15, max: 30 },  // 범위 확대 (가변성 증가)
    difficulty: "easy",
    rarity: "common",
  },
  {
    type: "quote_collect",
    title: "명언 수집가",
    description: "인상 깊은 구절을 기록하세요",
    icon: "Quote",
    action_url: "/notes/new",
    reward: { min: 18, max: 40 },  // 범위 확대
    difficulty: "easy",
    rarity: "common",
  },
  {
    type: "deep_reading",
    title: "깊이 읽기",
    description: "100자 이상의 생각을 기록하세요",
    icon: "Brain",
    action_url: "/notes/new",
    reward: { min: 25, max: 65 },  // 노력 대비 높은 보상
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "photo_capture",
    title: "순간 포착",
    description: "책과 함께한 순간을 사진으로 남기세요",
    icon: "Camera",
    action_url: "/notes/new",
    reward: { min: 20, max: 50 },  // 범위 확대
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "share_wisdom",
    title: "지혜 나눔",
    description: "기록을 공개로 설정하여 다른 독서가와 나누세요",
    icon: "Share2",
    action_url: "/notes/new",
    reward: { min: 30, max: 75 },  // 사회적 활동 강화
    difficulty: "medium",
    rarity: "rare",
  },
  {
    type: "lucky_box",
    title: "🎁 럭키박스",
    description: "무엇이 나올까요? 기록하고 열어보세요!",
    icon: "Gift",
    action_url: "/notes/new",
    reward: { min: 5, max: 150 },  // 극단적 가변성 (슬롯머신 효과 극대화)
    difficulty: "easy",
    rarity: "legendary",
    durationMinutes: 20,  // 30→20분: 더 강한 긴급성
  },
];

/**
 * ============================================
 * 물주기 시스템 (Reading Tree Watering System)
 * ============================================
 *
 * 심리학적 설계 원칙:
 * - 가변 보상 (Variable Reward): 매번 다른 포인트로 기대감 유발
 * - 손실 회피 (Loss Aversion): 나무가 시들 수 있다는 암시
 * - 사회적 증거 (Social Proof): 다른 사용자들의 물주기 활동
 * - 진행 시각화: 나무 성장으로 성취감 제공
 */

/**
 * 물주기 상태 정보
 */
export interface WateringStatus {
  canWater: boolean;              // 물주기 가능 여부
  nextWateringAt: string | null;  // 다음 물주기 가능 시간
  remainingSeconds: number;       // 남은 시간 (초)
  todayWateringCount: number;     // 오늘 물준 횟수
  totalWateringCount: number;     // 총 물준 횟수
  treeHealth: number;             // 나무 건강도 (0-100)
  lastWateredAt: string | null;   // 마지막 물준 시간
}

/**
 * 물주기 결과
 */
export interface WateringResult {
  success: boolean;
  points?: number;
  message: string;
  quote?: string;              // 독서 독려 문구
  isLuckyDrop?: boolean;       // 럭키 드롭 여부 (가변 보상)
  bonusPoints?: number;        // 보너스 포인트
  newTreeHealth?: number;      // 새로운 나무 건강도
}

/**
 * 레벨별 나무 성장 단계
 * 디자인 원칙: 자연스러운 성장 곡선, 시각적 피드백
 */
export interface TreeGrowthStage {
  level: number;
  name: string;                   // 나무 이름
  description: string;            // 설명
  height: number;                 // 상대적 높이 (%)
  hasLeaves: boolean;             // 잎 여부
  hasFlowers: boolean;            // 꽃 여부
  hasFruits: boolean;             // 열매 여부
  trunkColor: string;             // 줄기 색상
  leafColor: string;              // 잎 색상
  glowEffect: boolean;            // 빛나는 효과
  particleEffect: "none" | "subtle" | "sparkle" | "magical"; // 파티클 효과
}

/**
 * 레벨별 나무 성장 단계 정의 (LEVEL_DEFAULTS와 동기화)
 * 씨앗 → 새싹 → 떡잎 → 어린나무 → 나무 → 큰나무 → 꽃나무 → 열매나무 → 세계수 → 황금숲
 */
export const TREE_GROWTH_STAGES: Record<number, TreeGrowthStage> = {
  // 씨앗 - 땅 속 씨앗
  1: {
    level: 1,
    name: "씨앗",
    description: "독서의 씨앗을 심었어요",
    height: 8,
    hasLeaves: false,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#8B5A2B",
    leafColor: "#90EE90",
    glowEffect: false,
    particleEffect: "none",
  },
  // 새싹 - 막 돋아난 새싹
  2: {
    level: 2,
    name: "새싹",
    description: "작은 새싹이 돋아났어요",
    height: 18,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#8B5A2B",
    leafColor: "#86efac",
    glowEffect: false,
    particleEffect: "none",
  },
  // 떡잎 - 첫 잎이 자라남
  3: {
    level: 3,
    name: "떡잎",
    description: "첫 잎이 자라나고 있어요",
    height: 28,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#A0522D",
    leafColor: "#4ade80",
    glowEffect: false,
    particleEffect: "subtle",
  },
  // 어린나무 - 줄기가 튼튼해짐
  4: {
    level: 4,
    name: "어린나무",
    description: "줄기가 튼튼해지고 있어요",
    height: 42,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#8B4513",
    leafColor: "#34d399",
    glowEffect: false,
    particleEffect: "subtle",
  },
  // 나무 - 어엿한 나무
  5: {
    level: 5,
    name: "나무",
    description: "어엿한 나무로 성장했어요",
    height: 55,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#654321",
    leafColor: "#22c55e",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  // 큰나무 - 풍성한 가지
  6: {
    level: 6,
    name: "큰나무",
    description: "풍성한 가지를 뻗고 있어요",
    height: 68,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#5D4037",
    leafColor: "#15803d",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  // 꽃나무 - 아름다운 꽃
  7: {
    level: 7,
    name: "꽃나무",
    description: "아름다운 꽃이 피었어요",
    height: 78,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: false,
    trunkColor: "#4E342E",
    leafColor: "#16a34a",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  // 열매나무 - 지혜의 열매
  8: {
    level: 8,
    name: "열매나무",
    description: "지혜의 열매가 맺혔어요",
    height: 88,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#3E2723",
    leafColor: "#166534",
    glowEffect: true,
    particleEffect: "magical",
  },
  // 세계수 - 거대한 나무
  9: {
    level: 9,
    name: "세계수",
    description: "하늘을 향해 뻗은 거대한 나무",
    height: 95,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#2C1810",
    leafColor: "#14b8a6",
    glowEffect: true,
    particleEffect: "magical",
  },
  // 황금숲 - 전설의 숲
  10: {
    level: 10,
    name: "황금숲",
    description: "전설의 황금빛 숲을 이뤘어요",
    height: 100,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#B8860B",
    leafColor: "#FFD700",
    glowEffect: true,
    particleEffect: "magical",
  },
};

/**
 * 물주기 설정 상수
 *
 * ============================================
 * 심리학적 물주기 시스템 설계
 * ============================================
 *
 * 1. Variable Interval Schedule (가변 간격 스케줄):
 *    - 2시간 쿨다운: 하루 4-5회 자연스러운 접속 유도
 *    - 아침/점심/저녁/밤 리듬과 일치
 *
 * 2. Anticipation (기대감):
 *    - 쿨다운 타이머가 기대감 형성
 *    - "곧 물을 줄 수 있어요!" 메시지
 *
 * 3. Loss Aversion (손실 회피):
 *    - 건강도 감소로 "나무가 시든다" 시각화
 *    - 1.5%/시간: 하루 방치 시 36% 감소 (급한 느낌)
 *
 * 4. Variable Reward (가변 보상):
 *    - 기본 3-10점 범위 (예측 불가)
 *    - 럭키 드롭 12%: 충분한 기대감 형성
 *    - 럭키 배수 4x: 큰 기쁨 제공
 *
 * 5. Optimal Challenge (최적 도전):
 *    - 일일 6회 제한: 무한 반복 방지 + 희소성
 *    - 각 물주기의 가치 상승
 */
export const WATERING_CONFIG = {
  cooldownHours: 2,                    // 3→2시간: 더 자주 접속 유도
  basePoints: 3,                       // 기본 포인트
  maxPoints: 10,                       // 8→10: 가변성 증가
  luckyDropChance: 0.12,               // 10→12%: 약간 높은 확률로 기대감
  luckyDropMultiplier: 4,              // 3→4배: 럭키 시 더 큰 기쁨
  maxDailyWaterings: 6,                // 8→6회: 각 물주기 가치 상승
  healthDecayPerHour: 1.5,             // 2→1.5%: 적절한 긴장감
  healthRecoveryPerWatering: 18,       // 15→18%: 물주기 효과 강화
};

/**
 * 독서 독려 문구 (물주기 시 표시)
 * 심리학: 긍정적 강화, 자기효능감 증진
 */
export const READING_ENCOURAGEMENT_QUOTES = [
  // 동기부여 문구
  { text: "오늘도 나무에게 생명을 주셨네요! 📚", category: "motivation" },
  { text: "당신의 독서가 나무를 자라게 해요 🌱", category: "motivation" },
  { text: "한 페이지가 모여 숲이 됩니다 🌲", category: "motivation" },
  { text: "책 속의 지혜가 나무에 스며들어요 ✨", category: "motivation" },
  { text: "독서하는 당신, 정말 멋져요! 💪", category: "motivation" },

  // 독서 권유 문구
  { text: "오늘 읽은 책에서 어떤 문장이 마음에 들었나요?", category: "prompt" },
  { text: "잠시 쉬어가며 좋아하는 책을 펼쳐보세요 📖", category: "prompt" },
  { text: "10분만 읽어도 나무가 기뻐해요!", category: "prompt" },
  { text: "오늘의 인상 깊은 구절을 기록해보세요 ✍️", category: "prompt" },
  { text: "커피 한 잔과 함께 책 한 페이지 어때요? ☕", category: "prompt" },

  // 성취감 문구
  { text: "나무가 쑥쑥 자라고 있어요! 🎉", category: "achievement" },
  { text: "꾸준함이 만드는 기적, 바로 당신이에요", category: "achievement" },
  { text: "독서 습관이 점점 단단해지고 있어요 💎", category: "achievement" },
  { text: "당신의 나무가 행복해하고 있어요 🌳", category: "achievement" },
  { text: "오늘도 성장하는 당신을 응원해요 🌟", category: "achievement" },

  // 명언
  { text: "책은 마음의 양식이다 - 키케로", category: "quote" },
  { text: "독서는 정신에 있어 운동이 육체에 대한 것과 같다 - 스틸", category: "quote" },
  { text: "오늘 읽는 책이 내일의 나를 만든다", category: "quote" },
  { text: "한 권의 책은 하나의 세계다 - 윌리엄 카우퍼", category: "quote" },
  { text: "좋은 책을 읽는 것은 위대한 사람과 대화하는 것이다 - 데카르트", category: "quote" },
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

/**
 * 나무 성장 단계 가져오기
 */
export function getTreeGrowthStage(level: number): TreeGrowthStage {
  return TREE_GROWTH_STAGES[level] || TREE_GROWTH_STAGES[1];
}

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
 *
 * ============================================
 * 메시지 설계 원칙
 * ============================================
 *
 * 1. Near-miss Effect (Kassinove & Schare, 2001):
 *    - "거의 성공" 메시지가 재시도 동기 300% 증가
 *    - 구체적 숫자 제시 ("3점만 더!")
 *
 * 2. Loss Aversion (Kahneman & Tversky):
 *    - 획득의 기쁨 < 손실의 고통 (2배)
 *    - 잃을 것을 구체적으로 명시
 *
 * 3. Social Proof (Cialdini):
 *    - 다른 사람들의 행동이 강력한 동기
 *    - 숫자와 퍼센트로 신뢰성 부여
 *
 * 4. Self-Efficacy (Bandura):
 *    - "당신은 할 수 있다" 메시지
 *    - 과거 성공 경험 상기시키기
 *
 * 5. Anticipatory Pleasure:
 *    - 미래의 보상을 상상하게 하기
 *    - "곧 레벨업!", "특별 보상이 기다려요"
 */
export const MOTIVATION_MESSAGES = {
  // Near-miss 효과 (거의 달성) - 구체적 숫자와 진행률 강조
  nearMiss: [
    "✨ 딱 {points}점만 더! 거의 다 왔어요!",
    "🎯 {percent}% 완료! 마지막 스퍼트!",
    "💪 {remaining}점이면 레벨업! 포기하기엔 너무 아까워요!",
    "🌟 오늘 하루만 더 하면 달성이에요!",
    "🏃 결승선이 눈앞이에요! 조금만 더!",
  ],
  // 손실 회피 (스트릭 보호) - 구체적 손실 명시
  lossAversion: [
    "🔥 {streak}일 연속 기록이 자정에 끊겨요!",
    "⚠️ 오늘 활동 없으면 {bonus}% 보너스가 사라져요",
    "😢 {days}일간 쌓아온 {points}점 보너스가 위험해요",
    "⏰ 남은 시간 {hours}시간! 스트릭을 지켜주세요",
    "💔 지금까지의 노력 {streak}일치가 물거품이 돼요",
  ],
  // 사회적 증거 - 구체적 숫자로 신뢰성
  socialProof: [
    "📊 오늘 {count}명이 이 미션을 완료했어요",
    "🏆 상위 {percent}%의 독서가들과 함께해요!",
    "👥 지금 이 순간 {active}명이 함께 읽고 있어요",
    "🌳 우리 모임 {groupCount}명 중 {completed}명 완료!",
    "📈 이번 주 평균 {avg}점! 당신은 {your}점이에요",
  ],
  // 성취감 - 구체적 칭찬과 성장 강조
  achievement: [
    "🎉 대단해요! {streak}일 연속 성공!",
    "💎 꾸준함이 만든 {total}점의 성장!",
    "🌟 오늘도 한 걸음 더! 레벨 {level}까지 {percent}%!",
    "🏅 이번 달 {rank}번째로 열심히 하고 있어요!",
    "✨ {days}일 전보다 {growth}% 성장했어요!",
  ],
  // 보너스 오픈 - 희소성과 기대감
  bonusUnlock: [
    "🎁 보너스 미션 해금! 최대 {max}점 획득 가능!",
    "✨ 오늘만 열리는 특별 보상이에요!",
    "🎰 럭키박스 등장! 최대 {lucky}점의 기회!",
    "🌈 레어 미션 발견! {rarity} 등급이에요!",
    "⭐ VIP 미션 개방! {time}분 안에 도전하세요!",
  ],
  // 레벨업 축하 - Peak Experience
  levelUp: [
    "🎊 축하해요! {prev}에서 {next}(으)로 성장했어요!",
    "🌳 당신의 나무가 한 단계 더 자랐어요!",
    "✨ 새로운 {bonus}% 보너스 배율이 적용돼요!",
    "🏆 전체 사용자 중 상위 {percent}%에 진입!",
  ],
  // 복귀 유도 (3일+ 미접속)
  winback: [
    "🌱 당신의 나무가 기다리고 있어요...",
    "📚 {days}일 전에 읽던 '{book}'이 그리워해요",
    "🔥 스트릭은 끊겼지만, 다시 시작할 수 있어요!",
    "🎁 돌아온 기념 보너스 {bonus}점이 기다려요!",
  ],
};
