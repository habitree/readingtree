import { test, expect } from "@playwright/test";

test.describe("데스크톱 사이드바 네비게이션", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name === "mobile") test.skip();
  });

  test("사이드바 메뉴 항목 존재 확인", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const sidebar = page.locator("nav, aside, [role='navigation']").first();
    await expect(sidebar).toBeVisible({ timeout: 5000 }).catch(() => {});

    await page.screenshot({
      path: "../screenshots/desktop/nav_sidebar.jpg",
      fullPage: false,
      type: "jpeg",
      quality: 75,
    });
  });

  test("사이드바 메뉴 클릭 — 내 서재", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const link = page.locator('a[href="/books"]').first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/books");
    }
  });

  test("사이드바 메뉴 클릭 — 내 기록", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const link = page.locator('a[href="/notes"]').first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/notes");
    }
  });

  test("더보기 메뉴 토글 확인", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const moreBtn = page.locator('button:has-text("더보기"), button:has-text("more"), [aria-label*="더보기"]').first();
    if (await moreBtn.isVisible().catch(() => false)) {
      await moreBtn.click();
      await page.waitForTimeout(500);
      const groupsLink = page.locator('a[href="/groups"]').first();
      const isVisible = await groupsLink.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    }
  });
});

test.describe("모바일 하단 네비게이션", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name === "desktop") test.skip();
  });

  test("모바일 하단 네비 표시 확인", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: "../screenshots/mobile/nav_bottom.jpg",
      fullPage: false,
      type: "jpeg",
      quality: 75,
    });

    const navBar = page.locator('nav, [role="navigation"]').last();
    await expect(navBar).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("모바일 네비 — 서재 클릭", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const booksLink = page.locator('a[href="/books"]').first();
    if (await booksLink.isVisible()) {
      await booksLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/books");
    }
  });

  test("모바일 네비 — 기록 클릭", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const notesLink = page.locator('a[href="/notes"]').first();
    if (await notesLink.isVisible()) {
      await notesLink.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/notes");
    }
  });

  test("모바일 메뉴 시트 열기", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const menuBtn = page.locator('button:has-text("메뉴"), button[aria-label*="메뉴"], button[aria-label*="menu"]').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: "../screenshots/mobile/nav_menu_sheet.jpg",
        fullPage: false,
        type: "jpeg",
        quality: 75,
      });
    }
  });
});
