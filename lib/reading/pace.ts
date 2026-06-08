/**
 * 독서 페이스(페이지당 시간) 계산·표기 — 단일 출처(SSOT).
 *
 * "페이지당 평균 초"를 가중 집계로 산출한다:
 *   pacePerPageSeconds = Σ(적격 세션 시간) / Σ(적격 세션 읽은 페이지)
 *
 * 세션별 pace 단순 평균이 아니라 Σ/Σ 가중 평균을 쓰는 이유는,
 * 짧은 세션을 과대평가하지 않고 통계적으로 올바른 "페이지당 시간"을 얻기 위함.
 *
 * 순수 모듈 — DB 접근 없음. 서버(app/actions)·클라이언트(컴포넌트) 양쪽에서 import.
 * 데이터는 이미 fetch한 reading_logs 행을 그대로 사용한다(추가 쿼리 없음).
 */

/** 페이스 집계용 세션(reading_logs) 행(최소 필드) */
export interface PaceLog {
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
}

export interface PaceResult {
  /** 페이지당 평균 초. 적격 세션이 없으면 null */
  pacePerPageSeconds: number | null;
  /** 적격 세션의 읽은 페이지 합(Σ end_page - start_page) */
  pagesRead: number;
  /** 적격 세션의 시간 합(초) */
  pacedSeconds: number;
  /** 페이스 집계에 포함된 세션 수 */
  sessionCount: number;
}

/**
 * 적격 세션 판정 — 페이지 구간과 시간이 모두 양수여야 페이스 대상.
 * reading-pace-panel의 기존 필터와 동일 기준.
 */
function isPaced(log: PaceLog): boolean {
  return (
    log.start_page != null &&
    log.end_page != null &&
    log.end_page - log.start_page > 0 &&
    (log.reading_duration_seconds ?? 0) > 0
  );
}

/** reading_logs 행 묶음 → 가중 페이스. 적격 세션 없으면 pacePerPageSeconds=null */
export function computePace(logs: PaceLog[]): PaceResult {
  let pagesRead = 0;
  let pacedSeconds = 0;
  let sessionCount = 0;

  for (const log of logs) {
    if (!isPaced(log)) continue;
    pagesRead += log.end_page! - log.start_page!;
    pacedSeconds += log.reading_duration_seconds!;
    sessionCount += 1;
  }

  return {
    pacePerPageSeconds: pagesRead > 0 ? pacedSeconds / pagesRead : null,
    pagesRead,
    pacedSeconds,
    sessionCount,
  };
}

/** 페이지당 평균을 사람이 읽는 표기로 ("38초" / "1분 12초") */
export function formatPacePerPage(secondsPerPage: number): string {
  const s = Math.round(secondsPerPage);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}분 ${rem}초` : `${m}분`;
}

/** 남은 페이지 × 페이지당 초 → 예상 소요 초 */
export function estimateRemainingSeconds(
  remainingPages: number,
  pacePerPageSeconds: number,
): number {
  return Math.round(Math.max(0, remainingPages) * pacePerPageSeconds);
}
