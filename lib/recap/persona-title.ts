/**
 * 규칙 기반 독서 페르소나 타이틀 — 월간·연간 결산 공용.
 *
 * "use server" 없는 순수 모듈. 월간 결산(compute.ts)에 있던 규칙을 그대로 옮기고,
 * 분량 임계값만 기간(월/연)에 따라 바꿀 수 있게 했다.
 */

import type { RecapNotesByType } from "@/app/actions/recap/types";

export interface PersonaTimeBuckets {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface PersonaVolumeThresholds {
  /** 이 시간 이상이거나 deepBooks 이상 완독이면 "몰입형" */
  deepHours: number;
  deepBooks: number;
  /** 이 시간 미만이고 lightBooks 미만 완독이면 "가벼운" */
  lightHours: number;
  lightBooks: number;
  /** 데이터가 거의 없을 때의 타이틀 */
  fallbackTitle: string;
}

export const MONTHLY_PERSONA_THRESHOLDS: PersonaVolumeThresholds = {
  deepHours: 15,
  deepBooks: 5,
  lightHours: 3,
  lightBooks: 2,
  fallbackTitle: "이달의 독서가",
};

export const YEARLY_PERSONA_THRESHOLDS: PersonaVolumeThresholds = {
  deepHours: 100,
  deepBooks: 30,
  lightHours: 20,
  lightBooks: 6,
  fallbackTitle: "올해의 독서가",
};

export interface PersonaTitleInput {
  totalNotes: number;
  sessionCount: number;
  totalReadingSeconds: number;
  completedBooks: number;
  notesByType: RecapNotesByType;
  timeBuckets: PersonaTimeBuckets;
}

export function buildPersonaTitle(
  input: PersonaTitleInput,
  thresholds: PersonaVolumeThresholds = MONTHLY_PERSONA_THRESHOLDS,
): string {
  if (input.totalNotes < 3 && input.sessionCount < 3) return thresholds.fallbackTitle;

  const hours = input.totalReadingSeconds / 3600;
  let volume = "꾸준한";
  if (hours >= thresholds.deepHours || input.completedBooks >= thresholds.deepBooks) volume = "몰입형";
  else if (hours < thresholds.lightHours && input.completedBooks < thresholds.lightBooks) volume = "가벼운";

  const tb = input.timeBuckets;
  const maxTime = Math.max(tb.morning, tb.afternoon, tb.evening, tb.night);
  let timeWord = "";
  if (maxTime > 0) {
    if (maxTime === tb.night) timeWord = "심야";
    else if (maxTime === tb.morning) timeWord = "아침";
    else if (maxTime === tb.evening) timeWord = "저녁";
    else timeWord = "한낮";
  }

  const n = input.notesByType;
  const visual = n.photo + n.transcription;
  let styleNoun = "탐독가";
  const maxStyle = Math.max(n.quote, n.memo, visual);
  if (maxStyle > 0) {
    if (maxStyle === n.quote) styleNoun = "문장 수집가";
    else if (maxStyle === n.memo) styleNoun = "사색가";
    else styleNoun = "기록가";
  }

  return [volume, timeWord, styleNoun].filter(Boolean).join(" ");
}
