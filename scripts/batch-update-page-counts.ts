/**
 * 기존 책들의 페이지 수 일괄 업데이트 스크립트
 *
 * 실행: npx tsx scripts/batch-update-page-counts.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// 통합 조회
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

// 메인 함수
async function main() {
  console.log("========================================");
  console.log("  📚 페이지 수 일괄 업데이트");
  console.log("========================================\n");

  // 1. 페이지 수가 없는 책 조회
  const { data: books, error } = await supabase
    .from("books")
    .select("id, isbn, title")
    .is("total_pages", null)
    .not("isbn", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("❌ 책 조회 실패:", error.message);
    process.exit(1);
  }

  if (!books || books.length === 0) {
    console.log("✅ 모든 책에 페이지 수가 설정되어 있습니다!");
    return;
  }

  console.log(`📖 페이지 수가 없는 책: ${books.length}권\n`);

  // 2. 일괄 업데이트
  let successCount = 0;
  let failCount = 0;
  const results: Array<{
    title: string;
    isbn: string;
    pageCount: number | null;
    source: string | null;
  }> = [];

  for (const book of books) {
    if (!book.isbn) continue;

    process.stdout.write(`📚 ${book.title.slice(0, 25).padEnd(25)} ... `);

    const result = await fetchBookPageCount(book.isbn);

    if (result.pageCount) {
      // DB 업데이트
      const { error: updateError } = await supabase
        .from("books")
        .update({ total_pages: result.pageCount })
        .eq("id", book.id);

      if (updateError) {
        console.log(`❌ DB 오류`);
        failCount++;
      } else {
        const sourceLabel = result.source === "nl_seoji" ? "도서관" : "Google";
        console.log(`✅ ${result.pageCount}p (${sourceLabel})`);
        successCount++;
      }
    } else {
      console.log(`❌ 조회 실패`);
      failCount++;
    }

    results.push({
      title: book.title,
      isbn: book.isbn,
      pageCount: result.pageCount,
      source: result.source,
    });

    // Rate limiting (500ms 딜레이)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 3. 결과 요약
  console.log("\n========================================");
  console.log("  📊 업데이트 결과");
  console.log("========================================\n");

  console.log(`✅ 성공: ${successCount}권`);
  console.log(`❌ 실패: ${failCount}권`);
  console.log(`📈 성공률: ${Math.round((successCount / books.length) * 100)}%`);

  // 실패한 책 목록
  const failed = results.filter(r => !r.pageCount);
  if (failed.length > 0) {
    console.log("\n⚠️ 페이지 수를 찾지 못한 책:");
    for (const f of failed) {
      console.log(`   - ${f.title} (${f.isbn})`);
    }
  }
}

main().catch(console.error);
