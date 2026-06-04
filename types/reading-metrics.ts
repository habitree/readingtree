/**
 * 독서 3축 공용 타입 (A5).
 *
 * 기획서 v2(§3)의 3축 모델을 코드 어휘로 고정한다 —
 *   ⏱ ReadingTime(독서시간) · 📊 ReadingProgress(읽기진행률) · 🧭 ReadingJourney(여정).
 * 집계 코어(A3 `lib/reading/metrics.ts`)와 3축 통합 뷰(C8)가 이 타입을 공유한다.
 *
 * 순수 타입 모듈 — 서버·클라이언트 양쪽 import.
 */

/** ⏱ 독서시간 축 — "얼마나 오래" */
export interface ReadingTimeMetrics {
  /** 누적 독서 시간(초) */
  totalSeconds: number;
  /** 세션 수 */
  sessionCount: number;
  /** 세션당 평균(초). sessionCount=0이면 0 */
  avgSeconds: number;
}

/** 📊 읽기진행률 축 — "어디까지" */
export interface ReadingProgressMetrics {
  currentPage: number | null;
  totalPages: number | null;
  /** 0~100. totalPages 없으면 null */
  percent: number | null;
}

/** 🧭 여정 축 — 진행률 변화의 한 점 */
export interface ReadingJourneyPoint {
  /** KST 날짜키 "YYYY-MM-DD" */
  dateKey: string;
  page: number | null;
  kind: "progress" | "completed" | "session";
  note?: string | null;
}

/** 기간 집계 공통(A3 코어 출력) — 라이브·스냅샷 공유 */
export interface ReadingMetrics {
  range: { startISO: string; endISO: string };
  /** 기록(notes) 총수 */
  notes: number;
  /** notes.type별 카운트 */
  notesByType: Record<string, number>;
  time: ReadingTimeMetrics;
  /** 읽은 페이지 합(Σ end_page - start_page) */
  pages: number;
  /** 완독 권수 */
  completedBooks: number;
  /** 기록한 책 종수 */
  booksTouched: number;
  /** 기록한 날 수 */
  activeDays: number;
  /** 현재(전체) 연속 기록일 */
  currentStreak: number;
  /** 기간 내 최대 연속 기록일 */
  maxStreak: number;
}
