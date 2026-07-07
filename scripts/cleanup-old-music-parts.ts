/**
 * 구(v1) 병합 음원 파트 정리 스크립트 — 2026-07-07
 *
 * v2(4채널, v2/{channel}-{n}.mp3) 배포가 프로덕션에 반영된 "이후"에 실행할 것.
 * v1 파트(classic-1..7.mp3, jazz-1..2.mp3)를 버킷에서 삭제해 스토리지를 회수한다.
 * ⚠️ 배포 전에 실행하면 운영 중인 앱의 음악 재생이 끊긴다.
 *
 * 재즈 개별 원본(beautiful-dream.mp3 등 35개)은 빌드 소스이므로 삭제하지 않는다.
 *
 * 실행: npx tsx scripts/cleanup-old-music-parts.ts
 *
 * 필요한 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_MUSIC_URL
 *   SUPABASE_MUSIC_SERVICE_ROLE_KEY
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { createClient } from "@supabase/supabase-js";

const BUCKET = "jazz-music";
const OLD_PARTS = [
  ...Array.from({ length: 7 }, (_, i) => `classic-${i + 1}.mp3`),
  ...Array.from({ length: 2 }, (_, i) => `jazz-${i + 1}.mp3`),
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
  const serviceKey = process.env.SUPABASE_MUSIC_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_MUSIC_URL / SUPABASE_MUSIC_SERVICE_ROLE_KEY 필요");
  }
  const supabase = createClient(url, serviceKey);

  // 안전장치: v2 파트가 실제로 존재하는지 먼저 확인
  const { data: v2Files, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list("v2", { limit: 100 });
  if (listErr) throw new Error(`v2 목록 조회 실패: ${listErr.message}`);
  if (!v2Files || v2Files.length === 0) {
    throw new Error("v2 파트가 없습니다 — 먼저 build-combined-music.ts 를 실행하세요.");
  }
  console.log(`v2 파트 ${v2Files.length}개 확인 — 구 파트 삭제 진행`);

  const { data, error } = await supabase.storage.from(BUCKET).remove(OLD_PARTS);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
  console.log(`삭제 완료: ${data?.length ?? 0}개`);
  data?.forEach((f) => console.log(`  ✓ ${f.name}`));
}

main().catch((err) => {
  console.error("정리 실패:", err);
  process.exit(1);
});
