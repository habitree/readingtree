import * as fs from "fs";
import * as path from "path";
import type { PageCheckResult } from "./page-checker";

const RESULTS_DIR = path.resolve(__dirname, "../../results");

export function saveResult(result: PageCheckResult): void {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const fileName = `${result.viewport}_${result.group}_${result.route.replace(/\//g, "_").replace(/^_/, "") || "home"}.json`;
  fs.writeFileSync(
    path.join(RESULTS_DIR, fileName),
    JSON.stringify(result, null, 2),
    "utf-8",
  );
}

export function loadAllResults(): PageCheckResult[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  const files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json") && f !== "playwright-results.json");
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), "utf-8")));
}
