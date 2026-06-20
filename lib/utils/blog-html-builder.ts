/**
 * AI 독서 리포트를 블로그용 인라인 스타일 HTML로 변환 (ReadTree Reading Review 매거진 톤)
 *
 * 네이버 스마트에디터는 외부 CSS class/일부 속성을 무시하므로:
 *   - 모든 스타일 인라인
 *   - 다단 레이아웃은 <table>
 *   - 그라데이션 대신 솔리드 컬러 (에디터가 그라데이션을 종종 제거)
 *
 * v3 — 인앱 매거진 디자인과 통일. 파싱은 report-magazine 유틸을 공유한다.
 */

import { parseReportSections } from "./report-parser";
import { parseBlocks, parseInsightItems, firstQuote, mdToPlain } from "./report-magazine";
import type { BookInfoForReport, NoteSummary } from "@/types/ai/report";

interface BuildBlogHtmlOptions {
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteSummaries?: NoteSummary[];
  includeNotes?: boolean;
  generatedAt?: string;
  /** 사이트 origin — 노트/리포트 링크 생성용 */
  baseUrl?: string;
  /** 저장된 리포트 공유 ID */
  shareId?: string | null;
}

/** 노트 타입별 한글 라벨 */
const NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
  progress: "독서 여정",
};
const LINKABLE_NOTE_TYPES = new Set(["photo", "transcription"]);
const NOTE_TYPE_ORDER: string[] = ["transcription", "photo", "quote", "memo", "progress"];

// ─── 매거진 팔레트 / 서체 ─────────────────────────────────────
const C = {
  ink: "#0C1F12",
  green: "#1E4023",
  greenText: "#2A5A32",
  gold: "#C68A2E",
  goldLight: "#E8C77E",
  goldSoft: "#C6A86A",
  goldDeep: "#A9803A",
  cream: "#F6F1E4",
  paper: "#FBF8EF",
  paper2: "#F4EEDF",
  line: "#E7DEC8",
  ink2text: "#1C2B22",
  body: "#3A3830",
  sub: "#5C5A4F",
  meta: "#8A8275",
  green200: "#9FBF9C",
};
const SERIF_LAT = "Georgia,'Times New Roman',serif";
const SERIF_KR = "'Noto Serif KR','Nanum Myeongjo',serif";
const SANS = "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif";
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

const P_STYLE = `margin:0 0 14px 0;color:${C.body};font-size:16px;line-height:1.95;font-family:${SANS};`;

// ─── 공통 헬퍼 ───────────────────────────────────────────────
function escapeHtml(text: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const esc = escapeHtml;

function cleanKicker(t: string): string {
  return (t || "").replace(/^\s*\d+\s*[.)]\s*/, "").trim();
}

/** 로마숫자 + 키커 섹션 헤더 (중앙) */
function sectionHeader(numeral: string, kicker: string): string {
  return [
    `<div style="text-align:center;margin:0 0 22px 0;">`,
    `<div style="font-family:${SERIF_LAT};font-style:italic;font-size:26px;color:${C.gold};line-height:1;">${numeral}</div>`,
    `<div style="font-size:12px;font-weight:700;letter-spacing:0.25em;color:${C.goldDeep};margin-top:6px;">${esc(cleanKicker(kicker))}</div>`,
    `</div>`,
  ].join("");
}

/** 골드 ✦ 디바이더 */
function divider(): string {
  return `<div style="text-align:center;margin:30px 0;"><span style="color:${C.gold};font-size:11px;letter-spacing:0.3em;">✦ ✦ ✦</span></div>`;
}

