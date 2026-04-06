/**
 * 다회독 유틸리티
 * completed_dates JSONB를 파싱하여 회독 사이클을 추출하고
 * 노트를 회독별로 분배합니다.
 */

import type { NoteWithBook } from "@/types/note";
import type { ReadingCycle } from "@/types/ai/report-template";

/**
 * completed_dates를 안전하게 파싱
 * DB에서 string | string[] | null 형태로 올 수 있음
 */
export function parseCompletedDates(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((d): d is string => typeof d === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((d): d is string => typeof d === "string");
    } catch {
      // not JSON
    }
  }
  return [];
}

/**
 * 회독 사이클 추출
 * completed_dates와 started_at으로 각 회독의 시작/종료 구간을 생성
 */
export function getReadingCycles(
  completedDates: string[],
  startedAt: string | null
): Omit<ReadingCycle, "noteCount">[] {
  if (completedDates.length === 0 && !startedAt) return [];

  const sorted = [...completedDates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const cycles: Omit<ReadingCycle, "noteCount">[] = [];

  // 첫 번째 회독: started_at ~ sorted[0]
  if (sorted.length > 0) {
    cycles.push({
      readingNumber: 1,
      startDate: startedAt,
      endDate: sorted[0],
    });
  } else {
    // 완독 기록 없이 현재 읽는 중
    cycles.push({
      readingNumber: 1,
      startDate: startedAt,
      endDate: null,
    });
    return cycles;
  }

  // 2회독 이후: sorted[i-1] ~ sorted[i]
  for (let i = 1; i < sorted.length; i++) {
    cycles.push({
      readingNumber: i + 1,
      startDate: sorted[i - 1],
      endDate: sorted[i],
    });
  }

  // 현재 진행 중인 회독 (마지막 완독 이후)
  // 이 함수는 상태와 관계없이 구간만 생성, 호출자가 판단
  return cycles;
}

/**
 * 노트를 회독별로 분배
 * note.created_at을 기준으로 해당하는 회독 구간에 할당
 * 구간 밖의 노트는 가장 가까운 완료된 회독에 할당
 */
export function assignNotesToReadings(
  notes: NoteWithBook[],
  cycles: Omit<ReadingCycle, "noteCount">[]
): Map<number, NoteWithBook[]> {
  const result = new Map<number, NoteWithBook[]>();

  if (cycles.length === 0) return result;

  // 초기화
  for (const cycle of cycles) {
    result.set(cycle.readingNumber, []);
  }

  for (const note of notes) {
    const noteTime = new Date(note.created_at).getTime();
    let assigned = false;

    for (const cycle of cycles) {
      const start = cycle.startDate ? new Date(cycle.startDate).getTime() : -Infinity;
      const end = cycle.endDate ? new Date(cycle.endDate).getTime() : Infinity;

      if (noteTime >= start && noteTime <= end) {
        result.get(cycle.readingNumber)!.push(note);
        assigned = true;
        break;
      }
    }

    // 구간 밖 노트: 가장 마지막 회독에 할당
    if (!assigned) {
      const lastCycle = cycles[cycles.length - 1];
      result.get(lastCycle.readingNumber)!.push(note);
    }
  }

  return result;
}

/**
 * 다회독 여부 판단
 * completed_dates >= 2 또는 (completed_dates >= 1 AND status === "rereading")
 */
export function isMultiReading(completedDates: string[], status: string): boolean {
  if (completedDates.length >= 2) return true;
  if (completedDates.length >= 1 && status === "rereading") return true;
  return false;
}

/**
 * 다회독 시 노트를 비례 배분하여 제한
 * 총 maxNotes를 회독 수에 따라 균등 분배
 */
export function limitNotesByReading(
  notesByReading: Map<number, NoteWithBook[]>,
  maxNotes: number
): Map<number, NoteWithBook[]> {
  const readingCount = notesByReading.size;
  if (readingCount === 0) return notesByReading;

  const perReading = Math.floor(maxNotes / readingCount);
  const remainder = maxNotes % readingCount;
  const result = new Map<number, NoteWithBook[]>();

  let idx = 0;
  for (const [readingNum, notes] of notesByReading) {
    const limit = perReading + (idx < remainder ? 1 : 0);
    // 최근 노트 우선
    result.set(readingNum, notes.slice(-limit));
    idx++;
  }

  return result;
}
