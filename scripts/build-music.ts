/**
 * 개별 곡 정규화 빌드 스크립트 (v5 — 출처 재다운로드 + 320k CBR, 2026-09-03)
 *
 * 목적: 3채널(피아노/클래식/재즈) 전 곡을 **기록된 출처에서 다시 받아** 검수·정규화하고
 *       public/music/ 에 개별 파일로 배치한다. (병합·파트 분할·byte-offset seek 은 v4에서 폐기.)
 *
 * v5 변경(2026-09-03) — 전수 실측에서 드러난 결함 교정:
 *   · 출처 기반 재다운로드: tracks.ts 의 sourceUrl 이 실제 원본(https: Musopen FLAC / Wikimedia
 *     Commons / Mixkit, 또는 git:<commit>:<path> = 이 저장소 이력의 최초 원본)을 가리킨다.
 *     v4 까지는 sourceUrl 이 산출물(/music/…)을 가리켜 재현이 불가능했다.
 *   · clip: 한 파일에 두 곡이 이어 붙은 원본(아라베스크 1+2 등)은 구간을 잘라 한 곡만 남긴다.
 *   · 트루피크 캡 정상화: v4 의 `alimiter=limit=-1.5dB` 는 dB 접미사가 파싱되지 않아 무효였고
 *     약 50곡이 0 dBTP 를 넘었다. 이제 선형 게인 뒤 4x 오버샘플 리미터(선형값)로 -2 dBTP 캡,
 *     리미터 부담이 MAX_LIMIT_DB 를 넘으면 게인을 그만큼 낮춘다(과한 리미팅 방지).
 *   · 320 kbps CBR MP3(v4 VBR V2 ≈190k 에서 상향). 앨범아트·ID3 제거.
 *   · 산출물 검증: 곡별 트루피크 재측정(≤ -1.0 dBTP), md5 중복 0 — 위반 시 빌드 실패.
 *
 * 파이프라인(곡별):
 *   0. 출처 다운로드(캐시) → 1. clip(선택) → 2. 앞뒤 무음 트리밍(-50dB)
 *   → 3. (히스 곡만) afftdn 디노이즈 → 4. 선형 게인(-18 LUFS 목표) + 트루피크 리미터(-2 dBTP)
 *   → 5. libmp3lame 320k CBR 44.1kHz 스테레오 → public/music/<file>
 *
 * 실행: npx tsx scripts/build-music.ts
 *   환경변수 불필요. 전제: ffmpeg / ffprobe / git 이 PATH 에 존재.
 *   캐시: %TEMP%/rt-music-v5/src (원본), %TEMP%/rt-music-v5/out-320k-l18-tp20 (산출물)
 *
 * 안전: 모든 처리는 임시 폴더에서 수행하고, 전 곡 성공·검증 통과 시에만 public/music 의
 *       음악 파일을 전량 교체한다(ambience-*.mp3 는 build-ambience.ts 소관이라 건드리지 않는다).
 *       genres.ts 는 마지막에 한 번에 생성한다.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { mkdir, writeFile, copyFile, stat, readdir, unlink, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MUSIC_TRACKS, type MusicChannelId, type SourceTrack } from "../lib/music/tracks";

const execFileAsync = promisify(execFile);

const TARGET_LUFS = -18; // 곡 간 라우드니스 목표
const TP_CEIL_DB = -2.0; // 리미터 캡(dBTP). MP3 인코딩 오버슈트 여유를 두고 검증 기준은 -1.0
const VERIFY_TP_MAX = -1.0; // 산출물 트루피크 상한(검증)
const MAX_LIMIT_DB = 3; // 리미터가 깎아도 되는 최대 dB — 넘으면 게인을 낮춘다
const MP3_BITRATE = "320k";
const CONCURRENCY = 3;
const USER_AGENT = "readingtree-music-build/5.0 (contact: cdhrich@gmail.com)";
// 앞뒤 무음 트리밍 — 여유를 남겨 자연스러운 호흡 유지
const TRIM_FILTERS =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.5," +
  "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.8,areverse";
// 디노이즈(afftdn) — 진짜 표면 히스가 있는 곡에만.
const DENOISE_FILTER = "afftdn=nr=12:nf=-45:tn=1";

/**
 * 진짜 표면 히스(지지직)가 있는 곡 — 스펙트로그램 + "afftdn 전후 조용한 구간 15kHz+ 변화량"
 * 으로 확진(v4). 이 목록에 없는 곡은 afftdn 을 걸지 않는다(음악 고주파 보존).
 */
const HISS_TRACKS = new Set(["bach-jesu-joy-bwv147.mp3"]);

const WORK_DIR = path.join(tmpdir(), "rt-music-v5");
const SRC_DIR = path.join(WORK_DIR, "src");
const OUT_DIR = path.join(WORK_DIR, "out-320k-l18-tp20");

