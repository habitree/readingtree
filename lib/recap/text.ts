/**
 * 월간 결산/책 대시보드 공용 텍스트 유틸.
 *
 * "use server" 없는 순수 모듈 — compute.ts(집계)와 books-list.ts(책별 발췌) 양쪽에서 공유.
 */

/** 초 → "N시간 M분" / "M분" 한국어 표기 */
export function formatReadingTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

/** notes.content에서 인용 텍스트 추출 (JSON {quote,memo,text} 또는 평문) */
export function extractQuoteText(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { quote?: unknown; memo?: unknown; text?: unknown };
      const q = typeof parsed.quote === "string" ? parsed.quote : "";
      const m = typeof parsed.memo === "string" ? parsed.memo : "";
      const x = typeof parsed.text === "string" ? parsed.text : "";
      return (q || x || m).trim();
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