/** 인상 깊은 구절 — 라이트 풀쿼트(배경 없음, 골드 인용부호 + 다크 세리프) */
function featureQuote(text: string, attribution?: string | null): string {
  const parts = [
    `<div style="text-align:center;margin:28px 0;padding:6px 16px;">`,
    `<div style="color:${C.gold};font-family:${SERIF_LAT};font-size:50px;line-height:0.4;">&ldquo;</div>`,
    `<p style="color:${C.greenText};font-family:${SERIF_KR};font-size:21px;line-height:1.6;font-weight:600;font-style:italic;margin:12px auto 0 auto;max-width:560px;">${esc(text)}</p>`,
  ];
  if (attribution) {
    parts.push(
      `<div style="margin:16px 0 0 0;"><span style="display:inline-block;width:24px;border-top:1px solid ${C.gold};vertical-align:middle;"></span><span style="color:${C.goldDeep};font-size:13px;letter-spacing:0.08em;margin:0 12px;vertical-align:middle;">${esc(attribution)}</span><span style="display:inline-block;width:24px;border-top:1px solid ${C.gold};vertical-align:middle;"></span></div>`
    );
  }
  parts.push(`</div>`);
  return parts.join("");
}

/** 본문 블록(문단/리스트/인용) → 매거진 톤 HTML. dropcap=첫 문단 대문자 강조 */
function renderBlocks(content: string, dropcap = false): string {
  const blocks = parseBlocks(content);
  const dropIdx = dropcap ? blocks.findIndex((b) => b.kind === "p" && b.text) : -1;
  const out: string[] = [];
  blocks.forEach((b, i) => {
    if (b.kind === "p") {
      if (i === dropIdx && b.text) {
        const first = esc(b.text.charAt(0));
        const rest = esc(b.text.slice(1));
        out.push(
          `<p style="${P_STYLE}"><span style="float:left;font-family:${SERIF_KR};font-size:60px;line-height:0.78;font-weight:800;color:${C.greenText};margin:6px 14px 0 0;">${first}</span>${rest}</p>`
        );
      } else {
        out.push(`<p style="${P_STYLE}">${esc(b.text)}</p>`);
      }
    } else if (b.kind === "list") {
      b.items.forEach((it) => {
        const title = it.title
          ? `<strong style="font-family:${SERIF_KR};color:${C.ink2text};">${esc(it.title)}</strong>`
          : "";
        const sep = it.title && it.body ? " &mdash; " : "";
        out.push(
          `<p style="margin:9px 0;padding-left:20px;text-indent:-20px;color:${C.sub};font-size:15.5px;line-height:1.9;font-family:${SANS};"><span style="color:${C.gold};">&mdash; </span>${title}${sep}${esc(it.body)}</p>`
        );
      });
    } else {
      out.push(featureQuote(b.text, b.attribution));
    }
  });
  return out.join("\n");
}

/** 핵심 인사이트 → 01·02·03 테이블 행 */
function renderInsights(content: string): string {
  const items = parseInsightItems(content);
  if (!items.length) return renderBlocks(content);
  const rows = items.map((it, i) => {
    const num = String(i + 1).padStart(2, "0");
    const isLast = i === items.length - 1;
    const border = `border-top:1px solid ${C.line};${isLast ? `border-bottom:1px solid ${C.line};` : ""}`;
    const body = it.body
      ? `<p style="font-size:15px;color:${C.sub};margin:6px 0 0 0;line-height:1.8;font-family:${SANS};">${esc(it.body)}</p>`
      : "";
    return [
      `<table style="width:100%;border-collapse:collapse;${border}"><tr>`,
      `<td style="vertical-align:top;width:58px;padding:18px 0;"><span style="font-family:${SERIF_LAT};font-size:38px;font-weight:600;color:${C.gold};">${num}</span></td>`,
      `<td style="vertical-align:top;padding:18px 0;">`,
      `<div style="font-family:${SERIF_KR};font-size:19px;font-weight:700;color:${C.ink2text};line-height:1.35;">${esc(it.title)}</div>`,
      body,
      `</td></tr></table>`,
    ].join("");
  });
  return rows.join("\n");
}

