import { test, expect } from "@playwright/test";
import { checkPage } from "../helpers/page-checker";
import { saveResult } from "../helpers/report-collector";
import { MAIN_SOCIAL_PAGES } from "../helpers/constants";

for (const pageInfo of MAIN_SOCIAL_PAGES) {
  test(`[${pageInfo.group}] ${pageInfo.name} (${pageInfo.route})`, async ({ page }, testInfo) => {
    const viewport = testInfo.project.name;
    await page.waitForTimeout(300);

    const result = await checkPage(page, pageInfo, viewport);
    saveResult(result);

    await testInfo.attach("qa-result", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });

    if (!pageInfo.requiresAuth || !result.redirectedTo?.includes("/login")) {
      expect(result.httpStatus, `HTTP 상태: ${result.httpStatus}`).toBeLessThan(500);
    }
  });
}
