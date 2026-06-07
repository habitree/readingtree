/**
 * 장르별 음원 병합 + 파트 분할 빌드 스크립트 (1회성)
 *
 * 목적: 클래식/재즈 음원을 각각 "연속된 하나의 스트림"으로 병합하되,
 *       Supabase 스토리지 파일 크기 한도(50MB) 안에 들어가도록
 *       곡 경계 기준 ≤45MB 파트로 분할 업로드한다.
 *       런타임은 파트를 이중 버퍼로 끊김 없이 이어 붙여 단일 음원처럼 재생한다.
 *
 * 실행: npx tsx scripts/build-combined-music.ts
 *
 * 필요한 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_MUSIC_URL
 *   SUPABASE_MUSIC_SERVICE_ROLE_KEY   (업로드용)
 *
 * 전제: ffmpeg / ffprobe 가 PATH 에 존재 (full build — https 입력 지원)
 */

import { config as loadEnv } from "dotenv";
// Next.js 와 동일하게 .env.local 우선 로드
loadEnv({ path: ".env.local" });
loadEnv();
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MUSIC_TRACKS, type SourceTrack } from "../lib/music/tracks";

const execFileAsync = promisify(execFile);

const BUCKET = "jazz-music"; // 기존 public 버킷 재사용 (한도 50MB)
const MAX_PART_BYTES = 45 * 1024 * 1024; // 파트당 최대 45MB (50MB 한도 안전 여유)
const NORMALIZE_ARGS = [
  "-c:a", "libmp3lame",
  "-b:a", "128k",       // CBR — 바이트오프셋 seek 정확도
  "-ar", "44100",
  "-ac", "2",
  "-map_metadata", "-1", // ID3 제거
  "-write_xing", "0",    // Xing 헤더 제거 → concat 시 곡 사이 클릭/갭 방지
];
const CONCURRENCY = 4;

interface Cue {
  title: string;
  composer: string;
  start: number; // 장르 전체 타임라인 기준(초)
  duration: number;
}
interface Part {
  start: number; // 장르 전체 타임라인 기준 시작(초)
  duration: number;
  file: string; // 로컬 병합 파일 경로
}

function inputFor(track: SourceTrack): string {
  if (track.sourceUrl.startsWith("/")) {
    return path.join(process.cwd(), "public", track.sourceUrl);
  }
  return track.sourceUrl; // https — ffmpeg 가 직접 처리
}