/** 마무리(종합) — 라이트 강조 블록(연한 크림 + 골드 상하 보더, 다크 텍스트) */
function renderClosing(numeral: string, kicker: string, content: string): string {
  const text = mdToPlain(content).replace(/\s+/g, " ").trim();
  return [
    `<div style="background:${C.paper2};border-top:2px solid ${C.gold};border-bottom:2px solid ${C.gold};padding:32px 28px;text-align:center;margin:8px 0;">`,
    `<div style="font-family:${SERIF_LAT};font-style:italic;font-size:26px;color:${C.gold};line-height:1;">${numeral}</div>`,
    `<div style="font-size:12px;font-weight:700;letter-spacing:0.25em;color:${C.goldDeep};margin:8px 0 18px 0;">${esc(cleanKicker(kicker))}</div>`,
    `<p style="color:${C.ink2text};font-family:${SERIF_KR};font-size:19px;line-height:1.65;font-weight:500;margin:0;">${esc(text)}</p>`,
    `</div>`,
  ].join("");
}

/** 상단 리포트 링크 배너 */
function reportBanner(baseUrl: string, shareId: string): string {
  const url = `${baseUrl}/share/reports/${shareId}`;
  return [
    `<div style="background:${C.paper2};border:1px solid ${C.line};border-radius:8px;padding:12px 20px;margin-bottom:24px;text-align:center;">`,
    `<a href="${url}" style="color:${C.greenText};text-decoration:none;font-size:14px;font-weight:600;font-family:${SANS};" target="_blank">&#128196; 이 글의 원본 AI 독서 리포트 보기 &rarr;</a>`,
    `</div>`,
  ].join("");
}

/** 라이트 매거진 헤더(표지) — 배경 없이 골드 악센트 + 다크 텍스트로 자연스럽게 */
function masthead(bookInfo: BookInfoForReport, noteCount: number): string {
  const parts: string[] = [];
  parts.push(`<div style="text-align:center;padding:8px 0 4px 0;">`);
  // 브랜드 라벨 (골드, 다크 배경 없음)
  parts.push(
    `<div style="font-family:${SERIF_LAT};color:${C.gold};font-size:22px;font-weight:700;letter-spacing:0.3em;">READTREE</div>`
  );
  parts.push(
    `<div style="color:${C.goldDeep};font-size:10px;font-weight:700;letter-spacing:0.34em;margin-top:8px;">&mdash;&nbsp;&nbsp;READING REVIEW&nbsp;&nbsp;&mdash;</div>`
  );
  // 표지
  if (bookInfo.coverImageUrl) {
    parts.push(
      `<div style="margin:26px 0 18px 0;"><img src="${esc(bookInfo.coverImageUrl)}" alt="${esc(bookInfo.title)}" style="width:150px;border-radius:4px;box-shadow:0 6px 20px rgba(0,0,0,0.18);border:1px solid ${C.line};" /></div>`
    );
  } else {
    parts.push(`<div style="height:18px;"></div>`);
  }
  // 타이틀 (다크)
  parts.push(
    `<div style="font-family:${SERIF_LAT};font-style:italic;color:${C.goldDeep};font-size:16px;margin-bottom:10px;">a reading on</div>`
  );
  parts.push(
    `<h1 style="font-family:${SERIF_KR};color:${C.ink2text};font-size:28px;font-weight:800;line-height:1.3;margin:0;">${esc(bookInfo.title)}</h1>`
  );
  if (bookInfo.author) {
    parts.push(
      `<div style="font-family:${SERIF_KR};color:${C.sub};font-size:15px;margin-top:10px;">${esc(bookInfo.author)}</div>`
    );
  }
  // 지표 밴드 (라이트)
  parts.push(metricBand(bookInfo, noteCount));
  parts.push(`</div>`);
  return parts.join("\n");
}

