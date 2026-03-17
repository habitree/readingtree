import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.CAPTURE_URL || "http://localhost:3001";
const OUT_DIR = path.resolve(__dirname, "../public/screenshots");

const viewports = {
  pc: { width: 1440, height: 900, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

// 페이지 목록: 공개 + 샘플 페이지
const pages = [
  { name: "landing", path: "/", wait: 4000 },
  { name: "sample", path: "/sample", wait: 5000 },
  { name: "about", path: "/about", wait: 3000 },
  { name: "login", path: "/login", wait: 3000 },
  { name: "pricing", path: "/pricing", wait: 3000 },
  { name: "terms", path: "/terms", wait: 2000 },
];

async function findChrome(): Promise<string> {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    (process.env.LOCALAPPDATA || "") + "/Google/Chrome/Application/chrome.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chrome not found");
}

async function main() {
  for (const vp of ["pc", "mobile"] as const) {
    fs.mkdirSync(path.join(OUT_DIR, vp), { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: await findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  for (const vp of ["pc", "mobile"] as const) {
    const viewport = viewports[vp];
    console.log(`\n=== ${vp.toUpperCase()} (${viewport.width}x${viewport.height}) ===`);

    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "dark" },
    ]);

    for (const p of pages) {
      try {
        console.log(`  ${p.name}...`);
        await page.goto(`${BASE_URL}${p.path}`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        await new Promise((r) => setTimeout(r, p.wait));

        // 뷰포트 캡처
        await page.screenshot({
          path: path.join(OUT_DIR, vp, `${p.name}.png`),
          type: "png",
        });

        // 풀페이지
        await page.screenshot({
          path: path.join(OUT_DIR, vp, `${p.name}-full.png`),
          type: "png",
          fullPage: true,
        });

        console.log(`  OK`);
      } catch (e) {
        console.error(`  FAIL: ${e instanceof Error ? e.message : e}`);
      }
    }
    await page.close();
  }

  await browser.close();

  // 파일 크기 확인
  for (const vp of ["pc", "mobile"]) {
    const dir = path.join(OUT_DIR, vp);
    const files = fs.readdirSync(dir);
    console.log(`\n${vp}:`);
    for (const f of files) {
      const stat = fs.statSync(path.join(dir, f));
      console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)}KB`);
    }
  }
}

main().catch(console.error);