async function ffprobeDuration(file: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    file,
  ]);
  const d = parseFloat(stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe 실패: ${file}`);
  return d;
}

/** 단일 트랙을 정규화 mp3 로 인코딩(캐시) 후 실제 길이 반환 */
async function normalize(track: SourceTrack, outFile: string): Promise<number> {
  if (existsSync(outFile) && (await stat(outFile)).size > 0) {
    return ffprobeDuration(outFile);
  }
  const input = inputFor(track);
  if (track.sourceUrl.startsWith("/") && !existsSync(input)) {
    throw new Error(`로컬 음원 없음: ${input}`);
  }
  await execFileAsync(
    "ffmpeg",
    ["-y", "-i", input, ...NORMALIZE_ARGS, outFile],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return ffprobeDuration(outFile);
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

interface GenreBuild {
  id: "classic" | "jazz";
  name: string;
  emoji: string;
  tracks: SourceTrack[];
}

async function concatTo(segFiles: string[], listFile: string, outFile: string) {
  if (existsSync(outFile) && (await stat(outFile)).size > 0) return;
  await writeFile(
    listFile,
    segFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"),
    "utf8",
  );
  await execFileAsync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outFile],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}

/** 장르 1개 → cues(전체) + parts(≤45MB 분할) */
async function buildGenre(
  genre: GenreBuild,
  workDir: string,
): Promise<{ parts: Part[]; cues: Cue[]; total: number }> {
  console.log(`\n[${genre.id}] ${genre.tracks.length}곡 정규화 시작...`);

  const segFiles: string[] = [];
  const durations = await mapLimit(genre.tracks, CONCURRENCY, async (track, i) => {
    const out = path.join(workDir, `${genre.id}-seg-${String(i).padStart(3, "0")}.mp3`);
    const dur = await normalize(track, out);
    segFiles[i] = out;
    process.stdout.write(`  ✓ ${i + 1}/${genre.tracks.length} ${track.title}\n`);
    return dur;
  });

  // cues — 장르 전체 타임라인 누적
  const cues: Cue[] = [];
  let acc = 0;
  genre.tracks.forEach((t, i) => {
    cues.push({
      title: t.title,
      composer: t.composer,
      start: Math.round(acc * 1000) / 1000,
      duration: Math.round(durations[i] * 1000) / 1000,
    });
    acc += durations[i];
  });
  const total = Math.round(acc * 1000) / 1000;

  // 곡 경계 기준 ≤45MB 그룹핑
  const groups: number[][] = [];
  let curIdxs: number[] = [];
  let curBytes = 0;
  for (let i = 0; i < segFiles.length; i++) {
    const size = (await stat(segFiles[i])).size;
    if (curIdxs.length > 0 && curBytes + size > MAX_PART_BYTES) {
      groups.push(curIdxs);
      curIdxs = [];
      curBytes = 0;
    }
    curIdxs.push(i);
    curBytes += size;
  }
  if (curIdxs.length > 0) groups.push(curIdxs);

  // 파트별 concat + start/duration 계산
  const parts: Part[] = [];
  let partStart = 0;
  for (let p = 0; p < groups.length; p++) {
    const idxs = groups[p];
    const partSegs = idxs.map((i) => segFiles[i]);
    const partDur = idxs.reduce((s, i) => s + durations[i], 0);
    const listFile = path.join(workDir, `${genre.id}-part-${p + 1}-list.txt`);
    const outFile = path.join(workDir, `${genre.id}-${p + 1}.mp3`);
    console.log(`[${genre.id}] 파트 ${p + 1}/${groups.length} concat (${idxs.length}곡)...`);
    await concatTo(partSegs, listFile, outFile);
    const sizeMb = (await stat(outFile)).size / (1024 * 1024);
    console.log(`  → ${(partDur / 60).toFixed(1)}분, ${sizeMb.toFixed(1)}MB`);
    parts.push({
      start: Math.round(partStart * 1000) / 1000,
      duration: Math.round(partDur * 1000) / 1000,
      file: outFile,
    });
    partStart += partDur;
  }

  console.log(`[${genre.id}] 완료 — ${(total / 60).toFixed(1)}분, ${parts.length}개 파트`);
  return { parts, cues, total };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
  const serviceKey = process.env.SUPABASE_MUSIC_SERVICE_ROLE_KEY;

  const classicTracks = MUSIC_TRACKS.filter((t) => t.era !== "jazz");
  const jazzTracks = MUSIC_TRACKS.filter((t) => t.era === "jazz");

  console.log("=== 장르별 병합 + 파트 분할 빌드 ===");
  console.log(`클래식 ${classicTracks.length}곡 / 재즈 ${jazzTracks.length}곡`);

  const workDir = path.join(tmpdir(), "rt-music-build");
  await mkdir(workDir, { recursive: true });
  console.log(`작업 캐시: ${workDir}`);

  const genres: GenreBuild[] = [
    { id: "classic", name: "클래식", emoji: "🎻", tracks: classicTracks },
    { id: "jazz", name: "재즈", emoji: "🎷", tracks: jazzTracks },
  ];

  const built = await Promise.all(genres.map((g) => buildGenre(g, workDir)));

  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;
  const partUrls: string[][] = genres.map(() => []);

  if (url && serviceKey) {
    const supabase = createClient(url, serviceKey);
    for (let gi = 0; gi < genres.length; gi++) {
      const g = genres[gi];
      const parts = built[gi].parts;
      for (let p = 0; p < parts.length; p++) {
        const objectName = `${g.id}-${p + 1}.mp3`;
        const buf = await readFile(parts[p].file);
        console.log(`\n[업로드] ${objectName} (${(buf.length / 1024 / 1024).toFixed(1)}MB)...`);
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(objectName, buf, { contentType: "audio/mpeg", upsert: true });
        if (error) throw new Error(`업로드 실패(${objectName}): ${error.message}`);
        partUrls[gi][p] = `${publicBase}/${objectName}`;
        console.log(`  ✓ ${partUrls[gi][p]}`);
      }
    }
  } else {
    console.warn("\n[경고] 업로드 자격 미설정 — URL만 추정해 genres.ts 생성");
    genres.forEach((g, gi) => {
      built[gi].parts.forEach((_, p) => {
        partUrls[gi][p] = `${publicBase}/${g.id}-${p + 1}.mp3`;
      });
    });
  }

  // genres.ts 출력
  const genreObjs = genres.map((g, gi) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    durationSeconds: built[gi].total,
    parts: built[gi].parts.map((part, p) => ({
      url: partUrls[gi][p],
      start: part.start,
      duration: part.duration,
    })),
    cues: built[gi].cues,
  }));

  const fileContent =
    `// AUTO-GENERATED by scripts/build-combined-music.ts — 직접 수정 금지.\n` +
    `// 재생성: npx tsx scripts/build-combined-music.ts\n` +
    `import type { MusicGenre } from "@/types/music";\n\n` +
    `export const MUSIC_GENRES: MusicGenre[] = ${JSON.stringify(genreObjs, null, 2)};\n`;

  const outPath = path.join(process.cwd(), "lib", "music", "genres.ts");
  await writeFile(outPath, fileContent, "utf8");
  console.log(
    `\n✓ ${outPath} 생성 (parts: ${genreObjs.map((g) => g.parts.length).join("/")}, ` +
      `cues: ${genreObjs.map((g) => g.cues.length).join("/")})`,
  );
  console.log("\n=== 빌드 완료 ===");
}

main().catch((err) => {
  console.error("\n빌드 실패:", err);
  process.exit(1);
});