/** 지표 밴드 (기록 / 독서일 / 쪽수) */
function metricBand(bookInfo: BookInfoForReport, noteCount: number): string {
  const cells: { value: string; label: string }[] = [{ value: String(noteCount), label: "기록" }];
  if (bookInfo.startedAt && bookInfo.completedAt) {
    const s = new Date(bookInfo.startedAt).getTime();
    const e = new Date(bookInfo.completedAt).getTime();
    const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
    if (Number.isFinite(days)) cells.push({ value: String(days), label: "독서일" });
  }
  if (bookInfo.totalPages) {
    cells.push({ value: bookInfo.totalPages.toLocaleString(), label: "쪽수" });
  }
  const tds = cells
    .map(
      (c) =>
        `<td style="text-align:center;padding:0 16px;"><div style="font-family:${SERIF_LAT};font-size:26px;font-weight:600;color:${C.gold};line-height:1;">${esc(c.value)}</div><div style="font-size:10px;letter-spacing:0.14em;color:${C.meta};margin-top:7px;">${esc(c.label)}</div></td>`
    )
    .join(`<td style="width:1px;background:${C.line};"></td>`);
  return [
    `<table style="border-collapse:collapse;margin:24px auto 0 auto;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};"><tr>`,
    `<td style="padding:14px 0;"><table style="border-collapse:collapse;"><tr>${tds}</tr></table></td>`,
    `</tr></table>`,
  ].join("");
}

/** 독서 기록 요약 (옵션) — 매거진 톤 카드 */
function buildNoteSection(noteSummaries: NoteSummary[], baseUrl: string): string {
  if (noteSummaries.length === 0) return "";
  const parts: string[] = [];
  parts.push(
    `<div style="background:${C.paper2};border:1px solid ${C.line};border-radius:10px;padding:24px;">`
  );
  parts.push(
    `<div style="font-family:${SERIF_KR};font-size:17px;font-weight:700;color:${C.ink2text};margin:0 0 16px 0;">독서 기록 요약</div>`
  );

  const grouped = noteSummaries.reduce<Record<string, NoteSummary[]>>((acc, n) => {
    (acc[n.type] ||= []).push(n);
    return acc;
  }, {});
  const entries = Object.entries(grouped).sort(
    ([a], [b]) =>
      (NOTE_TYPE_ORDER.indexOf(a) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(a)) -
      (NOTE_TYPE_ORDER.indexOf(b) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(b))
  );
  const badge = (label: string) =>
    `<span style="display:inline-block;background:${C.paper};color:${C.goldDeep};border:1px solid ${C.line};font-size:12px;font-weight:600;padding:2px 9px;border-radius:10px;margin-right:8px;">${esc(label)}</span>`;

  entries.forEach(([type, notes], gi) => {
    const label = NOTE_TYPE_LABELS[type] || type;
    const linkable = LINKABLE_NOTE_TYPES.has(type);
    if (type === "progress") {
      parts.push(
        `<div style="padding:10px 0;${gi < entries.length - 1 ? `border-bottom:1px solid ${C.line};` : ""}">${badge(label)}<span style="color:${C.body};font-size:15px;">${notes.length}건의 진행 기록</span></div>`
      );
    } else {
      notes.forEach((note, i) => {
        const title = note.title || `${label} 기록`;
        const page = note.pageNumber
          ? ` <span style="color:${C.meta};font-size:13px;">(p.${esc(note.pageNumber)})</span>`
          : "";
        const isLast = gi === entries.length - 1 && i === notes.length - 1;
        const titleHtml = linkable
          ? `<a href="${baseUrl}/share/notes/${note.id}" style="color:${C.greenText};text-decoration:none;font-weight:500;" target="_blank">${esc(title)}</a>`
          : `<span style="color:${C.body};">${esc(title)}</span>`;
        parts.push(
          `<div style="padding:10px 0;${!isLast ? `border-bottom:1px solid ${C.line};` : ""}font-size:15px;font-family:${SANS};">${badge(label)}${titleHtml}${page}</div>`
        );
      });
    }
  });
  parts.push(`</div>`);
  return parts.join("\n");
}

