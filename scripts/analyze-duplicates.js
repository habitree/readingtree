/**
 * 중복 데이터 분석
 * 1. 이미지(extracted_text) 중복 확인
 * 2. 내 생각(memo_content) 중복 확인
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDuplicates() {
  console.log("=== 중복 데이터 분석 ===\n");

  // 1. 모든 transcription 데이터 조회
  const { data: allData, error } = await supabase
    .from("notes")
    .select(`
      id,
      content,
      created_at,
      book_id,
      books (id, title),
      transcriptions (id, memo_content, quote_content, extracted_text)
    `)
    .eq("type", "transcription")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("조회 오류:", error);
    return;
  }

  console.log(`전체 notes: ${allData.length}개\n`);

  // 2. extracted_text (이미지/OCR 결과) 중복 분석
  console.log("=== 1. 이미지(extracted_text) 중복 분석 ===\n");

  const extractedTextMap = new Map(); // extracted_text -> [notes]

  for (const note of allData) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
    const extractedText = trans?.extracted_text;

    if (extractedText && extractedText.length > 50) {
      // 처음 200자로 비교 (전체 텍스트는 너무 길 수 있음)
      const key = extractedText.substring(0, 200);

      if (!extractedTextMap.has(key)) {
        extractedTextMap.set(key, []);
      }
      extractedTextMap.get(key).push({
        noteId: note.id,
        transId: trans?.id,
        bookTitle: note.books?.title,
        date: note.created_at?.substring(0, 10),
        extractedText: extractedText.substring(0, 100)
      });
    }
  }

  // 중복된 항목 출력
  let imageDuplicates = [];
  for (const [key, notes] of extractedTextMap) {
    if (notes.length > 1) {
      imageDuplicates.push(notes);
    }
  }

  console.log(`이미지 중복 그룹: ${imageDuplicates.length}개\n`);

  for (const group of imageDuplicates.slice(0, 10)) {
    console.log(`[중복 그룹] ${group.length}개`);
    for (const item of group) {
      console.log(`   - ${item.bookTitle} (${item.date})`);
      console.log(`     noteId: ${item.noteId}`);
    }
    console.log();
  }

  // 3. memo_content (내 생각) 중복 분석
  console.log("\n=== 2. 내 생각(memo_content) 중복 분석 ===\n");

  const memoMap = new Map(); // memo_content -> [notes]

  for (const note of allData) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
    const memoContent = trans?.memo_content;

    if (memoContent && memoContent.length > 10) {
      // 처음 100자로 비교
      const key = memoContent.substring(0, 100).replace(/\s+/g, ' ').trim();

      if (!memoMap.has(key)) {
        memoMap.set(key, []);
      }
      memoMap.get(key).push({
        noteId: note.id,
        transId: trans?.id,
        bookTitle: note.books?.title,
        date: note.created_at?.substring(0, 10),
        memoContent: memoContent.substring(0, 60).replace(/\n/g, ' ')
      });
    }
  }

  // 중복된 항목 출력
  let memoDuplicates = [];
  for (const [key, notes] of memoMap) {
    if (notes.length > 1) {
      // 같은 책의 중복은 별도 표시
      const books = new Set(notes.map(n => n.bookTitle));
      memoDuplicates.push({
        memo: key.substring(0, 50),
        notes: notes,
        sameBook: books.size === 1,
        bookCount: books.size
      });
    }
  }

  console.log(`내 생각 중복 그룹: ${memoDuplicates.length}개\n`);

  // 같은 책 내 중복
  const sameBookDuplicates = memoDuplicates.filter(d => d.sameBook);
  console.log(`같은 책 내 중복: ${sameBookDuplicates.length}개`);

  for (const dup of sameBookDuplicates.slice(0, 10)) {
    console.log(`\n[${dup.notes[0].bookTitle}] - ${dup.notes.length}개 중복`);
    console.log(`   memo: ${dup.memo}...`);
    for (const item of dup.notes) {
      console.log(`   - ${item.date} (noteId: ${item.noteId})`);
    }
  }

  // 다른 책에 같은 내 생각
  const diffBookDuplicates = memoDuplicates.filter(d => !d.sameBook);
  console.log(`\n다른 책에 같은 내 생각: ${diffBookDuplicates.length}개`);

  for (const dup of diffBookDuplicates.slice(0, 10)) {
    console.log(`\n[${dup.bookCount}개 책에 중복]`);
    console.log(`   memo: ${dup.memo}...`);
    for (const item of dup.notes) {
      console.log(`   - ${item.bookTitle} (${item.date})`);
    }
  }

  // 4. 통계 요약
  console.log("\n\n=== 통계 요약 ===");
  console.log(`전체 notes: ${allData.length}개`);
  console.log(`이미지 중복 그룹: ${imageDuplicates.length}개`);
  console.log(`  - 중복 notes 수: ${imageDuplicates.reduce((sum, g) => sum + g.length - 1, 0)}개`);
  console.log(`내 생각 중복 그룹: ${memoDuplicates.length}개`);
  console.log(`  - 같은 책 내 중복: ${sameBookDuplicates.length}개`);
  console.log(`  - 다른 책 간 중복: ${diffBookDuplicates.length}개`);

  // JSON으로 저장 (삭제 스크립트용)
  const duplicateData = {
    imageDuplicates: imageDuplicates,
    memoDuplicates: memoDuplicates.map(d => ({
      memo: d.memo,
      notes: d.notes,
      sameBook: d.sameBook
    }))
  };

  console.log("\n중복 데이터 분석 완료");
  return duplicateData;
}

analyzeDuplicates().catch(console.error);
