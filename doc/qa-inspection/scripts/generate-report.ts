import * as fs from "fs";
import * as path from "path";

interface ConsoleMsg {
  type: string;
  text: string;
}

interface PageCheckResult {
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

const RESULTS_DIR = path.resolve(__dirname, "../results");
const OUTPUT_DIR = path.resolve(__dirname, "..");

function loadResults(): PageCheckResult[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  const files = fs.readdirSync(RESULTS_DIR).filter(
    (f) => f.endsWith(".json") && f !== "playwright-results.json"
  );
  return files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), "utf-8"))
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function severityColor(s: string): string {
  const colors: Record<string, string> = {
    critical: "#dc2626",
    major: "#ea580c",
    minor: "#ca8a04",
    info: "#2563eb",
    pass: "#16a34a",
  };
  return colors[s] || "#6b7280";
}

function severityEmoji(s: string): string {
  const emojis: Record<string, string> = {
    critical: "&#x1F6A8;",
    major: "&#x26A0;&#xFE0F;",
    minor: "&#x1F7E1;",
    info: "&#x2139;&#xFE0F;",
    pass: "&#x2705;",
  };
  return emojis[s] || "";
}

function generateReportHtml(results: PageCheckResult[]): string {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const total = results.length;
  const counts = { critical: 0, major: 0, minor: 0, info: 0, pass: 0 };
  for (const r of results) counts[r.severity]++;

  const desktopResults = results.filter((r) => r.viewport === "desktop");
  const mobileResults = results.filter((r) => r.viewport === "mobile");

  const groups = [...new Set(results.map((r) => r.group))];

  const groupNames: Record<string, string> = {
    auth: "인증 페이지",
    "main-core": "핵심 기능",
    "main-social": "소셜/부가 기능",
    admin: "관리자",
    static: "정적 페이지",
    payment: "결제",
    share: "공유 페이지",
  };

  // Top 10 slowest pages
  const slowest = [...results]
    .sort((a, b) => b.loadTimeMs - a.loadTimeMs)
    .slice(0, 10);

  // All broken images
  const allBrokenImages = results.flatMap((r) =>
    r.brokenImages.map((img) => ({
      page: r.name,
      route: r.route,
      viewport: r.viewport,
      ...img,
    }))
  );

  // All JS errors
  const allJsErrors = results.flatMap((r) =>
    r.jsErrors.map((err) => ({
      page: r.name,
      route: r.route,
      viewport: r.viewport,
      error: err,
    }))
  );

  // All console errors
  const allConsoleErrors = results.flatMap((r) =>
    r.consoleErrors.map((e) => ({
      page: r.name,
      route: r.route,
      viewport: r.viewport,
      text: e.text,
    }))
  );

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ReadingTree QA 점검 보고서</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 1.8rem; margin-bottom: 8px; }
  h2 { font-size: 1.3rem; margin: 32px 0 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  h3 { font-size: 1.1rem; margin: 20px 0 12px; }
  .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 24px; }
  .dashboard { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px; }
  .card { background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card .count { font-size: 2.4rem; font-weight: 700; }
  .card .label { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
  .viewport-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .viewport-box { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .viewport-box h3 { margin-top: 0; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 0.85rem; color: #475569; font-weight: 600; }
  td { padding: 10px 12px; border-top: 1px solid #f1f5f9; font-size: 0.85rem; }
  tr:hover td { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: white; }
  .group-section { margin-bottom: 24px; }
  details { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  summary { cursor: pointer; font-weight: 600; font-size: 1rem; }
  summary:hover { color: #2563eb; }
  .error-item { background: #fef2f2; border-left: 3px solid #dc2626; padding: 8px 12px; margin: 8px 0; border-radius: 0 8px 8px 0; font-size: 0.82rem; word-break: break-all; }
  .warning-item { background: #fffbeb; border-left: 3px solid #ca8a04; padding: 8px 12px; margin: 8px 0; border-radius: 0 8px 8px 0; font-size: 0.82rem; }
  .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .screenshot-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .screenshot-card img { width: 100%; height: 200px; object-fit: cover; object-position: top; }
  .screenshot-card .info { padding: 8px 12px; font-size: 0.82rem; }
  .tab-container { margin-bottom: 16px; }
  .tab-btn { padding: 8px 16px; border: none; background: #e2e8f0; cursor: pointer; border-radius: 8px 8px 0 0; font-size: 0.85rem; }
  .tab-btn.active { background: white; font-weight: 600; }
  @media (max-width: 768px) {
    .dashboard { grid-template-columns: repeat(3, 1fr); }
    .viewport-compare { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">
  <h1>ReadingTree QA 전체 점검 보고서</h1>
  <div class="meta">
    생성일: ${now} | 총 점검: ${total}개 페이지 | 대상: https://readingtree-tan.vercel.app
  </div>

  <div class="dashboard">
    <div class="card"><div class="count" style="color:${severityColor("critical")}">${counts.critical}</div><div class="label">Critical</div></div>
    <div class="card"><div class="count" style="color:${severityColor("major")}">${counts.major}</div><div class="label">Major</div></div>
    <div class="card"><div class="count" style="color:${severityColor("minor")}">${counts.minor}</div><div class="label">Minor</div></div>
    <div class="card"><div class="count" style="color:${severityColor("info")}">${counts.info}</div><div class="label">Info</div></div>
    <div class="card"><div class="count" style="color:${severityColor("pass")}">${counts.pass}</div><div class="label">Pass</div></div>
  </div>

  <h2>뷰포트별 비교</h2>
  <div class="viewport-compare">
    <div class="viewport-box">
      <h3>Desktop (1280x720)</h3>
      <p>총 ${desktopResults.length}개 | Critical: ${desktopResults.filter((r) => r.severity === "critical").length} | Major: ${desktopResults.filter((r) => r.severity === "major").length} | Minor: ${desktopResults.filter((r) => r.severity === "minor").length} | Pass: ${desktopResults.filter((r) => r.severity === "pass").length}</p>
      <p>평균 로딩: ${desktopResults.length ? Math.round(desktopResults.reduce((a, r) => a + r.loadTimeMs, 0) / desktopResults.length) : 0}ms</p>
    </div>
    <div class="viewport-box">
      <h3>Mobile (375x812)</h3>
      <p>총 ${mobileResults.length}개 | Critical: ${mobileResults.filter((r) => r.severity === "critical").length} | Major: ${mobileResults.filter((r) => r.severity === "major").length} | Minor: ${mobileResults.filter((r) => r.severity === "minor").length} | Pass: ${mobileResults.filter((r) => r.severity === "pass").length}</p>
      <p>평균 로딩: ${mobileResults.length ? Math.round(mobileResults.reduce((a, r) => a + r.loadTimeMs, 0) / mobileResults.length) : 0}ms</p>
    </div>
  </div>

  <h2>그룹별 상세 결과</h2>
  ${groups
    .map((group) => {
      const groupResults = results.filter((r) => r.group === group);
      const groupLabel = groupNames[group] || group;
      const groupCritical = groupResults.filter((r) => r.severity === "critical").length;
      const groupMajor = groupResults.filter((r) => r.severity === "major").length;
      return `
  <details ${groupCritical > 0 || groupMajor > 0 ? "open" : ""}>
    <summary>${groupLabel} (${groupResults.length}개) — Critical: ${groupCritical}, Major: ${groupMajor}</summary>
    <table>
      <tr><th>페이지</th><th>경로</th><th>뷰포트</th><th>상태</th><th>로딩</th><th>심각도</th><th>이슈</th></tr>
      ${groupResults
        .map(
          (r) => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td><code>${escapeHtml(r.route)}</code></td>
        <td>${r.viewport}</td>
        <td>${r.httpStatus}${r.redirectedTo ? ` → ${escapeHtml(r.redirectedTo)}` : ""}</td>
        <td>${r.loadTimeMs}ms</td>
        <td><span class="badge" style="background:${severityColor(r.severity)}">${r.severity}</span></td>
        <td>${
          [
            r.jsErrors.length > 0 ? `JS에러 ${r.jsErrors.length}` : "",
            r.consoleErrors.length > 0 ? `콘솔에러 ${r.consoleErrors.length}` : "",
            r.brokenImages.length > 0 ? `깨진이미지 ${r.brokenImages.length}` : "",
            r.layoutIssues.length > 0 ? `레이아웃 ${r.layoutIssues.length}` : "",
          ]
            .filter(Boolean)
            .join(", ") || "—"
        }</td>
      </tr>`
        )
        .join("")}
    </table>
  </details>`;
    })
    .join("")}

  <h2>Critical/Major 이슈 상세</h2>
  ${results
    .filter((r) => r.severity === "critical" || r.severity === "major")
    .map(
      (r) => `
  <details open>
    <summary>${severityEmoji(r.severity)} [${r.severity.toUpperCase()}] ${escapeHtml(r.name)} (${escapeHtml(r.route)}) — ${r.viewport}</summary>
    <p><strong>HTTP:</strong> ${r.httpStatus} | <strong>로딩:</strong> ${r.loadTimeMs}ms${r.redirectedTo ? ` | <strong>리다이렉트:</strong> ${escapeHtml(r.redirectedTo)}` : ""}</p>
    ${r.jsErrors.map((e) => `<div class="error-item"><strong>JS Error:</strong> ${escapeHtml(e)}</div>`).join("")}
    ${r.consoleErrors.map((e) => `<div class="error-item"><strong>Console:</strong> ${escapeHtml(e.text)}</div>`).join("")}
    ${r.brokenImages.map((img) => `<div class="warning-item"><strong>깨진 이미지:</strong> ${escapeHtml(img.src)} (alt: ${escapeHtml(img.alt)})</div>`).join("")}
    ${r.layoutIssues.map((issue) => `<div class="warning-item"><strong>레이아웃:</strong> ${escapeHtml(issue)}</div>`).join("")}
    ${r.screenshotPath ? `<p style="margin-top:8px"><a href="${r.screenshotPath}" target="_blank">스크린샷 보기</a></p>` : ""}
  </details>`
    )
    .join("") || '<p style="color:#16a34a;font-weight:600">Critical/Major 이슈가 없습니다!</p>'}

  <h2>성능 순위 (로딩 시간 Top 10)</h2>
  <table>
    <tr><th>#</th><th>페이지</th><th>경로</th><th>뷰포트</th><th>로딩 시간</th><th>심각도</th></tr>
    ${slowest
      .map(
        (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(r.name)}</td>
      <td><code>${escapeHtml(r.route)}</code></td>
      <td>${r.viewport}</td>
      <td><strong>${r.loadTimeMs}ms</strong></td>
      <td><span class="badge" style="background:${severityColor(r.severity)}">${r.severity}</span></td>
    </tr>`
      )
      .join("")}
  </table>

  ${
    allJsErrors.length > 0
      ? `
  <h2>JavaScript 에러 전체 목록 (${allJsErrors.length}건)</h2>
  ${allJsErrors.map((e) => `<div class="error-item"><strong>${escapeHtml(e.page)} (${e.viewport})</strong> ${escapeHtml(e.route)}<br>${escapeHtml(e.error)}</div>`).join("")}`
      : ""
  }

  ${
    allConsoleErrors.length > 0
      ? `
  <h2>콘솔 에러 전체 목록 (${allConsoleErrors.length}건)</h2>
  ${allConsoleErrors.slice(0, 50).map((e) => `<div class="error-item"><strong>${escapeHtml(e.page)} (${e.viewport})</strong> ${escapeHtml(e.route)}<br>${escapeHtml(e.text)}</div>`).join("")}
  ${allConsoleErrors.length > 50 ? `<p>... 외 ${allConsoleErrors.length - 50}건</p>` : ""}`
      : ""
  }

  ${
    allBrokenImages.length > 0
      ? `
  <h2>깨진 이미지 목록 (${allBrokenImages.length}건)</h2>
  <table>
    <tr><th>페이지</th><th>뷰포트</th><th>이미지 URL</th><th>Alt</th></tr>
    ${allBrokenImages.map((img) => `<tr><td>${escapeHtml(img.page)}</td><td>${img.viewport}</td><td style="word-break:break-all;font-size:0.8rem">${escapeHtml(img.src)}</td><td>${escapeHtml(img.alt)}</td></tr>`).join("")}
  </table>`
      : ""
  }

  <h2>스크린샷 갤러리</h2>
  <h3>Desktop</h3>
  <div class="screenshot-grid">
    ${desktopResults
      .filter((r) => r.screenshotPath)
      .map(
        (r) => `
    <div class="screenshot-card">
      <img src="${r.screenshotPath}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.style.display='none'">
      <div class="info">
        <strong>${escapeHtml(r.name)}</strong><br>
        <code>${escapeHtml(r.route)}</code> | ${r.loadTimeMs}ms | <span style="color:${severityColor(r.severity)}">${r.severity}</span>
      </div>
    </div>`
      )
      .join("")}
  </div>
  <h3>Mobile</h3>
  <div class="screenshot-grid">
    ${mobileResults
      .filter((r) => r.screenshotPath)
      .map(
        (r) => `
    <div class="screenshot-card">
      <img src="${r.screenshotPath}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.style.display='none'">
      <div class="info">
        <strong>${escapeHtml(r.name)}</strong><br>
        <code>${escapeHtml(r.route)}</code> | ${r.loadTimeMs}ms | <span style="color:${severityColor(r.severity)}">${r.severity}</span>
      </div>
    </div>`
      )
      .join("")}
  </div>

  <footer style="margin-top:48px;padding:16px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:0.8rem;text-align:center">
    ReadingTree QA 자동 점검 보고서 | Generated by Playwright + Claude Code | ${now}
  </footer>
</div>
</body>
</html>`;
}

function generateImprovementHtml(results: PageCheckResult[]): string {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const criticals = results.filter((r) => r.severity === "critical");
  const majors = results.filter((r) => r.severity === "major");
  const minors = results.filter((r) => r.severity === "minor");
  const infos = results.filter((r) => r.severity === "info");

  const slowPages = results.filter((r) => r.loadTimeMs > 3000);
  const mobileIssues = results.filter(
    (r) => r.viewport === "mobile" && (r.layoutIssues.length > 0 || r.severity === "critical" || r.severity === "major")
  );

  function issueRow(r: PageCheckResult): string {
    const issues = [
      ...r.jsErrors.map((e) => `JS에러: ${escapeHtml(e)}`),
      ...r.consoleErrors.map((e) => `콘솔에러: ${escapeHtml(e.text)}`),
      ...r.brokenImages.map((img) => `깨진이미지: ${escapeHtml(img.src)}`),
      ...r.layoutIssues.map((l) => `레이아웃: ${escapeHtml(l)}`),
    ];
    if (r.httpStatus >= 400) issues.unshift(`HTTP ${r.httpStatus}`);
    if (r.loadTimeMs > 5000) issues.push(`느린 로딩: ${r.loadTimeMs}ms`);
    return issues.join("<br>");
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ReadingTree QA 개선 기획서</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; }
  .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 1.8rem; margin-bottom: 8px; }
  h2 { font-size: 1.3rem; margin: 32px 0 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  h3 { font-size: 1.05rem; margin: 16px 0 8px; }
  .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 24px; }
  .summary-box { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .priority { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; color: white; }
  .p-critical { background: #dc2626; }
  .p-major { background: #ea580c; }
  .p-minor { background: #ca8a04; }
  .p-info { background: #2563eb; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
  th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 0.85rem; font-weight: 600; }
  td { padding: 10px 12px; border-top: 1px solid #f1f5f9; font-size: 0.85rem; vertical-align: top; }
  .action-item { background: white; border-left: 4px solid; border-radius: 0 12px 12px 0; padding: 16px; margin: 12px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .action-item.critical { border-color: #dc2626; }
  .action-item.major { border-color: #ea580c; }
  .action-item.minor { border-color: #ca8a04; }
  .roadmap-item { display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .roadmap-num { width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  ul { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; }
</style>
</head>
<body>
<div class="container">
  <h1>ReadingTree QA 개선 기획서</h1>
  <div class="meta">생성일: ${now} | 기반: QA 자동 점검 결과</div>

  <div class="summary-box">
    <h3>점검 요약</h3>
    <ul>
      <li>총 점검 페이지: <strong>${results.length}</strong>개 (Desktop + Mobile)</li>
      <li>Critical 이슈: <strong style="color:#dc2626">${criticals.length}</strong>건 (즉시 수정)</li>
      <li>Major 이슈: <strong style="color:#ea580c">${majors.length}</strong>건 (1주 내 수정)</li>
      <li>Minor 이슈: <strong style="color:#ca8a04">${minors.length}</strong>건 (개선 권장)</li>
      <li>Info: <strong style="color:#2563eb">${infos.length}</strong>건 (참고)</li>
      <li>성능 경고 (3초+): <strong>${slowPages.length}</strong>건</li>
      <li>모바일 전용 이슈: <strong>${mobileIssues.length}</strong>건</li>
    </ul>
  </div>

  ${
    criticals.length > 0
      ? `
  <h2><span class="priority p-critical">P0</span> Critical 이슈 — 즉시 수정</h2>
  ${criticals
    .map(
      (r) => `
  <div class="action-item critical">
    <h3>${escapeHtml(r.name)} (${escapeHtml(r.route)}) — ${r.viewport}</h3>
    <p><strong>현상:</strong> ${issueRow(r)}</p>
    <p><strong>영향:</strong> 사용자가 해당 페이지를 정상적으로 이용할 수 없음</p>
    <p><strong>수정 방안:</strong></p>
    <ul>
      ${r.jsErrors.length > 0 ? "<li>JavaScript 런타임 에러 수정 — 에러 바운더리 및 null 체크 추가</li>" : ""}
      ${r.httpStatus >= 500 ? "<li>서버 사이드 에러 디버깅 — Vercel 로그 확인 및 서버 액션 수정</li>" : ""}
      ${r.httpStatus === 0 ? "<li>페이지 로딩 타임아웃 — 서버 응답 최적화 또는 코드 스플리팅</li>" : ""}
    </ul>
    <p><strong>기한:</strong> 즉시 (1-2일 내)</p>
  </div>`
    )
    .join("")}`
      : '<div class="summary-box" style="border-left:4px solid #16a34a"><h3 style="color:#16a34a">Critical 이슈 없음</h3></div>'
  }

  ${
    majors.length > 0
      ? `
  <h2><span class="priority p-major">P1</span> Major 이슈 — 1주 내 수정</h2>
  ${majors
    .map(
      (r) => `
  <div class="action-item major">
    <h3>${escapeHtml(r.name)} (${escapeHtml(r.route)}) — ${r.viewport}</h3>
    <p><strong>현상:</strong> ${issueRow(r)}</p>
    <p><strong>수정 방안:</strong></p>
    <ul>
      ${r.consoleErrors.length >= 5 ? "<li>콘솔 에러 다수 — 에러 원인 분석 및 수정</li>" : ""}
      ${r.brokenImages.length >= 3 ? "<li>깨진 이미지 다수 — 이미지 경로/CDN 확인</li>" : ""}
      ${r.layoutIssues.length > 0 ? "<li>레이아웃 깨짐 — CSS 반응형 수정</li>" : ""}
      ${r.loadTimeMs > 10000 ? "<li>극심한 로딩 지연 — 코드 스플리팅, 데이터 페칭 최적화</li>" : ""}
      ${r.httpStatus >= 400 && r.httpStatus < 500 ? "<li>HTTP 4xx 응답 — 라우팅/권한 확인</li>" : ""}
    </ul>
  </div>`
    )
    .join("")}`
      : ""
  }

  ${
    minors.length > 0
      ? `
  <h2><span class="priority p-minor">P2</span> Minor 이슈 — 개선 권장</h2>
  <table>
    <tr><th>페이지</th><th>경로</th><th>뷰포트</th><th>이슈</th></tr>
    ${minors.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td><code>${escapeHtml(r.route)}</code></td><td>${r.viewport}</td><td>${issueRow(r)}</td></tr>`).join("")}
  </table>`
      : ""
  }

  <h2>성능 개선 권고</h2>
  ${
    slowPages.length > 0
      ? `
  <table>
    <tr><th>페이지</th><th>경로</th><th>뷰포트</th><th>로딩</th><th>권고</th></tr>
    ${slowPages
      .sort((a, b) => b.loadTimeMs - a.loadTimeMs)
      .map(
        (r) => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td><code>${escapeHtml(r.route)}</code></td>
      <td>${r.viewport}</td>
      <td><strong>${r.loadTimeMs}ms</strong></td>
      <td>${
        r.loadTimeMs > 10000
          ? "데이터 페칭 최적화, 코드 스플리팅 필수"
          : r.loadTimeMs > 5000
            ? "이미지 최적화, lazy loading 검토"
            : "경미한 지연 — 모니터링"
      }</td>
    </tr>`
      )
      .join("")}
  </table>`
      : "<p>3초 이상 로딩 페이지 없음</p>"
  }

  ${
    mobileIssues.length > 0
      ? `
  <h2>모바일 UX 개선 권고</h2>
  <table>
    <tr><th>페이지</th><th>경로</th><th>이슈</th></tr>
    ${mobileIssues.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td><code>${escapeHtml(r.route)}</code></td><td>${issueRow(r)}</td></tr>`).join("")}
  </table>`
      : ""
  }

  <h2>후속 조치 로드맵</h2>
  <div class="roadmap-item">
    <div class="roadmap-num">1</div>
    <div><strong>즉시 (1-2일)</strong> — Critical 이슈 전체 수정. JS 런타임 에러, 서버 500 에러 해결.</div>
  </div>
  <div class="roadmap-item">
    <div class="roadmap-num">2</div>
    <div><strong>1주차</strong> — Major 이슈 수정. 깨진 이미지 복구, 레이아웃 깨짐 수정, 느린 페이지 최적화.</div>
  </div>
  <div class="roadmap-item">
    <div class="roadmap-num">3</div>
    <div><strong>2주차</strong> — Minor 이슈 정리. 콘솔 에러 정리, 깨진 링크 수정, 모바일 UX 개선.</div>
  </div>
  <div class="roadmap-item">
    <div class="roadmap-num">4</div>
    <div><strong>3주차</strong> — 성능 최적화. 이미지 CDN 설정, lazy loading, 코드 스플리팅 적용.</div>
  </div>
  <div class="roadmap-item">
    <div class="roadmap-num">5</div>
    <div><strong>지속</strong> — QA 자동화 CI 통합. PR마다 Playwright 점검 실행, 리그레션 방지.</div>
  </div>

  <footer style="margin-top:48px;padding:16px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:0.8rem;text-align:center">
    ReadingTree QA 개선 기획서 | Generated by Claude Code | ${now}
  </footer>
</div>
</body>
</html>`;
}

// Main
const results = loadResults();
if (results.length === 0) {
  console.error("결과 파일이 없습니다. 먼저 Playwright 테스트를 실행하세요.");
  process.exit(1);
}

console.log(`총 ${results.length}개 결과 로드됨`);

const reportHtml = generateReportHtml(results);
fs.writeFileSync(path.join(OUTPUT_DIR, "report.html"), reportHtml, "utf-8");
console.log("report.html 생성 완료");

const improvementHtml = generateImprovementHtml(results);
fs.writeFileSync(path.join(OUTPUT_DIR, "improvement-plan.html"), improvementHtml, "utf-8");
console.log("improvement-plan.html 생성 완료");
