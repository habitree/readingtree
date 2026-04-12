/**
 * 디자인 토큰 - 일관된 UI를 위한 CSS 클래스 상수
 *
 * 모든 페이지와 컴포넌트에서 이 토큰을 사용하여 일관성을 유지합니다.
 */

// ============================================================================
// 폼 요소 높이 (Form Element Heights)
// ============================================================================
export const formHeights = {
  /** 기본 입력 필드 높이 (모바일: h-10, 데스크톱: h-11) */
  input: "h-10 sm:h-11",
  /** 컴팩트 입력 필드 높이 */
  inputCompact: "h-9",
  /** 버튼 높이 (기본) */
  button: "h-10 sm:h-11",
  /** 버튼 높이 (컴팩트) */
  buttonCompact: "h-9",
  /** 아이콘 버튼 높이 */
  iconButton: "h-9 w-9 sm:h-10 sm:w-10",
  /** 삭제 버튼 높이 (작은 아이콘) */
  deleteButton: "h-7 w-7",
} as const;

// ============================================================================
// 간격 (Spacing)
// ============================================================================
export const spacing = {
  /** 페이지 섹션 간격 */
  pageSection: "space-y-4 sm:space-y-6",
  /** 페이지 섹션 간격 (넓음) */
  pageSectionWide: "space-y-6 sm:space-y-8",
  /** 카드 내부 간격 */
  cardContent: "p-3 sm:p-4",
  /** 폼 필드 간격 */
  formField: "space-y-4",
  /** 리스트 아이템 간격 */
  listItem: "gap-3 sm:gap-4",
  /** 그리드 간격 */
  grid: "gap-3 sm:gap-4",
} as const;

// ============================================================================
// 페이지 타이틀 (Page Titles)
// ============================================================================
export const typography = {
  /** 페이지 메인 제목 */
  pageTitle: "text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight",
  /** 페이지 서브 제목 (섹션) */
  sectionTitle: "text-lg sm:text-xl font-semibold tracking-tight",
  /** 카드 제목 */
  cardTitle: "text-base sm:text-lg font-medium",
  /** 페이지 설명 */
  pageDescription: "text-sm text-muted-foreground",
  /** 라벨 */
  label: "text-sm font-medium",
  /** 작은 텍스트 */
  small: "text-xs sm:text-sm",
  /** 매우 작은 텍스트 */
  tiny: "text-[10px] sm:text-xs",
  /** 도움말 텍스트 */
  helper: "text-xs text-muted-foreground",
  /** 에러 텍스트 */
  errorText: "text-xs text-destructive font-medium",
  /** 링크 텍스트 */
  link: "text-primary hover:underline underline-offset-4",
} as const;

// ============================================================================
// 그리드 레이아웃 (Grid Layouts)
// ============================================================================
export const grids = {
  /** 책 목록 그리드 (모바일 4열, PC 8열) */
  bookList: "grid grid-cols-4 gap-1.5 sm:gap-2 md:grid-cols-6 lg:grid-cols-8",
  /** 노트 목록 그리드 */
  noteList: "grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3",
  /** 검색 결과 그리드 */
  searchResults: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
  /** 2열 그리드 (반응형) */
  twoCol: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  /** 3열 그리드 (반응형) */
  threeCol: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  /** 그룹 공유서재 그리드 (모바일 3열, PC 5열 — 사이드바 고려) */
  groupBookGrid: "grid grid-cols-4 gap-1.5 sm:gap-2 md:grid-cols-6 lg:grid-cols-8",
} as const;

// ============================================================================
// 아이콘 크기 (Icon Sizes)
// ============================================================================
export const iconSizes = {
  /** 작은 아이콘 (라벨 옆) */
  sm: "w-3.5 h-3.5",
  /** 기본 아이콘 */
  md: "w-4 h-4",
  /** 중간 아이콘 (버튼 내) */
  lg: "w-5 h-5",
  /** 큰 아이콘 (빈 상태) */
  xl: "w-8 h-8 sm:w-10 sm:h-10",
} as const;

