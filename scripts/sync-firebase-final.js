/**
 * Firebase → Supabase 최종 동기화
 *
 * 전략:
 * 1. 정확 매칭: 제목 + 날짜
 * 2. 책 기반 매칭: 같은 책이면 가장 가까운 날짜에 적용
 * 3. memo_content가 없는 Supabase 기록에 우선 적용
 */
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const serviceAccountPath = path.resolve(__dirname, "../habitree-f49e1-c9ca7c97d434.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) dateStr = dateStr.substring(0, 10);
  const match = dateStr.match(/(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (match) {
    let year = match[1].length === 2 ? `20${match[1]}` : match[1];
    return `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  return null;
}

function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/\s*[\(\（].*[\)\）]\s*/g, '')
    .replace(/[-_:\/]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function extractBookName(title) {
  if (!title) return '';
  // 부제, 설명 부분 제거하고 핵심 책 이름만 추출
  let bookName = title
    .replace(/\s*[\(\（].*[\)\）]\s*/g, '')  // 괄호 내용 제거
    .replace(/[-_:\/].*$/, '')  // 하이픈/언더스코어 이후 제거
    .trim();
  return bookName.toLowerCase().replace(/\s+/g, '');
}

function titleSimilarity(t1, t2) {
  const s1 = normalizeTitle(t1);
  const s2 = normalizeTitle(t2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // 핵심 책 이름 비교
  const b1 = extractBookName(t1);
  const b2 = extractBookName(t2);
  if (b1 === b2 || b1.includes(b2) || b2.includes(b1)) return 0.85;

  return 0;
}

async function syncFinal() {
  console.log("=== Firebase → Supabase 최종 동기화 ===\n");

  try {
    // 1. Firebase 데이터 조회
    console.log("1. Firebase 데이터 조회...");
    const firebaseData = [];

    const sampleSnapshot = await db.collection("sample_transcriptions").get();
    sampleSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.personalThought) {
        firebaseData.push({
          id: doc.id, title: data.title, date: data.date,
          personalThought: data.personalThought, content: data.content
        });
      }
    });

    const transSnapshot = await db.collection("transcriptions").get();
    transSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.personalThought) {
        firebaseData.push({
          id: doc.id, title: data.title, date: data.date,
          personalThought: data.personalThought, content: data.content
        });
      }
    });

    console.log(`   Firebase personalThought: ${firebaseData.length}개\n`);

    // 2. Supabase 데이터 조회
    console.log("2. Supabase 데이터 조회...");
    const { data: supabaseNotes, error } = await supabase
      .from("notes")
      .select(`id, book_id, created_at, content, books (id, title), transcriptions (id, memo_content)`)
      .eq("type", "transcription");

    if (error) {
      console.error("Supabase 오류:", error);
      await admin.app().delete();
      return;
    }

    // memo_content가 없는 항목 분리
    const notesWithoutMemo = supabaseNotes.filter(n => {
      const trans = Array.isArray(n.transcriptions) ? n.transcriptions[0] : n.transcriptions;
      return !trans?.memo_content;
    });

    console.log(`   Supabase notes: ${supabaseNotes.length}개`);
    console.log(`   memo_content 없음: ${notesWithoutMemo.length}개\n`);

    // 3. Phase 1: 정확 매칭 (제목 + 날짜)
    console.log("3. Phase 1: 정확 매칭 (제목 + 날짜)...\n");

    const processedFbIds = new Set();
    const processedNoteIds = new Set();
    let phase1Count = 0;

    for (const fb of firebaseData) {
      if (/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)) continue;

      const fbDate = normalizeDate(fb.date);
      const fbTitle = normalizeTitle(fb.title);

      for (const note of supabaseNotes) {
        if (processedNoteIds.has(note.id)) continue;

        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
        const spDate = normalizeDate(note.created_at);
        const titleSim = titleSimilarity(fb.title, book?.title);

        // 정확 매칭: 제목 유사도 85%+ AND 날짜 일치
        if (titleSim >= 0.85 && fbDate === spDate && trans?.id) {
          const { error: updateError } = await supabase
            .from("transcriptions")
            .update({ memo_content: fb.personalThought })
            .eq("id", trans.id);

          if (!updateError) {
            phase1Count++;
            processedFbIds.add(fb.id);
            processedNoteIds.add(note.id);
            console.log(`   ✅ ${fb.title} (${fb.date}) → ${book?.title}`);
          }
          break;
        }
      }
    }

    console.log(`\n   Phase 1 완료: ${phase1Count}개 업데이트\n`);

    // 4. Phase 2: 같은 책, 다른 날짜 (memo_content 없는 항목 우선)
    console.log("4. Phase 2: 같은 책 + memo_content 없는 항목 매칭...\n");

    let phase2Count = 0;
    const remainingFb = firebaseData.filter(fb =>
      !processedFbIds.has(fb.id) && !/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)
    );

    for (const fb of remainingFb) {
      const fbBookName = extractBookName(fb.title);
      if (!fbBookName || fbBookName.length < 2) continue;

      // memo_content가 없는 같은 책 찾기
      for (const note of notesWithoutMemo) {
        if (processedNoteIds.has(note.id)) continue;

        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
        const spBookName = extractBookName(book?.title);

        if (!trans?.id) continue;

        // 책 이름 유사도 체크
        if (spBookName.includes(fbBookName) || fbBookName.includes(spBookName)) {
          const { error: updateError } = await supabase
            .from("transcriptions")
            .update({ memo_content: fb.personalThought })
            .eq("id", trans.id);

          if (!updateError) {
            phase2Count++;
            processedFbIds.add(fb.id);
            processedNoteIds.add(note.id);
            console.log(`   ✅ ${fb.title} (${fb.date}) → ${book?.title} (${note.created_at.substring(0, 10)})`);
          }
          break;
        }
      }
    }

    console.log(`\n   Phase 2 완료: ${phase2Count}개 업데이트\n`);

    // 5. 결과 요약
    const totalUpdated = phase1Count + phase2Count;
    console.log("=== 최종 결과 ===");
    console.log(`총 업데이트: ${totalUpdated}개`);
    console.log(`  - Phase 1 (정확 매칭): ${phase1Count}개`);
    console.log(`  - Phase 2 (같은 책): ${phase2Count}개`);

    // 여전히 매칭 안된 Firebase 항목
    const stillUnmatched = firebaseData.filter(fb =>
      !processedFbIds.has(fb.id) && !/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)
    );
    console.log(`\n매칭 실패: ${stillUnmatched.length}개`);

    if (stillUnmatched.length > 0 && stillUnmatched.length <= 30) {
      console.log("\n매칭 실패 목록:");
      for (const fb of stillUnmatched) {
        console.log(`   - ${fb.title} (${fb.date})`);
      }
    }

    // memo_content가 여전히 없는 Supabase 항목
    const { data: remainingEmpty } = await supabase
      .from("transcriptions")
      .select("id")
      .is("memo_content", null);

    console.log(`\nSupabase memo_content 없는 항목: ${remainingEmpty?.length || 0}개`);

  } catch (error) {
    console.error("오류:", error);
  }

  await admin.app().delete();
}

syncFinal().catch(console.error);
