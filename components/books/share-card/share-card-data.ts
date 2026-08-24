/**
 * AI 리포트 마크다운 + 책 정보 → 공유 카드 데이터(ShareCardData) 정규화
 *
 * AI 출력이 불규칙해도 카드가 깨지지 않도록 모든 필드는 안전하게 폴백한다.
 * (섹션 파싱은 report-parser / report-magazine 유틸을 재사용)
 */

import { parseReportSections } from "@/lib/utils/report-parser";
import { mdToPlain, mdParagraphs, parseInsightItems } from "@/lib/utils/report-magazine";
import { getProxiedImageUrl } from "@/lib/utils/image";
import type { BookInfoForReport } from "@/types/ai/report";
import type { ShareCardData } from "./templates/types";

export interface BuildShareCardInput {
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteTypeCounts: Record<string, number>;
  readingDays: number;
  generatedAt?: string;
}

/** 개요 섹션에서 제외할 메타데이터 라인 프리픽스 */
const META_LINE_RE = /^(제목|저자|독서\s*기간|진행률|읽는\s*이유|분량|상태|출판)/;

/** 인상 깊은 구절 섹션 → { text, page } 배열 */
function parseQuotes(md: string): { text: string; page: string | null }[] {
  const out: { text: string; page: string | null }[] = [];
  for (const block of (md || "").split(/\n{2,}/)) {
    const quoted = block
      .split("\n")
      .map((l) => l.match(/^\s{0,3}>\s?(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => m[1].trim());
    if (quoted.length === 0) continue;
    let text = mdToPlain(quoted.join(" ")).replace(/\s+/g, " ").trim();
    let page: string | null = null;
    const pm = text.match(/\(\s*[pP]\.?\s*([0-9]+(?:\s*[-~]\s*[0-9]+)?)\s*\)\s*$/);
    if (pm && pm.index !== undefined) {
      page = pm[1].replace(/\s+/g, "");
      text = text.slice(0, pm.index).trim();
    }
    text = text.replace(/^["“]/, "").replace(/["”]$/, "").trim();
    if (text) out.push({ text, page });
  }
  return out;
}

/** 나의 생각 정리 섹션 → 독자 문장 배열 (따옴표 라인 우선, 없으면 문단) */
function parseThoughts(md: string): string[] {
  const lines = mdToPlain(md)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const quoted = lines
    .filter((l) => /^["“]/.test(l))
    .map((l) => l.replace(/^["“]/, "").replace(/["”]\s*$/, "").trim())
    .filter(Boolean);
  if (quoted.length > 0) return quoted;
  return mdParagraphs(md);
}

/** 종합 요약에서 마지막 질문 문장 분리 */
function splitClosingQuestion(md: string): { summary: string; question: string | null } {
  const plain = mdToPlain(md).replace(/\s+/g, " ").trim();
  const m = plain.match(/([^.!?。]*\?)\s*$/);
  if (m && m[1].trim().length >= 6) {
    return { summary: plain.slice(0, plain.length - m[0].length).trim(), question: m[1].trim() };
  }
  return { summary: plain, question: null };
}

export function buildShareCardData(input: BuildShareCardInput): ShareCardData {
  const { reportMarkdown, bookInfo, noteCount, noteTypeCounts, readingDays, generatedAt } = input;

  const sections = parseReportSections(reportMarkdown);
  const byId = (id: string) => sections.find((s) => s.id === id);
  const overviewSec = byId("book-overview");
  const insightsSec = byId("key-insights");
  const quotesSec = byId("memorable-quotes");
  const thoughtsSec = byId("my-thoughts");
  const journeySec = byId("reading-journey");
  const summarySec = byId("summary");

  // 개요: 읽는 이유 추출 + 메타 라인 제거한 서술만
  const overviewPlain = overviewSec ? mdToPlain(overviewSec.content) : "";
  const reasonMatch = overviewPlain.match(/읽는\s*이유\s*[:：]\s*([^\n]+)/);
  const readReason = reasonMatch ? reasonMatch[1].trim() : null;
  const overview = overviewPlain
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !META_LINE_RE.test(l))
    .join(" ")
    .trim();

  // 기간(양 끝 포함)
  let periodDays: number | null = null;
  if (bookInfo.startedAt && bookInfo.completedAt) {
    const s = new Date(bookInfo.startedAt).getTime();
    const e = new Date(bookInfo.completedAt).getTime();
    if (Number.isFinite(s) && Number.isFinite(e) && e >= s) {
      periodDays = Math.max(1, Math.round((e - s) / 86400000) + 1);
    }
  }

  const { summary, question } = summarySec
    ? splitClosingQuestion(summarySec.content)
    : { summary: "", question: null };

  return {
    title: bookInfo.title,
    author: bookInfo.author ?? null,
    coverUrl: bookInfo.coverImageUrl ? getProxiedImageUrl(bookInfo.coverImageUrl) : null,
    totalPages: bookInfo.totalPages ?? null,
    startedAt: bookInfo.startedAt ?? null,
    completedAt: bookInfo.completedAt ?? null,
    periodDays,
    readingDays,
    noteCount,
    noteTypeCounts,
    isCompleted: Boolean(bookInfo.completedAt),
    publishedAt: generatedAt || new Date().toISOString(),
    readReason,
    overview,
    insights: insightsSec ? parseInsightItems(insightsSec.content) : [],
    quotes: quotesSec ? parseQuotes(quotesSec.content) : [],
    thoughts: thoughtsSec ? parseThoughts(thoughtsSec.content) : [],
    journey: journeySec ? mdToPlain(journeySec.content).replace(/\s+/g, " ").trim() : "",
    summary,
    closingQuestion: question,
  };
}