function sourceExt(track: SourceTrack): string {
  const m = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(decodeURIComponent(track.sourceUrl));
  return (m?.[1] ?? "bin").toLowerCase();
}

/** 원본을 캐시에 확보한다: https → 다운로드, git:<commit>:<path> → 이력에서 추출. */
async function fetchSource(track: SourceTrack): Promise<string> {
  const dest = path.join(SRC_DIR, `${track.file.replace(/\.mp3$/, "")}.${sourceExt(track)}`);
  if (existsSync(dest) && (await stat(dest)).size > 0) return dest;

  if (track.sourceUrl.startsWith("git:")) {
    const [, commit, ...rest] = track.sourceUrl.split(":");
    const gitPath = rest.join(":");
    const { stdout } = await execFileAsync("git", ["cat-file", "-p", `${commit}:${gitPath}`], {
      encoding: "buffer",
      maxBuffer: 256 * 1024 * 1024,
    });
    await writeFile(dest, stdout);
    return dest;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(track.sourceUrl, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const expected = Number(res.headers.get("content-length") ?? 0);
      if (expected && buf.length !== expected) throw new Error(`short read ${buf.length}/${expected}`);
      await writeFile(dest, buf);
      return dest;
    } catch (err) {
      if (attempt === 3) throw new Error(`다운로드 실패(${track.title}): ${String(err)}`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
  throw new Error("unreachable");
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

/** clip(선택) + 트림 + 선택적 디노이즈 — 측정/인코딩 공통 프리필터. */
function preFilters(track: SourceTrack): string {
  const chain: string[] = [];
  if (track.clip) {
    const parts = [];
    if (track.clip.start !== undefined) parts.push(`start=${track.clip.start}`);
    if (track.clip.end !== undefined) parts.push(`end=${track.clip.end}`);
    chain.push(`atrim=${parts.join(":")},asetpts=PTS-STARTPTS`);
  }
  chain.push(TRIM_FILTERS);
  if (HISS_TRACKS.has(track.file)) chain.push(DENOISE_FILTER);
  return chain.join(",");
}

interface Loudness {
  lufs: number;
  truePeak: number;
}

/** 프리필터 적용 상태의 통합 라우드니스·트루피크 측정. */
async function measure(input: string, filters: string): Promise<Loudness> {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner", "-nostats", "-i", input,
      "-af", `${filters},loudnorm=I=${TARGET_LUFS}:TP=${TP_CEIL_DB}:print_format=json`,
      "-f", "null", "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const m = stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/);
  if (!m) throw new Error(`loudnorm 측정 실패: ${input}`);
  const j = JSON.parse(m[0]) as { input_i: string; input_tp: string };
  const lufs = parseFloat(j.input_i);
  const truePeak = parseFloat(j.input_tp);
  if (!Number.isFinite(lufs) || !Number.isFinite(truePeak)) {
    throw new Error(`loudnorm 측정값 파싱 실패: ${input}`);
  }
  return { lufs, truePeak };
}

interface Built {
  file: string;
  duration: number;
  gain: number;
  limited: number;
  outLufs: number;
  outTp: number;
  md5: string;
}

/**
 * 단일 곡 정규화 → 320k MP3. 선형 게인으로 -18 LUFS 를 맞추되, 게인 후 트루피크가 캡을
 * 넘는 만큼은 리미터가 처리한다(최대 MAX_LIMIT_DB). 그 이상 필요하면 게인을 낮춰
 * 다이내믹 레인지를 보존한다(그 곡은 -18 보다 조용해진다 — 의도된 트레이드오프).
 */
async function normalize(track: SourceTrack, input: string, outFile: string): Promise<Built> {
  let gain = NaN; // 캐시된 산출물이면 측정을 생략한다(gain 미상)
  let limited = 0;
  if (!(existsSync(outFile) && (await stat(outFile)).size > 0)) {
    const pre = preFilters(track);
    const src = await measure(input, pre);
    gain = TARGET_LUFS - src.lufs;
    const over = src.truePeak + gain - TP_CEIL_DB; // 캡을 넘는 양(dB)
    limited = Math.max(0, Math.min(over, MAX_LIMIT_DB));
    if (over > MAX_LIMIT_DB) gain -= over - MAX_LIMIT_DB;
    gain = Math.round(gain * 100) / 100;
    const limit = Math.pow(10, TP_CEIL_DB / 20).toFixed(4); // alimiter 는 선형값만 받는다
    await execFileAsync(
      "ffmpeg",
      [
        "-y", "-i", input,
        "-af",
        `${pre},volume=${gain}dB,` +
          `aresample=176400,alimiter=limit=${limit}:attack=5:release=80:level=false,aresample=44100`,
        "-c:a", "libmp3lame",
        "-b:a", MP3_BITRATE,
        "-ar", "44100",
        "-ac", "2",
        "-vn",                 // 앨범아트(mjpeg/png) 스트림 제거
        "-map_metadata", "-1", // ID3 제거
        outFile,
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    );
  }
  const out = await measure(outFile, "anull");
  const md5 = createHash("md5").update(await readFile(outFile)).digest("hex");
  return {
    file: track.file,
    duration: await ffprobeDuration(outFile),
    gain,
    limited,
    outLufs: out.lufs,
    outTp: out.truePeak,
    md5,
  };
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
  const files = MUSIC_TRACKS.map((t) => t.file);
  if (new Set(files).size !== files.length) throw new Error("tracks.ts 에 중복 file 이 있다");

  console.log("=== 개별 곡 정규화 빌드 (v5: 출처 재다운로드 + 320k CBR) ===");
  console.log(channels.map((c) => `${c.name} ${c.tracks.length}곡`).join(" / "));
  await mkdir(SRC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`작업 캐시: ${WORK_DIR}`);

  // 1) 출처 확보
  console.log(`\n[출처] ${MUSIC_TRACKS.length}곡 다운로드/추출...`);
  await mapLimit(MUSIC_TRACKS, 4, async (t) => {
    await fetchSource(t);
    process.stdout.write(`  ↓ ${t.file}\n`);
  });

  // 2) 곡별 정규화 → OUT_DIR
  const built = new Map<string, Built>();
  for (const ch of channels) {
    console.log(`\n[${ch.id}] ${ch.tracks.length}곡 정규화...`);
    await mapLimit(ch.tracks, CONCURRENCY, async (track, i) => {
      const input = await fetchSource(track);
      const b = await normalize(track, input, path.join(OUT_DIR, track.file));
      built.set(track.file, b);
      const lim = b.limited > 0 ? ` lim ${b.limited.toFixed(1)}dB` : "";
      const how = Number.isNaN(b.gain) ? "캐시" : `gain ${b.gain >= 0 ? "+" : ""}${b.gain}dB${lim}`;
      process.stdout.write(
        `  ✓ ${i + 1}/${ch.tracks.length} ${track.title} — ${how}` +
          ` → ${b.outLufs.toFixed(1)} LUFS / ${b.outTp.toFixed(1)} dBTP · ${b.duration.toFixed(1)}s\n`,
      );
    });
  }

  // 3) 검증 — 트루피크·중복
  const problems: string[] = [];
  const byMd5 = new Map<string, string[]>();
  for (const b of built.values()) {
    if (b.outTp > VERIFY_TP_MAX) problems.push(`트루피크 초과 ${b.file}: ${b.outTp.toFixed(2)} dBTP`);
    byMd5.set(b.md5, [...(byMd5.get(b.md5) ?? []), b.file]);
  }
  for (const [, names] of byMd5) {
    if (names.length > 1) problems.push(`산출물 중복(같은 음원): ${names.join(" == ")}`);
  }
  if (problems.length) {
    throw new Error(`검증 실패:\n  ${problems.join("\n  ")}`);
  }

  // 4) 전 곡 성공 → public/music 의 음악 파일 전량 교체(ambience-* 제외)
  const publicMusic = path.join(process.cwd(), "public", "music");
  await mkdir(publicMusic, { recursive: true });
  console.log(`\n[배치] public/music 교체...`);
  const keep = new Set(files);
  for (const name of await readdir(publicMusic)) {
    const p = path.join(publicMusic, name);
    if ((await stat(p)).isDirectory()) continue;
    if (name.startsWith("ambience-")) continue;
    if (!keep.has(name)) {
      await unlink(p);
      process.stdout.write(`  - 삭제 ${name}\n`);
    }
  }
  for (const f of files) await copyFile(path.join(OUT_DIR, f), path.join(publicMusic, f));

  // 5) genres.ts 생성
  const genreObjs = channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    emoji: ch.emoji,
    tracks: ch.tracks.map((t) => ({
      title: t.title,
      composer: t.composer,
      url: `/music/${t.file}`,
      duration: Math.round(built.get(t.file)!.duration * 1000) / 1000,
    })),
  }));

  const fileContent =
    `// AUTO-GENERATED by scripts/build-music.ts — 직접 수정 금지.\n` +
    `// 재생성: npx tsx scripts/build-music.ts\n` +
    `import type { MusicGenre } from "@/types/music";\n\n` +
    `export const MUSIC_GENRES: MusicGenre[] = ${JSON.stringify(genreObjs, null, 2)};\n`;
  const outPath = path.join(process.cwd(), "lib", "music", "genres.ts");
  await writeFile(outPath, fileContent, "utf8");

  const total = [...built.values()].reduce((s, b) => s + b.duration, 0);
  console.log(
    `\n✓ ${outPath} 생성 (곡수: ${genreObjs.map((g) => g.tracks.length).join("/")}, 총 ${(total / 60).toFixed(0)}분)`,
  );
  console.log("\n=== 빌드 완료 ===");
}

main().catch((err) => {
  console.error("\n빌드 실패:", err);
  process.exit(1);
});
