/**
 * Supabase 데이터 구조 상세 확인
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStructure() {
  console.log("=== Supabase 데이터 구조 상세 확인 ===\n");

  // 1. notes 테이블 구조 확인 (명상록 2025-09-17)
  console.log("1. notes 테이블 - 명상록 검색...\n");

  const { data: meditationNotes, error: notesError } = await supabase
    .from("notes")
    .select(`
      *,
      books (*),
      transcriptions (*)
    `)
    .eq("type", "transcription")
    .ilike("books.title", "%명상록%");

  if (notesError) {
    console.error("notes 조회 오류:", notesError);
  } else {
    console.log(`명상록 관련 notes: ${meditationNotes?.length || 0}개\n`);

    for (const note of meditationNotes || []) {
      const noteDate = note.created_at?.substring(0, 10);
      console.log(`--- Note ID: ${note.id} ---`);
      console.log(`created_at: ${note.created_at}`);
      console.log(`날짜: ${noteDate}`);
      console.log(`book_id: ${note.book_id}`);
      console.log(`type: ${note.type}`);
      console.log(`content (처음 100자): ${note.content?.substring(0, 100)}...`);
      console.log(`\nbooks:`, JSON.stringify(note.books, null, 2));
      console.log(`\ntranscriptions:`, JSON.stringify(note.transcriptions, null, 2));
      console.log("\n");
    }
  }

  // 2. transcriptions 테이블 전체 구조 확인
  console.log("\n2. transcriptions 테이블 컬럼 확인...\n");

  const { data: sampleTrans, error: transError } = await supabase
    .from("transcriptions")
    .select("*")
    .limit(3);

  if (transError) {
    console.error("transcriptions 조회 오류:", transError);
  } else if (sampleTrans && sampleTrans.length > 0) {
    console.log("transcriptions 컬럼:", Object.keys(sampleTrans[0]));
    console.log("\n샘플 데이터:");
    for (const trans of sampleTrans) {
      console.log(JSON.stringify(trans, null, 2));
      console.log("---");
    }
  }

  // 3. memo_content가 있는 transcriptions 확인
  console.log("\n3. memo_content가 있는 transcriptions 샘플...\n");

  const { data: withMemo, error: memoError } = await supabase
    .from("transcriptions")
    .select(`
      *,
      notes!inner (
        id,
        created_at,
        content,
        book_id,
        books (title)
      )
    `)
    .not("memo_content", "is", null)
    .limit(5);

  if (memoError) {
    console.error("memo 조회 오류:", memoError);
  } else {
    console.log(`memo_content가 있는 항목: ${withMemo?.length || 0}개 (샘플)\n`);
    for (const item of withMemo || []) {
      const book = item.notes?.books;
      console.log(`책: ${book?.title || "?"}`);
      console.log(`날짜: ${item.notes?.created_at?.substring(0, 10)}`);
      console.log(`memo_content: ${item.memo_content?.substring(0, 80)}...`);
      console.log(`quote_content: ${item.quote_content?.substring(0, 50) || "없음"}`);
      console.log("전체 구조:", JSON.stringify(item, null, 2).substring(0, 500));
      console.log("---\n");
    }
  }

  // 4. 명상록 2025-09-17 특정 조회
  console.log("\n4. 명상록 2025-09-17 날짜 검색...\n");

  const { data: sept17Notes, error: sept17Error } = await supabase
    .from("notes")
    .select(`
      *,
      books!inner (id, title),
      transcriptions (*)
    `)
    .eq("type", "transcription")
    .gte("created_at", "2025-09-17T00:00:00")
    .lt("created_at", "2025-09-18T00:00:00");

  if (sept17Error) {
    console.error("2025-09-17 조회 오류:", sept17Error);
  } else {
    console.log(`2025-09-17 필사 기록: ${sept17Notes?.length || 0}개\n`);
    for (const note of sept17Notes || []) {
      console.log(`책: ${note.books?.title}`);
      console.log(`note_id: ${note.id}`);
      console.log(`transcriptions:`, JSON.stringify(note.transcriptions, null, 2));
      console.log("---\n");
    }
  }
}

checkStructure().catch(console.error);
