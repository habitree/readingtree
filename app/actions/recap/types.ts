/**
 * 월간 독서결산(Monthly Reading Recap) 공용 타입.
 *
 * "use server" 없는 순수 타입 모듈 — 서버 액션과 클라이언트 컴포넌트 양쪽에서 import.
 * compute.ts가 생성하고, monthly_recaps.stats / highlights JSONB 컬럼에 동결 저장된다.
 */

/** 기록 타입별 카운트 (notes.type) */
export interface RecapNotesByType {
  transcription: number;
  photo: number;
  memo: number;
  quote: number;
  progress: number;
}

/** 전월 대비 증감 (양수=증가) */
export interface RecapVsPrev {
  notesDelta: number;
  secondsDelta: number;
  booksDelta: number;
}

/** 연간 목표 진행도 (getGoalProgress 기반) */
export interface RecapGoal {
  /** 연간 목표 권수 (0이면 미설정) */
  target: number;
  /** 올해 누적 완독 권수 */
  completedYTD: number;
  /** 달성률 0~100 */
  progress: number;
}

/** 결산 핵심 수치 — monthly_recaps.stats */
export interface RecapStats {
  totalNotes: number;
  notesByType: RecapNotesByType;
  totalReadingSeconds: number;
  totalPages: number;
  sessionCount: number;
  completedBooks: number;
  /** 그 달에 한 번이라도 기록한 책 종수 */
  booksTouched: number;
  /** 기록한 날 수 */
  activeDays: number;
  /** 그 달 내 최대 연속 기록일 */
  maxStreakInMonth: number;
  /** 현재(전체) 연속 기록일 — getStreakAndTodayData */
  currentStreak: number;
  vsPrev: RecapVsPrev;
  goal: RecapGoal;
}

export interface RecapTopBook {
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  noteCount: number;
}

export interface RecapBadge {
  /** 안정적 식별자 — 예: "streak_14", "books_5", "new_explorer" */
  key: string;
  /** 표시 라벨 (이미 번역된 한국어) */
  label: string;
  /** 이모지 또는 아이콘 키 */
  icon: string;
}

/** 결산 하이라이트 — monthly_recaps.highlights */
export interface RecapHighlights {
  /** 규칙 기반 독서 페르소나 타이틀 — 예: "몰입형 심야 탐독가" */
  personaTitle: string;
  topBook: RecapTopBook | null;
  mostReadAuthor: { name: string; noteCount: number } | null;
  longestSession: { bookTitle: string; minutes: number } | null;
  busiestDay: { dateKey: string; count: number } | null;
  /** 완독 책 표지 URL (카드/OG용, 최대 5장) */
  completedCovers: string[];
  memorableQuote: { text: string; bookTitle: string } | null;
  badges: RecapBadge[];
}

/** computeMonthlyRecap 출력 */
export interface RecapComputed {
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  /** 기록·세션·완독 모두 0 → 빈 달 (공유 비활성) */
  isEmpty: boolean;
}

/** monthly_recaps 한 행을 표현하는 DB 레코드 */
export interface RecapRecord {
  id: string;
  userId: string;
  shareId: string;
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  aiCaption: string | null;
  isPublic: boolean;
  shareVersion: number;
  generatedAt: string;
}

/** 월간 "읽은 책" 대시보드의 책 한 권 (라이브 쿼리, 스냅샷 미저장) */
export interface MonthlyBookItem {
  /** /books/{userBookId} 링크용 (없으면 bookId 폴백) */
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
  currentPage: number | null;
  /** user_books.status */
  status: string;
  /** completed_at가 그 달 범위 안 */
  completedInMonth: boolean;
  noteCount: number;
  readingSeconds: number;
  pagesRead: number;
  /** 정렬용 ISO (note/log/완독 중 최신) */
  lastActiveAt: string;
  /** 대표 인용/메모 발췌 */
  excerpt: string | null;
  /** current/total (0~100) */
  progressPercent: number | null;
}

/** getMonthlyBooksList 결과 */
export interface MonthlyBooksResult {
  year: number;
  month: number;
  totalBooks: number;
  completedCount: number;
  totalReadingSeconds: number;
  /** 완독 우선 → lastActive 내림차순 */
  books: MonthlyBookItem[];
  isGuest: boolean;
}

/** 공유 다이얼로그 / 공개 페이지용 데이터 (스탬프 StampShareData 미러) */
export interface RecapShareData {
  shareId: string;
  userId: string;
  isPublic: boolean;
  shareVersion: number;
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  aiCaption: string | null;
  profile: {
    name: string | null;
    avatarUrl: string | null;
  } | null;
}
