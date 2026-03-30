import { test, expect } from "@playwright/test";
import { checkPage } from "../helpers/page-checker";
import { saveResult } from "../helpers/report-collector";
import { STATIC_MISC_PAGES } from "../helpers/constants";

for (const pageInfo of STATIC_MISC_PAGES) {
  test(`[${pageInfo.group}] ${pageInfo.name} (${pageInfo.route})`, async ({ page }, testInfo) => {
    const viewport = testInfo.project.name;
    await page.waitForTimeout(300);

    const result = await checkPage(page, pageInfo, viewport);
    saveResult(result);

    await testInfo.attach("qa-result", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });

    // Share pages with test-id may return 404 - that's expected
    if (pageInfo.group === "share") {
      // Just check it doesn't crash (5xx)
      expect(result.httpStatus).not.toBeGreaterThanOrEqual(500);
    } else {
      expect(result.httpStatus, `HTTP 상태: ${result.httpStatus}`).toBeLessThan(500);
    }
  });
}
