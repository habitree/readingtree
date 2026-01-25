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
 * 레벨별 나무 성장 단계 정의
 * 미술/디자인 관점: 자연스러운 색상 전환, 성장의 시각적 표현
 */
export const TREE_GROWTH_STAGES: Record<number, TreeGrowthStage> = {
  1: {
    level: 1,
    name: "씨앗",
    description: "작은 씨앗에서 시작되는 여정",
    height: 10,
    hasLeaves: false,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#8B5A2B",
    leafColor: "#90EE90",
    glowEffect: false,
    particleEffect: "none",
  },
  2: {
    level: 2,
    name: "새싹",
    description: "땅을 뚫고 나온 작은 새싹",
    height: 20,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#8B5A2B",
    leafColor: "#98FB98",
    glowEffect: false,
    particleEffect: "none",
  },
  3: {
    level: 3,
    name: "어린 나무",
    description: "조금씩 자라나는 어린 나무",
    height: 35,
    hasLeaves: true,
    hasFlowers: false,
    hasFruits: false,
    trunkColor: "#A0522D",
    leafColor: "#32CD32",
    glowEffect: false,
    particleEffect: "subtle",
  },
  4: {
    level: 4,
    name: "청년 나무",
    description: "힘차게 성장하는 나무",
    height: 50,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: false,
    trunkColor: "#8B4513",
    leafColor: "#228B22",
    glowEffect: false,
    particleEffect: "subtle",
  },
  5: {
    level: 5,
    name: "성숙한 나무",
    description: "풍성한 잎을 가진 나무",
    height: 65,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: false,
    trunkColor: "#654321",
    leafColor: "#006400",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  6: {
    level: 6,
    name: "열매 나무",
    description: "첫 열매를 맺기 시작한 나무",
    height: 75,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#5D4037",
    leafColor: "#2E7D32",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  7: {
    level: 7,
    name: "고목",
    description: "깊은 지혜를 품은 나무",
    height: 85,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#4E342E",
    leafColor: "#1B5E20",
    glowEffect: true,
    particleEffect: "sparkle",
  },
  8: {
    level: 8,
    name: "신비의 나무",
    description: "신비로운 기운을 뿜는 나무",
    height: 92,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#3E2723",
    leafColor: "#00695C",
    glowEffect: true,
    particleEffect: "magical",
  },
  9: {
    level: 9,
    name: "세계수",
    description: "세상의 지혜를 담은 거대한 나무",
    height: 97,
    hasLeaves: true,
    hasFlowers: true,
    hasFruits: true,
    trunkColor: "#2C1810",
    leafColor: "#004D40",
    glowEffect: true,
    particleEffect: "magical",
  },
  10: {
    level: 10,
    name: "전설의 나무",
    description: "전설 속에서만 존재하던 황금빛 나무",
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
 */
export const WATERING_CONFIG = {
  cooldownHours: 3,                    // 쿨다운 시간 (3시간)
  basePoints: 3,                       // 기본 포인트
  maxPoints: 8,                        // 최대 포인트 (가변 보상)
  luckyDropChance: 0.1,                // 럭키 드롭 확률 (10%)
  luckyDropMultiplier: 3,              // 럭키 드롭 배수
  maxDailyWaterings: 8,                // 일일 최대 물주기 횟수
  healthDecayPerHour: 2,               // 시간당 건강도 감소
  healthRecoveryPerWatering: 15,       // 물주기당 건강도 회복
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
  // 보너스 오픈
  bonusUnlock: [
    "🎉 보너스 미션이 열렸어요!",
    "✨ 특별 보상을 받을 수 있어요!",
    "🎁 추가 미션에 도전해보세요!",
  ],
};
