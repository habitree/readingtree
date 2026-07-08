/**
 * 채널별 음원 병합 + 파트 분할 빌드 스크립트 (v2 — 2026-07-07)
 *
 * 목적: 4채널(피아노/클래식/활기찬 클래식/재즈) 음원을 각각 "연속된 하나의 스트림"으로
 *       병합하되, Supabase 스토리지 파일 크기 한도(50MB) 안에 들어가도록
 *       곡 경계 기준 ≤45MB 파트로 분할 업로드한다.
 *       런타임은 파트를 이중 버퍼로 끊김 없이 이어 붙여 셔플 재생한다.
 *
 * v3 품질 개선(2026-07-08 — 지지직/음질 개편):
 *   - 256kbps CBR (기존 160k) — 원본 대부분 192~320k라 다운그레이드를 최소화.
 *     CBR 유지 이유: 런타임이 파트 내 바이트오프셋 seek로 곡 위치를 잡음(VBR 불가).
 *   - EBU R128 측정(loudnorm 1-pass) 기반 선형 게인 정규화 — 목표 -18 LUFS,
 *     트루피크 -2.0dBTP 상한. volume 필터만 적용하므로 다이내믹 압축 없음.
 *     · -2.0dBTP: lossy MP3 재인코딩은 소스에 없던 인터샘플 피크를 더하므로
 *       -1.5dBTP로는 디코딩 시 0dBFS를 넘겨 클리핑(지지직) 위험 → 여유 확대.
 *     · -18 LUFS: 부스트 감소로 저비트레이트 곡의 잡음 증폭 완화 + 채널 간 일관성.
 *   - 앞뒤 무음 트리밍(-50dB, 앞 0.5s/뒤 0.8s 여유) — 곡 사이 죽은 공백 제거
 *   - 업로드 경로 v2/{channel}-{n}.mp3 를 그대로 '덮어쓰기'.
 *     (검증: 이 음악 버킷은 cacheControl을 무시하고 항상 no-cache로 서빙 —
 *      fix-music-cache-headers.ts 참조 — 이므로 CDN immutable 캐시가 없어 재사용 안전.
 *      단 파트 경계가 바뀌므로 재인코딩 직후 genres.ts와 함께 즉시 배포해야 한다.)
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
import { MUSIC_TRACKS, type MusicChannelId, type SourceTrack } from "../lib/music/tracks";

const execFileAsync = promisify(execFile);

const BUCKET = "jazz-music"; // 기존 public 버킷 재사용 (한도 50MB)
const OBJECT_PREFIX = "v2"; // 기존 경로 덮어쓰기(버킷이 no-cache 서빙이라 안전)
const MAX_PART_BYTES = 45 * 1024 * 1024; // 파트당 최대 45MB (50MB 한도 안전 여유)
const BITRATE = "256k"; // CBR — 바이트오프셋 seek 정확도 + 원본(192~320k) 다운그레이드 최소화
const TARGET_LUFS = -18; // 곡 간 라우드니스 목표(부스트 감소 → 잡음 완화)
const TP_LIMIT_DB = -2.0; // 트루피크 상한(MP3 인터샘플 피크 여유 → 지지직 방지)
// 앞뒤 무음 트리밍 — 여유를 남겨 자연스러운 호흡 유지
const TRIM_FILTERS =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.5," +
  "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.8,areverse";
const CONCURRENCY = 4;

interface Cue {
  title: string;
  composer: string;
  start: number; // 채널 전체 타임라인 기준(초)
  duration: number;
}
interface Part {
  start: number; // 채널 전체 타임라인 기준 시작(초)
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

/** EBU R128 측정 (loudnorm 1-pass JSON) → 통합 라우드니스/트루피크 */
async function measureLoudness(
  input: string,
): Promise<{ inputI: number; inputTp: number }> {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner", "-nostats",
      "-i", input,
      "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TP_LIMIT_DB}:print_format=json`,
      "-f", "null", "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  // loudnorm JSON 블록 뒤에 muxer 로그가 이어지므로 블록 자체를 매칭
  const jsonMatch = stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/);
  if (!jsonMatch) throw new Error(`loudnorm 측정 실패: ${input}`);
  const parsed = JSON.parse(jsonMatch[0]) as { input_i: string; input_tp: string };
  const inputI = parseFloat(parsed.input_i);
  const inputTp = parseFloat(parsed.input_tp);
  if (!Number.isFinite(inputI) || !Number.isFinite(inputTp)) {
    throw new Error(`loudnorm 측정값 파싱 실패: ${input}`);
  }
  return { inputI, inputTp };
}

