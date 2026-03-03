/**
 * AI 독서 리포트를 네이버 블로그용 인라인 스타일 HTML로 변환
 * 네이버 스마트에디터는 외부 CSS class를 무시하므로 모든 스타일을 인라인으로 적용
 *
 * v2 — "사람이 쓴 느낌" 고도화
 *   - 섹션별 차별화 (6가지 스타일)
 *   - 4종 구분선 패턴
 *   - 이모지 헤더 + 감성 인용구
 *   - 리포트 링크 배너
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
const COLOR_BODY = "#333";
const COLOR_HEADING = "#222";
const COLOR_SUB = "#666";
const COLOR_META = "#999";
const COLOR_LINK = "#2b6cb0";
const FONT_SIZE_BODY = "16px";
const LINE_HEIGHT_BODY = "1.9";

// ─── 섹션별 스타일 정의 ───────────────────────────────────────

interface SectionStyle {
  emoji: string;
  accentColor: string;
  bgColor: string;
  borderStyle: string;
}

const SECTION_STYLES: Record<string, SectionStyle> = {
  "book-overview": {
    emoji: "📖",
    accentColor: "#A8B5A0",
    bgColor: "#faf8f3",
    borderStyle: "border-left:4px solid #A8B5A0;",
  },
  "key-insights": {
    emoji: "💡",
    accentColor: "#C4A265",
    bgColor: "#fdf8ef",
    borderStyle: "border-top:4px solid #C4A265;",
  },
  "memorable-quotes": {
    emoji: "✏️",
    accentColor: "#7B9E87",
    bgColor: "transparent",
    borderStyle: "border-left:4px solid #7B9E87;",
  },
  "my-thoughts": {
    emoji: "💭",
    accentColor: "#8B7EC8",
    bgColor: "#f8f5fd",
    borderStyle: "border-left:4px solid #8B7EC8;",
  },
  "reading-journey": {
    emoji: "🌿",
    accentColor: "#C4704F",
    bgColor: "#fdf5f2",
    borderStyle: "",
  },
  summary: {
    emoji: "⭐",
    accentColor: "#2D6A4F",
    bgColor: "#f3f8f5",
    borderStyle: "",
  },
};

const DEFAULT_SECTION_STYLE: SectionStyle = {
  emoji: "📝",
  accentColor: "#A8B5A0",
  bgColor: "#faf8f3",
  borderStyle: "border-left:4px solid #A8B5A0;",
};

// ─── 구분선 헬퍼 ─────────────────────────────────────────────

type DividerStyle = "double" | "dashed" | "short-center" | "solid-thin";

function buildDivider(style: DividerStyle): string {
  switch (style) {
    case "double":
      return `<div style="margin:32px 0;border-top:3px double #ddd;"></div>`;
    case "dashed":
      return `<div style="margin:28px 0;border-top:1px dashed #ccc;"></div>`;
    case "short-center":
      return `<div style="text-align:center;margin:30px 0;"><span style="display:inline-block;width:60px;border-top:2px solid #bbb;vertical-align:middle;"></span><span style="display:inline-block;margin:0 12px;color:#bbb;font-size:12px;">●</span><span style="display:inline-block;width:60px;border-top:2px solid #bbb;vertical-align:middle;"></span></div>`;
    case "solid-thin":
      return `<div style="margin:24px 0;border-top:1px solid #e5e5e5;"></div>`;
  }
}

/** 섹션 순서에 따라 구분선 스타일 결정 */
const SECTION_DIVIDER_SEQUENCE: DividerStyle[] = [
  "dashed",
  "short-center",
  "dashed",
  "dashed",
];

// ─── 마크다운 → 인라인 HTML 변환 ───────────────────────────────

