/**
 * 음악 파트 파일에 immutable 캐시 헤더 일괄 재적용 (1회성)
 *
 * 배경: 기존 병합 파트(.mp3)들이 cacheControl 없이 업로드되어 Supabase가
 *       `Cache-Control: no-cache`로 서빙 → 대용량 파트의 Range 스트리밍이
 *       매 요청 재검증·CDN MISS로 재생 중 끊김을 유발.
 *
 * 동작: lib/music/genres.ts의 모든 파트 URL을 순회하며 기존 파일을
 *       공개 URL로 그대로 다운로드 → 같은 이름으로 cacheControl=1년 immutable로
 *       재업로드(upsert). **재인코딩·내용 변경 없음, 헤더만 갱신.**
 *
 * 실행: npx tsx scripts/fix-music-cache-headers.ts
 *
 * 필요한 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_MUSIC_URL
 *   SUPABASE_MUSIC_SERVICE_ROLE_KEY
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { createClient } from "@supabase/supabase-js";
import { MUSIC_GENRES } from "../lib/music/genres";

const BUCKET = "jazz-music"; // build-combined-music.ts 와 동일 버킷
const CACHE_CONTROL = "31536000"; // 1년(immutable)

/** 공개 URL에서 버킷 내 오브젝트 경로 추출 (.../public/<bucket>/<object>) */
function objectNameFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
  const serviceKey = process.env.SUPABASE_MUSIC_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "[중단] 환경변수 미설정 — NEXT_PUBLIC_SUPABASE_MUSIC_URL · SUPABASE_MUSIC_SERVICE_ROLE_KEY 가 필요합니다.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const targets = MUSIC_GENRES.flatMap((g) => g.parts.map((p) => p.url));
  console.log(`=== 음악 캐시 헤더 재적용: ${targets.length}개 파트 ===`);

  let ok = 0;
  for (const partUrl of targets) {
    const objectName = objectNameFromUrl(partUrl);
    if (!objectName) {
      console.warn(`  ⚠ 건너뜀(경로 파싱 실패): ${partUrl}`);
      continue;
    }

    // 1) 기존 바이트 그대로 다운로드
    const res = await fetch(partUrl);
    if (!res.ok) {
      console.warn(`  ⚠ 다운로드 실패(${res.status}): ${objectName}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());

    // 2) 같은 이름으로 cacheControl 지정해 재업로드(내용 동일)
    const { error } = await supabase.storage.from(BUCKET).upload(objectName, buf, {
      contentType: "audio/mpeg",
      upsert: true,
      cacheControl: CACHE_CONTROL,
    });
    if (error) {
      console.warn(`  ⚠ 업로드 실패: ${objectName} — ${error.message}`);
      continue;
    }
    ok += 1;
    console.log(`  ✓ ${objectName} (${(buf.length / 1024 / 1024).toFixed(1)}MB) · cache 1y`);
  }

  console.log(`\n=== 완료: ${ok}/${targets.length} 갱신 ===`);
  console.log("확인: curl -I <part url> → cache-control: public, max-age=31536000");
}

main().catch((err) => {
  console.error("\n실패:", err);
  process.exit(1);
});