/**
 * 단일 트랙을 정규화 mp3 로 인코딩(캐시) 후 실제 길이 반환.
 * 무음 트리밍 + 선형 게인(목표 LUFS, 트루피크 상한 캡) + 160k CBR.
 */
async function normalize(track: SourceTrack, outFile: string): Promise<number> {
  if (existsSync(outFile) && (await stat(outFile)).size > 0) {
    return ffprobeDuration(outFile);
  }
  const input = inputFor(track);
  if (track.sourceUrl.startsWith("/") && !existsSync(input)) {
    throw new Error(`로컬 음원 없음: ${input}`);
  }

  const { inputI, inputTp } = await measureLoudness(input);
  // 선형 게인 — 목표 LUFS 까지 올리되 트루피크가 상한을 넘지 않도록 캡
  const gainDb = Math.min(TARGET_LUFS - inputI, TP_LIMIT_DB - inputTp);
  const gain = Math.round(gainDb * 100) / 100;

  await execFileAsync(
    "ffmpeg",
    [
      "-y", "-i", input,
      "-af", `${TRIM_FILTERS},volume=${gain}dB`,
      "-c:a", "libmp3lame",
      "-b:a", BITRATE,
      "-ar", "44100",
      "-ac", "2",
      "-map_metadata", "-1", // ID3 제거
      "-write_xing", "0",    // Xing 헤더 제거 → concat 시 곡 사이 클릭/갭 방지
      outFile,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  process.stdout.write(
    `    · ${track.title} — ${inputI.toFixed(1)} LUFS → gain ${gain >= 0 ? "+" : ""}${gain}dB\n`,
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

interface ChannelBuild {
  id: MusicChannelId;
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

/** 채널 1개 → cues(전체) + parts(≤45MB 분할) */
async function buildChannel(
  channel: ChannelBuild,
  workDir: string,
): Promise<{ parts: Part[]; cues: Cue[]; total: number }> {
  console.log(`\n[${channel.id}] ${channel.tracks.length}곡 정규화 시작...`);

  const segFiles: string[] = [];
  const durations = await mapLimit(channel.tracks, CONCURRENCY, async (track, i) => {
    const out = path.join(workDir, `${channel.id}-seg-${String(i).padStart(3, "0")}.mp3`);
    const dur = await normalize(track, out);
    segFiles[i] = out;
    process.stdout.write(`  ✓ ${i + 1}/${channel.tracks.length} ${track.title}\n`);
    return dur;
  });

  // cues — 채널 전체 타임라인 누적
  const cues: Cue[] = [];
  let acc = 0;
  channel.tracks.forEach((t, i) => {
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
    const listFile = path.join(workDir, `${channel.id}-part-${p + 1}-list.txt`);
    const outFile = path.join(workDir, `${channel.id}-${p + 1}.mp3`);
    console.log(`[${channel.id}] 파트 ${p + 1}/${groups.length} concat (${idxs.length}곡)...`);
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

  console.log(`[${channel.id}] 완료 — ${(total / 60).toFixed(1)}분, ${parts.length}개 파트`);
  return { parts, cues, total };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
  const serviceKey = process.env.SUPABASE_MUSIC_SERVICE_ROLE_KEY;

  const channels: ChannelBuild[] = [
    { id: "piano", name: "피아노", emoji: "🎹", tracks: [] },
    { id: "classic", name: "클래식", emoji: "🎻", tracks: [] },
    { id: "energetic", name: "활기찬 클래식", emoji: "🎺", tracks: [] },
    { id: "jazz", name: "재즈", emoji: "🎷", tracks: [] },
  ];
  for (const t of MUSIC_TRACKS) {
    const ch = channels.find((c) => c.id === t.channel);
    if (!ch) throw new Error(`알 수 없는 채널: ${t.channel} (${t.id})`);
    ch.tracks.push(t);
  }

  console.log("=== 채널별 병합 + 파트 분할 빌드 (v2) ===");
  console.log(channels.map((c) => `${c.name} ${c.tracks.length}곡`).join(" / "));

  // 인코딩 파라미터(비트레이트/LUFS/TP)가 바뀌면 캐시를 재사용하면 안 되므로
  // 파라미터를 반영한 디렉터리명 사용 — 자동으로 fresh 재인코딩.
  const workDir = path.join(tmpdir(), `rt-music-build-256k-l18-tp20`);
  await mkdir(workDir, { recursive: true });
  console.log(`작업 캐시: ${workDir}`);

  const built: { parts: Part[]; cues: Cue[]; total: number }[] = [];
  for (const ch of channels) {
    built.push(await buildChannel(ch, workDir));
  }

  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;
  const partUrls: string[][] = channels.map(() => []);

  // SKIP_UPLOAD=1 : 인코딩·genres.ts 생성만 하고 업로드는 건너뜀(프로덕션 무영향).
  //   덮어쓰기(v2 재사용)는 배포 전까지 라이브를 깨므로, 무거운 인코딩은 미리 캐시에
  //   만들어 두고 실제 업로드는 배포 직전에 별도 실행(캐시 히트로 빠름)하기 위함.
  const skipUpload = process.env.SKIP_UPLOAD === "1";

  if (url && serviceKey && !skipUpload) {
    const supabase = createClient(url, serviceKey);
    for (let gi = 0; gi < channels.length; gi++) {
      const g = channels[gi];
      const parts = built[gi].parts;
      for (let p = 0; p < parts.length; p++) {
        const objectName = `${OBJECT_PREFIX}/${g.id}-${p + 1}.mp3`;
        const buf = await readFile(parts[p].file);
        console.log(`\n[업로드] ${objectName} (${(buf.length / 1024 / 1024).toFixed(1)}MB)...`);
        const { error } = await supabase.storage
          .from(BUCKET)
          // cacheControl 1년을 요청하되, 이 버킷은 실제로 이를 무시하고 no-cache 로
          // 서빙한다(fix-music-cache-headers.ts 검증). 그래서 같은 v2 이름 덮어쓰기가
          // 안전하다(브라우저가 ETag 로 재검증 → 새 파일 즉시 반영).
          .upload(objectName, buf, {
            contentType: "audio/mpeg",
            upsert: true,
            cacheControl: "31536000",
          });
        if (error) throw new Error(`업로드 실패(${objectName}): ${error.message}`);
        partUrls[gi][p] = `${publicBase}/${objectName}`;
        console.log(`  ✓ ${partUrls[gi][p]}`);
      }
    }
  } else {
    console.warn(
      skipUpload
        ? "\n[SKIP_UPLOAD] 업로드 생략 — 인코딩 캐시 + genres.ts 만 생성(배포 직전 재실행으로 업로드)"
        : "\n[경고] 업로드 자격 미설정 — URL만 추정해 genres.ts 생성",
    );
    channels.forEach((g, gi) => {
      built[gi].parts.forEach((_, p) => {
        partUrls[gi][p] = `${publicBase}/${OBJECT_PREFIX}/${g.id}-${p + 1}.mp3`;
      });
    });
  }

  // genres.ts 출력
  const genreObjs = channels.map((g, gi) => ({
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
