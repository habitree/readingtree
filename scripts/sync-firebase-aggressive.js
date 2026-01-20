/**
 * Firebase → Supabase 적극적 동기화
 * 매칭 실패 항목들에 대해 더 넓은 매칭 시도
 *
 * 매칭 전략:
 *   1. 정확 매칭: 제목 + 날짜
 *   2. 유사 매칭: 제목 50%+ AND 날짜
 *   3. 내용 매칭: 필사 내용 50%+ (제목 관계없이)
 *   4. 핵심어 매칭: 제목 핵심어 포함 AND 날짜
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
 * 날짜 정규화
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) dateStr = dateStr.substring(0, 10);
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
 * 제목 정규화
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\s*[\(\（].*[\)\）]\s*/g, '')
    .replace(/[-_:\/]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 제목에서 핵심어 추출 (2글자 이상 단어)
 */
function extractKeywords(title) {
  if (!title) return [];
  return title
    .replace(/\s*[\(\（].*[\)\）]\s*/g, '')
    .replace(/[-_:\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => w.toLowerCase());
}

/**
 * 텍스트 유사도 (Jaccard)
 */
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const words1 = new Set(text1.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(text2.replace(/[^\w\s가-힣]/g, '').split(/\s+/).filter(w => w.length > 1));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * 제목 유사도 (Levenshtein)
 */
function titleSimilarity(title1, title2) {
  const s1 = normalizeTitle(title1);
  const s2 = normalizeTitle(title2);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const len1 = s1.length, len2 = s2.length;
  const matrix = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - (matrix[len1][len2] / Math.max(len1, len2));
}

/**
 * 핵심어 매칭 점수
 */
function keywordMatchScore(fbTitle, spTitle) {
  const fbKeywords = extractKeywords(fbTitle);
  const spKeywords = extractKeywords(spTitle);
  if (fbKeywords.length === 0) return 0;

  let matchCount = 0;
  for (const kw of fbKeywords) {
    if (spKeywords.some(sk => sk.includes(kw) || kw.includes(sk))) {
      matchCount++;
    }
  }
  return matchCount / fbKeywords.length;
}

function normalizeContent(content) {
  if (!content) return '';
  return content.replace(/\s+/g, ' ').replace(/[^\w\s가-힣]/g, '').trim().substring(0, 500);
}

async function syncAggressive() {
  console.log("=== Firebase → Supabase 적극적 동기화 ===\n");

  try {
    // Firebase 데이터 조회
    console.log("1. Firebase 데이터 조회...\n");
    const firebaseData = [];

    const sampleTransSnapshot = await db.collection("sample_transcriptions").get();
    sampleTransSnapshot.forEach((doc) => {
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

    console.log(`   Firebase: ${firebaseData.length}개\n`);

    // Supabase 데이터 조회
    console.log("2. Supabase 데이터 조회...\n");
    const { data: supabaseNotes, error } = await supabase
      .from("notes")
      .select(`id, book_id, created_at, content, books (id, title), transcriptions (id, memo_content)`)
      .eq("type", "transcription");

    if (error) {
      console.error("Supabase 오류:", error);
      await admin.app().delete();
      return;
    }

    console.log(`   Supabase: ${supabaseNotes.length}개\n`);

    // 이미 처리된 noteId 추적
    const processedNoteIds = new Set();
    let updatedCount = 0;
    const results = [];

    console.log("3. 매칭 및 업데이트...\n");

    for (const fb of firebaseData) {
      // 날짜 형식 제목 스킵
      if (/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)) continue;

      const fbDate = normalizeDate(fb.date);
      const fbContent = normalizeContent(fb.content);
      const fbTitle = normalizeTitle(fb.title);

      let bestMatch = null;
      let bestScore = 0;
      let bestType = null;

      for (const note of supabaseNotes) {
        if (processedNoteIds.has(note.id)) continue;

        const book = Array.isArray(note.books) ? note.books[0] : note.books;
        const trans = Array.isArray(note.transcriptions) ? note.transcriptions[0] : note.transcriptions;
        const spDate = normalizeDate(note.created_at);
        const spTitle = normalizeTitle(book?.title);
        const spContent = normalizeContent(note.content);

        // 1. 정확 매칭 (100%)
        if (fbTitle === spTitle && fbDate === spDate) {
          bestMatch = { note, book, trans };
          bestScore = 1;
          bestType = 'exact';
          break;
        }

        // 2. 날짜 일치 + 제목 유사도
        if (fbDate === spDate) {
          const titleSim = titleSimilarity(fb.title, book?.title);
          const kwScore = keywordMatchScore(fb.title, book?.title);
          const combinedScore = Math.max(titleSim, kwScore);

          if (combinedScore >= 0.5 && combinedScore > bestScore) {
            bestMatch = { note, book, trans };
            bestScore = combinedScore;
            bestType = combinedScore >= 0.7 ? 'similar' : 'keyword';
          }
        }

        // 3. 내용 매칭 (날짜 관계없이, 높은 유사도)
        if (fbContent && spContent) {
          const contentSim = calculateSimilarity(fbContent, spContent);
          if (contentSim >= 0.6 && contentSim > bestScore) {
            bestMatch = { note, book, trans };
            bestScore = contentSim;
            bestType = 'content';
          }
        }
      }

      // 매칭 결과 처리
      if (bestMatch && bestScore >= 0.5) {
        const { note, book, trans } = bestMatch;
        processedNoteIds.add(note.id);

        if (!trans?.id) {
          console.log(`   ⚠️ transcription 없음: ${fb.title}`);
          continue;
        }

        // 업데이트 실행
        const { error: updateError } = await supabase
          .from("transcriptions")
          .update({ memo_content: fb.personalThought })
          .eq("id", trans.id);

        if (!updateError) {
          updatedCount++;
          const typeLabel = { exact: '정확', similar: '유사', keyword: '키워드', content: '내용' }[bestType];
          console.log(`   ✅ ${typeLabel}(${(bestScore * 100).toFixed(0)}%) ${fb.title} → ${book?.title}`);
          console.log(`      날짜: ${fb.date} → ${note.created_at.substring(0, 10)}`);

          results.push({
            firebase: fb.title,
            supabase: book?.title,
            type: bestType,
            score: bestScore,
            date: fb.date
          });
        } else {
          console.log(`   ❌ 업데이트 실패: ${fb.title} - ${updateError.message}`);
        }
      }
    }

    // 결과 요약
    console.log(`\n=== 동기화 완료 ===`);
    console.log(`총 업데이트: ${updatedCount}개`);
    console.log(`  - 정확: ${results.filter(r => r.type === 'exact').length}개`);
    console.log(`  - 유사: ${results.filter(r => r.type === 'similar').length}개`);
    console.log(`  - 키워드: ${results.filter(r => r.type === 'keyword').length}개`);
    console.log(`  - 내용: ${results.filter(r => r.type === 'content').length}개`);

    // 여전히 매칭 안된 항목 분석
    const matchedIds = new Set(results.map(r => r.firebase));
    const unmatched = firebaseData.filter(fb =>
      !matchedIds.has(fb.title) && !/^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(fb.title)
    );

    if (unmatched.length > 0) {
      console.log(`\n=== 매칭 실패 분석 (${unmatched.length}개) ===`);

      // Supabase에 해당 날짜 기록이 있는지 확인
      for (const fb of unmatched.slice(0, 15)) {
        const fbDate = normalizeDate(fb.date);
        const sameDateNotes = supabaseNotes.filter(n => normalizeDate(n.created_at) === fbDate);

        console.log(`\n   📚 ${fb.title} (${fb.date})`);
        if (sameDateNotes.length === 0) {
          console.log(`      ❌ Supabase에 ${fbDate} 날짜 기록 없음`);
        } else {
          console.log(`      같은 날짜 Supabase 기록:`);
          for (const n of sameDateNotes.slice(0, 3)) {
            const book = Array.isArray(n.books) ? n.books[0] : n.books;
            console.log(`         - ${book?.title}`);
          }
        }
      }
    }

  } catch (error) {
    console.error("오류:", error);
  }

  await admin.app().delete();
}

syncAggressive().catch(console.error);
