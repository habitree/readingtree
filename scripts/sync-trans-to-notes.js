/**
 * transcriptions.memo_content → notes.content.memo 동기화
 *
 * 기존에 transcriptions.memo_content에만 있는 데이터를
 * notes.content.memo에도 반영
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncTransToNotes() {
  console.log("=== transcriptions → notes.content 동기화 ===\n");

  // 1. 모든 transcription notes 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      books (title),
      transcriptions (id, memo_content, quote_content)
    `)
    .eq("type", "transcription");

  if (error) {
    console.error("조회 오류:", error);
    return;
  }

  console.log(`전체 notes: ${notes?.length || 0}개\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const note of notes || []) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;

    // transcriptions에 memo_content가 없으면 스킵
    if (!trans?.memo_content) {
      skippedCount++;
      continue;
    }

    // 기존 notes.content 파싱
    let existingContent = {};
    if (note.content) {
      try {
        existingContent = typeof note.content === 'string'
          ? JSON.parse(note.content)
          : note.content;
      } catch (e) {
        existingContent = {};
      }
    }

    // notes.content.memo가 이미 동일한 값이면 스킵
    if (existingContent.memo === trans.memo_content) {
      skippedCount++;
      continue;
    }

    // 새 content 생성
    const newContent = {
      quote: existingContent.quote || trans.quote_content || '',
      memo: trans.memo_content
    };

    // notes.content 업데이트
    const { error: updateError } = await supabase
      .from("notes")
      .update({ content: JSON.stringify(newContent) })
      .eq("id", note.id);

    if (updateError) {
      console.log(`❌ 업데이트 실패: ${note.books?.title} - ${updateError.message}`);
      errorCount++;
    } else {
      updatedCount++;
      const bookTitle = note.books?.title || "제목없음";
      const date = note.created_at?.substring(0, 10);
      console.log(`✅ ${bookTitle} (${date})`);
      console.log(`   memo: ${trans.memo_content.substring(0, 50).replace(/\n/g, ' ')}...`);
    }
  }

  console.log(`\n=== 동기화 완료 ===`);
  console.log(`업데이트: ${updatedCount}개`);
  console.log(`스킵 (이미 동기화 또는 데이터 없음): ${skippedCount}개`);
  console.log(`오류: ${errorCount}개`);

  // 검증
  console.log(`\n=== 검증: notes.content.memo 확인 ===\n`);

  const { data: verifyNotes } = await supabase
    .from("notes")
    .select(`id, content, books (title)`)
    .eq("type", "transcription")
    .not("content", "is", null)
    .limit(10);

  let withMemoCount = 0;
  for (const n of verifyNotes || []) {
    let content = {};
    try {
      content = typeof n.content === 'string' ? JSON.parse(n.content) : n.content || {};
    } catch (e) {}
    if (content.memo) {
      withMemoCount++;
    }
  }
  console.log(`샘플 10개 중 notes.content.memo 있는 항목: ${withMemoCount}개`);
}

syncTransToNotes().catch(console.error);
