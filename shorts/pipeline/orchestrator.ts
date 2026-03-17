import path from "path";
import fs from "fs";
import { PipelineContext, ShortsQueueItem } from "../src/types/common";
import { fetchData } from "./steps/01-fetch-data";
import { generateScriptStep } from "./steps/02-generate-script";
import { generateTTSStep } from "./steps/03-generate-tts";
import { renderVideo } from "./steps/04-render-video";
import { postProcess } from "./steps/05-post-process";
import { uploadToStorage } from "./steps/06-upload";
import { getCostSummary } from "./utils/cost-tracker";

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * TTS 파일을 public/audio/tts/에 복사하고 Remotion staticFile()용 상대경로 반환
 * staticFile()은 public/ 기준 상대경로를 기대
 */
function copyTTSToPublic(ttsAbsolutePath: string, series: string): string {
  const publicTtsDir = path.join(PROJECT_ROOT, "public", "audio", "tts");
  fs.mkdirSync(publicTtsDir, { recursive: true });

  const filename = `${series}-${Date.now()}.mp3`;
  const destPath = path.join(publicTtsDir, filename);
  fs.copyFileSync(ttsAbsolutePath, destPath);

  // staticFile()이 인식하는 상대경로 (public/ 기준)
  return `audio/tts/${filename}`;
}

export async function runPipeline(series: string): Promise<void> {
  const workDir = path.resolve(PROJECT_ROOT, `output/${series}-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  const ctx: PipelineContext = {
    queueItem: {
      id: `local-${Date.now()}`,
      series,
      status: "pending",
      inputData: {},
      scriptText: null,
      ttsAudioUrl: null,
      videoUrl: null,
      thumbnailUrl: null,
      metadata: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    workDir,
    series,
  };

  try {
    console.log(`[1/6] Fetching data for ${series}...`);
    const inputData = await fetchData(ctx);

    console.log(`[2/6] Generating script...`);
    const script = await generateScriptStep(ctx, inputData);

    console.log(`[3/6] Generating TTS...`);
    const ttsAbsPath = await generateTTSStep(ctx, script);
    const ttsRelativePath = copyTTSToPublic(ttsAbsPath, series);
    console.log(`    TTS: ${ttsRelativePath}`);

    console.log(`[4/6] Rendering video...`);
    const props = { ...inputData, audioUrl: ttsRelativePath, seriesId: series };
    const videoPath = await renderVideo(ctx, props);

    console.log(`[5/6] Post-processing...`);
    const result = await postProcess(ctx, videoPath);

    console.log(`[6/6] Uploading...`);
    const urls = await uploadToStorage(ctx, result.videoPath, result.thumbnailPath);

    console.log(`Pipeline complete!`);
    console.log(`Video: ${urls.videoUrl}`);
    console.log(getCostSummary());
  } catch (error) {
    console.error(`Pipeline failed:`, error instanceof Error ? error.message : error);
    throw error;
  }
}
