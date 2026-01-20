/**
 * Firebase → Supabase 정밀 동기화
 * 기준: habitree.io의 "나의기록" (personalThought)
 * 매칭: 같은 책 + 같은 날짜 (AND 조건)
 */
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

// 환경변수 로드
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Firebase Admin SDK 초기화
const serviceAccountPath = path.resolve(__dirname, "../habitree-f49e1-c9ca7c97d434.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 날짜 정규화 함수
 * "2025-09-17", "2025.09.17", "25.9.17" 등을 YYYY-MM-DD로 통일
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  // ISO 형식 (2025-09-17T06:47:00.000Z)
  if (dateStr.includes('T')) {
    dateStr = dateStr.substring(0, 10);
  }

  // 다양한 형식 파싱
  const match = dateStr.match(/(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (match) {
    let year = match[1].length === 2 ? `20${match[1]}` : match[1];
    let month = match[2].padStart(2, '0');
    let day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * 책 제목 정규화 (부제 제외, 소문자, 공백 제거)
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s*[\(\（].*[\)\）]\s*/g, '')  // 부제 (괄호) 제거
    .replace(/\s+/g, '')  // 공백 제거
    .trim();
}

async function syncFirebasePrecise() {
  console.log("=== Firebase → Supabase 정밀 동기화 시작 ===\n");
  console.log("매칭 조건: 같은 책 제목 AND 같은 날짜\n");

  try {
    // 1. Firebase에서 personalThought가 있는 모든 문서 조회
    console.log("1. Firebase sample_transcriptions 조회 중...\n");

    const firebaseData = [];

    // sample_transcriptions 컬렉션 조회
    const sampleTransSnapshot = await db.collection("sample_transcriptions").get();
    console.log(`   sample_transcriptions: ${sampleTransSnapshot.size}개 문서`);

    sampleTransSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.personalThought) {
        firebaseData.push({
          id: doc.id,
          collection: "sample_transcriptions",
          title: data.title,
          date: data.date,
          personalThought: data.personalThought,
          bookId: data.bookId,
          content: data.content,
          createdAt: data.createdAt,
        });
      }
    });

    // transcriptions 컬렉션도 확인
    const transSnapshot = await db.collection("transcriptions").get();
    console.log(`   transcriptions: ${transSnapshot.size}개 문서`);

    transSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.personalThought) {
        firebaseData.push({
          id: doc.id,
          collection: "transcriptions",
          title: data.title,
          date: data.date,
          personalThought: data.personalThought,
          bookId: data.bookId,
          content: data.content,
          createdAt: data.createdAt,
        });
      }
    });

    console.log(`\n   personalThought가 있는 문서: ${firebaseData.length}개\n`);

    if (firebaseData.length === 0) {
      console.log("동기화할 데이터가 없습니다.");
      await admin.app().delete();
      return;
    }

    // Firebase 데이터 출력
    console.log("2. Firebase 데이터 확인:\n");
    for (const item of firebaseData) {
      const normalizedTitle = normalizeTitle(item.title);
      const normalizedDate = normalizeDate(item.date);
      console.log(`   📚 ${item.title || "제목 없음"}`);
      console.log(`      날짜: ${item.date || "날짜 없음"}`);
      console.log(`      정규화: ${normalizedTitle} | ${normalizedDate}`);
      console.log(`      💭 내 생각: ${item.personalThought.substring(0, 50)}...`);
      console.log();
    }

    // 2. Supabase에서 모든 필사 기록 조회 (notes + books 조인)
    console.log("3. Supabase 데이터 조회...\n");

    // notes와 books 조인하여 조회
    const { data: supabaseNotes, error: notesError } = await supabase
      .from("notes")
      .select(`
        id,
        book_id,
        created_at,
        content,
        books (
          id,
          title,
          author
        )
      `)
      .eq("type", "transcription");

    if (notesError) {
      console.error("Supabase notes 조회 오류:", notesError);
      await admin.app().delete();
      return;
    }

    console.log(`   Supabase notes (transcription): ${supabaseNotes.length}개\n`);

    // Supabase 데이터도 출력
    console.log("4. Supabase 필사 기록 확인:\n");
    for (const note of supabaseNotes.slice(0, 10)) {
      const book = Array.isArray(note.books) ? note.books[0] : note.books;
      const normalizedTitle = normalizeTitle(book?.title);
      const normalizedDate = normalizeDate(note.created_at);
      console.log(`   📚 ${book?.title || "제목 없음"}`);
      console.log(`      날짜: ${note.created_at}`);
      console.log(`      정규화: ${normalizedTitle} | ${normalizedDate}`);
      console.log();
    }
    if (supabaseNotes.length > 10) {
      console.log(`   ... 외 ${supabaseNotes.length - 10}개 더 있음\n`);
    }

    // 3. 정밀 매칭 및 업데이트
    console.log("5. 정밀 매칭 진행 (책 제목 AND 날짜)...\n");

    let matchedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const matchResults = [];

    for (const fbRecord of firebaseData) {
      const fbTitle = normalizeTitle(fbRecord.title);
      const fbDate = normalizeDate(fbRecord.date);

      if (!fbTitle || !fbDate) {
        console.log(`   ⚠️ Firebase 데이터 불완전: ${fbRecord.title} (${fbRecord.date})`);
        continue;
      }

      for (const note of supabaseNotes) {
        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const spTitle = normalizeTitle(book?.title);
        const spDate = normalizeDate(note.created_at);

        // 책 제목 AND 날짜 모두 일치해야 매칭
        const isExactMatch = fbTitle === spTitle && fbDate === spDate;

        if (isExactMatch) {
          matchedCount++;
          matchResults.push({
            firebaseId: fbRecord.id,
            noteId: note.id,
            firebaseTitle: fbRecord.title,
            supabaseTitle: book?.title,
            firebaseDate: fbRecord.date,
            supabaseDate: note.created_at,
            normalizedTitle: fbTitle,
            normalizedDate: fbDate,
            personalThought: fbRecord.personalThought,
          });

          console.log(`   ✅ 정밀 매칭 발견!`);
          console.log(`      Firebase: ${fbRecord.title} (${fbRecord.date})`);
          console.log(`      Supabase: ${book?.title} (${note.created_at.substring(0, 10)})`);
          console.log(`      정규화: ${fbTitle} | ${fbDate}`);
          console.log();
        }
      }
    }

    console.log(`\n매칭 결과: ${matchedCount}개 발견\n`);

    // 4. 매칭된 항목 업데이트
    if (matchResults.length > 0) {
      console.log("6. Supabase transcriptions 업데이트...\n");

      for (const match of matchResults) {
        // transcription 레코드 찾기
        const { data: trans, error: transError } = await supabase
          .from("transcriptions")
          .select("id, memo_content")
          .eq("note_id", match.noteId)
          .single();

        if (transError) {
          console.log(`   ⚠️ ${match.supabaseTitle}: transcription 조회 실패`);
          continue;
        }

        // 이미 memo_content가 있으면 스킵 (덮어쓰지 않음)
        if (trans.memo_content) {
          skippedCount++;
          console.log(`   ⏭️ ${match.supabaseTitle} (${match.normalizedDate}): 이미 memo_content 존재`);
          console.log(`      기존: ${trans.memo_content.substring(0, 50)}...`);
          continue;
        }

        // memo_content 업데이트
        const { error: updateError } = await supabase
          .from("transcriptions")
          .update({ memo_content: match.personalThought })
          .eq("id", trans.id);

        if (updateError) {
          console.log(`   ❌ ${match.supabaseTitle}: 업데이트 실패 - ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`   ✅ ${match.supabaseTitle} (${match.normalizedDate}): memo_content 업데이트 완료`);
          console.log(`      💭 ${match.personalThought.substring(0, 80).replace(/\n/g, " ")}...`);
        }
      }
    }

    // 5. 결과 요약
    console.log("\n=== 동기화 결과 ===");
    console.log(`Firebase personalThought 데이터: ${firebaseData.length}개`);
    console.log(`정밀 매칭 발견 (책 제목 AND 날짜): ${matchedCount}개`);
    console.log(`이미 memo_content 존재 (스킵): ${skippedCount}개`);
    console.log(`실제 업데이트: ${updatedCount}개`);

  } catch (error) {
    console.error("동기화 오류:", error);
  }

  // Firebase 연결 종료
  await admin.app().delete();
}

syncFirebasePrecise().catch(console.error);