// ============================================================================
// 카드 스타일 (Card Styles)
// ============================================================================
export const cardStyles = {
  /** 기본 카드 호버 */
  hover: "hover:shadow-md transition-shadow duration-200",
  /** 선택 가능한 카드 */
  selectable: "hover:shadow-md transition-shadow duration-200 cursor-pointer",
  /** 심플 카드 (기록 목록용) */
  simple: "border-border/40 hover:shadow-md transition-shadow",
  /** 심플 카드 draft */
  simpleDraft: "border-dashed border-amber-300/40 dark:border-amber-700/30 hover:shadow-md transition-shadow",
  /** 강조 카드 (게스트 안내 등) */
  highlight: "border-primary/20 bg-primary/5",
  /** 에러 카드 */
  error: "border-destructive/20 bg-destructive/5",
} as const;

// ============================================================================
// 섹션 배경 (Section Backgrounds)
// ============================================================================
export const backgrounds = {
  /** 구절 입력 영역 */
  quote: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/30",
  /** 메모 입력 영역 */
  memo: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-900/30",
  /** 이미지 업로드 영역 */
  upload: "bg-slate-50/80 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-700/30",
  /** 필사 버튼 */
  transcription: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
  /** 사진 버튼 */
  photo: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
} as const;

// ============================================================================
// 그림자/높이감 (Elevation)
// ============================================================================
export const elevation = {
  /** 그림자 없음 */
  none: "shadow-none",
  /** 아주 약한 그림자 (버튼 기본) */
  xs: "shadow-sm",
  /** 기본 그림자 (카드 기본) */
  sm: "shadow-md",
  /** 중간 그림자 (카드 호버) */
  md: "shadow-lg",
  /** 큰 그림자 (모달, 드롭다운) */
  lg: "shadow-xl",
  /** 최대 그림자 (풀스크린 오버레이) */
  xl: "shadow-2xl",
} as const;

// ============================================================================
// 테두리 둥글기 (Border Radius)
// ============================================================================
export const radius = {
  /** 둥글기 없음 */
  none: "rounded-none",
  /** 작은 둥글기 (버튼, 배지) */
  sm: "rounded-md",
  /** 기본 둥글기 (카드, 입력 필드) */
  md: "rounded-lg",
  /** 큰 둥글기 (모달) */
  lg: "rounded-xl",
  /** 완전 둥글기 (아바타) */
  full: "rounded-full",
} as const;

// ============================================================================
// 트랜지션 (Transition) - 성능 최적화: 명시적 속성만 전환
// ============================================================================
export const transition = {
  /** 빠른 전환 (150ms) - 호버, 포커스 */
  fast: "transition-[transform,opacity] duration-150 ease-out",
  /** 기본 전환 (200ms) - 카드 호버, 버튼 */
  base: "transition-[transform,opacity,box-shadow] duration-200 ease-in-out",
  /** 느린 전환 (300ms) - 모달, 패널 */
  slow: "transition-[transform,opacity] duration-300 ease-in-out",
  /** 색상 전환 (200ms) - 테마 변경 */
  colors: "transition-colors duration-200 ease-in-out",
} as const;

// ============================================================================
// Z-Index 레이어
// ============================================================================
export const zIndex = {
  /** 기본 레이어 */
  base: "z-0",
  /** 드롭다운 */
  dropdown: "z-10",
  /** 스티키 헤더 */
  sticky: "z-20",
  /** 오버레이 배경 */
  overlay: "z-40",
  /** 모달 */
  modal: "z-50",
  /** 토스트 알림 */
  toast: "z-[60]",
} as const;

// ============================================================================
// 복합 스타일 헬퍼 (Composite Style Helpers)
// ============================================================================

/**
 * 페이지 컨테이너 스타일
 */
export const pageContainer = "container max-w-5xl mx-auto px-2 sm:px-4";

/**
 * 메인 콘텐츠 영역 (사이드바 고려)
 */
export const mainContent = "lg:pl-64";

/**
 * 섹션 카드 스타일
 */
export const sectionCard = (bg: keyof typeof backgrounds) =>
  `p-3 rounded-lg border ${backgrounds[bg]}`;

// ============================================================================
// 반응형 클래스 헬퍼 (Responsive Class Helpers)
// ============================================================================

/**
 * 모바일에서만 표시
 */
export const mobileOnly = "sm:hidden";

/**
 * 데스크톱에서만 표시
 */
export const desktopOnly = "hidden sm:block";

/**
 * PC(lg)에서만 표시
 */
export const pcOnly = "hidden lg:block";

/**
 * 모바일에서 숨김 (PC에서 표시)
 */
export const hiddenOnMobile = "hidden sm:flex";
