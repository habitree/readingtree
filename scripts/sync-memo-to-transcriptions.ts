/**
 * notes.content의 memo/quote를 transcriptions 테이블로 동기화하는 스크립트
 *
 * 로직:
 * 1. notes 테이블에서 transcription 타입의 기록 조회
 * 2. notes.content에서 JSON 형식의 memo/quote 파싱
 * 3. 해당 note의 transcriptions 레코드에 memo_content/quote_content 업데이트
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

interface SyncResult {
  noteId: string;
  bookTitle: string;
  createdAt: string;
  hasMemo: boolean;
  hasQuote: boolean;
  status: "success" | "skipped" | "error";
  message?: string;
}

async function syncMemoToTranscriptions() {
  console.log("=== notes.content → transcriptions 동기화 시작 ===\n");

  // 1. notes 테이블에서 transcription 타입의 기록 조회
  const { data: notes, error: notesError } = await supabase
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
        author
      )
    `)
    .eq("type", "transcription")
    .not("content", "is", null)
    .order("created_at", { ascending: false });

  if (notesError) {
    console.error("Notes 조회 오류:", notesError);
    return;
  }

  console.log(`총 ${notes?.length || 0}개의 필사 기록 중 content가 있는 기록 조회 완료\n`);

  // 2. 동기화 대상 찾기
  const syncTargets: Array<{
    noteId: string;
    bookTitle: string;
    author: string;
    createdAt: string;
    memo?: string;
    quote?: string;
  }> = [];

  notes?.forEach((note: any) => {
    if (note.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (typeof parsed === "object" && parsed !== null) {
          const memo = parsed.memo;
          const quote = parsed.quote;

          if (memo || quote) {
            const book = Array.isArray(note.books) ? note.books[0] : note.books;
            syncTargets.push({
              noteId: note.id,
              bookTitle: book?.title || "제목 없음",
              author: book?.author || "저자 미상",
              createdAt: new Date(note.created_at).toLocaleDateString("ko-KR"),
              memo: memo || undefined,
              quote: quote || undefined,
            });
          }
        }
      } catch {
        // JSON 파싱 실패 시 무시 (구 형식)
      }
    }
  });

  console.log(`=== 동기화 대상: ${syncTargets.length}개 ===\n`);

  if (syncTargets.length === 0) {
    console.log("동기화할 대상이 없습니다.");
    return;
  }

  // 동기화 대상 미리보기
  console.log("동기화 대상 목록:");
  syncTargets.forEach((target, idx) => {
    console.log(`[${idx + 1}] ${target.createdAt} | ${target.bookTitle}`);
    if (target.quote) {
      console.log(`    📖 구절: ${target.quote.substring(0, 50).replace(/\n/g, " ")}...`);
    }
    if (target.memo) {
      console.log(`    💭 내 생각: ${target.memo.substring(0, 50).replace(/\n/g, " ")}...`);
    }
  });

  console.log("\n=== 동기화 실행 ===\n");

  // 3. 동기화 실행
  const results: SyncResult[] = [];

  for (const target of syncTargets) {
    // transcriptions 테이블에서 해당 note_id로 레코드 찾기
    const { data: transcription, error: transError } = await supabase
      .from("transcriptions")
      .select("id, memo_content, quote_content")
      .eq("note_id", target.noteId)
      .maybeSingle();

    if (transError) {
      results.push({
        noteId: target.noteId,
        bookTitle: target.bookTitle,
        createdAt: target.createdAt,
        hasMemo: !!target.memo,
        hasQuote: !!target.quote,
        status: "error",
        message: `조회 오류: ${transError.message}`,
      });
      continue;
    }

    if (!transcription) {
      // transcription 레코드가 없으면 새로 생성
      const { error: insertError } = await supabase
        .from("transcriptions")
        .insert({
          note_id: target.noteId,
          extracted_text: "", // 빈 문자열로 초기화
          memo_content: target.memo || null,
          quote_content: target.quote || null,
          status: "completed",
        });

      if (insertError) {
        results.push({
          noteId: target.noteId,
          bookTitle: target.bookTitle,
          createdAt: target.createdAt,
          hasMemo: !!target.memo,
          hasQuote: !!target.quote,
          status: "error",
          message: `생성 오류: ${insertError.message}`,
        });
      } else {
        results.push({
          noteId: target.noteId,
          bookTitle: target.bookTitle,
          createdAt: target.createdAt,
          hasMemo: !!target.memo,
          hasQuote: !!target.quote,
          status: "success",
          message: "새 레코드 생성",
        });
      }
      continue;
    }

    // 기존 레코드가 있으면 업데이트
    const updateData: { memo_content?: string | null; quote_content?: string | null } = {};
    let needsUpdate = false;

    // memo_content 업데이트 (기존 값이 없거나 비어있을 때만)
    if (target.memo && (!transcription.memo_content || transcription.memo_content.trim() === "")) {
      updateData.memo_content = target.memo;
      needsUpdate = true;
    }

    // quote_content 업데이트 (기존 값이 없거나 비어있을 때만)
    if (target.quote && (!transcription.quote_content || transcription.quote_content.trim() === "")) {
      updateData.quote_content = target.quote;
      needsUpdate = true;
    }

    if (!needsUpdate) {
      results.push({
        noteId: target.noteId,
        bookTitle: target.bookTitle,
        createdAt: target.createdAt,
        hasMemo: !!target.memo,
        hasQuote: !!target.quote,
        status: "skipped",
        message: "이미 데이터가 있음",
      });
      continue;
    }

    const { error: updateError } = await supabase
      .from("transcriptions")
      .update(updateData)
      .eq("id", transcription.id);

    if (updateError) {
      results.push({
        noteId: target.noteId,
        bookTitle: target.bookTitle,
        createdAt: target.createdAt,
        hasMemo: !!target.memo,
        hasQuote: !!target.quote,
        status: "error",
        message: `업데이트 오류: ${updateError.message}`,
      });
    } else {
      results.push({
        noteId: target.noteId,
        bookTitle: target.bookTitle,
        createdAt: target.createdAt,
        hasMemo: !!target.memo,
        hasQuote: !!target.quote,
        status: "success",
        message: `업데이트 완료 (memo: ${!!updateData.memo_content}, quote: ${!!updateData.quote_content})`,
      });
    }
  }

  // 4. 결과 출력
  console.log("=== 동기화 결과 ===\n");

  const successCount = results.filter((r) => r.status === "success").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️ 스킵: ${skippedCount}개 (이미 데이터 있음)`);
  console.log(`❌ 오류: ${errorCount}개`);

  console.log("\n상세 결과:");
  results.forEach((result, idx) => {
    const statusIcon = result.status === "success" ? "✅" : result.status === "skipped" ? "⏭️" : "❌";
    console.log(`${statusIcon} [${idx + 1}] ${result.createdAt} | ${result.bookTitle.substring(0, 30)}... | ${result.message}`);
  });

  // 5. 동기화 후 확인
  console.log("\n=== 동기화 후 transcriptions 상태 확인 ===\n");

  const { data: updatedTrans, error: checkError } = await supabase
    .from("transcriptions")
    .select("id, note_id, memo_content, quote_content")
    .or("memo_content.neq.,quote_content.neq.")
    .not("memo_content", "is", null);

  if (checkError) {
    console.error("확인 오류:", checkError);
  } else {
    console.log(`memo_content 또는 quote_content가 있는 transcriptions: ${updatedTrans?.length || 0}개`);
  }
}

syncMemoToTranscriptions().catch(console.error);
