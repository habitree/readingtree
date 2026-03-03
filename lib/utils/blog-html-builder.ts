/**
 * AI 독서 리포트를 네이버 블로그용 인라인 스타일 HTML로 변환
 * 네이버 스마트에디터는 외부 CSS class를 무시하므로 모든 스타일을 인라인으로 적용
 */

import { parseReportSections } from "./report-parser";
import type { BookInfoForReport, NoteSummary } from "@/types/ai/report";

interface BuildBlogHtmlOptions {
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteSummaries?: NoteSummary[];
  includeNotes?: boolean;
  generatedAt?: string;
  /** 사이트 origin (e.g. https://readtree.app) — 노트/리포트 링크 생성용 */
  baseUrl?: string;
  /** 저장된 리포트 공유 ID — 리포트 링크 생성용 */
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

/** 링크 가능한 노트 타입 (사진, 필사) */
const LINKABLE_NOTE_TYPES = new Set(["photo", "transcription"]);

// ─── 공통 스타일 상수 ─────────────────────────────────────────

const FONT_FAMILY = "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif";
const COLOR_BODY = "#3a3a3a";
const COLOR_HEADING = "#222";
const COLOR_SUB = "#666";
const COLOR_META = "#999";
const COLOR_LINK = "#2b6cb0";
const COLOR_ACCENT = "#d4a574";
const FONT_SIZE_BODY = "15px";
const LINE_HEIGHT_BODY = "1.85";

// ─── 마크다운 → 인라인 HTML 변환 ───────────────────────────────

/** 인라인 마크다운(볼드, 이탤릭)을 HTML로 변환 */
function convertInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/** 마크다운 텍스트를 인라인 스타일 HTML로 변환 */
function markdownToInlineHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const htmlParts: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;

  const flushList = () => {
    if (inList === "ul") htmlParts.push("</ul>");
    if (inList === "ol") htmlParts.push("</ol>");
    inList = null;
  };

  const flushBlockquote = () => {
    if (inBlockquote) {
      htmlParts.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 빈 줄 → 현재 블록 닫기
    if (!trimmed) {
      flushList();
      flushBlockquote();
      continue;
    }

    // ### 소제목
    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushList();
      flushBlockquote();
      htmlParts.push(
        `<h3 style="font-size:16px;font-weight:700;margin:20px 0 10px 0;color:${COLOR_HEADING};line-height:1.5;">${convertInlineMarkdown(h3Match[1])}</h3>`
      );
      continue;
    }

    // > 인용구
    if (trimmed.startsWith("> ")) {
      flushList();
      if (!inBlockquote) {
        htmlParts.push(
          `<blockquote style="border-left:3px solid ${COLOR_ACCENT};background:#faf6f1;padding:14px 18px;margin:16px 0;color:${COLOR_SUB};font-style:italic;border-radius:0 8px 8px 0;">`
        );
        inBlockquote = true;
      }
      const content = trimmed.slice(2);
      htmlParts.push(
        `<p style="margin:4px 0;font-size:${FONT_SIZE_BODY};line-height:${LINE_HEIGHT_BODY};">${convertInlineMarkdown(content)}</p>`
      );
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // - 비순서 리스트
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inList === "ol") flushList();
      if (inList !== "ul") {
        htmlParts.push(`<ul style="margin:10px 0;padding-left:24px;">`);
        inList = "ul";
      }
      htmlParts.push(
        `<li style="margin:5px 0;color:${COLOR_BODY};line-height:${LINE_HEIGHT_BODY};font-size:${FONT_SIZE_BODY};">${convertInlineMarkdown(ulMatch[1])}</li>`
      );
      continue;
    }

    // 1. 순서 리스트
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList === "ul") flushList();
      if (inList !== "ol") {
        htmlParts.push(`<ol style="margin:10px 0;padding-left:24px;">`);
        inList = "ol";
      }
      htmlParts.push(
        `<li style="margin:5px 0;color:${COLOR_BODY};line-height:${LINE_HEIGHT_BODY};font-size:${FONT_SIZE_BODY};">${convertInlineMarkdown(olMatch[1])}</li>`
      );
      continue;
    }

    // 일반 텍스트 → p 태그
    flushList();
    htmlParts.push(
      `<p style="margin:10px 0;color:${COLOR_BODY};line-height:${LINE_HEIGHT_BODY};font-size:${FONT_SIZE_BODY};">${convertInlineMarkdown(trimmed)}</p>`
    );
  }

  flushList();
  flushBlockquote();

  return htmlParts.join("\n");
}

