import { runPipeline } from "./orchestrator";

const args = process.argv.slice(2);
const seriesIdx = args.indexOf("--series");
const series = seriesIdx !== -1 ? args[seriesIdx + 1] : "daily-quote";

if (!series) {
  console.error("Usage: tsx pipeline/cli.ts --series <series-name>");
  console.error("Available: daily-quote, book-review, reading-tip, book-vs-book, app-preview");
  process.exit(1);
}

console.log(`Starting pipeline for series: ${series}`);
runPipeline(series).catch(() => process.exit(1));
