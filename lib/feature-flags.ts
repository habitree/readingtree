/**
 * Feature flags (기록 기능 전면 개편 Phase 5 → 기록 기획 12 Phase C)
 *
 * 환경변수 기반의 단순 카나리 토글. 빌드 타임에 인라인.
 * 새 진입점(RecordSheet)으로의 점진 이행을 위한 안전장치.
 *
 * 사용:
 *   import { isRecordV2Enabled } from "@/lib/feature-flags";
 *   if (isRecordV2Enabled()) { useRecordSheet().openStart() }
 *   else { useStampCaptureStore().open() }
 *
 * 환경변수 설정 (기록 기획 12 Phase C — 기본값 ON 전환):
 *   미지정 / "1" / "true" / "yes" / "on"  →  새 RecordSheet 활성화 (기본)
 *   "0" / "false" / "no" / "off"          →  기존 StampCaptureSheet 폴백 (킬 스위치)
 *
 * 점진 이행 메모:
 *   - Phase B에서 RecordSheet가 attach(사후 사진 첨부) 패리티를 달성 → Phase C에서 기본 ON.
 *   - legacy(StampCaptureSheet/createReadingStamp 등) 물리 삭제는 ON 검증(1주) 통과 후 별도 PR.
 *   - 롤백이 필요하면 NEXT_PUBLIC_RECORD_V2=0 으로 즉시 폴백.
 */

const FALSY = new Set(["0", "false", "no", "off"]);

/**
 * 새 RecordSheet 통합 진입점 활성화 여부. (기본 ON)
 *
 * SSR/CSR 모두에서 동일 결과 — `NEXT_PUBLIC_*` 인라인 → hydration mismatch 없음.
 */
export function isRecordV2Enabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_RECORD_V2;
  // 미지정/빈값 → 기본 ON. 명시적 falsy 값일 때만 OFF(킬 스위치).
  if (raw == null || raw.trim() === "") return true;
  return !FALSY.has(raw.trim().toLowerCase());
}

/**
 * 통합 기록 피드(기록 기획 13) 활성화 여부. (기본 ON)
 *
 * /notes "전체" 탭(list 뷰)에서 reading_logs + notes 를 머지한 단일 피드를 노출.
 * 표시 신규 추가라 RECORD_V2와 독립. 롤백은 NEXT_PUBLIC_UNIFIED_FEED=0.
 */
export function isUnifiedFeedEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_UNIFIED_FEED;
  if (raw == null || raw.trim() === "") return true;
  return !FALSY.has(raw.trim().toLowerCase());
}

/**
 * 진행율 기록을 reading_logs(페이지-only)에 저장 — 데이터 모델 단일화 (기록 기획 13 §11 ③).
 * **기본 ON** (사용자 "강제 진행" 결정으로 2026-06-15 OFF→ON 전환). 켜지면 진행율 쓰기가
 * reading_logs로 가고, 여정·캘린더·대시보드·주간/스트릭 리더가 reading_logs progress를
 * notes(레거시)와 함께 읽는다(dual-source, disjoint — 이중 카운트 없음).
 *
 * 롤백(킬 스위치): NEXT_PUBLIC_PROGRESS_IN_LOGS=0
 */
export function isProgressInLogsEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_PROGRESS_IN_LOGS;
  if (raw == null || raw.trim() === "") return true;
  return !FALSY.has(raw.trim().toLowerCase());
}
