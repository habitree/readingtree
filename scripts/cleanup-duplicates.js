/**
 * 중복 데이터 정리
 *
 * 1. 이미지 중복: 같은 이미지면 최신 날짜만 유지, 나머지는 extracted_text 삭제
 * 2. 내 생각 중복:
 *    - 같은 책: Firebase 날짜와 일치하는 것 유지, 나머지 memo 삭제
 *    - 다른 책: Firebase 원본 데이터 기준으로 올바른 책에만 유지
 */
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Firebase 초기화
const serviceAccountPath = path.resolve(__dirname, "../habitree-f49e1-c9ca7c97d434.json");
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// Supabase 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function cleanupDuplicates() {
  console.log("=== 중복 데이터 정리 ===\n");

  // 1. Firebase 원본 데이터 조회 (기준)
  console.log("1. Firebase 원본 데이터 조회...");
  const firebaseData = [];

  const sampleSnapshot = await db.collection("sample_transcriptions").get();
  sampleSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.personalThought) {
      firebaseData.push({
        id: doc.id,
        title: data.title,
        date: normalizeDate(data.date),
        normalizedTitle: normalizeTitle(data.title),
        personalThought: data.personalThought.substring(0, 100)
      });
    }
  });

  console.log(`   Firebase 원본: ${firebaseData.length}개\n`);

  // 2. Supabase 전체 데이터 조회
  console.log("2. Supabase 데이터 조회...");
  const { data: allNotes, error } = await supabase
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
    await admin.app().delete();
    return;
  }

  console.log(`   Supabase notes: ${allNotes.length}개\n`);

  // 3. 이미지 중복 처리
  console.log("3. 이미지 중복 처리...\n");

  const extractedTextMap = new Map();
  for (const note of allNotes) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
    const extractedText = trans?.extracted_text;

    if (extractedText && extractedText.length > 50) {
      const key = extractedText.substring(0, 200);
      if (!extractedTextMap.has(key)) {
        extractedTextMap.set(key, []);
      }
      extractedTextMap.get(key).push({
        noteId: note.id,
        transId: trans?.id,
        bookTitle: note.books?.title,
        date: note.created_at?.substring(0, 10)
      });
    }
  }

  let imageCleanCount = 0;
  for (const [key, notes] of extractedTextMap) {
    if (notes.length > 1) {
      // 최신 날짜 것 유지, 나머지 extracted_text null로
      notes.sort((a, b) => b.date.localeCompare(a.date)); // 최신순
      const toKeep = notes[0];
      const toClean = notes.slice(1);

      for (const item of toClean) {
        if (item.transId) {
          const { error: updateError } = await supabase
            .from("transcriptions")
            .update({ extracted_text: null })
            .eq("id", item.transId);

          if (!updateError) {
            imageCleanCount++;
            console.log(`   🗑️ 이미지 중복 제거: ${item.bookTitle} (${item.date})`);
          }
        }
      }
    }
  }

  console.log(`\n   이미지 중복 제거: ${imageCleanCount}개\n`);

  // 4. 내 생각 중복 처리
  console.log("4. 내 생각 중복 처리...\n");

  const memoMap = new Map();
  for (const note of allNotes) {
    const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
    const memoContent = trans?.memo_content;

    if (memoContent && memoContent.length > 10) {
      const key = memoContent.substring(0, 100).replace(/\s+/g, ' ').trim();
      if (!memoMap.has(key)) {
        memoMap.set(key, []);
      }
      memoMap.get(key).push({
        noteId: note.id,
        transId: trans?.id,
        bookTitle: note.books?.title,
        normalizedTitle: normalizeTitle(note.books?.title),
        date: normalizeDate(note.created_at),
        memoContent: memoContent
      });
    }
  }

  let memoCleanCount = 0;
  for (const [memoKey, notes] of memoMap) {
    if (notes.length > 1) {
      // Firebase 원본에서 이 memo와 일치하는 기록 찾기
      const matchingFirebase = firebaseData.filter(fb =>
        fb.personalThought.substring(0, 80) === memoKey.substring(0, 80)
      );

      // Firebase에서 일치하는 책+날짜 조합 찾기
      const validCombinations = new Set();
      for (const fb of matchingFirebase) {
        validCombinations.add(`${fb.normalizedTitle}|${fb.date}`);
      }

      // 유효한 조합이 없으면 가장 오래된 것만 유지
      if (validCombinations.size === 0) {
        notes.sort((a, b) => a.date.localeCompare(b.date));
        const toKeep = notes[0];
        const toClean = notes.slice(1);

        for (const item of toClean) {
          if (item.transId) {
            // notes.content의 memo도 삭제
            const { data: noteData } = await supabase
              .from("notes")
              .select("content")
              .eq("id", item.noteId)
              .single();

            let content = {};
            try {
              content = typeof noteData?.content === 'string'
                ? JSON.parse(noteData.content)
                : noteData?.content || {};
            } catch (e) {}

            // memo 삭제
            const { error: transError } = await supabase
              .from("transcriptions")
              .update({ memo_content: null })
              .eq("id", item.transId);

            const { error: noteError } = await supabase
              .from("notes")
              .update({ content: JSON.stringify({ quote: content.quote || '', memo: '' }) })
              .eq("id", item.noteId);

            if (!transError) {
              memoCleanCount++;
              console.log(`   🗑️ 중복 memo 제거 (날짜순): ${item.bookTitle} (${item.date})`);
            }
          }
        }
      } else {
        // 유효한 조합만 유지
        for (const item of notes) {
          const itemCombo = `${item.normalizedTitle}|${item.date}`;
          const isValid = validCombinations.has(itemCombo);

          if (!isValid && item.transId) {
            // notes.content의 memo도 삭제
            const { data: noteData } = await supabase
              .from("notes")
              .select("content")
              .eq("id", item.noteId)
              .single();

            let content = {};
            try {
              content = typeof noteData?.content === 'string'
                ? JSON.parse(noteData.content)
                : noteData?.content || {};
            } catch (e) {}

            const { error: transError } = await supabase
              .from("transcriptions")
              .update({ memo_content: null })
              .eq("id", item.transId);

            const { error: noteError } = await supabase
              .from("notes")
              .update({ content: JSON.stringify({ quote: content.quote || '', memo: '' }) })
              .eq("id", item.noteId);

            if (!transError) {
              memoCleanCount++;
              console.log(`   🗑️ 잘못된 memo 제거: ${item.bookTitle} (${item.date})`);
              console.log(`      유효한 조합: ${[...validCombinations].join(', ')}`);
            }
          }
        }
      }
    }
  }

  console.log(`\n   내 생각 중복 제거: ${memoCleanCount}개\n`);

  // 5. 결과 요약
  console.log("=== 정리 완료 ===");
  console.log(`이미지 중복 제거: ${imageCleanCount}개`);
  console.log(`내 생각 중복 제거: ${memoCleanCount}개`);
  console.log(`총 정리: ${imageCleanCount + memoCleanCount}개`);

  await admin.app().delete();
}

cleanupDuplicates().catch(console.error);