// ─── HTML 빌더 ───────────────────────────────────────────────

/** 책 정보 헤더 HTML */
function buildBookHeader(bookInfo: BookInfoForReport, noteCount: number): string {
  const parts: string[] = [];

  parts.push('<div style="margin-bottom:28px;">');

  // 책 제목
  parts.push(
    `<h1 style="font-size:24px;font-weight:800;color:${COLOR_HEADING};margin:0 0 10px 0;line-height:1.4;">AI 독서 리포트 — ${escapeHtml(bookInfo.title)}</h1>`
  );

  // 저자
  if (bookInfo.author) {
    parts.push(
      `<p style="font-size:15px;color:${COLOR_SUB};margin:0 0 14px 0;">${escapeHtml(bookInfo.author)}</p>`
    );
  }

  // 메타 정보
  const meta: string[] = [];
  if (bookInfo.startedAt) {
    const start = new Date(bookInfo.startedAt).toLocaleDateString("ko-KR");
    const end = bookInfo.completedAt
      ? new Date(bookInfo.completedAt).toLocaleDateString("ko-KR")
      : "진행 중";
    meta.push(`독서기간: ${start} ~ ${end}`);
  }
  meta.push(`기록 ${noteCount}개 기반`);

  if (meta.length > 0) {
    parts.push(
      `<p style="font-size:13px;color:${COLOR_META};margin:0;line-height:1.6;">${meta.join("&nbsp;&nbsp;|&nbsp;&nbsp;")}</p>`
    );
  }

  parts.push("</div>");
  return parts.join("\n");
}

