/**
 * 백색소음(자연 앰비언스) 빌드 스크립트 (2026-07-31)
 *
 * 목적: 독서용 백색소음 채널(빗소리/숲속/파도/모닥불)의 음원을 Wikimedia Commons 에서
 *       내려받아 정규화·무한반복용으로 가공해 public/music/ 에 배치하고,
 *       lib/music/ambience.ts (채널 데이터)를 생성한다.
 *
 * 파이프라인(채널별 1곡):
 *   1. Commons 원본 다운로드(캐시) → 지정 구간 슬라이스
 *   2. highpass 38Hz — 마이크 럼블·바람 저역 제거
 *   3. 심리스 루프 가공 — 앞 2초를 잘라 꼬리에 크로스페이드(끝→시작이 이어짐).
 *      런타임은 단일 곡 셔플 큐(이중 버퍼)로 반복 재생하므로 경계 클릭이 없어야 한다.
 *   4. loudnorm 2-pass(linear) — 목표 -22 LUFS / TP -2dBTP (선형 게인, TP 초과 시 게인 자동 감소)
 *      (음악 -18 LUFS 보다 낮게 — 지속음이라 같은 LUFS 면 체감이 훨씬 크다)
 *   5. VBR V5 MP3 (지속 노이즈라 저비트레이트로 충분) → public/music/ambience-<id>.mp3
 *
 * 실행: npx tsx scripts/build-ambience.ts   (전제: ffmpeg/ffprobe PATH)
 *
 * 라이선스: 각 SOURCES 항목 참조. CC BY / CC BY-SA 음원은 앱 내 표기 필수 —
 *           미니플레이어 composer(녹음자명) + 음악 시트 출처 문구로 표기한다.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

const TARGET_LUFS = -22;
const TP_CEIL_DB = -2;
const VBR_QUALITY = "5"; // 지속 노이즈 — V5(~130k)로 충분
const XFADE_S = 2; // 루프 경계 크로스페이드 길이
const UA = "ReadingTreeAmbience/1.0 (https://read.habitree.io)";

interface AmbienceSource {
  /** 채널 id (MusicGenre.id) */
  id: string;
  name: string;
  emoji: string;
  /** 곡 표시 타이틀 */
  title: string;
  /** 녹음자 — 미니플레이어 composer 자리에 노출(CC 표기 겸용) */
  recordist: string;
  /** Commons 파일 페이지 + 라이선스 (기록용) */
  license: string;
  sourcePage: string;
  downloadUrl: string;
  /** 원본에서 사용할 구간(초) */
  sliceStart: number;
  sliceEnd: number;
}

const SOURCES: AmbienceSource[] = [
  {
    id: "rain",
    name: "빗소리",
    emoji: "🌧️",
    title: "잔잔한 빗소리",
    recordist: "Zuvji",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Calm_rain.wav",
    downloadUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Calm_rain.wav",
    sliceStart: 5,
    sliceEnd: 485,
  },
  {
    id: "forest",
    name: "숲속",
    emoji: "🌲",
    title: "새벽 숲의 새소리",
    recordist: "Silas S. Brown",
    license: "Public Domain",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Dawnchorus-uk.ogg",
    downloadUrl: "https://upload.wikimedia.org/wikipedia/commons/d/de/Dawnchorus-uk.ogg",
    sliceStart: 900, // 새 활동이 가장 활발한 구간(실측 mean -31dB)
    sliceEnd: 1380,
  },
  {
    id: "waves",
    name: "파도",
    emoji: "🌊",
    title: "밀려오는 파도",
    recordist: "Andrew Migneault",
    license: "CC BY-SA 4.0",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Lake_Okeechobee_Surf_in_April_2016.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b0/Lake_Okeechobee_Surf_in_April_2016.ogg",
    sliceStart: 5,
    sliceEnd: 330,
  },
  {
    id: "fire",
    name: "모닥불",
    emoji: "🔥",
    title: "타닥이는 모닥불",
    recordist: "Glaneur de sons",
    license: "CC BY 3.0",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Campfire_sound_ambience.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/b1/Campfire_sound_ambience.ogg",
    sliceStart: 0,
    sliceEnd: 60,
  },
];

