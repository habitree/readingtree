/**
 * Google Books API 테스트
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

console.log("========================================");
console.log("  Google Books API Test");
console.log("========================================\n");

console.log("API Key:", apiKey ? apiKey.substring(0, 15) + "..." : "NOT SET");

async function testGoogleBooks(isbn: string, title: string) {
  console.log(`\n[${title}] ISBN: ${isbn}`);

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `isbn:${isbn}`);
  if (apiKey) {
    url.searchParams.append("key", apiKey);
  }

  try {
    const response = await fetch(url.toString());
    console.log(`   Status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 300)}`);
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      console.log(`   Title: ${book.title}`);
      console.log(`   Page Count: ${book.pageCount || "N/A"}`);
      return book.pageCount;
    } else {
      console.log("   No results found");
      return null;
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
    return null;
  }
}

async function main() {
  const testBooks = [
    { isbn: "9788936434267", title: "아몬드" },
    { isbn: "9788932920313", title: "82년생 김지영" },
    { isbn: "9780141439518", title: "Pride and Prejudice (영문)" },
  ];

  let success = 0;
  for (const book of testBooks) {
    const result = await testGoogleBooks(book.isbn, book.title);
    if (result) success++;
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n========================================");
  console.log(`  Result: ${success}/${testBooks.length} successful`);
  console.log("========================================");
}

main().catch(console.error);
