import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { PipelineContext } from "../../src/types/common";
import { SERIES } from "../../src/config/series";

const execFileAsync = promisify(execFile);

export async function renderVideo(
  ctx: PipelineContext,
  props: Record<string, unknown>
): Promise<string> {
  const seriesConfig = SERIES[ctx.series];
  if (!seriesConfig) throw new Error(`Unknown series: ${ctx.series}`);

  const outputPath = path.join(ctx.workDir, `${ctx.series}-${Date.now()}.mp4`);

  await execFileAsync("npx", [
    "remotion", "render",
    "src/index.ts",
    seriesConfig.id,
    outputPath,
    "--props", JSON.stringify(props),
  ], {
    cwd: path.resolve(__dirname, "../.."),
    timeout: 300000, // 5분
  });

  return outputPath;
}
