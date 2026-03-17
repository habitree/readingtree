import { runPipeline } from "../pipeline/orchestrator";

async function generateWeekly() {
  console.log("=== ReadTree Weekly Content Generator ===");

  const series = ["book-review", "reading-tip"];
  for (const s of series) {
    console.log(`\n--- Generating ${s} ---`);
    await runPipeline(s);
  }

  console.log("\nWeekly generation complete!");
}

generateWeekly().catch(() => process.exit(1));
