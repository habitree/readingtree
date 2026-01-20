/**
 * notes.content 필드 구조 상세 확인
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNotesContent() {
  console.log("=== notes.content 필드 구조 확인 ===\n");

  // 1. 명상록 2025-09-17 찾기
  console.log("1. 명상록 2025-09-17 검색...\n");

  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      book_id,
      books!inner (id, title)
    `)
    .eq("type", "transcription")
    .ilike("books.title", "%명상록%")
    .gte("created_at", "2025-09-17T00:00:00")
    .lt("created_at", "2025-09-18T00:00:00");

  if (error) {
    console.error("오류:", error);
  } else {
    console.log(`명상록 2025-09-17: ${notes?.length || 0}개\n`);
    for (const note of notes || []) {
      console.log(`note_id: ${note.id}`);
      console.log(`책: ${note.books?.title}`);
      console.log(`content 타입: ${typeof note.content}`);
      console.log(`content 값:`, note.content);
      console.log("---\n");
    }
  }

  // 2. content가 JSON 형식인 notes 샘플
  console.log("\n2. content가 있는 notes 샘플 (JSON 구조 확인)...\n");

  const { data: sampleNotes, error: sampleError } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      books (title)
    `)
    .eq("type", "transcription")
    .not("content", "is", null)
    .limit(10);

  if (sampleError) {
    console.error("오류:", sampleError);
  } else {
    for (const note of sampleNotes || []) {
      console.log(`책: ${note.books?.title}`);
      console.log(`날짜: ${note.created_at?.substring(0, 10)}`);
      console.log(`content 타입: ${typeof note.content}`);

      // content 파싱
      let parsed = note.content;
      if (typeof note.content === 'string') {
        try {
          parsed = JSON.parse(note.content);
        } catch (e) {
          parsed = note.content;
        }
      }

      if (parsed && typeof parsed === 'object') {
        console.log(`  - quote: ${parsed.quote?.substring(0, 50) || '없음'}...`);
        console.log(`  - memo: ${parsed.memo?.substring(0, 50) || '없음'}...`);
      } else {
        console.log(`  content (string): ${String(parsed).substring(0, 100)}...`);
      }
      console.log("---\n");
    }
  }

  // 3. transcriptions와 notes.content 비교
  console.log("\n3. notes.content vs transcriptions 비교...\n");

  const { data: comparison, error: compError } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      books (title),
      transcriptions (id, memo_content, quote_content)
    `)
    .eq("type", "transcription")
    .not("content", "is", null)
    .limit(5);

  if (compError) {
    console.error("오류:", compError);
  } else {
    for (const note of comparison || []) {
      const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
      let noteContent = note.content;
      if (typeof noteContent === 'string') {
        try { noteContent = JSON.parse(noteContent); } catch (e) {}
      }

      console.log(`책: ${note.books?.title}`);
      console.log(`날짜: ${note.created_at?.substring(0, 10)}`);
      console.log(`\n[notes.content]`);
      console.log(`  quote: ${noteContent?.quote?.substring(0, 60) || '없음'}...`);
      console.log(`  memo: ${noteContent?.memo?.substring(0, 60) || '없음'}...`);
      console.log(`\n[transcriptions]`);
      console.log(`  quote_content: ${trans?.quote_content?.substring(0, 60) || '없음'}...`);
      console.log(`  memo_content: ${trans?.memo_content?.substring(0, 60) || '없음'}...`);
      console.log("\n===\n");
    }
  }
}

checkNotesContent().catch(console.error);
