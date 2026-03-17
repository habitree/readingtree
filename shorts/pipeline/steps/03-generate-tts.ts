import path from "path";
import { PipelineContext } from "../../src/types/common";
import { generateTTS } from "../utils/edge-tts";

export async function generateTTSStep(
  ctx: PipelineContext,
  script: string
): Promise<string> {
  const outputPath = path.join(ctx.workDir, "narration.mp3");
  await generateTTS(script, outputPath);
  return outputPath;
}
