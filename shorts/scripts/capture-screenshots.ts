import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const BASE_URL = "https://readingtree.vercel.app";
const OUT_DIR = path.resolve(__dirname, "../public/screenshots");

// PC: 1920x1080, Mobile: 390x844 (iPhone 14)
const viewports = {
  pc: { width: 1920, height: 1080, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

// 캡처할 페이지 목록 (공개 접근 가능 페이지)
const pages = [
  { name: "landing", path: "/", waitFor: 3000 },
  { name: "sample", path: "/sample", waitFor: 4000 },
  { name: "about", path: "/about", waitFor: 3000 },
  { name: "login", path: "/login", waitFor: 2000 },
  { name: "pricing", path: "/pricing", waitFor: 2000 },
];

async function findChrome(): Promise<string> {
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chrome or Edge not found");
}

async function main() {
  fs.mkdirSync(path.join(OUT_DIR, "pc"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "mobile"), { recursive: true });

  const executablePath = await findChrome();
  console.log(`Using browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const vp of ["pc", "mobile"] as const) {
    const viewport = viewports[vp];
    console.log(`\n--- Capturing ${vp} screenshots (${viewport.width}x${viewport.height}) ---`);

    const page = await browser.newPage();
    await page.setViewport(viewport);

    // 다크 모드 설정 (서비스 기본 테마)
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "dark" },
    ]);

    for (const p of pages) {
      const url = `${BASE_URL}${p.path}`;
      console.log(`  Capturing: ${url}`);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
        await new Promise((r) => setTimeout(r, p.waitFor));

        // 풀페이지 및 뷰포트 캡처
        await page.screenshot({
          path: path.join(OUT_DIR, vp, `${p.name}.png`),
          type: "png",
        });

        // 풀페이지 캡처 (스크롤 포함)
        await page.screenshot({
          path: path.join(OUT_DIR, vp, `${p.name}-full.png`),
          type: "png",
          fullPage: true,
        });

        console.log(`  OK: ${p.name}`);
      } catch (e) {
        console.error(`  FAIL: ${p.name} - ${e instanceof Error ? e.message : e}`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("\nAll screenshots captured!");
  console.log(`Output: ${OUT_DIR}`);
}

main().catch(console.error);
