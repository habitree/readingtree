/**
 * 토스페이먼츠 결제경로 스크린샷 자동 캡처 + HTML 문서 생성
 *
 * 사용법:
 *   node scripts/capture-payment-flow.mjs
 *
 * 출력:
 *   img/payment-flow/  → 스크린샷 PNG 파일
 *   doc/legal/payment-flow.html → 결제경로 문서 (PDF 변환용)
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IMG_DIR = join(ROOT, "img", "payment-flow");
const DOC_DIR = join(ROOT, "doc", "legal");

const BASE_URL = "https://readingtree-tan.vercel.app";
const DEMO_EMAIL = "demo@readtree.app";
const DEMO_PW = "readtree";

mkdirSync(IMG_DIR, { recursive: true });
mkdirSync(DOC_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ko-KR",
  });
  const page = await context.newPage();

  const screenshots = [];

  // --- Step 1: 홈페이지 메인 ---
  console.log("[1/6] 홈페이지 메인 캡처...");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const s1 = join(IMG_DIR, "01-homepage.png");
  await page.screenshot({ path: s1, fullPage: false });
  screenshots.push({ path: "01-homepage.png", title: "1. 홈페이지 메인", desc: "ReadTree 서비스 메인 페이지" });

  // --- Step 2: 로그인 ---
  console.log("[2/6] 로그인 진행...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // 이메일 로그인 접이식 펼치기 (소셜 로그인이 기본이므로)
  const expandBtn = page.locator('button:has-text("다른 방법"), button:has-text("other"), button:has-text("기타")').first();
  if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expandBtn.click();
    await page.waitForTimeout(500);
  } else {
    // ChevronDown 있는 버튼 찾기
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down, svg[class*="chevron"]') }).first();
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 이메일 입력
  const emailInput = page.locator('#email, input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 5000 });
  await emailInput.fill(DEMO_EMAIL);

  // 비밀번호 입력
  const pwInput = page.locator('#password, input[type="password"]').first();
  await pwInput.fill(DEMO_PW);

  // 로그인 버튼 클릭
  const loginBtn = page.locator('button[type="submit"]').first();
  await loginBtn.click();

  // 로그인 후 리다이렉트 대기
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // --- Step 3: 포인트 충전 페이지 ---
  console.log("[3/6] 포인트 충전 페이지 캡처...");
  await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const s3 = join(IMG_DIR, "02-pricing.png");
  await page.screenshot({ path: s3, fullPage: false });
  screenshots.push({ path: "02-pricing.png", title: "2. 포인트 충전 페이지", desc: "라이트(₩1,900) / 스탠다드(₩3,900) / 프리미엄(₩6,900) 3종 패키지" });

  // --- Step 4: 패키지 선택 (충전하기 버튼 근처) ---
  console.log("[4/6] 패키지 선택 화면 캡처...");
  // 스탠다드 패키지 영역으로 스크롤
  const chargeBtn = page.locator('button:has-text("충전"), button:has-text("구매")').first();
  if (await chargeBtn.isVisible().catch(() => false)) {
    await chargeBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  const s4 = join(IMG_DIR, "03-package-select.png");
  await page.screenshot({ path: s4, fullPage: false });
  screenshots.push({ path: "03-package-select.png", title: "3. 패키지 선택", desc: "충전하기 버튼을 통해 결제 진행" });

  // --- Step 5: 결제창 (토스 결제창은 외부이므로 클릭 후 캡처 시도) ---
  console.log("[5/6] 결제창 캡처 시도...");
  let paymentCaptured = false;
  try {
    // 충전 버튼 클릭 시도
    if (await chargeBtn.isVisible().catch(() => false)) {
      await chargeBtn.click();
      await page.waitForTimeout(3000);

      // 토스 결제 위젯/iframe 또는 모달 확인
      const s5 = join(IMG_DIR, "04-payment-widget.png");
      await page.screenshot({ path: s5, fullPage: false });
      screenshots.push({ path: "04-payment-widget.png", title: "4. 결제창", desc: "토스페이먼츠 결제 수단 선택 화면 (신용카드, 간편결제, 계좌이체)" });
      paymentCaptured = true;
    }
  } catch {
    console.log("  → 결제창 캡처 실패 (수동 캡처 필요)");
  }

  if (!paymentCaptured) {
    screenshots.push({ path: "04-payment-widget.png", title: "4. 결제창", desc: "토스페이먼츠 결제 수단 선택 화면 (수동 스크린샷 필요)" });
  }

  // --- Step 6: 결제 완료 페이지 ---
  console.log("[6/6] 결제 완료 페이지 캡처...");
  await page.goto(`${BASE_URL}/payment/success?orderId=SAMPLE&paymentKey=SAMPLE&amount=3900`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const s6 = join(IMG_DIR, "05-payment-success.png");
  await page.screenshot({ path: s6, fullPage: false });
  screenshots.push({ path: "05-payment-success.png", title: "5. 결제 완료", desc: "결제 완료 확인 페이지" });

  await browser.close();

  // --- HTML 문서 생성 ---
  console.log("\n결제경로 HTML 문서 생성...");
  generateHTML(screenshots);

  console.log("\n✅ 완료!");
  console.log(`   스크린샷: img/payment-flow/`);
  console.log(`   결제경로 문서: doc/legal/payment-flow.html`);
  console.log(`\n📌 브라우저에서 doc/legal/payment-flow.html 열고 Ctrl+P → PDF로 저장하세요.`);
}

function generateHTML(screenshots) {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>결제경로 안내 - 해빗트리(habitree)</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { font-size: 14px; color: #666; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
    .info-table td { padding: 8px 12px; border: 1px solid #ddd; }
    .info-table td:first-child { background: #f5f5f5; font-weight: 600; width: 140px; }
    .step { margin-bottom: 30px; page-break-inside: avoid; }
    .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .step-number { background: #333; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .step-title { font-size: 16px; font-weight: 600; }
    .step-desc { font-size: 13px; color: #666; margin-bottom: 8px; padding-left: 38px; }
    .step-img { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .step-img img { width: 100%; display: block; }
    .step-img .placeholder { background: #f9f9f9; padding: 60px; text-align: center; color: #999; font-size: 14px; }
    .flow-arrow { text-align: center; font-size: 24px; color: #999; margin: 10px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>

  <div class="header">
    <h1>결제경로 안내</h1>
    <p>해빗트리(habitree) - ReadTree 독서 기록 서비스</p>
  </div>

  <table class="info-table">
    <tr><td>상호명</td><td>해빗트리(habitree)</td></tr>
    <tr><td>서비스명</td><td>ReadTree - 독서 기록 관리 웹서비스</td></tr>
    <tr><td>서비스 URL</td><td>https://readtree.app</td></tr>
    <tr><td>결제 상품</td><td>포인트 충전 (라이트 ₩1,900 / 스탠다드 ₩3,900 / 프리미엄 ₩6,900)</td></tr>
    <tr><td>결제 수단</td><td>신용카드, 계좌이체, 간편결제</td></tr>
    <tr><td>상점아이디(MID)</td><td>linkma6qc5</td></tr>
  </table>

  <h2 style="font-size:18px; margin-bottom: 20px;">결제 흐름</h2>

${screenshots.map((s, i) => `
  <div class="step">
    <div class="step-header">
      <div class="step-number">${i + 1}</div>
      <div class="step-title">${s.title}</div>
    </div>
    <p class="step-desc">${s.desc}</p>
    <div class="step-img">
      <img src="../../img/payment-flow/${s.path}" alt="${s.title}" onerror="this.parentElement.innerHTML='<div class=placeholder>스크린샷: ${s.path}<br>이미지를 img/payment-flow/ 폴더에 넣어주세요</div>'" />
    </div>
  </div>
  ${i < screenshots.length - 1 ? '<div class="flow-arrow">▼</div>' : ''}
`).join("")}

  <div class="footer">
    <p>해빗트리(habitree) | 대표: 최동혁 | 사업자등록번호: 171-56-00503</p>
    <p>서울특별시 광진구 동일로20길 44 | 연락처: 010-9988-4810 | 이메일: cdhrich@naver.com</p>
    <p>작성일: ${new Date().toISOString().slice(0, 10)}</p>
  </div>

</body>
</html>`;

  writeFileSync(join(DOC_DIR, "payment-flow.html"), html, "utf-8");
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
