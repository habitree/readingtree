/**
 * Firebase → Supabase 향상된 동기화
 * 기준: habitree.io의 "나의기록" (personalThought)
 * 매칭:
 *   1. 같은 책 + 같은 날짜 (정확 매칭)
 *   2. 유사한 제목 + 같은 날짜 (유사 매칭)
 *   3. 필사 내용 80% 이상 유사 (내용 매칭)
 *
 * 기존 memo_content가 있어도 Firebase 데이터로 업데이트
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
    .replace(/[-_:]/g, '')  // 특수문자 제거
    .replace(/\s+/g, '')  // 공백 제거
    .trim();
}

/**
 * 텍스트 유사도 계산 (Jaccard Similarity)
 * 단어 기반 비교
 */
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  // 텍스트를 단어로 분리
  const words1 = new Set(text1.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(text2.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  // 교집합
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  // 합집합
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * 제목 유사도 계산 (Levenshtein Distance 기반)
 */
function titleSimilarity(title1, title2) {
  const s1 = normalizeTitle(title1);
  const s2 = normalizeTitle(title2);

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  // 하나가 다른 하나를 포함하면 높은 유사도
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * 필사 내용 정규화 (비교용)
 */
function normalizeContent(content) {
  if (!content) return '';
  return content
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s가-힣]/g, '')
    .trim()
    .substring(0, 500);  // 처음 500자만 비교
}

async function syncFirebaseEnhanced() {
  console.log("=== Firebase → Supabase 향상된 동기화 시작 ===\n");
  console.log("매칭 조건:");
  console.log("  1. 정확 매칭: 같은 책 제목 AND 같은 날짜");
  console.log("  2. 유사 매칭: 제목 유사도 70%+ AND 같은 날짜");
  console.log("  3. 내용 매칭: 필사 내용 유사도 80%+\n");

  try {
    // 1. Firebase에서 personalThought가 있는 모든 문서 조회
    console.log("1. Firebase 데이터 조회 중...\n");

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

    // 2. Supabase에서 모든 필사 기록 조회 (notes + books + transcriptions 조인)
    console.log("2. Supabase 데이터 조회...\n");

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
        ),
        transcriptions (
          id,
          memo_content,
          quote_content
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
    console.log("3. 매칭 진행...\n");

    let exactMatchCount = 0;
    let similarMatchCount = 0;
    let contentMatchCount = 0;
    let updatedCount = 0;
    let overwrittenCount = 0;
    const matchResults = [];
    const processedNoteIds = new Set();

    for (const fbRecord of firebaseData) {
      const fbTitle = normalizeTitle(fbRecord.title);
      const fbDate = normalizeDate(fbRecord.date);
      const fbContent = normalizeContent(fbRecord.content);

      // 제목이 날짜 형식인 경우 스킵 (예: "25.9.4")
      if (/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fbRecord.title)) {
        console.log(`   ⏭️ 제목이 날짜 형식 (스킵): ${fbRecord.title}`);
        continue;
      }

      let bestMatch = null;
      let bestMatchType = null;
      let bestScore = 0;

      for (const note of supabaseNotes) {
        // 이미 처리된 note는 스킵
        if (processedNoteIds.has(note.id)) continue;

        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const spTitle = normalizeTitle(book?.title);
        const spDate = normalizeDate(note.created_at);
        const spContent = normalizeContent(note.content);
        const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;

        // 1. 정확 매칭 (제목 + 날짜 완전 일치)
        if (fbTitle === spTitle && fbDate === spDate) {
          bestMatch = { note, book, trans };
          bestMatchType = 'exact';
          bestScore = 1;
          break;  // 정확 매칭이면 바로 사용
        }

        // 2. 유사 매칭 (제목 유사도 70%+ AND 날짜 일치)
        if (fbDate === spDate) {
          const titleSim = titleSimilarity(fbRecord.title, book?.title);
          if (titleSim >= 0.7 && titleSim > bestScore) {
            bestMatch = { note, book, trans };
            bestMatchType = 'similar';
            bestScore = titleSim;
          }
        }

        // 3. 내용 매칭 (필사 내용 유사도 80%+)
        if (fbContent && spContent) {
          const contentSim = calculateSimilarity(fbContent, spContent);
          if (contentSim >= 0.8 && contentSim > bestScore) {
            bestMatch = { note, book, trans };
            bestMatchType = 'content';
            bestScore = contentSim;
          }
        }
      }

      // 매칭 결과 처리
      if (bestMatch && bestScore >= 0.7) {
        const { note, book, trans } = bestMatch;
        processedNoteIds.add(note.id);

        if (bestMatchType === 'exact') exactMatchCount++;
        else if (bestMatchType === 'similar') similarMatchCount++;
        else if (bestMatchType === 'content') contentMatchCount++;

        matchResults.push({
          firebaseId: fbRecord.id,
          noteId: note.id,
          transId: trans?.id,
          firebaseTitle: fbRecord.title,
          supabaseTitle: book?.title,
          firebaseDate: fbRecord.date,
          supabaseDate: note.created_at,
          personalThought: fbRecord.personalThought,
          existingMemo: trans?.memo_content,
          matchType: bestMatchType,
          matchScore: bestScore,
        });

        const matchTypeLabel = {
          exact: '정확',
          similar: '유사',
          content: '내용'
        }[bestMatchType];

        console.log(`   ✅ ${matchTypeLabel} 매칭 (${(bestScore * 100).toFixed(0)}%)`);
        console.log(`      Firebase: ${fbRecord.title} (${fbRecord.date})`);
        console.log(`      Supabase: ${book?.title} (${note.created_at.substring(0, 10)})`);
        if (trans?.memo_content) {
          console.log(`      기존 memo: ${trans.memo_content.substring(0, 40)}...`);
        }
        console.log();
      }
    }

    console.log(`\n=== 매칭 결과 ===`);
    console.log(`정확 매칭: ${exactMatchCount}개`);
    console.log(`유사 매칭: ${similarMatchCount}개`);
    console.log(`내용 매칭: ${contentMatchCount}개`);
    console.log(`총 매칭: ${matchResults.length}개\n`);

    // 4. 업데이트 실행
    if (matchResults.length > 0) {
      console.log("4. Supabase transcriptions 업데이트...\n");

      for (const match of matchResults) {
        if (!match.transId) {
          console.log(`   ⚠️ ${match.supabaseTitle}: transcription 레코드 없음`);
          continue;
        }

        const isOverwrite = !!match.existingMemo;

        // memo_content 업데이트 (기존 데이터 덮어쓰기)
        const { error: updateError } = await supabase
          .from("transcriptions")
          .update({ memo_content: match.personalThought })
          .eq("id", match.transId);

        if (updateError) {
          console.log(`   ❌ ${match.supabaseTitle}: 업데이트 실패 - ${updateError.message}`);
        } else {
          updatedCount++;
          if (isOverwrite) overwrittenCount++;

          const action = isOverwrite ? '덮어쓰기' : '신규';
          console.log(`   ✅ ${match.supabaseTitle} (${match.supabaseDate.substring(0, 10)}): ${action} 완료`);
          console.log(`      💭 ${match.personalThought.substring(0, 60).replace(/\n/g, " ")}...`);
        }
      }
    }

    // 5. 결과 요약
    console.log("\n=== 동기화 완료 ===");
    console.log(`Firebase personalThought 데이터: ${firebaseData.length}개`);
    console.log(`총 매칭: ${matchResults.length}개`);
    console.log(`  - 정확 매칭: ${exactMatchCount}개`);
    console.log(`  - 유사 매칭: ${similarMatchCount}개`);
    console.log(`  - 내용 매칭: ${contentMatchCount}개`);
    console.log(`실제 업데이트: ${updatedCount}개`);
    console.log(`  - 덮어쓰기: ${overwrittenCount}개`);
    console.log(`  - 신규: ${updatedCount - overwrittenCount}개`);

    // 매칭 실패 목록
    const matchedFirebaseIds = new Set(matchResults.map(m => m.firebaseId));
    const unmatchedRecords = firebaseData.filter(fb => !matchedFirebaseIds.has(fb.id));

    if (unmatchedRecords.length > 0) {
      console.log(`\n=== 매칭 실패 (${unmatchedRecords.length}개) ===`);
      for (const fb of unmatchedRecords.slice(0, 20)) {
        console.log(`   - ${fb.title} (${fb.date})`);
      }
      if (unmatchedRecords.length > 20) {
        console.log(`   ... 외 ${unmatchedRecords.length - 20}개`);
      }
    }

  } catch (error) {
    console.error("동기화 오류:", error);
  }

  // Firebase 연결 종료
  await admin.app().delete();
}

syncFirebaseEnhanced().catch(console.error);