/** 노트 요약 섹션 HTML (사진/필사에 링크 포함) */
function buildNoteSection(noteSummaries: NoteSummary[], baseUrl: string): string {
  if (noteSummaries.length === 0) return "";

  const parts: string[] = [];
  parts.push(
    `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:28px 0 14px 0;padding-bottom:10px;border-bottom:2px solid #eee;">독서 기록 요약</h2>`
  );

  // 타입별 그룹화
  const grouped = noteSummaries.reduce<Record<string, NoteSummary[]>>((acc, note) => {
    const key = note.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  parts.push(`<ul style="margin:12px 0;padding-left:24px;list-style:none;">`);
  for (const [type, notes] of Object.entries(grouped)) {
    const label = NOTE_TYPE_LABELS[type] || type;
    const isLinkable = LINKABLE_NOTE_TYPES.has(type);

    if (type === "progress") {
      parts.push(
        `<li style="margin:8px 0;color:${COLOR_BODY};line-height:${LINE_HEIGHT_BODY};font-size:${FONT_SIZE_BODY};padding:6px 0;">` +
        `<span style="display:inline-block;background:#e8f4fd;color:#2b6cb0;font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;margin-right:8px;">${label}</span>` +
        `${notes.length}건의 진행 기록</li>`
      );
    } else {
      for (const note of notes) {
        const title = note.title || `${label} 기록`;
        const page = note.pageNumber ? ` <span style="color:${COLOR_META};font-size:13px;">(p.${note.pageNumber})</span>` : "";
        const noteUrl = `${baseUrl}/notes/${note.id}`;

        // 타입 뱃지
        const badge =
          `<span style="display:inline-block;background:${isLinkable ? "#fef3e2" : "#f3f4f6"};color:${isLinkable ? "#b45309" : COLOR_SUB};font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;margin-right:8px;">${label}</span>`;

        // 사진/필사는 링크, 나머지는 텍스트
        const titleHtml = isLinkable
          ? `<a href="${noteUrl}" style="color:${COLOR_LINK};text-decoration:none;font-weight:500;" target="_blank">${escapeHtml(title)}</a>`
          : escapeHtml(title);

        parts.push(
          `<li style="margin:8px 0;color:${COLOR_BODY};line-height:${LINE_HEIGHT_BODY};font-size:${FONT_SIZE_BODY};padding:6px 0;">${badge}${titleHtml}${page}</li>`
        );
      }
    }
  }
  parts.push("</ul>");

  return parts.join("\n");
}

/** 출처 워터마크 + AI 리포트 링크 */
function buildFooter(options: {
  generatedAt?: string;
  baseUrl?: string;
  shareId?: string | null;
}): string {
  const { generatedAt, baseUrl, shareId } = options;

  const date = generatedAt
    ? new Date(generatedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const reportLink =
    baseUrl && shareId
      ? `<a href="${baseUrl}/share/reports/${shareId}" style="color:${COLOR_LINK};text-decoration:none;font-weight:500;" target="_blank">AI 독서 리포트 전문 보기</a>`
      : null;

  const parts: string[] = [];
  parts.push(`<div style="margin-top:36px;padding-top:20px;border-top:2px solid #eee;text-align:center;">`);

  if (reportLink) {
    parts.push(
      `<p style="font-size:14px;color:${COLOR_BODY};margin:0 0 10px 0;">${reportLink}</p>`
    );
  }

  parts.push(
    `<p style="font-size:12px;color:#bbb;margin:0;">AI 독서 리포트 by ReadTree&nbsp;&nbsp;|&nbsp;&nbsp;${date}</p>`
  );
  parts.push("</div>");

  return parts.join("\n");
}

/** HTML 특수문자 이스케이프 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 메인 export 함수 ───────────────────────────────────────

/** 블로그용 인라인 스타일 HTML 생성 */
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

  const parts: string[] = [];

  // 최상위 wrapper
  parts.push(
    `<div style="max-width:720px;margin:0 auto;font-family:${FONT_FAMILY};color:${COLOR_BODY};letter-spacing:-0.01em;">`
  );

  // 1. 책 정보 헤더
  parts.push(buildBookHeader(bookInfo, noteCount));

  // 2. 구분선
  parts.push(`<hr style="border:none;border-top:2px solid #eee;margin:24px 0;">`);

  // 3. 리포트 섹션
  const sections = parseReportSections(reportMarkdown);
  for (const section of sections) {
    parts.push(
      `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:32px 0 14px 0;line-height:1.5;">${escapeHtml(section.title)}</h2>`
    );
    parts.push(markdownToInlineHtml(section.content));
  }

  // 4. 구분선 + 노트 (옵션)
  if (includeNotes && noteSummaries && noteSummaries.length > 0) {
    parts.push(`<hr style="border:none;border-top:2px solid #eee;margin:28px 0;">`);
    parts.push(buildNoteSection(noteSummaries, baseUrl));
  }

  // 5. 출처 워터마크 + 리포트 링크
  parts.push(buildFooter({ generatedAt, baseUrl, shareId }));

  // wrapper 닫기
  parts.push("</div>");

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

  // 헤더
  lines.push(`AI 독서 리포트 — ${bookInfo.title}`);
  if (bookInfo.author) lines.push(bookInfo.author);
  lines.push(`기록 ${noteCount}개 기반`);
  lines.push("");
  lines.push("─".repeat(40));
  lines.push("");

  // 섹션
  const sections = parseReportSections(reportMarkdown);
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  // 노트
  if (includeNotes && noteSummaries && noteSummaries.length > 0) {
    lines.push("─".repeat(40));
    lines.push("");
    lines.push("## 독서 기록 요약");
    lines.push("");
    const grouped = noteSummaries.reduce<Record<string, NoteSummary[]>>((acc, note) => {
      if (!acc[note.type]) acc[note.type] = [];
      acc[note.type].push(note);
      return acc;
    }, {});
    for (const [type, notes] of Object.entries(grouped)) {
      const label = NOTE_TYPE_LABELS[type] || type;
      if (type === "progress") {
        lines.push(`- ${label} ${notes.length}건`);
      } else {
        const isLinkable = LINKABLE_NOTE_TYPES.has(type);
        for (const note of notes) {
          const title = note.title || `${label} 기록`;
          const page = note.pageNumber ? ` (p.${note.pageNumber})` : "";
          const link = isLinkable && baseUrl ? ` → ${baseUrl}/notes/${note.id}` : "";
          lines.push(`- [${label}] ${title}${page}${link}`);
        }
      }
    }
    lines.push("");
  }

  // 워터마크 + 리포트 링크
  lines.push("─".repeat(40));
  if (baseUrl && shareId) {
    lines.push(`AI 독서 리포트 전문: ${baseUrl}/share/reports/${shareId}`);
  }
  lines.push("AI 독서 리포트 by ReadTree");

  return lines.join("\n");
}
