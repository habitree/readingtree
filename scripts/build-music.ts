/**
 * 개별 곡 정규화 빌드 스크립트 (v4 — 병합 스트림 폐기, 2026-07-24)
 *
 * 목적: 3채널(피아노/클래식/재즈)의 모든 곡을 **개별 파일**로
 *       정규화해 public/music/ 에 배치한다. 병합(concat)·파트 분할·byte-offset seek 를
 *       전면 폐기 — 곡 하나가 독립 파일이므로 런타임에 "파일상 다음 곡" 이 존재하지 않아
 *       곡 겹침이 원천 불가능하다. public/ 은 Vercel CDN(immutable)으로 서빙된다.
 *
 * 파이프라인(곡별):
 *   1. 앞뒤 무음 트리밍(-50dB) — 곡 사이 죽은 공백 제거
 *   2. (히스 곡만) afftdn 디노이즈 — 원본 표면잡음(지지직) 제거
 *      · 15kHz+ 노이즈 플로어 실측으로 재생 히스 > -62dB 인 6곡만 대상(음악 손상 방지)
 *   3. 선형 게인 + 트루피크 리미터(alimiter) — 목표 -18 LUFS / 트루피크 -1.5dBTP
 *      · volume 으로 목표까지 선형 게인(모든 구간 동일 비율) + alimiter 로 피크만 순간 제한.
 *        loudnorm 의 dynamic 정규화와 달리 구간별 압축이 없어 다이내믹 레인지(LRA)를
 *        완전 보존하고, 조용한 구간의 표면 히스를 증폭하지 않는다.
 *        실측: schubert-andante LRA 9.6→9.5 / bach-jesu-joy 는 dynamic 대비 히스 억제.
 *      · 감쇠 곡에도 트루피크 캡을 잘못 적용하던 구(舊) 선형게인 버그(편차 6.2dB) 해소.
 *   4. VBR V2 MP3 인코딩(-vn: 앨범아트 스트림 제거) → public/music/<파일명>
 *      · 개별 곡이라 byte-offset seek 이 없으므로 CBR 불필요 → VBR 로 음질 유지+용량 절감
 *
 * 재즈: 원본이 Supabase(외부 https)에 있으므로 먼저 로컬로 받아 동일 파이프라인 적용,
 *       public 으로 이전(전 채널 public 통일 → Supabase Storage 부담 해소).
 *
 * 실행: npx tsx scripts/build-music.ts
 *   환경변수 불필요(재즈 URL 은 tracks.ts 에 이미 https 절대경로).
 * 전제: ffmpeg / ffprobe 가 PATH 에 존재.
 *
 * 안전: 모든 처리는 임시 폴더에서 수행하고, 전 곡 성공 시에만 public/music 을 덮어쓴다.
 *       (실패 시 원본 보존.) genres.ts 는 마지막에 한 번에 생성한다.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MUSIC_TRACKS, type MusicChannelId, type SourceTrack } from "../lib/music/tracks";

const execFileAsync = promisify(execFile);

const TARGET_LUFS = -18; // 곡 간 라우드니스 목표
const TP_CEIL_DB = -1.5; // 트루피크 상한(dBTP)
const VBR_QUALITY = "2"; // libmp3lame VBR V2(~190k) — 개별 곡이라 seek 불필요 → VBR 로 용량 절감
// 앞뒤 무음 트리밍 — 여유를 남겨 자연스러운 호흡 유지
const TRIM_FILTERS =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.5," +
  "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.8,areverse";
// 디노이즈(afftdn) — 진짜 표면 히스가 있는 곡에만.
const DENOISE_FILTER = "afftdn=nr=12:nf=-45:tn=1";
const CONCURRENCY = 3;

/**
 * 진짜 표면 히스(지지직)가 있는 곡 — 스펙트로그램 + "afftdn 전후 조용한 구간 15kHz+ 변화량"
 * 으로 확진. bach-jesu-joy 만 균일 노이즈 띠(Δ17dB)를 보였고, 후보였던 다른 곡들
 * (telemann·massenet·faure 등)은 음악 배음(15kHz 컷, 무음시 고역 소멸, Δ<3dB)이라 제외.
 * 이 목록에 없는 곡은 afftdn 을 걸지 않는다(음악 고주파 보존 — 디노이즈는 무효하고 유해).
 */
