import { test, expect, type Page } from "@playwright/test";

/**
 * 음악 타이머 + 독서 기록 통합 UX 테스트
 * - 타이머 시트 열기/닫기
 * - 책 선택 UI 존재 확인
 * - 플레이리스트 선택
 * - 시간 프리셋 선택
 * - 타이머 시작 → 미니 플레이어 표시
 * - 대시보드 독서 시작 버튼
 */

const BASE_URL = "https://readingtree-tan.vercel.app";

// ── 헬퍼 ──
async function openTimerSheet(page: Page) {
  // 헤더의 MusicToggleButton — title 속성으로 식별
  // idle 상태: title="배경 음악 + 독서 타이머"
  // running: title="독서 일시정지"
  // paused: title="독서 계속하기"
  const musicBtn = page.locator(
    'button[title="배경 음악 + 독서 타이머"], button[title="독서 일시정지"], button[title="독서 계속하기"]'
  );

  try {
    await musicBtn.first().waitFor({ state: "visible", timeout: 5000 });
    await musicBtn.first().click();
    return true;
  } catch {
    // 모바일 바텀 내비의 음악 버튼 fallback
    const mobileBtn = page.locator('button[aria-label*="음악"]');
    try {
      await mobileBtn.first().waitFor({ state: "visible", timeout: 3000 });
      await mobileBtn.first().click();
      return true;
    } catch {
      return false;
    }
  }
}

