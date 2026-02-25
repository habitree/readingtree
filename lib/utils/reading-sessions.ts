import type { NoteWithBook } from "@/types/note";

export interface ReadingSession {
  sessionNumber: number;
  startDate: string;
  endDate: string | null;
  completedDate: string | null;
  durationDays: number;
  isCurrentSession: boolean;
  notes: NoteWithBook[];
  maxPageInSession: number | null;
  avgPagesPerDay: number | null;
}

interface UserBookSessionData {
  started_at: string;
  status: string;
  current_page: number | null;
  completedDates: string[];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(1, Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24)));
}

/**
 * UserBook 데이터와 진행 기록으로 회독 세션 목록을 계산
 *
 * 세션 경계:
 * - 1회독: started_at → completed_dates[0] (또는 현재)
 * - 2회독: completed_dates[0]+1일 → completed_dates[1] (또는 현재)
 * - N회독: completed_dates[N-2]+1일 → completed_dates[N-1] (또는 현재)
 */
export function deriveReadingSessions(
  data: UserBookSessionData,
  totalPages: number | null,
  progressNotes: NoteWithBook[]
): ReadingSession[] {
  const { started_at, status, current_page, completedDates } = data;

  if (!started_at) return [];

  const isActiveReading =
    status === "reading" || status === "rereading" || status === "paused";

  const sortedCompletedDates = [...completedDates].sort();
  const numSessions =
    sortedCompletedDates.length + (isActiveReading ? 1 : 0);

  // 완독이지만 completed_dates 없는 레거시 케이스
  if (numSessions === 0 && status === "completed") {
    return [
      {
        sessionNumber: 1,
        startDate: started_at,
        endDate: null,
        completedDate: null,
        durationDays: daysBetween(started_at, new Date().toISOString()),
        isCurrentSession: false,
        notes: progressNotes,
        maxPageInSession: totalPages,
        avgPagesPerDay: null,
      },
    ];
  }

  if (numSessions === 0) return [];

  const now = new Date().toISOString();

  return Array.from({ length: numSessions }, (_, i) => {
    const sessionNumber = i + 1;
    const isCurrentSession = isActiveReading && i === numSessions - 1;
    const completedDate =
      !isCurrentSession && i < sortedCompletedDates.length
        ? sortedCompletedDates[i]
        : null;

    // 세션 시작일
    let startDate: string;
    if (i === 0) {
      startDate = started_at;
    } else {
      const prev = new Date(sortedCompletedDates[i - 1]);
      prev.setDate(prev.getDate() + 1);
      prev.setHours(0, 0, 0, 0);
      startDate = prev.toISOString();
    }

    const endDate = completedDate ?? null;
    const effectiveEnd = endDate ?? now;
    const durationDays = daysBetween(startDate, effectiveEnd);

    // 이 세션에 속하는 기록 필터
    const sessionStartDate = new Date(startDate);
    sessionStartDate.setHours(0, 0, 0, 0);
    const sessionEndDate = endDate
      ? (() => {
          const d = new Date(endDate);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : null;

    const sessionNotes = progressNotes.filter((note) => {
      const noteDate = new Date(note.created_at);
      if (noteDate < sessionStartDate) return false;
      if (sessionEndDate && noteDate > sessionEndDate) return false;
      return true;
    });

    // 세션 최대 페이지
    let maxPageInSession: number | null = null;
    for (const note of sessionNotes) {
      if (note.page_number) {
        const p = parseInt(note.page_number, 10);
        if (!isNaN(p)) {
          maxPageInSession = Math.max(maxPageInSession ?? 0, p);
        }
      }
    }

    // 완독 세션은 totalPages 사용
    if (!isCurrentSession && totalPages) {
      maxPageInSession = totalPages;
    }

    // 현재 세션은 current_page 반영
    if (isCurrentSession && current_page) {
      maxPageInSession = Math.max(maxPageInSession ?? 0, current_page);
    }

    const avgPagesPerDay =
      maxPageInSession && durationDays > 0
        ? parseFloat((maxPageInSession / durationDays).toFixed(1))
        : null;

    return {
      sessionNumber,
      startDate,
      endDate,
      completedDate,
      durationDays,
      isCurrentSession,
      notes: sessionNotes,
      maxPageInSession,
      avgPagesPerDay,
    };
  });
}