/** 인라인 마크다운(볼드, 이탤릭)을 HTML로 변환 */
function convertInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/** 마크다운 텍스트를 인라인 스타일 HTML로 변환 (sectionId로 blockquote 분기) */
function markdownToInlineHtml(
  markdown: string,
  sectionId?: string
): string {
  const lines = markdown.split("\n");
  const htmlParts: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;

  const isQuoteSection = sectionId === "memorable-quotes";

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
        `<h3 style="font-size:17px;font-weight:700;margin:22px 0 10px 0;color:${COLOR_HEADING};line-height:1.5;">${convertInlineMarkdown(h3Match[1])}</h3>`
      );
      continue;
    }

    // > 인용구 — 섹션별 분기
    if (trimmed.startsWith("> ")) {
      flushList();
      if (!inBlockquote) {
        if (isQuoteSection) {
          // memorable-quotes: 에메랄드 강화
          htmlParts.push(
            `<blockquote style="border-left:4px solid #7B9E87;background:#f0f7f2;padding:18px 22px;margin:18px 0;color:#3a5a40;font-style:italic;border-radius:0 8px 8px 0;font-size:16px;line-height:1.9;">`
          );
        } else {
          // 기타: 어스톤 스타일
          htmlParts.push(
            `<blockquote style="border-left:3px solid #d4a574;background:#faf6f1;padding:14px 18px;margin:16px 0;color:${COLOR_SUB};font-style:italic;border-radius:0 8px 8px 0;">`
          );
        }
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

/** 상단 리포트 링크 배너 (shareId 있을 때만) */
function buildReportBanner(baseUrl: string, shareId: string): string {
  const reportUrl = `${baseUrl}/share/reports/${shareId}`;
  return [
    `<div style="background:#eef8f4;border:1px solid #c6e4d4;border-radius:10px;padding:14px 20px;margin-bottom:28px;text-align:center;">`,
    `<a href="${reportUrl}" style="color:#2D6A4F;text-decoration:none;font-size:15px;font-weight:600;" target="_blank">📄 이 글의 원본 AI 독서 리포트 보기 →</a>`,
    `</div>`,
  ].join("\n");
}

/** 책 정보 헤더 HTML (표지 이미지 + 뱃지형 메타) */
function buildBookHeader(bookInfo: BookInfoForReport, noteCount: number): string {
  const parts: string[] = [];

  parts.push('<div style="margin-bottom:28px;">');

  // AI 독서 리포트 뱃지
  parts.push(
    `<div style="margin-bottom:14px;"><span style="display:inline-block;background:#eef8f4;color:#2D6A4F;font-size:12px;font-weight:700;padding:4px 12px;border-radius:12px;letter-spacing:0.02em;">AI 독서 리포트</span></div>`
  );

  // 표지 이미지 + 제목/저자 영역
  if (bookInfo.coverImageUrl) {
    // 이미지가 있으면 테이블 레이아웃 (네이버 호환)
    parts.push(
      `<table style="border:none;border-collapse:collapse;margin:0 0 16px 0;"><tr>`
    );
    parts.push(
      `<td style="vertical-align:top;padding:0 20px 0 0;width:100px;"><img src="${escapeHtml(bookInfo.coverImageUrl)}" alt="${escapeHtml(bookInfo.title)}" style="width:100px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" /></td>`
    );
    parts.push(`<td style="vertical-align:top;padding:0;">`);
    parts.push(
      `<h1 style="font-size:24px;font-weight:800;color:${COLOR_HEADING};margin:0 0 8px 0;line-height:1.4;">${escapeHtml(bookInfo.title)}</h1>`
    );
    if (bookInfo.author) {
      parts.push(
        `<p style="font-size:15px;color:${COLOR_SUB};margin:0 0 12px 0;">${escapeHtml(bookInfo.author)}</p>`
      );
    }
    // 메타 뱃지 (테이블 안)
    parts.push(buildMetaBadges(bookInfo, noteCount));
    parts.push(`</td></tr></table>`);
  } else {
    // 이미지 없으면 기존 블록형
    parts.push(
      `<h1 style="font-size:24px;font-weight:800;color:${COLOR_HEADING};margin:0 0 8px 0;line-height:1.4;">${escapeHtml(bookInfo.title)}</h1>`
    );
    if (bookInfo.author) {
      parts.push(
        `<p style="font-size:15px;color:${COLOR_SUB};margin:0 0 12px 0;">${escapeHtml(bookInfo.author)}</p>`
      );
    }
    parts.push(buildMetaBadges(bookInfo, noteCount));
  }

  parts.push("</div>");
  return parts.join("\n");
}

/** 이모지 뱃지형 메타 정보 */
function buildMetaBadges(bookInfo: BookInfoForReport, noteCount: number): string {
  const badges: string[] = [];
  const badgeStyle =
    "display:inline-block;background:#f5f5f0;color:#666;font-size:13px;padding:3px 10px;border-radius:10px;margin-right:8px;margin-bottom:4px;";

  if (bookInfo.startedAt) {
    const start = new Date(bookInfo.startedAt).toLocaleDateString("ko-KR");
    const end = bookInfo.completedAt
      ? new Date(bookInfo.completedAt).toLocaleDateString("ko-KR")
      : "진행 중";
    badges.push(`<span style="${badgeStyle}">📅 ${start} ~ ${end}</span>`);
  }
  badges.push(`<span style="${badgeStyle}">📝 기록 ${noteCount}개</span>`);

  return `<div style="margin:0;">${badges.join("")}</div>`;
}

/** 섹션별 차별화 HTML 래퍼 */
function buildStyledSection(
  sectionId: string,
  title: string,
  contentHtml: string
): string {
  const style = SECTION_STYLES[sectionId] || DEFAULT_SECTION_STYLE;
  const parts: string[] = [];

  switch (sectionId) {
    case "book-overview":
      // 크림 배경 + 왼쪽 스톤바
      parts.push(
        `<div style="background:${style.bgColor};${style.borderStyle}padding:20px 24px;margin:0;border-radius:0 10px 10px 0;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    case "key-insights":
      // 앰버 배경 + 상단 바
      parts.push(
        `<div style="background:${style.bgColor};${style.borderStyle}padding:20px 24px;margin:0;border-radius:0 0 10px 10px;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    case "memorable-quotes":
      // 왼쪽 세이지 바 (배경 없음, 인용구 자체가 강화됨)
      parts.push(
        `<div style="padding:8px 0;margin:0;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    case "my-thoughts":
      // 라벤더 배경 + 왼쪽 바
      parts.push(
        `<div style="background:${style.bgColor};${style.borderStyle}padding:20px 24px;margin:0;border-radius:0 10px 10px 0;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    case "reading-journey":
      // 로즈 배경 박스
      parts.push(
        `<div style="background:${style.bgColor};padding:20px 24px;margin:0;border-radius:10px;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;border-bottom:2px solid ${style.accentColor};padding-bottom:10px;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    case "summary":
      // 세이지 전체 박스 + 중앙 정렬 헤더
      parts.push(
        `<div style="background:${style.bgColor};border:1px solid #d0e4d5;padding:24px 28px;margin:0;border-radius:12px;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${style.accentColor};margin:0 0 16px 0;line-height:1.5;text-align:center;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;

    default:
      // fallback: 기본 스타일
      parts.push(
        `<div style="background:${style.bgColor};${style.borderStyle}padding:20px 24px;margin:0;border-radius:0 10px 10px 0;">`
      );
      parts.push(
        `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 14px 0;line-height:1.5;">${style.emoji} ${escapeHtml(title)}</h2>`
      );
      parts.push(contentHtml);
      parts.push(`</div>`);
      break;
  }

  return parts.join("\n");
}

/** 노트 요약 섹션 HTML — 카드형 (사진/필사에 링크 포함) */
function buildNoteSection(noteSummaries: NoteSummary[], baseUrl: string): string {
  if (noteSummaries.length === 0) return "";

  const parts: string[] = [];

  // 카드 래퍼
  parts.push(
    `<div style="background:#faf8f3;border:1px solid #e8e4da;border-radius:12px;padding:24px;margin:0;">`
  );
  parts.push(
    `<h2 style="font-size:19px;font-weight:700;color:${COLOR_HEADING};margin:0 0 16px 0;line-height:1.5;">📚 독서 기록 요약</h2>`
  );

  // 타입별 그룹화
  const grouped = noteSummaries.reduce<Record<string, NoteSummary[]>>((acc, note) => {
    const key = note.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  const entries = Object.entries(grouped);
  entries.forEach(([type, notes], groupIdx) => {
    const label = NOTE_TYPE_LABELS[type] || type;
    const isLinkable = LINKABLE_NOTE_TYPES.has(type);

    if (type === "progress") {
      parts.push(
        `<div style="padding:10px 0;${groupIdx < entries.length - 1 ? "border-bottom:1px solid #e8e4da;" : ""}">` +
          `<span style="display:inline-block;background:#e8f4fd;color:#2b6cb0;font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;margin-right:8px;">${label}</span>` +
          `<span style="color:${COLOR_BODY};font-size:${FONT_SIZE_BODY};">${notes.length}건의 진행 기록</span>` +
          `</div>`
      );
    } else {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const title = note.title || `${label} 기록`;
        const page = note.pageNumber
          ? ` <span style="color:${COLOR_META};font-size:13px;">(p.${note.pageNumber})</span>`
          : "";
        const noteUrl = `${baseUrl}/share/notes/${note.id}`;
        const isLast = groupIdx === entries.length - 1 && i === notes.length - 1;

        // 타입 뱃지
        const badge = `<span style="display:inline-block;background:${isLinkable ? "#fef3e2" : "#f3f4f6"};color:${isLinkable ? "#b45309" : COLOR_SUB};font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;margin-right:8px;">${label}</span>`;

        // 사진/필사는 링크, 나머지는 텍스트
        const titleHtml = isLinkable
          ? `<a href="${noteUrl}" style="color:${COLOR_LINK};text-decoration:none;font-weight:500;" target="_blank">${escapeHtml(title)}</a>`
          : escapeHtml(title);

        parts.push(
          `<div style="padding:10px 0;${!isLast ? "border-bottom:1px solid #e8e4da;" : ""}">${badge}${titleHtml}${page}</div>`
        );
      }
    }
  });

  parts.push("</div>");
  return parts.join("\n");
}

/** 하단 마무리 — 장식 + 워터마크 + 리포트 링크 */
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

  const parts: string[] = [];

  // 장식선
  parts.push(
    `<div style="text-align:center;margin:36px 0 20px 0;"><span style="color:#bbb;font-size:14px;">🌿</span><span style="display:inline-block;width:80px;border-top:1px solid #ddd;vertical-align:middle;margin:0 10px;"></span><span style="color:#bbb;font-size:14px;">🌿</span></div>`
  );

  // 하단 박스
  parts.push(
    `<div style="background:#f8f8f4;border-radius:10px;padding:18px 24px;text-align:center;">`
  );

  if (baseUrl && shareId) {
    const reportUrl = `${baseUrl}/share/reports/${shareId}`;
    parts.push(
      `<p style="font-size:14px;color:${COLOR_BODY};margin:0 0 10px 0;"><a href="${reportUrl}" style="color:${COLOR_LINK};text-decoration:none;font-weight:600;" target="_blank">📄 AI 독서 리포트 전문 보기 →</a></p>`
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

  // 최상위 wrapper — 크림 배경
  parts.push(
    `<div style="max-width:720px;margin:0 auto;padding:24px;background:#fefdfb;font-family:${FONT_FAMILY};color:${COLOR_BODY};letter-spacing:-0.01em;">`
  );

  // 1. 리포트 링크 배너 (shareId 있을 때)
  if (baseUrl && shareId) {
    parts.push(buildReportBanner(baseUrl, shareId));
  }

  // 2. 책 정보 헤더
  parts.push(buildBookHeader(bookInfo, noteCount));

  // 3. 이중선 구분
  parts.push(buildDivider("double"));

  // 4. 리포트 섹션 — 섹션별 차별화 + 구분선 패턴
  const sections = parseReportSections(reportMarkdown);
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // 섹션 콘텐츠 (sectionId 전달로 blockquote 분기)
    const contentHtml = markdownToInlineHtml(section.content, section.id);
    parts.push(buildStyledSection(section.id, section.title, contentHtml));

    // 섹션 간 구분선 (마지막 섹션 뒤에는 넣지 않음)
    if (i < sections.length - 1) {
      const dividerIdx = i % SECTION_DIVIDER_SEQUENCE.length;
      parts.push(SECTION_DIVIDER_SEQUENCE[dividerIdx] !== undefined
        ? buildDivider(SECTION_DIVIDER_SEQUENCE[dividerIdx])
        : buildDivider("dashed"));
    }
  }

  // 5. 이중선 구분
  parts.push(buildDivider("double"));

  // 6. 노트 (옵션)
  if (includeNotes && noteSummaries && noteSummaries.length > 0) {
    parts.push(buildNoteSection(noteSummaries, baseUrl));
    parts.push(buildDivider("solid-thin"));
  }

  // 7. 하단 마무리
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
          const link = isLinkable && baseUrl ? ` → ${baseUrl}/share/notes/${note.id}` : "";
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
