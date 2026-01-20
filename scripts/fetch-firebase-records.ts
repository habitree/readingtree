/**
 * Firebase Firestore에서 "나의 기록" 데이터를 조회하는 스크립트
 *
 * 목적: habitree.io/search에서 보여지는 "나의 기록"을 가져와서
 * Supabase의 transcriptions.memo_content에 업데이트
 */
import * as admin from "firebase-admin";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase Admin SDK 초기화
const serviceAccountPath = resolve(__dirname, "../habitree-f49e1-c9ca7c97d434.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const db = admin.firestore();

async function fetchFirebaseRecords() {
  console.log("=== Firebase Firestore 데이터 조회 ===\n");

  try {
    // 1. 모든 컬렉션 목록 조회
    console.log("1. 컬렉션 목록 조회 중...\n");
    const collections = await db.listCollections();

    console.log("발견된 컬렉션:");
    for (const collection of collections) {
      console.log(`  - ${collection.id}`);
    }

    // 2. 각 컬렉션의 문서 조회
    console.log("\n2. 각 컬렉션 데이터 조회 중...\n");

    for (const collection of collections) {
      console.log(`\n=== 컬렉션: ${collection.id} ===`);

      const snapshot = await collection.limit(10).get();
      console.log(`  문서 수: ${snapshot.size}개 (최대 10개만 표시)\n`);

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  [${doc.id}]`);

        // 주요 필드 출력
        const importantFields = ['title', 'name', 'content', 'memo', 'thought', 'myThought',
          'date', 'createdAt', 'book', 'bookTitle', '내생각', '나의기록', 'quote'];

        for (const field of importantFields) {
          if (data[field] !== undefined) {
            const value = typeof data[field] === 'object'
              ? JSON.stringify(data[field]).substring(0, 100)
              : String(data[field]).substring(0, 100);
            console.log(`    ${field}: ${value}...`);
          }
        }

        // 모든 필드 키 출력
        console.log(`    [모든 필드]: ${Object.keys(data).join(', ')}`);
        console.log();
      });
    }

    // 3. 특정 컬렉션 상세 조회 (일반적인 이름들 시도)
    const possibleCollections = [
      'records', 'notes', 'thoughts', 'memos', 'myRecords',
      'transcriptions', 'books', 'readings', 'entries',
      '나의기록', '기록', '필사', '내생각'
    ];

    console.log("\n3. 관련 컬렉션 상세 조회 시도...\n");

    for (const collName of possibleCollections) {
      try {
        const collRef = db.collection(collName);
        const snapshot = await collRef.limit(1).get();

        if (!snapshot.empty) {
          console.log(`✅ 컬렉션 발견: ${collName}`);

          // 전체 문서 수 조회
          const allDocs = await collRef.get();
          console.log(`   총 문서 수: ${allDocs.size}개`);

          // 첫 번째 문서 구조 출력
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();
          console.log(`   문서 구조: ${JSON.stringify(Object.keys(data))}`);
          console.log(`   샘플 데이터:`);
          console.log(`   ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
          console.log();
        }
      } catch (err) {
        // 컬렉션이 없으면 무시
      }
    }

  } catch (error) {
    console.error("Firebase 조회 오류:", error);
  }

  // Firebase 연결 종료
  await admin.app().delete();
}

fetchFirebaseRecords().catch(console.error);
