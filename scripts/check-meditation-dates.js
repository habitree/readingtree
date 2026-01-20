/**
 * 명상록 날짜별 데이터 확인
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMeditation() {
  console.log("=== 명상록 날짜별 데이터 확인 ===\n");

  // 명상록 관련 모든 notes 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      books!inner (id, title),
      transcriptions (id, memo_content)
    `)
    .eq("type", "transcription")
    .ilike("books.title", "%명상록%")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("오류:", error);
    return;
  }

  console.log(`명상록 필사 기록: ${notes?.length || 0}개\n`);

  for (const note of notes || []) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
    let content = {};
    try {
      content = typeof note.content === 'string' ? JSON.parse(note.content) : note.content || {};
    } catch (e) {}

    console.log(`날짜: ${note.created_at?.substring(0, 10)}`);
    console.log(`책: ${note.books?.title}`);
    console.log(`notes.content.memo: ${content.memo?.substring(0, 60).replace(/\n/g, ' ') || '없음'}...`);
    console.log(`transcriptions.memo_content: ${trans?.memo_content?.substring(0, 60).replace(/\n/g, ' ') || '없음'}...`);
    console.log("---\n");
  }
}

checkMeditation().catch(console.error);
