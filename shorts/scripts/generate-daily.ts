import { runPipeline } from "../pipeline/orchestrator";

console.log("=== ReadTree Daily Quote Generator ===");
runPipeline("daily-quote").catch(() => process.exit(1));
