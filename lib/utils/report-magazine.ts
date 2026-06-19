/**
 * AI 독서 리포트(매거진형) 마크다운 → 표현 요소 추출 유틸
 *
 * `parseReportSections`가 마크다운을 섹션(id/title/content)으로 나눈 뒤,
 * 매거진 레이아웃이 필요로 하는 형태(문단/항목/인용)로 콘텐츠를 가공한다.
 * AI 출력이 불규칙해도 깨지지 않도록 모든 함수는 안전하게 폴백한다.
 */

/** 인라인 마크다운 표기를 제거해 순수 텍스트로 변환 */
export function mdToPlain(md: string): string {
  return (md || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 이미지
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // 링크 → 텍스트
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // 코드
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // 굵게/기울임
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // 헤딩
    .replace(/^\s{0,3}>\s?/gm, "") // 인용 마커
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "") // 리스트 마커
    .replace(/\s+\n/g, "\n")
    .trim();
}

/** 본문을 순수 텍스트 문단 배열로 분리 (헤딩/리스트/인용 블록 제외) */
export function mdParagraphs(md: string): string[] {
  const blocks = (md || "").split(/\n{2,}/);
  const out: string[] = [];
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    // 리스트/인용/헤딩만으로 구성된 블록은 본문 문단에서 제외
    const lines = block.split("\n");
    const isListy = lines.every((l) => /^\s{0,3}(?:[-*+]|\d+\.|>|#)/.test(l));
    if (isListy) continue;
    const plain = mdToPlain(block).replace(/\n+/g, " ").trim();
    if (plain) out.push(plain);
  }
  return out;
}

export interface InsightItem {
  title: string;
  body: string;
}

/** "핵심 인사이트" 섹션을 항목(제목 + 설명) 배열로 파싱 */
export function parseInsightItems(md: string): InsightItem[] {
  const lines = (md || "").split("\n");
  const items: InsightItem[] = [];
  let current: { raw: string; cont: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const text = (current.raw + " " + current.cont.join(" ")).trim();
    items.push(splitTitleBody(text));
    current = null;
  };

  for (const line of lines) {
    const m = line.match(/^\s{0,3}(?:[-*+]|\d+\.)\s+(.*)$/);
    if (m) {
      flush();
      current = { raw: m[1].trim(), cont: [] };
    } else if (current && line.trim() && !/^\s{0,3}#{1,6}\s/.test(line)) {
      current.cont.push(mdToPlain(line));
    }
  }
  flush();

  // 리스트가 전혀 없으면 문단을 항목으로 사용
  if (items.length === 0) {
    return mdParagraphs(md).map((p) => splitTitleBody(p));
  }
  return items;
}

/** 한 항목 텍스트에서 제목/본문 분리 */
function splitTitleBody(text: string): InsightItem {
  // **제목**: 본문  /  **제목** — 본문  /  **제목** - 본문
  const bold = text.match(/^[*_]{2}([^*_]+)[*_]{2}\s*[:：\-–—]?\s*(.*)$/);
  if (bold) {
    return { title: bold[1].trim(), body: mdToPlain(bold[2]).trim() };
  }
  const plain = mdToPlain(text);
  // 제목: 본문
  const colon = plain.match(/^([^:：]{2,40})[:：]\s+(.+)$/);
  if (colon) {
    return { title: colon[1].trim(), body: colon[2].trim() };
  }
  // 첫 문장을 제목으로
  const sent = plain.match(/^(.+?[.!?。]) (.+)$/);
  if (sent && sent[1].length <= 50) {
    return { title: sent[1].trim(), body: sent[2].trim() };
  }
  return { title: plain.trim(), body: "" };
}

export interface PullQuote {
  text: string;
  attribution: string | null;
}

/** 섹션에서 대표 인용을 추출 (blockquote 우선, 없으면 첫 문장) */
export function firstQuote(md: string): PullQuote | null {
  const lines = (md || "").split("\n");
  const quoteLines: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s{0,3}>\s?(.*)$/);
    if (m) {
      quoteLines.push(m[1].trim());
    } else if (quoteLines.length > 0) {
      break; // 연속 blockquote 종료
    }
  }
  if (quoteLines.length > 0) {
    let attribution: string | null = null;
    const last = quoteLines[quoteLines.length - 1];
    if (/^[—–-]\s*\S/.test(last) || (last.length <= 40 && /^[—–-]/.test(last))) {
      attribution = last.replace(/^[—–-]\s*/, "").trim();
      quoteLines.pop();
    }
    const text = mdToPlain(quoteLines.join(" ")).trim();
    if (text) return { text, attribution };
  }
  // 폴백: 첫 문단의 첫 문장
  const para = mdParagraphs(md)[0];
  if (para) {
    const sentence = para.match(/^(.+?[.!?。])(\s|$)/);
    return { text: (sentence ? sentence[1] : para).trim(), attribution: null };
  }
  return null;
}

/** 본문 블록 (문단 / 리스트 / 인용) — 실제 AI 출력이 리스트·인용 위주여도 안전 렌더 */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: InsightItem[] }
  | { kind: "quote"; text: string; attribution: string | null };

const LIST_RE = /^\s{0,3}(?:[-*+]|\d+\.)\s+/;

/** 섹션 본문을 블록 배열로 파싱 (문단/리스트/인용 혼재 대응) */
export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of (md || "").split(/\n{2,}/)) {
    const b = raw.trim();
    if (!b) continue;
    const lines = b.split("\n").filter((l) => l.trim());
    const isQuote = lines.every((l) => /^\s{0,3}>/.test(l));
    const isList =
      lines.some((l) => LIST_RE.test(l)) &&
      lines.every((l) => LIST_RE.test(l) || /^\s+\S/.test(l));
    if (isQuote) {
      const q = firstQuote(b);
      if (q) blocks.push({ kind: "quote", text: q.text, attribution: q.attribution });
    } else if (isList) {
      const items = parseInsightItems(b);
      if (items.length) blocks.push({ kind: "list", items });
    } else {
      const text = mdToPlain(b).replace(/\n+/g, " ").trim();
      if (text) blocks.push({ kind: "p", text });
    }
  }
  return blocks;
}

/** 텍스트의 첫 문장 (공유 카드 한 줄용) */
export function firstSentence(text: string, maxLen = 80): string {
  const plain = mdToPlain(text).replace(/\n+/g, " ").trim();
  if (!plain) return "";
  const m = plain.match(/^(.+?[.!?。])(\s|$)/);
  const s = (m ? m[1] : plain).trim();
  return s.length > maxLen ? s.slice(0, maxLen).trim() + "…" : s;
}
