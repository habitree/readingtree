/**
 * Firebase sample_transcriptions의 personalThought를
 * Supabase transcriptions.memo_content로 동기화하는 스크립트
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

async function syncFirebaseToSupabase() {
  console.log("=== Firebase → Supabase 동기화 시작 ===\n");

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
      console.log(`   📚 ${item.title || "제목 없음"}`);
      console.log(`      날짜: ${item.date || "날짜 없음"}`);
      console.log(`      💭 내 생각: ${item.personalThought.substring(0, 50)}...`);
      console.log();
    }

    // 2. Supabase에서 매칭할 데이터 조회
    console.log("3. Supabase 데이터 조회 및 매칭...\n");

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

    // 3. 매칭 및 업데이트
    console.log("4. 매칭 및 업데이트 진행...\n");

    let matchedCount = 0;
    let updatedCount = 0;
    const matchResults = [];

    for (const firebaseItem of firebaseData) {
      // 책 제목과 날짜로 매칭 시도
      const firebaseTitle = firebaseItem.title?.toLowerCase().trim() || "";
      const firebaseDate = firebaseItem.date || "";

      for (const note of supabaseNotes) {
        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const supabaseTitle = book?.title?.toLowerCase().trim() || "";
        const noteDate = new Date(note.created_at);
        const noteDateStr = `${noteDate.getFullYear()}.${noteDate.getMonth() + 1}.${noteDate.getDate()}`;

        // 제목 매칭 (부분 일치)
        const titleMatch =
          supabaseTitle.includes(firebaseTitle) ||
          firebaseTitle.includes(supabaseTitle) ||
          (firebaseTitle.length > 3 && supabaseTitle.includes(firebaseTitle.substring(0, 5)));

        // 날짜 매칭 (다양한 형식 고려)
        const dateMatch =
          firebaseDate.includes(noteDateStr) ||
          noteDateStr.includes(firebaseDate.replace(/^20/, "")) ||
          firebaseDate.replace(/\./g, "-").includes(noteDate.toISOString().substring(0, 10));

        if (titleMatch || dateMatch) {
          matchedCount++;
          matchResults.push({
            firebaseId: firebaseItem.id,
            noteId: note.id,
            firebaseTitle: firebaseItem.title,
            supabaseTitle: book?.title,
            firebaseDate: firebaseDate,
            supabaseDate: noteDateStr,
            personalThought: firebaseItem.personalThought,
            matchType: titleMatch && dateMatch ? "title+date" : titleMatch ? "title" : "date",
          });

          console.log(`   ✅ 매칭 발견!`);
          console.log(`      Firebase: ${firebaseItem.title} (${firebaseDate})`);
          console.log(`      Supabase: ${book?.title} (${noteDateStr})`);
          console.log(`      매칭 유형: ${titleMatch && dateMatch ? "제목+날짜" : titleMatch ? "제목" : "날짜"}`);
          console.log();
        }
      }
    }

    console.log(`\n매칭 결과: ${matchedCount}개 발견\n`);

    // 4. 매칭된 항목 업데이트
    if (matchResults.length > 0) {
      console.log("5. Supabase transcriptions 업데이트...\n");

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

        // 이미 memo_content가 있으면 스킵
        if (trans.memo_content) {
          console.log(`   ⏭️ ${match.supabaseTitle}: 이미 memo_content 존재`);
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
          console.log(`   ✅ ${match.supabaseTitle}: memo_content 업데이트 완료`);
          console.log(`      💭 ${match.personalThought.substring(0, 50)}...`);
        }
      }
    }

    // 5. 결과 요약
    console.log("\n=== 동기화 결과 ===");
    console.log(`Firebase personalThought 데이터: ${firebaseData.length}개`);
    console.log(`Supabase 매칭 발견: ${matchedCount}개`);
    console.log(`실제 업데이트: ${updatedCount}개`);

  } catch (error) {
    console.error("동기화 오류:", error);
  }

  // Firebase 연결 종료
  await admin.app().delete();
}

syncFirebaseToSupabase().catch(console.error);
