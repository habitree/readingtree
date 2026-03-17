import { PipelineContext } from "../../src/types/common";
import { generateScript } from "../utils/openai";

export async function generateScriptStep(
  ctx: PipelineContext,
  inputData: Record<string, unknown>
): Promise<string> {
  const { series } = ctx;
  const script = await generateScript(series, inputData);
  return script;
}