async function download(src: AmbienceSource, dir: string): Promise<string> {
  const ext = path.extname(new URL(src.downloadUrl).pathname) || ".bin";
  const dest = path.join(dir, `${src.id}${ext}`);
  if (existsSync(dest) && (await stat(dest)).size > 0) return dest;
  const res = await fetch(src.downloadUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`다운로드 실패(${src.id}): HTTP ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

/** 슬라이스 + highpass + 심리스 루프 가공 → 무손실 중간 WAV */
async function makeLoopWav(src: AmbienceSource, input: string, wavOut: string): Promise<void> {
  const { sliceStart: s, sliceEnd: e } = src;
  const bodyStart = s + XFADE_S;
  // body=[s+2..e] 꼬리에 head=[s..s+2] 를 크로스페이드 — 파일 끝이 시작(=s+2 직전 내용)으로 이어져
  // 반복 재생 시 경계가 매끄럽다.
  const graph =
    `[0]atrim=start=${bodyStart}:end=${e},asetpts=PTS-STARTPTS,highpass=f=38[body];` +
    `[0]atrim=start=${s}:end=${bodyStart},asetpts=PTS-STARTPTS,highpass=f=38[head];` +
    `[body][head]acrossfade=d=${XFADE_S}:c1=tri:c2=tri[out]`;
  await execFileAsync(
    "ffmpeg",
    ["-y", "-i", input, "-filter_complex", graph, "-map", "[out]",
      "-ar", "44100", "-ac", "2", "-c:a", "pcm_s16le", wavOut],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}

interface LoudnormMeasure {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
}

async function measureLufs(file: string): Promise<LoudnormMeasure> {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file,
      "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TP_CEIL_DB}:print_format=json`,
      "-f", "null", "-"],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const m = stderr.match(/\{[^{}]*"input_i"[\s\S]*?\}/);
  if (!m) throw new Error(`loudnorm 측정 실패: ${file}`);
  const measured = JSON.parse(m[0]) as LoudnormMeasure;
  if (!Number.isFinite(parseFloat(measured.input_i))) {
    throw new Error(`loudnorm 파싱 실패: ${file}`);
  }
  return measured;
}

/** 2-pass loudnorm(linear) — 선형 게인으로 I=-22 LUFS, TP 초과 시 게인만 자동 감소(압축 없음). */
async function encodeMp3(wav: string, measured: LoudnormMeasure, outFile: string): Promise<number> {
  const af =
    `loudnorm=I=${TARGET_LUFS}:TP=${TP_CEIL_DB}:LRA=20:linear=true` +
    `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
    `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}`;
  await execFileAsync(
    "ffmpeg",
    ["-y", "-i", wav,
      "-af", af,
      "-ar", "44100",
      "-c:a", "libmp3lame", "-q:a", VBR_QUALITY,
      "-vn", "-map_metadata", "-1", outFile],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outFile,
  ]);
  const d = parseFloat(stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe 실패: ${outFile}`);
  return d;
}

async function main() {
  const workDir = path.join(tmpdir(), "rt-ambience-v1-l22-tp2");
  const srcDir = path.join(workDir, "src");
  const outDir = path.join(workDir, "out");
  await mkdir(srcDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  console.log("=== 백색소음 빌드 ===");
  console.log(`작업 캐시: ${workDir}`);

  const results: { src: AmbienceSource; url: string; duration: number }[] = [];
  for (const src of SOURCES) {
    process.stdout.write(`\n[${src.id}] ${src.name}\n`);
    const input = await download(src, srcDir);
    process.stdout.write(`  ↓ 원본 확보\n`);
    const wav = path.join(outDir, `${src.id}.wav`);
    await makeLoopWav(src, input, wav);
    const measured = await measureLufs(wav);
    const basename = `ambience-${src.id}.mp3`;
    const outFile = path.join(outDir, basename);
    const duration = await encodeMp3(wav, measured, outFile);
    process.stdout.write(
      `  ✓ ${parseFloat(measured.input_i).toFixed(1)} LUFS → ${TARGET_LUFS} LUFS(linear) · ${duration.toFixed(1)}s\n`,
    );
    results.push({ src, url: `/music/${basename}`, duration: Math.round(duration * 1000) / 1000 });
  }

  // 전 채널 성공 → public/music 배치
  const publicMusic = path.join(process.cwd(), "public", "music");
  await mkdir(publicMusic, { recursive: true });
  for (const r of results) {
    const basename = path.basename(r.url);
    await execFileAsync(
      process.platform === "win32" ? "cmd" : "cp",
      process.platform === "win32"
        ? ["/c", "copy", "/y", path.join(outDir, basename), path.join(publicMusic, basename)]
        : [path.join(outDir, basename), path.join(publicMusic, basename)],
    );
  }

  // lib/music/ambience.ts 생성
  const genreObjs = results.map((r) => ({
    id: r.src.id,
    name: r.src.name,
    emoji: r.src.emoji,
    ambience: true,
    tracks: [
      { title: r.src.title, composer: r.src.recordist, url: r.url, duration: r.duration },
    ],
  }));
  const credits = results
    .map((r) => ` * - ${r.src.name}: ${r.src.recordist} — ${r.src.license} (${r.src.sourcePage})`)
    .join("\n");
  const fileContent =
    `// AUTO-GENERATED by scripts/build-ambience.ts — 직접 수정 금지.\n` +
    `// 재생성: npx tsx scripts/build-ambience.ts\n` +
    `/**\n * 백색소음 채널 — 채널당 1곡을 심리스 루프로 반복 재생한다.\n *\n * 음원 출처 (Wikimedia Commons):\n${credits}\n */\n` +
    `import type { MusicGenre } from "@/types/music";\n\n` +
    `export const AMBIENCE_GENRES: MusicGenre[] = ${JSON.stringify(genreObjs, null, 2)};\n`;
  const outPath = path.join(process.cwd(), "lib", "music", "ambience.ts");
  await writeFile(outPath, fileContent, "utf8");
  console.log(`\n✓ ${outPath} 생성 (${genreObjs.length}채널)`);
  console.log("=== 빌드 완료 ===");
}

main().catch((err) => {
  console.error("\n빌드 실패:", err);
  process.exit(1);
});
