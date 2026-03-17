import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

async function preview() {
  console.log("Starting Remotion Studio preview...");
  const cwd = path.resolve(__dirname, "..");

  const child = execFileAsync("npx", ["remotion", "studio", "src/index.ts"], {
    cwd,
    timeout: 0,
  });

  child.child.stdout?.pipe(process.stdout);
  child.child.stderr?.pipe(process.stderr);
}

preview().catch(console.error);