/** 하단 푸터 */
function buildFooter(generatedAt?: string, baseUrl?: string, shareId?: string | null): string {
  const date = (generatedAt ? new Date(generatedAt) : new Date()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parts: string[] = [];
  parts.push(divider());
  parts.push(`<div style="text-align:center;">`);
  if (baseUrl && shareId) {
    parts.push(
      `<p style="font-size:14px;margin:0 0 10px 0;font-family:${SANS};"><a href="${baseUrl}/share/reports/${shareId}" style="color:${C.greenText};text-decoration:none;font-weight:600;" target="_blank">&#128196; AI 독서 리포트 전문 보기 &rarr;</a></p>`
    );
  }
  parts.push(
    `<p style="font-family:${SERIF_LAT};font-style:italic;font-size:13px;color:${C.meta};margin:0;">발행 ${esc(date)} &middot; ReadTree Reading Review</p>`
  );
  parts.push(`</div>`);
  return parts.join("\n");
}

// ─── 메인 export ─────────────────────────────────────────────

/** 블로그용 인라인 스타일 HTML 생성 (매거진 톤) */
export function buildBlogHtml(options: BuildBlogHtmlOptions): string {
  const {
    reportMarkdown,
    bookInfo,
    noteCount,
    noteSummaries,
    includeNotes = false,
    generatedAt,
    baseUrl = "",
    shareId,
  } = options;

  const sections = parseReportSections(reportMarkdown);
  const byId = (id: string) => sections.find((s) => s.id === id);
  const overview = byId("book-overview");
  const insights = byId("key-insights");
  const quotes = byId("memorable-quotes");
  const thoughts = byId("my-thoughts");
  const journey = byId("reading-journey");
  const summary = byId("summary");
  const known = new Set([
    "book-overview",
    "key-insights",
    "memorable-quotes",
    "my-thoughts",
    "reading-journey",
    "summary",
  ]);
  const extras = sections.filter((s) => !known.has(s.id));

  // 로마숫자 부여 (인용은 비넘버 피처)
  const order: string[] = [];
  if (overview) order.push("book-overview");
  if (insights) order.push("key-insights");
  if (thoughts) order.push("my-thoughts");
  if (journey) order.push("reading-journey");
  extras.forEach((s) => order.push(s.id));
  if (summary) order.push("summary");
  const numeral: Record<string, string> = {};
  order.forEach((k, i) => (numeral[k] = ROMAN[i + 1] || String(i + 1)));

  const featQuote = quotes ? firstQuote(quotes.content) : null;

  const parts: string[] = [];
  // 배경 없음(투명) — 블로그 본문 배경에 자연스럽게 녹아들고, 에디터가 배경을 제거해도 안전
  parts.push(
    `<div style="max-width:720px;margin:0 auto;padding:8px 4px;font-family:${SANS};color:${C.body};letter-spacing:-0.01em;">`
  );

  if (baseUrl && shareId) parts.push(reportBanner(baseUrl, shareId));

  // 표지(마스트헤드)
  parts.push(masthead(bookInfo, noteCount));

  // 본문 컨테이너
  parts.push(`<div style="padding:8px 4px;">`);

  // I 개요
  if (overview) {
    parts.push(`<div style="padding:32px 4px 8px 4px;">`);
    parts.push(sectionHeader(numeral["book-overview"], overview.title));
    parts.push(renderBlocks(overview.content, true));
    parts.push(`</div>`);
  }

  if (overview && insights) parts.push(divider());

  // II 핵심 인사이트
  if (insights) {
    parts.push(`<div style="padding:24px 4px;">`);
    parts.push(sectionHeader(numeral["key-insights"], insights.title));
    parts.push(renderInsights(insights.content));
    parts.push(`</div>`);
  }

  // 인상 깊은 구절 (피처)
  if (featQuote) {
    parts.push(`<div style="padding:8px 0;">`);
    parts.push(featureQuote(featQuote.text, featQuote.attribution));
    parts.push(`</div>`);
  }

  // III 나의 기록에서
  if (thoughts) {
    parts.push(`<div style="padding:24px 4px;">`);
    parts.push(sectionHeader(numeral["my-thoughts"], thoughts.title));
    parts.push(renderBlocks(thoughts.content));
    parts.push(`</div>`);
  }

  if (thoughts && journey) parts.push(divider());

  // IV 독서 여정
  if (journey) {
    parts.push(`<div style="padding:24px 4px;">`);
    parts.push(sectionHeader(numeral["reading-journey"], journey.title));
    parts.push(renderBlocks(journey.content));
    parts.push(`</div>`);
  }

  // 추가 섹션
  extras.forEach((s) => {
    parts.push(`<div style="padding:24px 4px;">`);
    parts.push(sectionHeader(numeral[s.id], s.title));
    parts.push(renderBlocks(s.content));
    parts.push(`</div>`);
  });

  parts.push(`</div>`); // 본문 컨테이너 닫기

  // V 종합 (다시 덮으며)
  if (summary) {
    parts.push(`<div style="padding:8px 0 4px 0;">`);
    parts.push(renderClosing(numeral["summary"], summary.title, summary.content));
    parts.push(`</div>`);
  }

  // 노트 (옵션)
  if (includeNotes && noteSummaries && noteSummaries.length > 0) {
    parts.push(`<div style="padding:24px 4px 4px 4px;">`);
    parts.push(buildNoteSection(noteSummaries, baseUrl));
    parts.push(`</div>`);
  }

  // 푸터
  parts.push(buildFooter(generatedAt, baseUrl, shareId));

  parts.push(`</div>`);
  return parts.join("\n");
}

/** 블로그용 평문 텍스트 생성 (fallback) */
export function buildBlogPlainText(options: BuildBlogHtmlOptions): string {
  const {
    reportMarkdown,
    bookInfo,
    noteCount,
    noteSummaries,
    includeNotes = false,
    baseUrl = "",
    shareId,
  } = options;

  const lines: string[] = [];
  lines.push("READTREE · READING REVIEW");
  lines.push(`a reading on — ${bookInfo.title}`);
  if (bookInfo.author) lines.push(bookInfo.author);
  lines.push(`기록 ${noteCount}개 기반`);
  lines.push("");
  lines.push("─".repeat(40));
  lines.push("");

  const sections = parseReportSections(reportMarkdown);
  const known = new Set([
    "book-overview",
    "key-insights",
    "memorable-quotes",
    "my-thoughts",
    "reading-journey",
    "summary",
  ]);
  let n = 0;
  for (const section of sections) {
    const numbered = section.id !== "memorable-quotes";
    const head =
      numbered && known.has(section.id) ? `${ROMAN[++n] || n}. ${cleanKicker(section.title)}` : cleanKicker(section.title);
    lines.push(`## ${head}`);
    lines.push("");
    lines.push(mdToPlain(section.content));
    lines.push("");
  }

  if (includeNotes && noteSummaries && noteSummaries.length > 0) {
    lines.push("─".repeat(40));
    lines.push("");
    lines.push("## 독서 기록 요약");
    lines.push("");
    const grouped = noteSummaries.reduce<Record<string, NoteSummary[]>>((acc, note) => {
      (acc[note.type] ||= []).push(note);
      return acc;
    }, {});
    const sorted = Object.entries(grouped).sort(
      ([a], [b]) =>
        (NOTE_TYPE_ORDER.indexOf(a) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(a)) -
        (NOTE_TYPE_ORDER.indexOf(b) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(b))
    );
    for (const [type, notes] of sorted) {
      const label = NOTE_TYPE_LABELS[type] || type;
      if (type === "progress") {
        lines.push(`- ${label} ${notes.length}건`);
      } else {
        const linkable = LINKABLE_NOTE_TYPES.has(type);
        for (const note of notes) {
          const title = note.title || `${label} 기록`;
          const page = note.pageNumber ? ` (p.${note.pageNumber})` : "";
          const link = linkable && baseUrl ? ` → ${baseUrl}/share/notes/${note.id}` : "";
          lines.push(`- [${label}] ${title}${page}${link}`);
        }
      }
    }
    lines.push("");
  }

  lines.push("─".repeat(40));
  if (baseUrl && shareId) {
    lines.push(`AI 독서 리포트 전문: ${baseUrl}/share/reports/${shareId}`);
  }
  lines.push("ReadTree Reading Review");

  return lines.join("\n");
}
