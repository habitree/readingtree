/**
 * 동기화 결과 확인 스크립트
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

async function verifySync() {
  console.log("=== 동기화 결과 확인 ===\n");

  // memo_content가 있는 transcriptions 조회
  const { data: transWithMemo, error: memoError } = await supabase
    .from("transcriptions")
    .select("*")
    .not("memo_content", "is", null);

  if (memoError) {
    console.error("조회 오류:", memoError);
    return;
  }

  console.log(`memo_content가 있는 transcriptions: ${transWithMemo?.length || 0}개\n`);

  // 각 transcription의 상세 정보 조회
  for (const trans of transWithMemo || []) {
    // 해당 note 조회
    const { data: note } = await supabase
      .from("notes")
      .select("id, book_id, created_at, books(title, author)")
      .eq("id", trans.note_id)
      .single();

    if (note) {
      const book = Array.isArray(note.books) ? note.books[0] : note.books;
      const bookTitle = (book as any)?.title || "제목 없음";
      const createdAt = new Date(note.created_at).toLocaleDateString("ko-KR");

      console.log(`📚 ${bookTitle}`);
      console.log(`   날짜: ${createdAt}`);
      console.log(`   💭 내 생각: ${trans.memo_content?.substring(0, 80).replace(/\n/g, " ")}...`);
      if (trans.quote_content) {
        console.log(`   📖 구절: ${trans.quote_content.substring(0, 60).replace(/\n/g, " ")}...`);
      }
      console.log();
    }
  }

  // quote_content가 있는 것도 확인
  const { data: transWithQuote } = await supabase
    .from("transcriptions")
    .select("*")
    .not("quote_content", "is", null);

  console.log(`\nquote_content가 있는 transcriptions: ${transWithQuote?.length || 0}개`);

  // 통계
  console.log("\n=== 최종 통계 ===");
  const { count: totalTrans } = await supabase
    .from("transcriptions")
    .select("*", { count: "exact", head: true });

  console.log(`- 전체 transcriptions: ${totalTrans || 0}개`);
  console.log(`- memo_content 있음: ${transWithMemo?.length || 0}개`);
  console.log(`- quote_content 있음: ${transWithQuote?.length || 0}개`);
}

verifySync().catch(console.error);