const HISS_TRACKS = new Set([
  "bach-jesu-joy-bwv147.mp3",
]);

/**
 * 곡의 출력 파일명(basename). 항상 .mp3 로 강제한다 — 원본이 .ogg(beethoven-symphony5-1)여도
 * 출력은 mp3 컨테이너이므로 확장자가 어긋나면 인코딩이 실패한다.
 */
function outputBasename(track: SourceTrack): string {
  const seg = track.sourceUrl.split("/").pop() ?? `${track.id}.mp3`;
  return seg.replace(/\.[^.]+$/, ".mp3");
}

/** 재즈 다운로드 저장 파일명 — 원본 확장자 유지(입력용). */
function jazzDownloadName(track: SourceTrack): string {
  return track.sourceUrl.split("/").pop() ?? `${track.id}.mp3`;
}

function localInputPath(track: SourceTrack, jazzDir: string): string {
  if (track.sourceUrl.startsWith("/")) {
    return path.join(process.cwd(), "public", track.sourceUrl);
  }
  // https(재즈) — 사전 다운로드한 로컬 경로(원본 확장자)
  return path.join(jazzDir, jazzDownloadName(track));
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

/** 재즈 https 원본을 로컬로 받아둔다(재다운로드 방지). */
async function downloadJazz(track: SourceTrack, jazzDir: string): Promise<void> {
  const dest = path.join(jazzDir, jazzDownloadName(track));
  if (existsSync(dest) && (await stat(dest)).size > 0) return;
  const res = await fetch(track.sourceUrl);
  if (!res.ok) throw new Error(`재즈 다운로드 실패(${track.title}): HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

/** 필터 프리픽스(트림 + 선택적 디노이즈) — pass1/pass2 공통. */
function preFilters(basename: string): string {
  const chain = [TRIM_FILTERS];
  if (HISS_TRACKS.has(basename)) chain.push(DENOISE_FILTER);
  return chain.join(",");
}

/** 트림/디노이즈 적용 상태의 통합 라우드니스(LUFS) 측정. */
async function measureLufs(input: string, pre: string): Promise<number> {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner", "-nostats", "-i", input,
      "-af", `${pre},loudnorm=I=${TARGET_LUFS}:TP=${TP_CEIL_DB}:print_format=json`,
      "-f", "null", "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const m = stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/);
  if (!m) throw new Error(`loudnorm 측정 실패: ${input}`);
  const inputI = parseFloat((JSON.parse(m[0]) as { input_i: string }).input_i);
  if (!Number.isFinite(inputI)) throw new Error(`loudnorm 측정값 파싱 실패: ${input}`);
  return inputI;
}

/**
 * 단일 곡을 정규화 mp3 로 인코딩 후 실제 길이 반환.
 * 선형 게인(volume) + 트루피크 리미터(alimiter) — 목표 LUFS 까지 균일 비율로 올리되
 * 피크만 순간 제한. dynamic 압축이 없어 다이내믹 레인지·히스 비율을 보존한다.
 */
async function normalize(
  track: SourceTrack,
  input: string,
  outFile: string,
): Promise<number> {
  if (existsSync(outFile) && (await stat(outFile)).size > 0) {
    return ffprobeDuration(outFile);
  }
  if (!existsSync(input)) throw new Error(`음원 없음: ${input}`);

  const basename = outputBasename(track);
  const pre = preFilters(basename);
  const inputI = await measureLufs(input, pre);
  const gain = Math.round((TARGET_LUFS - inputI) * 100) / 100;

  await execFileAsync(
    "ffmpeg",
    [
      "-y", "-i", input,
      "-af", `${pre},volume=${gain}dB,alimiter=limit=${TP_CEIL_DB}dB`,
      "-c:a", "libmp3lame",
      "-q:a", VBR_QUALITY,   // VBR — 개별 곡이라 byte-offset seek 불필요
      "-ar", "44100",
      "-ac", "2",
      "-vn",                 // 앨범아트(mjpeg/png) 스트림 제거
      "-map_metadata", "-1", // ID3 제거
      outFile,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const denoised = HISS_TRACKS.has(basename) ? " +디노이즈" : "";
  process.stdout.write(
    `    · ${track.title} — ${inputI.toFixed(1)} LUFS → gain ${gain >= 0 ? "+" : ""}${gain}dB${denoised}\n`,
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

interface OutTrack {
  title: string;
  composer: string;
  url: string;
  duration: number;
}

async function main() {
  const channels: ChannelBuild[] = [
    { id: "piano", name: "피아노", emoji: "🎹", tracks: [] },
    { id: "classic", name: "클래식", emoji: "🎻", tracks: [] },
    { id: "jazz", name: "재즈", emoji: "🎷", tracks: [] },
  ];
  for (const t of MUSIC_TRACKS) {
    const ch = channels.find((c) => c.id === t.channel);
    if (!ch) throw new Error(`알 수 없는 채널: ${t.channel} (${t.id})`);
    ch.tracks.push(t);
  }

  console.log("=== 개별 곡 정규화 빌드 (v4) ===");
  console.log(channels.map((c) => `${c.name} ${c.tracks.length}곡`).join(" / "));

  // 인코딩 파라미터가 바뀌면 캐시 재사용 금지 → 파라미터 반영한 디렉터리명
  const workDir = path.join(tmpdir(), "rt-music-v4-vbr2-l18-tp15");
  const jazzDir = path.join(workDir, "jazz-src");
  const outDir = path.join(workDir, "out");
  await mkdir(jazzDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  console.log(`작업 캐시: ${workDir}`);

  // 1) 재즈 원본 다운로드
  const jazz = channels.find((c) => c.id === "jazz")!;
  console.log(`\n[재즈] ${jazz.tracks.length}곡 다운로드...`);
  await mapLimit(jazz.tracks, 6, async (t) => {
    await downloadJazz(t, jazzDir);
    process.stdout.write(`  ↓ ${outputBasename(t)}\n`);
  });

  // 2) 곡별 정규화 → outDir
  const built: OutTrack[][] = [];
  for (const ch of channels) {
    console.log(`\n[${ch.id}] ${ch.tracks.length}곡 정규화...`);
    const outs = await mapLimit(ch.tracks, CONCURRENCY, async (track, i) => {
      const basename = outputBasename(track);
      const input = localInputPath(track, jazzDir);
      const outFile = path.join(outDir, basename);
      const duration = await normalize(track, input, outFile);
      process.stdout.write(`  ✓ ${i + 1}/${ch.tracks.length} ${track.title}\n`);
      return {
        title: track.title,
        composer: track.composer,
        url: `/music/${basename}`,
        duration: Math.round(duration * 1000) / 1000,
        _basename: basename,
      };
    });
    built.push(outs);
  }

  // 3) 전 곡 성공 → public/music 덮어쓰기
  const publicMusic = path.join(process.cwd(), "public", "music");
  await mkdir(publicMusic, { recursive: true });
  console.log(`\n[배치] public/music 덮어쓰기...`);
  for (let ci = 0; ci < channels.length; ci++) {
    for (const t of built[ci]) {
      const basename = (t as OutTrack & { _basename: string })._basename;
      await copyFile(path.join(outDir, basename), path.join(publicMusic, basename));
    }
  }

  // 4) genres.ts 생성
  const genreObjs = channels.map((ch, ci) => ({
    id: ch.id,
    name: ch.name,
    emoji: ch.emoji,
    tracks: built[ci].map((t) => ({
      title: t.title,
      composer: t.composer,
      url: t.url,
      duration: t.duration,
    })),
  }));

  const fileContent =
    `// AUTO-GENERATED by scripts/build-music.ts — 직접 수정 금지.\n` +
    `// 재생성: npx tsx scripts/build-music.ts\n` +
    `import type { MusicGenre } from "@/types/music";\n\n` +
    `export const MUSIC_GENRES: MusicGenre[] = ${JSON.stringify(genreObjs, null, 2)};\n`;
  const outPath = path.join(process.cwd(), "lib", "music", "genres.ts");
  await writeFile(outPath, fileContent, "utf8");

  console.log(
    `\n✓ ${outPath} 생성 (곡수: ${genreObjs.map((g) => g.tracks.length).join("/")})`,
  );
  console.log("\n=== 빌드 완료 ===");
}

main().catch((err) => {
  console.error("\n빌드 실패:", err);
  process.exit(1);
});
