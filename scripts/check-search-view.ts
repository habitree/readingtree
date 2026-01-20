/**
 * habitree.io/search 페이지에서 보여지는 것과 동일한 데이터 조회
 * (검색 API와 동일한 방식으로 조회)
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSearchView() {
  console.log("=== habitree.io/search 페이지 데이터 확인 ===\n");

  // notes와 transcriptions를 조인하여 검색 페이지에서 보여지는 데이터 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      book_id,
      content,
      type,
      created_at,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("type", "transcription")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("조회 오류:", error);
    return;
  }

  console.log(`최근 필사 기록 ${notes?.length || 0}개 조회\n`);
  console.log("=".repeat(80));

  for (const note of notes || []) {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    const bookTitle = (book as any)?.title || "제목 없음";
    const author = (book as any)?.author || "저자 미상";
    const createdAt = new Date(note.created_at).toLocaleDateString("ko-KR");

    // transcription 데이터 조회
    const { data: trans } = await supabase
      .from("transcriptions")
      .select("extracted_text, quote_content, memo_content, status")
      .eq("note_id", note.id)
      .single();

    console.log(`\n📚 ${bookTitle}`);
    console.log(`   저자: ${author}`);
    console.log(`   필사 일자: ${createdAt}`);
    console.log(`   상태: ${trans?.status || "없음"}`);

    // OCR 추출 텍스트
    if (trans?.extracted_text) {
      console.log(`   📝 OCR 추출: ${trans.extracted_text.substring(0, 60).replace(/\n/g, " ")}...`);
    }

    // 구절 (quote_content)
    if (trans?.quote_content) {
      console.log(`   📖 구절: ${trans.quote_content.substring(0, 60).replace(/\n/g, " ")}...`);
    }

    // 내 생각 (memo_content) - 이번에 동기화한 데이터!
    if (trans?.memo_content) {
      console.log(`   💭 내 생각: ${trans.memo_content.substring(0, 60).replace(/\n/g, " ")}...`);
    } else {
      // notes.content에서 확인
      if (note.content) {
        try {
          const parsed = JSON.parse(note.content);
          if (parsed.memo) {
            console.log(`   💭 내 생각 (notes): ${parsed.memo.substring(0, 60).replace(/\n/g, " ")}...`);
          }
        } catch {}
      }
    }

    console.log("-".repeat(80));
  }

  // memo_content가 있는 기록만 따로 출력
  console.log("\n\n=== '내 생각'이 있는 기록 (transcriptions.memo_content) ===\n");

  const { data: withMemo } = await supabase
    .from("transcriptions")
    .select("note_id, memo_content, quote_content")
    .not("memo_content", "is", null);

  console.log(`총 ${withMemo?.length || 0}개의 기록에 '내 생각'이 저장됨\n`);

  for (const trans of withMemo || []) {
    const { data: note } = await supabase
      .from("notes")
      .select("created_at, books(title)")
      .eq("id", trans.note_id)
      .single();

    if (note) {
      const book = Array.isArray(note.books) ? note.books[0] : note.books;
      const bookTitle = (book as any)?.title || "제목 없음";
      const createdAt = new Date(note.created_at).toLocaleDateString("ko-KR");

      console.log(`✅ ${createdAt} | ${bookTitle}`);
      console.log(`   💭 ${trans.memo_content?.substring(0, 70).replace(/\n/g, " ")}...`);
      console.log();
    }
  }
}

checkSearchView().catch(console.error);
