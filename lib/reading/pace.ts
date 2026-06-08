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

// =============================================================================
// 로버스트 페이스 — 잘못된 시간/페이지 세션이 평균을 왜곡하지 않도록 자동 정제
// =============================================================================

/** 세션이 페이스 집계에서 제외된 사유 */
export type ExclusionReason =
  | "not_paced" // 페이지 구간/시간 미충족(시간만 기록 등)
  | "below_min" // 페이지당 시간이 비현실적으로 짧음(오기록)
  | "above_max" // 페이지당 시간이 과다(타이머 켜둠 의심)
  | "mad_outlier"; // 통계적 이상치(median ± k·MAD 밖)

export interface PaceConstants {
  /** 이 값 미만 초/페이지는 비현실 → 제외 */
  minSecPerPage: number;
  /** 이 값 초과 초/페이지는 타이머 과다 의심 → 제외 */
  maxSecPerPage: number;
  /** MAD 밴드 폭 (median ± k·MAD) */
  madK: number;
  /** MAD 단계를 적용할 최소 표본 수(미만이면 생략) */
  minSamplesForMad: number;
  /** MAD=0(동일값 다수)일 때 0 제외 방지용 하한 초 */
  madFloorSec: number;
}

export const DEFAULT_PACE_CONSTANTS: PaceConstants = {
  minSecPerPage: 3,
  maxSecPerPage: 1800, // 30분/페이지
  madK: 3.5,
  minSamplesForMad: 5,
  madFloorSec: 5,
};

export interface RobustPaceResult extends PaceResult {
  /** 제외된 세션 수(하드범위 + MAD). not_paced는 포함 안 함 */
  excludedCount: number;
  /** 제외된 적격후보 세션의 사유 모음 */
  excluded: { perPage: number; reason: ExclusionReason }[];
  constants: PaceConstants;
}

/** 숫자 배열 중앙값 (비파괴) */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 세션 1건 분류 — UI 투명 표시(배지)·집계 공용.
 * ctx(중앙값·MAD)가 주어지면 MAD 단계까지, 없으면 하드범위까지만 판정.
 */
export function classifyPaceSession(
  log: PaceLog,
  ctx?: { medianPerPage: number; mad: number; constants?: PaceConstants },
): { eligible: boolean; perPage: number | null; reason: ExclusionReason | null } {
  if (!isPaced(log)) {
    return { eligible: false, perPage: null, reason: "not_paced" };
  }
  const c = ctx?.constants ?? DEFAULT_PACE_CONSTANTS;
  const perPage = log.reading_duration_seconds! / (log.end_page! - log.start_page!);

  if (perPage < c.minSecPerPage) return { eligible: false, perPage, reason: "below_min" };
  if (perPage > c.maxSecPerPage) return { eligible: false, perPage, reason: "above_max" };

  if (ctx) {
    const band = Math.max(ctx.mad, c.madFloorSec) * c.madK;
    if (band > 0 && Math.abs(perPage - ctx.medianPerPage) > band) {
      return { eligible: false, perPage, reason: "mad_outlier" };
    }
  }
  return { eligible: true, perPage, reason: null };
}

/**
 * 세션 목록을 한 번에 분류 — 입력 순서대로 사유 배열 반환(헤드라인과 동일 기준).
 * UI 배지/투명 표시용. null이면 평균에 사용된 세션.
 */
export function classifyPaceSessions(
  logs: PaceLog[],
  constants: Partial<PaceConstants> = {},
): (ExclusionReason | null)[] {
  const c = { ...DEFAULT_PACE_CONSTANTS, ...constants };

  const perPages = logs.map((l) =>
    isPaced(l) ? l.reading_duration_seconds! / (l.end_page! - l.start_page!) : null,
  );
  const hardPass: number[] = [];
  for (const p of perPages) {
    if (p != null && p >= c.minSecPerPage && p <= c.maxSecPerPage) hardPass.push(p);
  }

  let med = 0;
  let band = 0;
  const useMad = hardPass.length >= c.minSamplesForMad;
  if (useMad) {
    med = median(hardPass);
    const mad = median(hardPass.map((x) => Math.abs(x - med)));
    band = Math.max(mad, c.madFloorSec) * c.madK;
  }

  return perPages.map((p) => {
    if (p == null) return "not_paced";
    if (p < c.minSecPerPage) return "below_min";
    if (p > c.maxSecPerPage) return "above_max";
    if (useMad && band > 0 && Math.abs(p - med) > band) return "mad_outlier";
    return null;
  });
}

/**
 * 로버스트 페이스 — 2단계(하드 타당범위 → 표본≥N시 MAD)로 이상치를 제외한 뒤
 * 살아남은 세션만 기존 computePace(Σ시간/Σ페이지)로 가중 집계한다.
 *
 * 잘못된 시간(타이머 과다)·오기록이 전체 평균을 망치지 않게 자동 정제한다.
 */
export function computeRobustPace(
  logs: PaceLog[],
  constants: Partial<PaceConstants> = {},
): RobustPaceResult {
  const c = { ...DEFAULT_PACE_CONSTANTS, ...constants };

  // 1) 적격 후보(isPaced) + 하드 타당범위
  const candidates: { log: PaceLog; perPage: number }[] = [];
  const excluded: { perPage: number; reason: ExclusionReason }[] = [];

  for (const log of logs) {
    if (!isPaced(log)) continue; // not_paced는 robust 대상 아님(시간만 기록 등)
    const perPage = log.reading_duration_seconds! / (log.end_page! - log.start_page!);
    if (perPage < c.minSecPerPage) {
      excluded.push({ perPage, reason: "below_min" });
    } else if (perPage > c.maxSecPerPage) {
      excluded.push({ perPage, reason: "above_max" });
    } else {
      candidates.push({ log, perPage });
    }
  }

  // 2) 표본 충분하면 MAD 통계 이상치 제거
  let survivors = candidates;
  if (candidates.length >= c.minSamplesForMad) {
    const med = median(candidates.map((x) => x.perPage));
    const mad = median(candidates.map((x) => Math.abs(x.perPage - med)));
    const band = Math.max(mad, c.madFloorSec) * c.madK;
    survivors = [];
    for (const x of candidates) {
      if (Math.abs(x.perPage - med) > band) {
        excluded.push({ perPage: x.perPage, reason: "mad_outlier" });
      } else {
        survivors.push(x);
      }
    }
  }

  // 3) 살아남은 세션만 기존 가중 집계(SSOT)
  const base = computePace(survivors.map((x) => x.log));

  return {
    ...base,
    excludedCount: excluded.length,
    excluded,
    constants: c,
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
