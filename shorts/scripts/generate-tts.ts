import path from "path";
import fs from "fs";
import { generateTTS } from "../pipeline/utils/edge-tts";
import { narrationScripts } from "../src/config/narration";

const OUTPUT_DIR = path.resolve(__dirname, "../public/audio/tts");

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = Object.entries(narrationScripts);
  console.log(`Generating TTS for ${entries.length} narrations...`);

  for (const [key, text] of entries) {
    const outputPath = path.join(OUTPUT_DIR, `${key}.mp3`);
    console.log(`  [${key}] generating...`);
    try {
      await generateTTS(text, outputPath);
      console.log(`  [${key}] done -> ${outputPath}`);
    } catch (err) {
      console.error(`  [${key}] FAILED:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("All TTS generation complete.");
}

main();
