/**
 * Google Books API 테스트 - 키 없이
 */

async function test() {
  const isbn = "9788936434267";
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;

  console.log("Testing WITHOUT API key...");
  console.log("URL:", url);

  const response = await fetch(url);
  console.log("Status:", response.status);

  if (response.ok) {
    const data = await response.json();
    if (data.items && data.items[0]) {
      console.log("Title:", data.items[0].volumeInfo.title);
      console.log("Pages:", data.items[0].volumeInfo.pageCount);
      console.log("\nSUCCESS - API works without key!");
    } else {
      console.log("No results");
    }
  } else {
    const text = await response.text();
    console.log("Error:", text.substring(0, 300));
  }
}

test().catch(console.error);
