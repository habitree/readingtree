/**
 * 특정 책의 필사 기록 확인 스크립트
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBookRecords() {
  console.log("=== 책별 필사 기록 확인 ===\n");

  // "죽음의 수용소에서" 책 검색
  const searchTerms = ["죽음의 수용소", "수용소", "Man's Search"];

  for (const term of searchTerms) {
    console.log(`\n검색어: "${term}"`);
    console.log("-".repeat(60));

    const { data: books, error } = await supabase
      .from("books")
      .select("id, title, author, isbn")
      .ilike("title", `%${term}%`);

    if (error) {
      console.error("오류:", error.message);
      continue;
    }

    if (!books || books.length === 0) {
      console.log("  결과 없음");
      continue;
    }

    for (const book of books) {
      console.log(`\n📚 ${book.title}`);
      console.log(`   저자: ${book.author || "미상"}`);
      console.log(`   ISBN: ${book.isbn || "없음"}`);
      console.log(`   Book ID: ${book.id}`);

      // 해당 책의 notes 조회
      const { data: notes } = await supabase
        .from("notes")
        .select("id, created_at, content, type")
        .eq("book_id", book.id)
        .eq("type", "transcription")
        .order("created_at", { ascending: false });

      if (!notes || notes.length === 0) {
        console.log("   필사 기록: 없음");
        continue;
      }

      console.log(`   필사 기록: ${notes.length}개`);

      for (const note of notes) {
        const noteDate = new Date(note.created_at).toLocaleDateString("ko-KR");
        console.log(`\n   [${noteDate}] Note ID: ${note.id}`);

        // notes.content 확인
        if (note.content) {
          try {
            const parsed = JSON.parse(note.content);
            if (parsed.memo) {
              console.log(`   📝 notes.content.memo: ${parsed.memo.substring(0, 80)}...`);
            }
            if (parsed.quote) {
              console.log(`   📖 notes.content.quote: ${parsed.quote.substring(0, 60)}...`);
            }
          } catch {
            console.log(`   📝 notes.content: ${note.content.substring(0, 80)}...`);
          }
        }

        // transcriptions 확인
        const { data: trans } = await supabase
          .from("transcriptions")
          .select("id, memo_content, quote_content, extracted_text, status")
          .eq("note_id", note.id)
          .single();

        if (trans) {
          console.log(`   Transcription ID: ${trans.id}`);
          console.log(`   상태: ${trans.status || "없음"}`);
          if (trans.memo_content) {
            console.log(`   💭 memo_content: ${trans.memo_content.substring(0, 80).replace(/\n/g, " ")}...`);
          } else {
            console.log(`   💭 memo_content: (비어있음)`);
          }
          if (trans.quote_content) {
            console.log(`   📖 quote_content: ${trans.quote_content.substring(0, 60).replace(/\n/g, " ")}...`);
          }
          if (trans.extracted_text) {
            console.log(`   🔍 extracted_text: ${trans.extracted_text.substring(0, 60).replace(/\n/g, " ")}...`);
          }
        } else {
          console.log(`   ⚠️ transcription 레코드 없음`);
        }
      }
    }
  }

  // 전체 책 목록도 확인
  console.log("\n\n=== 전체 책 목록 (필사 기록 있는 것만) ===\n");

  const { data: allBooks } = await supabase
    .from("books")
    .select("id, title, author")
    .order("title");

  let bookCount = 0;
  for (const book of allBooks || []) {
    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("book_id", book.id)
      .eq("type", "transcription");

    if (count && count > 0) {
      bookCount++;
      console.log(`${bookCount}. ${book.title} (${count}개 필사)`);
    }
  }
}

checkBookRecords().catch(console.error);
