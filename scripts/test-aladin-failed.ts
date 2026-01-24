/**
 * 알라딘 API로 실패한 3권 재조회
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const FAILED_BOOKS = [
  { isbn: "9788960306073", title: "부의 통찰" },
  { isbn: "9788935208647", title: "생각하지 않는 사람들" },
  { isbn: "9791193083291", title: "커서 AI로 나만의 수익형 앱 서비스 만들기" },
];

// 알라딘 API
async function fetchFromAladin(isbn: string): Promise<number | null> {
  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    console.log("ALADIN_TTB_KEY not set");
    return null;
  }

  const url = new URL("http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx");
  url.searchParams.append("ttbkey", ttbKey);
  url.searchParams.append("itemIdType", "ISBN13");
  url.searchParams.append("ItemId", isbn);
  url.searchParams.append("output", "js");
  url.searchParams.append("Version", "20131101");
  url.searchParams.append("OptResult", "ebookList,usedList,reviewList");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.log(`   HTTP Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data).slice(0, 400)}`);

    if (data.item && data.item.length > 0) {
      const item = data.item[0];
      if (item.subInfo && item.subInfo.itemPage) {
        return item.subInfo.itemPage;
      }
      if (item.itemPage) {
        return item.itemPage;
      }
    }
    return null;
  } catch (e) {
    console.log(`   Error: ${e}`);
    return null;
  }
}

async function main() {
  console.log("========================================");
  console.log("  Aladin API Test (3 Failed Books)");
  console.log("========================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let updated = 0;

  for (const book of FAILED_BOOKS) {
    console.log(`[${book.title}] ISBN: ${book.isbn}`);

    const pageCount = await fetchFromAladin(book.isbn);

    if (pageCount) {
      console.log(`   -> Page count: ${pageCount}p`);

      const { error } = await supabase
        .from("books")
        .update({ total_pages: pageCount })
        .eq("isbn", book.isbn);

      if (error) {
        console.log(`   -> DB Update FAILED: ${error.message}`);
      } else {
        console.log("   -> DB Updated!");
        updated++;
      }
    } else {
      console.log("   -> Page count NOT FOUND");
    }

    console.log("");
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("========================================");
  console.log(`  Result: ${updated}/3 updated`);
  console.log("========================================");
}

main().catch(console.error);
