import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { ttsConfig } from "../../src/config/audio";

const execAsync = promisify(exec);

/**
 * Edge TTS를 사용하여 텍스트를 음성으로 변환
 * edge-tts Python CLI를 내부적으로 호출
 */
export async function generateTTS(
  text: string,
  outputPath: string,
  voice?: string
): Promise<string> {
  const resolvedPath = path.resolve(outputPath);
  const selectedVoice = voice ?? ttsConfig.voice;

  const tmpFile = path.join(os.tmpdir(), `tts-input-${Date.now()}.txt`);
  try {
    fs.writeFileSync(tmpFile, text, "utf-8");

    const cmd = [
      "edge-tts",
      `--voice "${selectedVoice}"`,
      `--rate "${ttsConfig.rate}"`,
      `--pitch "${ttsConfig.pitch}"`,
      `-f "${tmpFile}"`,
      `--write-media "${resolvedPath}"`,
    ].join(" ");

    await execAsync(cmd, { timeout: 30000 });
  } catch (error) {
    throw new Error(`Edge TTS generation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }

  return resolvedPath;
}
