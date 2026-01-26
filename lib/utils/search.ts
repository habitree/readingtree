/**
 * 검색 관련 유틸리티 함수
 */

/**
 * HTML 특수 문자를 이스케이프 처리 (XSS 방지)
 * @param text 원본 텍스트
 * @returns 이스케이프된 텍스트
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 검색어를 하이라이트 처리
 * XSS 방지를 위해 HTML 이스케이프 처리 후 하이라이트 적용
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이트된 HTML 문자열
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return escapeHtml(text);

  // 원본 텍스트를 HTML 이스케이프 처리 (XSS 방지)
  const escapedText = escapeHtml(text);

  // 검색어를 이스케이프하여 정규식 특수 문자 처리
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  // 대소문자 구분 없이 검색 (한글 지원)
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  
  // 검색어를 하이라이트 처리
  // 이미 이스케이프된 텍스트에서 검색하므로 안전함
  return escapedText.replace(
    regex,
    '<mark class="bg-primary/20 dark:bg-primary/30 rounded px-0.5">$1</mark>'
  );
}

/**
 * 검색어를 단어 단위로 분리
 * @param query 검색어
 * @returns 단어 배열
 */
export function splitSearchQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

