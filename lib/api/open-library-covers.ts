/**
 * Open Library Covers API 연동
 *
 * - 표지 URL 생성: ISBN 기반 정적 URL (레이트리밋 없음)
 * - 표지 존재 여부 확인: HEAD 요청 후 200일 때만 URL 반환 (저장용)
 * - 레이트리밋: 식별자 기준 IP당 5분 100회 → 호출부에서 배치 수 제한 권장
 * @see doc/api/book-external-apis.md
 */

/** 표지 크기 (S=작음, M=중간, L=큼) */
export type OpenLibraryCoverSize = "S" | "M" | "L";

const BASE_URL = "https://covers.openlibrary.org/b/isbn";

/**
 * ISBN 정규화 (하이픈·공백 제거).
 * Open Library는 유연하게 받지만, URL 경로에는 숫자만 사용.
 */
export function normalizeIsbnForCover(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").trim();
}

/**
 * Open Library Covers URL만 생성 (네트워크 호출 없음).
 * 표지가 없어도 404 이미지가 반환되므로, “저장용”으로 쓸 때는 resolveOpenLibraryCoverUrl 사용 권장.
 */
export function getOpenLibraryCoverUrl(
  isbn: string,
  size: OpenLibraryCoverSize = "M"
): string {
  const normalized = normalizeIsbnForCover(isbn);
  if (!normalized) return "";
  return `${BASE_URL}/${normalized}-${size}.jpg`;
}

export interface ResolveCoverOptions {
  /** HEAD 요청 타임아웃(ms). 기본 2000. */
  timeoutMs?: number;
  /** 표지 크기 */
  size?: OpenLibraryCoverSize;
}

/**
 * 해당 ISBN에 대한 Open Library 표지가 실제로 존재하는지 HEAD로 확인 후,
 * 존재할 때만 URL을 반환. DB 저장용으로 사용하면 깨진 URL 저장을 방지할 수 있음.
 * 레이트리밋(IP당 5분 100회)을 고려해 호출부에서 배치 수를 제한할 것.
 */
export async function resolveOpenLibraryCoverUrl(
  isbn: string,
  options: ResolveCoverOptions = {}
): Promise<string | null> {
  const { timeoutMs = 2000, size = "M" } = options;
  const url = getOpenLibraryCoverUrl(isbn, size);
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "ReadTree/1.0 (book-cover-fallback)" },
    });
    clearTimeout(timeoutId);
    return res.ok ? url : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
