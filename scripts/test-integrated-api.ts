/**
 * 통합 페이지 수 조회 API 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-integrated-api.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

// 테스트할 ISBN 목록
const TEST_ISBNS = [
  { isbn: "9788932920313", title: "82년생 김지영" },
  { isbn: "9788936434267", title: "아몬드" },
  { isbn: "9788954672214", title: "시선으로부터" },
  { isbn: "9791168340794", title: "인류의 미래를 묻다" },
  { isbn: "9788937460999", title: "맥베스" },
  { isbn: "9788934972464", title: "총균쇠" },
  { isbn: "9788901260716", title: "역행자" },
];

// ISBN 정규화
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").trim();
}

// 페이지 수 유효성 검사
function isValidPageCount(pageCount: number): boolean {
  return (
    typeof pageCount === "number" &&
    Number.isFinite(pageCount) &&
    pageCount >= 1 &&
    pageCount <= 10000
  );
}

// 국립중앙도서관 API
async function fetchFromNLSeoji(isbn: string): Promise<number | null> {
  const certKey = process.env.NL_SEOJI_CERT_KEY;
  if (!certKey) return null;

  const url = new URL("https://www.nl.go.kr/seoji/SearchApi.do");
  url.searchParams.append("cert_key", certKey);
  url.searchParams.append("result_style", "json");
  url.searchParams.append("page_no", "1");
  url.searchParams.append("page_size", "1");
  url.searchParams.append("isbn", isbn);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      const pageStr = data.docs[0].PAGE;
      if (pageStr) {
        const pageMatch = pageStr.match(/(\d+)/);
        if (pageMatch) {
          const pageCount = parseInt(pageMatch[1], 10);
          if (isValidPageCount(pageCount)) {
            return pageCount;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Google Books API
async function fetchFromGoogleBooks(isbn: string): Promise<number | null> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `isbn:${isbn}`);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const pageCount = data.items[0].volumeInfo?.pageCount;
      if (pageCount && isValidPageCount(pageCount)) {
        return pageCount;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 통합 조회 (복합 전략)
async function fetchBookPageCount(isbn: string): Promise<{
  pageCount: number | null;
  source: string | null;
}> {
  const normalized = normalizeIsbn(isbn);

  // 1. 국립중앙도서관 시도
  const nlResult = await fetchFromNLSeoji(normalized);
  if (nlResult !== null) {
    return { pageCount: nlResult, source: "nl_seoji" };
  }

  // 2. Google Books 시도
  const googleResult = await fetchFromGoogleBooks(normalized);
  if (googleResult !== null) {
    return { pageCount: googleResult, source: "google_books" };
  }

  return { pageCount: null, source: null };
}

// 메인 테스트
async function main() {
  console.log("========================================");
  console.log("  📖 통합 페이지 수 조회 API 테스트");
  console.log("========================================\n");

  const results: Array<{
    isbn: string;
    title: string;
    pageCount: number | null;
    source: string | null;
  }> = [];

  for (const book of TEST_ISBNS) {
    console.log(`📚 ${book.title} (${book.isbn})`);

    const result = await fetchBookPageCount(book.isbn);

    if (result.pageCount) {
      const sourceNames: Record<string, string> = {
        nl_seoji: "국립중앙도서관",
        google_books: "Google Books",
      };
      console.log(
        `   ✅ ${result.pageCount}p (${sourceNames[result.source!] || result.source})`
      );
    } else {
      console.log(`   ❌ 조회 실패`);
    }

    results.push({
      isbn: book.isbn,
      title: book.title,
      pageCount: result.pageCount,
      source: result.source,
    });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n========================================");
  console.log("  📊 통합 테스트 결과");
  console.log("========================================\n");

  console.log("| 책 제목 | 페이지 | 출처 |");
  console.log("|---------|--------|------|");

  for (const r of results) {
    const pages = r.pageCount ? `${r.pageCount}p` : "❌";
    const source = r.source === "nl_seoji" ? "도서관" : r.source === "google_books" ? "Google" : "-";
    console.log(`| ${r.title.padEnd(15)} | ${pages.padEnd(6)} | ${source.padEnd(6)} |`);
  }

  const successCount = results.filter(r => r.pageCount).length;
  const nlCount = results.filter(r => r.source === "nl_seoji").length;
  const googleCount = results.filter(r => r.source === "google_books").length;

  console.log(`\n📈 총 성공률: ${successCount}/${results.length} (${Math.round(successCount / results.length * 100)}%)`);
  console.log(`   - 국립중앙도서관: ${nlCount}건`);
  console.log(`   - Google Books: ${googleCount}건 (폴백)`);
}

main().catch(console.error);
