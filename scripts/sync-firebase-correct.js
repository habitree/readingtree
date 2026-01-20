/**
 * Firebase → Supabase 올바른 동기화
 *
 * 데이터 구조:
 * 1. notes.content = {"quote": "...", "memo": "..."} (JSON string)
 * 2. transcriptions.memo_content = "..."
 * 3. transcriptions.quote_content = "..."
 *
 * 두 테이블 모두 업데이트해야 함
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

function titleSimilarity(t1, t2) {
  const s1 = normalizeTitle(t1);
  const s2 = normalizeTitle(t2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  return 0;
}

async function syncCorrect() {
  console.log("=== Firebase → Supabase 올바른 동기화 ===\n");
  console.log("데이터 구조: notes.content (JSON) + transcriptions.memo_content 모두 업데이트\n");

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
      .select(`
        id,
        content,
        book_id,
        created_at,
        books (id, title),
        transcriptions (id, memo_content, quote_content)
      `)
      .eq("type", "transcription");

    if (error) {
      console.error("Supabase 오류:", error);
      await admin.app().delete();
      return;
    }

    console.log(`   Supabase notes: ${supabaseNotes.length}개\n`);

    // 3. 매칭 및 업데이트
    console.log("3. 매칭 및 업데이트...\n");

    const processedNoteIds = new Set();
    let updatedCount = 0;
    let errorCount = 0;

    for (const fb of firebaseData) {
      // 날짜 형식 제목 스킵
      if (/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)) continue;

      const fbDate = normalizeDate(fb.date);
      if (!fbDate) continue;

      // 매칭되는 Supabase 기록 찾기
      for (const note of supabaseNotes) {
        if (processedNoteIds.has(note.id)) continue;

        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
        const spDate = normalizeDate(note.created_at);

        // 제목 유사도 + 날짜 일치
        const titleSim = titleSimilarity(fb.title, book?.title);
        if (titleSim >= 0.85 && fbDate === spDate) {
          processedNoteIds.add(note.id);

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

          // 새 content 생성 (memo만 업데이트)
          const newContent = {
            quote: existingContent.quote || '',
            memo: fb.personalThought
          };

          // 1) notes.content 업데이트
          const { error: noteError } = await supabase
            .from("notes")
            .update({ content: JSON.stringify(newContent) })
            .eq("id", note.id);

          if (noteError) {
            console.log(`   ❌ notes 업데이트 실패: ${book?.title} - ${noteError.message}`);
            errorCount++;
            continue;
          }

          // 2) transcriptions.memo_content 업데이트
          if (trans?.id) {
            const { error: transError } = await supabase
              .from("transcriptions")
              .update({ memo_content: fb.personalThought })
              .eq("id", trans.id);

            if (transError) {
              console.log(`   ⚠️ transcriptions 업데이트 실패: ${book?.title}`);
            }
          }

          updatedCount++;
          console.log(`   ✅ ${fb.title} (${fb.date}) → ${book?.title}`);
          console.log(`      memo: ${fb.personalThought.substring(0, 50).replace(/\n/g, ' ')}...`);

          break;  // 매칭되면 다음 Firebase 레코드로
        }
      }
    }

    // 4. 결과 요약
    console.log(`\n=== 동기화 완료 ===`);
    console.log(`총 업데이트: ${updatedCount}개`);
    console.log(`오류: ${errorCount}개`);

    // 5. 검증 - 업데이트된 항목 확인
    console.log(`\n=== 검증 ===`);
    const { data: verifyData } = await supabase
      .from("notes")
      .select(`
        id,
        content,
        created_at,
        books (title),
        transcriptions (memo_content)
      `)
      .eq("type", "transcription")
      .not("content", "is", null)
      .limit(5);

    console.log("\n업데이트된 데이터 샘플:");
    for (const note of verifyData || []) {
      const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
      let content = note.content;
      try {
        content = typeof note.content === 'string' ? JSON.parse(note.content) : note.content;
      } catch (e) {}

      console.log(`\n${note.books?.title} (${note.created_at?.substring(0, 10)})`);
      console.log(`  notes.content.memo: ${content?.memo?.substring(0, 40) || '없음'}...`);
      console.log(`  transcriptions.memo_content: ${trans?.memo_content?.substring(0, 40) || '없음'}...`);
    }

  } catch (error) {
    console.error("오류:", error);
  }

  await admin.app().delete();
}

syncCorrect().catch(console.error);
