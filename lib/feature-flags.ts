/**
 * Feature flags (기록 기능 전면 개편 Phase 5)
 *
 * 환경변수 기반의 단순 카나리 토글. 빌드 타임에 인라인.
 * 새 진입점(RecordSheet)으로의 점진 이행을 위한 안전장치.
 *
 * 사용:
 *   import { isRecordV2Enabled } from "@/lib/feature-flags";
 *   if (isRecordV2Enabled()) { useRecordSheet().openStart() }
 *   else { useStampCaptureStore().open() }
 *
 * 환경변수 설정:
 *   NEXT_PUBLIC_RECORD_V2=1  →  새 RecordSheet 활성화
 *   미지정 / "0" / "false"  →  기존 StampCaptureSheet 유지 (안전 기본값)
 *
 * 카나리 단계:
 *   1) 내부 사용자만 — env override (.env.local에 1)
 *   2) 신규 가입자 10% — Vercel env 분기 (Edge config 추후)
 *   3) 전체 — Phase 6에서 토글 제거 + 코드에서 legacy 분기 삭제
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function readBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;
  return TRUTHY.has(value.toLowerCase());
}

/**
 * 새 RecordSheet 통합 진입점 활성화 여부.
 *
 * SSR/CSR 모두에서 동일 결과 — `NEXT_PUBLIC_*` 인라인 → hydration mismatch 없음.
 */
export function isRecordV2Enabled(): boolean {
  return readBooleanEnv(process.env.NEXT_PUBLIC_RECORD_V2);
}