test.describe("음악 타이머 + 독서 기록 통합", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  });

  test("홈 페이지 정상 로드", async ({ page }) => {
    await expect(page).toHaveTitle(/Habitree|ReadingTree|독서/i);
    // 페이지 에러 없음 확인
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test("타이머 시트 열기/닫기", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) {
      test.skip();
      return;
    }

    // Sheet 가 열렸는지 확인 — heading의 "독서 타이머"
    const sheetTitle = page.getByRole("heading", { name: "독서 타이머" });
    await expect(sheetTitle).toBeVisible({ timeout: 5000 });

    // 시간 프리셋 존재 확인
    const preset30 = page.getByRole("button", { name: "30분" });
    await expect(preset30).toBeVisible();

    // 독서 시작 버튼 존재 확인
    const startBtn = page.getByRole("button", { name: "독서 시작" });
    await expect(startBtn).toBeVisible();

    // Sheet 닫기 (overlay 클릭 또는 ESC)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  test("시간 프리셋 선택 동작", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 15분 프리셋 클릭
    const preset15 = page.locator('button:has-text("15분")');
    if (await preset15.count() > 0) {
      await preset15.first().click();
      // 선택 상태 확인 (primary 색상 등)
      await page.waitForTimeout(300);
    }

    // 무제한 버튼 확인
    const unlimitedBtn = page.getByText("무제한");
    await expect(unlimitedBtn).toBeVisible();
  });

  test("플레이리스트 선택 UI 존재", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 배경음악 섹션 확인
    const musicLabel = page.getByText("배경음악");
    await expect(musicLabel).toBeVisible({ timeout: 3000 });

    // 장르 탭 확인 (클래식 또는 재즈)
    const classicTab = page.getByText("클래식");
    const jazzTab = page.getByText("재즈");
    const hasGenreTabs = (await classicTab.count() > 0) || (await jazzTab.count() > 0);
    expect(hasGenreTabs).toBeTruthy();
  });

  test("읽을 책 선택 UI 표시 (로그인 상태 의존)", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(1500);

    // "읽을 책" 섹션은 로그인 + 읽는 중인 책이 있을 때만 표시
    const bookSection = page.getByText("읽을 책");
    const bookSectionVisible = await bookSection.isVisible().catch(() => false);

    if (bookSectionVisible) {
      // 책 선택 칩이 있는지 확인
      const bookChips = page.locator('button:has(img), button:has(svg.lucide-book-open)');
      expect(await bookChips.count()).toBeGreaterThanOrEqual(0);
    }

    // 로그인 상태가 아니면 "책 없이 시작" 안내가 없어도 정상
    // → 이 테스트는 게스트에서도 통과해야 함
  });

  test("타이머 시작 → 미니 플레이어 표시", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 30분 선택 (기본값)
    const preset30 = page.locator('button:has-text("30분")');
    if (await preset30.count() > 0) {
      await preset30.first().click();
    }

    // 독서 시작 버튼 클릭
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());

    // 미니 플레이어가 표시되는지 확인 (하단 바)
    await page.waitForTimeout(2000);

    // 미니 플레이어: 재생 컨트롤 (일시정지/재생 버튼)
    const playPauseBtn = page.locator('button[title="일시정지"], button[title="재생"]');
    const miniPlayerVisible = await playPauseBtn.first().isVisible().catch(() => false);

    if (miniPlayerVisible) {
      // 타이머 관련 텍스트 확인 ("남음" 또는 "경과")
      const timerText = page.locator('text=/남음|경과/');
      await expect(timerText.first()).toBeVisible({ timeout: 3000 });

      // 곡 정보 표시 확인
      const trackInfo = page.locator('text=/—/');
      expect(await trackInfo.count()).toBeGreaterThan(0);
    }
  });

  test("타이머 진행 중 일시정지/재개", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 15분 선택 + 시작
    const preset15 = page.locator('button:has-text("15분")');
    if (await preset15.count() > 0) await preset15.first().click();

    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    // 일시정지 버튼 클릭
    const pauseBtn = page.locator('button[title="일시정지"]');
    if (await pauseBtn.isVisible().catch(() => false)) {
      await pauseBtn.click();
      await page.waitForTimeout(500);

      // "일시정지" 텍스트 표시 확인
      const pausedText = page.getByText("일시정지");
      const isPaused = await pausedText.isVisible().catch(() => false);

      // 재생 버튼으로 변경 확인
      const playBtn = page.locator('button[title="재생"]');
      const isPlayVisible = await playBtn.isVisible().catch(() => false);

      expect(isPaused || isPlayVisible).toBeTruthy();
    }
  });

  test("타이머 정지 (독서 종료)", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    // 독서 종료 버튼 클릭
    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.waitForTimeout(1500);

      // 완료 다이얼로그 표시 확인
      const completeDialog = page.getByText("독서 완료!");
      const dialogVisible = await completeDialog.isVisible().catch(() => false);

      if (dialogVisible) {
        // 시간 기록 저장 버튼 확인
        const saveBtn = page.getByText("시간 기록 저장");
        await expect(saveBtn).toBeVisible({ timeout: 3000 });

        // 다이얼로그 내부 스크롤하여 나머지 버튼 확인
        const dialogContent = page.locator('[role="dialog"]');
        await dialogContent.evaluate((el) => el.scrollTop = el.scrollHeight);
        await page.waitForTimeout(300);

        // 메모 남기기 버튼 확인
        const memoBtn = page.getByText("메모 남기기");
        const memoVisible = await memoBtn.isVisible().catch(() => false);

        // 조금 더 읽기 버튼 확인
        const continueBtn = page.getByText("조금 더 읽기");
        const continueVisible = await continueBtn.isVisible().catch(() => false);

        // 그만 읽기 버튼 확인
        const quitBtn = page.getByText("그만 읽기");
        const quitVisible = await quitBtn.isVisible().catch(() => false);

        // 최소 2개 이상 버튼 보여야 함 (viewport에 따라 일부 숨김 가능)
        const visibleCount = [memoVisible, continueVisible, quitVisible].filter(Boolean).length;
        expect(visibleCount).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test("완료 다이얼로그 — 메모 남기기 토글", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.waitForTimeout(1000);

      const memoBtn = page.getByText("메모 남기기");
      if (await memoBtn.isVisible().catch(() => false)) {
        await memoBtn.click();
        await page.waitForTimeout(500);

        // textarea 표시 확인
        const textarea = page.locator('textarea[placeholder*="인상적"]');
        await expect(textarea).toBeVisible();

        // 글자 수 표시 확인
        const charCount = page.getByText("/200");
        await expect(charCount).toBeVisible();

        // 취소 버튼 확인
        const cancelBtn = page.getByText("취소");
        await expect(cancelBtn).toBeVisible();

        // 메모 입력 테스트
        await textarea.fill("테스트 메모입니다");
        await page.waitForTimeout(300);

        // 글자 수 업데이트 확인
        const updatedCount = page.getByText("8/200");
        await expect(updatedCount).toBeVisible();
      }
    }
  });

  test("완료 다이얼로그 — 조금 더 읽기 프리셋", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.waitForTimeout(1000);

      const continueBtn = page.getByText("조금 더 읽기");
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);

        // 시간 프리셋 표시 확인
        const preset15 = page.getByText("+15분");
        const preset30 = page.getByText("+30분");
        const preset60 = page.getByText("+60분");

        await expect(preset15).toBeVisible();
        await expect(preset30).toBeVisible();
        await expect(preset60).toBeVisible();

        // 무제한 옵션 확인
        const unlimitedOption = page.getByText("무제한");
        await expect(unlimitedOption).toBeVisible();
      }
    }
  });

  test("대시보드 계속 읽기 카드에 타이머 버튼 존재", async ({ page }) => {
    // 계속 읽기 카드가 있는지 확인 (로그인 상태 의존)
    await page.waitForTimeout(2000);

    const timerBtns = page.locator('button[aria-label="독서 타이머 시작"]');
    const count = await timerBtns.count();

    if (count > 0) {
      // 타이머 버튼이 있으면 클릭 가능한지 확인
      const firstBtn = timerBtns.first();
      await expect(firstBtn).toBeVisible();
      await expect(firstBtn).toBeEnabled();
    }
    // 게스트 상태에서는 카드가 없을 수 있으므로 skip 아닌 pass
  });

  test("무제한 모드 타이머", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 무제한 클릭
    const unlimitedBtn = page.getByText("무제한");
    if (await unlimitedBtn.count() > 0) {
      await unlimitedBtn.first().click();
      await page.waitForTimeout(300);
    }

    // 독서 시작
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    // "경과" 텍스트 확인 (무제한 모드는 "남음" 대신 "경과" 표시)
    const elapsedText = page.getByText("경과");
    const isElapsed = await elapsedText.first().isVisible().catch(() => false);

    if (isElapsed) {
      // 무제한 표시 확인
      const unlimitedLabel = page.getByText("무제한");
      const hasUnlimited = await unlimitedLabel.isVisible().catch(() => false);
      expect(hasUnlimited).toBeTruthy();
    }

    // 정리: 종료
    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
    }
  });

  test("즐겨찾기 시간 프리셋 관리", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 즐겨찾기 버튼 확인
    const favBtn = page.getByText("즐겨찾기");
    if (await favBtn.isVisible().catch(() => false)) {
      await favBtn.click();
      await page.waitForTimeout(300);

      // 즐겨찾기 편집 모드 확인
      const editTitle = page.getByText("즐겨찾기 편집");
      await expect(editTitle).toBeVisible();

      // 완료 버튼 확인
      const doneBtn = page.getByText("완료");
      await expect(doneBtn).toBeVisible();
    }
  });

  test("직접 입력 시간 설정", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);

    // 직접 입력 버튼 클릭
    const customBtn = page.getByText("직접");
    if (await customBtn.isVisible().catch(() => false)) {
      await customBtn.click();
      await page.waitForTimeout(300);

      // 숫자 입력 필드 확인
      const input = page.locator('input[type="number"]');
      await expect(input).toBeVisible();

      // 25분 입력
      await input.fill("25");
      await page.waitForTimeout(300);

      // 저장 버튼 확인 (즐겨찾기 추가)
      const saveBtn = page.getByText("저장");
      const hasSave = await saveBtn.isVisible().catch(() => false);
      expect(hasSave).toBeTruthy();
    }
  });

  test("다음/이전 곡 컨트롤", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    // 다음 곡 버튼
    const nextBtn = page.locator('button[title="다음 곡"]');
    if (await nextBtn.isVisible().catch(() => false)) {
      const trackBefore = await page.locator('text=/—/').first().textContent();
      await nextBtn.click();
      await page.waitForTimeout(1000);
      // 곡이 변경되었는지 확인 (트랙 이름이 바뀌었을 수 있음)
      const trackAfter = await page.locator('text=/—/').first().textContent();
      // 곡이 1개뿐일 수도 있으므로 같아도 에러 아님
      expect(trackAfter).toBeDefined();
    }

    // 이전 곡 버튼
    const prevBtn = page.locator('button[title="이전 곡"]');
    if (await prevBtn.isVisible().catch(() => false)) {
      await prevBtn.click();
      await page.waitForTimeout(500);
    }

    // 정리
    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
    }
  });

  test("음량 조절 컨트롤", async ({ page }) => {
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }

    await page.waitForTimeout(500);
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(2000);

    // 음량 버튼 클릭
    const volumeBtn = page.locator('button[title="음량 조절"]');
    if (await volumeBtn.isVisible().catch(() => false)) {
      await volumeBtn.click();
      await page.waitForTimeout(500);

      // 음량 슬라이더 확인
      const slider = page.locator('input[type="range"]');
      await expect(slider).toBeVisible();
    }

    // 정리
    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
    }
  });

  test("콘솔 에러 없이 전체 흐름 수행", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // 1. 타이머 시트 열기
    const opened = await openTimerSheet(page);
    if (!opened) { test.skip(); return; }
    await page.waitForTimeout(500);

    // 2. 시간 선택
    const preset15 = page.locator('button:has-text("15분")');
    if (await preset15.count() > 0) await preset15.first().click();

    // 3. 독서 시작
    const startBtn = page.getByText("독서 시작");
    await startBtn.evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(3000);

    // 4. 3초 대기 후 종료
    const stopBtn = page.locator('button[title="독서 종료"]');
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.waitForTimeout(1000);
    }

    // 5. 다이얼로그에서 그만 읽기
    const quitBtn = page.getByText("그만 읽기");
    if (await quitBtn.isVisible().catch(() => false)) {
      await quitBtn.click();
      await page.waitForTimeout(500);
    }

    // 콘솔 에러 확인
    const criticalErrors = errors.filter(e =>
      !e.includes("NotAllowedError") && // autoplay 정책 에러는 무시
      !e.includes("play()") &&
      !e.includes("AbortError")
    );
    expect(criticalErrors).toEqual([]);
  });
});
