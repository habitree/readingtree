/**
 * 음악 파트 파일에 immutable 캐시 헤더 일괄 재적용 시도 (1회성)
 *
 * ⚠️ 검증 결과(2026-06-08): 현재 음악 Supabase(public 버킷, sb-gateway-mode:direct)는
 *    update/upload의 cacheControl 옵션을 **무시하고 항상 `Cache-Control: no-cache`로 서빙**한다.
 *    (파일 교체로 ETag·Last-Modified는 바뀌나 서빙 cache-control은 불변 — 원본 검증 완료.)
 *    따라서 이 스크립트로는 캐시 헤더를 바꿀 수 없다. CDN 캐싱이 필요하면
 *    버킷/프로젝트 레벨 설정 변경 또는 별도 CDN/프록시가 필요하다.
 *    ※ 단일 세션 연속 재생의 "중간 끊김"은 cache-control과 무관(브라우저가 Range로 점진 수신).
 *      실제 끊김 해결은 클라이언트 복구 로직(music-mini-player) 수정이 담당한다.
 *    이 스크립트는 향후 스토리지 정책이 cacheControl을 존중하게 되면 그대로 사용 가능하도록 보존한다.
 *
 * 동작: lib/music/genres.ts의 모든 파트 URL을 순회하며 기존 파일을
 *       공개 URL로 그대로 다운로드 → 같은 이름으로 cacheControl=1년 immutable로
 *       update. **재인코딩·내용 변경 없음.**
 *
 * 실행: npx tsx scripts/fix-music-cache-headers.ts [파일명필터]
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

  // 선택: 인자로 특정 파일명(예: jazz-2)만 처리 — 빠른 검증용
  const only = process.argv[2];
  let targets = MUSIC_GENRES.flatMap((g) => g.parts.map((p) => p.url));
  if (only) targets = targets.filter((u) => u.includes(only));
  console.log(`=== 음악 캐시 헤더 재적용: ${targets.length}개 파트${only ? ` (필터: ${only})` : ""} ===`);

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

    // 2) 같은 이름으로 cacheControl 지정해 교체.
    //    upsert 업로드는 기존 오브젝트의 cache-control 메타데이터를 갱신하지 않으므로
    //    update()로 메타데이터까지 교체한다(내용은 동일 바이트).
    const { error } = await supabase.storage.from(BUCKET).update(objectName, buf, {
      contentType: "audio/mpeg",
      cacheControl: CACHE_CONTROL,
      upsert: true,
    });
    if (error) {
      console.warn(`  ⚠ 업데이트 실패: ${objectName} — ${error.message}`);
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
