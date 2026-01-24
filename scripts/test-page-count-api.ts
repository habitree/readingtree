/**
 * 페이지 수 조회 API 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-page-count-api.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

// 테스트할 ISBN 목록 (한국 도서)
const TEST_ISBNS = [
  "9788932920313", // 82년생 김지영
  "9788936434267", // 채식주의자
  "9788954672214", // 아몬드
  "9791168340794", // 불편한 편의점
  "9788937460999", // 어린왕자
];

// 국립중앙도서관 API 테스트
async function testNLSeojiAPI(isbn: string) {
  const certKey = process.env.NL_SEOJI_CERT_KEY;

  if (!certKey) {
    console.error("❌ NL_SEOJI_CERT_KEY 환경변수가 설정되지 않았습니다.");
    return null;
  }

  const url = new URL("https://www.nl.go.kr/seoji/SearchApi.do");
  url.searchParams.append("cert_key", certKey);
  url.searchParams.append("result_style", "json");
  url.searchParams.append("page_no", "1");
  url.searchParams.append("page_size", "1");
  url.searchParams.append("isbn", isbn);

  console.log(`\n📚 국립중앙도서관 API 테스트: ${isbn}`);
  console.log(`   URL: ${url.toString().replace(certKey, "***")}`);

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`   ❌ HTTP 오류: ${response.status}`);
      return null;
    }

    const data = await response.json();

    console.log(`   📦 응답:`, JSON.stringify(data, null, 2).slice(0, 500));

    if (data.docs && data.docs.length > 0) {
      const doc = data.docs[0];
      console.log(`   ✅ 제목: ${doc.TITLE}`);
      console.log(`   ✅ 저자: ${doc.AUTHOR}`);
      console.log(`   ✅ 출판사: ${doc.PUBLISHER}`);
      console.log(`   ✅ 페이지: ${doc.PAGE}`);

      // 페이지 수 파싱
      if (doc.PAGE) {
        const pageMatch = doc.PAGE.match(/(\d+)/);
        if (pageMatch) {
          const pageCount = parseInt(pageMatch[1], 10);
          console.log(`   🎯 파싱된 페이지 수: ${pageCount}`);
          return pageCount;
        }
      }
    } else {
      console.log(`   ⚠️ 검색 결과 없음`);
    }

    return null;
  } catch (error) {
    console.error(`   ❌ 오류:`, error);
    return null;
  }
}

// Google Books API 테스트 (키 없이)
async function testGoogleBooksAPI(isbn: string) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `isbn:${isbn}`);

  console.log(`\n📗 Google Books API 테스트: ${isbn}`);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`   ❌ HTTP 오류: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      console.log(`   ✅ 제목: ${volumeInfo.title}`);
      console.log(`   ✅ 저자: ${volumeInfo.authors?.join(", ")}`);
      console.log(`   ✅ 페이지: ${volumeInfo.pageCount}`);
      return volumeInfo.pageCount || null;
    } else {
      console.log(`   ⚠️ 검색 결과 없음`);
    }

    return null;
  } catch (error) {
    console.error(`   ❌ 오류:`, error);
    return null;
  }
}

// 메인 테스트 실행
async function main() {
  console.log("========================================");
  console.log("  📖 페이지 수 조회 API 테스트");
  console.log("========================================");

  const results: Array<{
    isbn: string;
    nlSeoji: number | null;
    googleBooks: number | null;
  }> = [];

  for (const isbn of TEST_ISBNS) {
    const nlResult = await testNLSeojiAPI(isbn);

    // API Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 500));

    const googleResult = await testGoogleBooksAPI(isbn);

    results.push({
      isbn,
      nlSeoji: nlResult,
      googleBooks: googleResult,
    });

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n========================================");
  console.log("  📊 테스트 결과 요약");
  console.log("========================================");
  console.log("\n| ISBN | 국립중앙도서관 | Google Books |");
  console.log("|------|--------------|--------------|");

  for (const result of results) {
    const nl = result.nlSeoji ? `${result.nlSeoji}p` : "❌";
    const google = result.googleBooks ? `${result.googleBooks}p` : "❌";
    console.log(`| ${result.isbn} | ${nl.padEnd(12)} | ${google.padEnd(12)} |`);
  }

  const nlSuccess = results.filter(r => r.nlSeoji).length;
  const googleSuccess = results.filter(r => r.googleBooks).length;

  console.log(`\n✅ 국립중앙도서관: ${nlSuccess}/${results.length} 성공`);
  console.log(`✅ Google Books: ${googleSuccess}/${results.length} 성공`);
}

main().catch(console.error);
