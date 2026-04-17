/**
 * AI 기능 사용 전 사전 가드.
 * 추천·리포트 등 의미 있는 AI 결과를 내려면 최소한의 사용자 활동 데이터가 필요하다.
 *
 *   const check = canRequestRecommendation({ completedBooks: 2 });
 *   if (!check.allowed) {
 *     // check.reason: "NOT_ENOUGH_BOOKS"
 *     // check.progress.current / check.progress.required
 *   }
 */

export const AI_RECOMMENDATION_MIN_BOOKS = 5;
export const AI_REPORT_MIN_NOTES = 3;

export interface GuardProgress {
  current: number;
  required: number;
  percent: number;
}

export interface GuardResult<E extends string = string> {
  allowed: boolean;
  reason?: E;
  progress?: GuardProgress;
  /** 한국어 안내 메시지 */
  message?: string;
}

function clampPercent(current: number, required: number): number {
  if (required <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((current / required) * 100)));
}

/**
 * AI 책 추천을 요청할 수 있는지 확인.
 * 기준: 완독 책 5권 이상.
 */
export function canRequestRecommendation(context: {
  completedBooks: number;
}): GuardResult<"NOT_ENOUGH_BOOKS"> {
  const { completedBooks } = context;
  if (completedBooks >= AI_RECOMMENDATION_MIN_BOOKS) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "NOT_ENOUGH_BOOKS",
    progress: {
      current: completedBooks,
      required: AI_RECOMMENDATION_MIN_BOOKS,
      percent: clampPercent(completedBooks, AI_RECOMMENDATION_MIN_BOOKS),
    },
    message: `AI 추천을 위해 책 ${AI_RECOMMENDATION_MIN_BOOKS}권 완독이 필요해요. 현재 ${completedBooks}/${AI_RECOMMENDATION_MIN_BOOKS}권.`,
  };
}

/**
 * AI 독서 리포트 생성이 의미 있으려면 최소 기록 수가 필요.
 */
export function canRequestReport(context: {
  noteCount: number;
}): GuardResult<"NOT_ENOUGH_NOTES"> {
  const { noteCount } = context;
  if (noteCount >= AI_REPORT_MIN_NOTES) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "NOT_ENOUGH_NOTES",
    progress: {
      current: noteCount,
      required: AI_REPORT_MIN_NOTES,
      percent: clampPercent(noteCount, AI_REPORT_MIN_NOTES),
    },
    message: `리포트 생성을 위해 기록 ${AI_REPORT_MIN_NOTES}개 이상이 필요해요. 현재 ${noteCount}/${AI_REPORT_MIN_NOTES}개.`,
  };
}
