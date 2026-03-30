import type { Page } from "@playwright/test";
import { CONSOLE_NOISE_FILTERS, type PageInfo } from "./constants";
import * as path from "path";
import * as fs from "fs";

export interface ConsoleMsg {
  type: string;
  text: string;
}

export interface PageCheckResult {
  url: string;
  route: string;
  name: string;
  group: string;
  viewport: string;
  timestamp: string;
  httpStatus: number;
  redirectedTo: string | null;
  loadTimeMs: number;
  consoleErrors: ConsoleMsg[];
  consoleWarnings: ConsoleMsg[];
  jsErrors: string[];
  brokenImages: { src: string; alt: string }[];
  layoutIssues: string[];
  screenshotPath: string;
  severity: "pass" | "critical" | "major" | "minor" | "info";
}

function isNoise(text: string): boolean {
  return CONSOLE_NOISE_FILTERS.some((re) => re.test(text));
}

function classifySeverity(result: Omit<PageCheckResult, "severity">): PageCheckResult["severity"] {
  // Critical: 5xx or unhandled JS errors
  if (result.httpStatus >= 500) return "critical";
  if (result.jsErrors.length > 0) return "critical";

  // Major: 4xx (non-auth redirect), many broken images, layout issues, slow load
  const is4xxReal = result.httpStatus >= 400 && !result.redirectedTo?.includes("/login");
  if (is4xxReal) return "major";
  if (result.brokenImages.length >= 3) return "major";
  if (result.layoutIssues.length > 0) return "major";
  if (result.loadTimeMs > 10000) return "major";
  if (result.consoleErrors.length >= 5) return "major";

  // Minor
  if (result.brokenImages.length >= 1) return "minor";
  if (result.loadTimeMs > 5000) return "minor";
  if (result.consoleErrors.length >= 1) return "minor";

  // Info
  if (result.loadTimeMs > 3000) return "info";
  if (result.consoleWarnings.length >= 3) return "info";

  return "pass";
}

export async function checkPage(
  page: Page,
  pageInfo: PageInfo,
  viewport: string,
): Promise<PageCheckResult> {
  const consoleErrors: ConsoleMsg[] = [];
  const consoleWarnings: ConsoleMsg[] = [];
  const jsErrors: string[] = [];

  // 1. Console listener
  page.on("console", (msg) => {
    const text = msg.text();
    if (isNoise(text)) return;
    if (msg.type() === "error") {
      consoleErrors.push({ type: "error", text });
    } else if (msg.type() === "warning") {
      consoleWarnings.push({ type: "warning", text });
    }
  });

  // 2. JS error listener
  page.on("pageerror", (err) => {
    jsErrors.push(err.message);
  });

  // 3. Navigate
  const startTime = Date.now();
  let httpStatus = 0;
  let redirectedTo: string | null = null;

  try {
    const response = await page.goto(pageInfo.route, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    httpStatus = response?.status() ?? 0;

    // Wait a bit more for client-side rendering
    await page.waitForTimeout(2000);
  } catch (e) {
    httpStatus = 0; // timeout or network error
    jsErrors.push(`Navigation error: ${(e as Error).message}`);
  }

  const loadTimeMs = Date.now() - startTime;

  // Check redirect
  const finalUrl = page.url();
  const baseUrl = "https://readingtree-tan.vercel.app";
  const expectedUrl = `${baseUrl}${pageInfo.route}`;
  if (!finalUrl.startsWith(expectedUrl.split("?")[0])) {
    redirectedTo = finalUrl.replace(baseUrl, "");
  }

  // If auth required and redirected to login, mark as expected
  if (pageInfo.requiresAuth && redirectedTo?.includes("/login")) {
    // Expected behavior - don't count as error
  }

  // 4. Check broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter((img) => img.src && img.naturalWidth === 0 && img.complete)
      .map((img) => ({ src: img.src, alt: img.alt || "(no alt)" }));
  }).catch(() => []);

  // 5. Check layout issues
  const layoutIssues = await page.evaluate(() => {
    const issues: string[] = [];
    const body = document.body;
    if (body.scrollWidth > window.innerWidth + 5) {
      issues.push(`가로 스크롤 발생: body(${body.scrollWidth}px) > viewport(${window.innerWidth}px)`);
    }
    return issues;
  }).catch(() => []);

  // 6. Screenshot
  const screenshotDir = path.resolve(__dirname, `../../screenshots/${viewport}`);
  fs.mkdirSync(screenshotDir, { recursive: true });
  const safeName = pageInfo.route.replace(/\//g, "_").replace(/^_/, "") || "home";
  const screenshotPath = `screenshots/${viewport}/${safeName}.jpg`;
  const screenshotFullPath = path.resolve(__dirname, `../../${screenshotPath}`);

  try {
    await page.screenshot({
      path: screenshotFullPath,
      fullPage: true,
      type: "jpeg",
      quality: 75,
    });
  } catch {
    // screenshot failure is non-critical
  }

  // Clean up listeners
  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");

  const partial = {
    url: finalUrl,
    route: pageInfo.route,
    name: pageInfo.name,
    group: pageInfo.group,
    viewport,
    timestamp: new Date().toISOString(),
    httpStatus,
    redirectedTo,
    loadTimeMs,
    consoleErrors,
    consoleWarnings,
    jsErrors,
    brokenImages,
    layoutIssues,
    screenshotPath,
  };

  return {
    ...partial,
    severity: classifySeverity(partial),
  };
}
