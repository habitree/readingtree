/**
 * Supabase 데이터 이관 검증 스크립트
 * 
 * 기존 프로젝트와 새 프로젝트의 데이터를 비교하여 이관이 정상적으로 완료되었는지 확인합니다.
 * 
 * 사용 방법:
 * 1. .env.local에 기존 및 새 프로젝트 정보 설정
 * 2. node scripts/verify-supabase-migration.js 실행
 * 
 * 환경 변수:
 * - OLD_SUPABASE_URL: 기존 프로젝트 URL
 * - OLD_SUPABASE_SERVICE_ROLE_KEY: 기존 프로젝트 Service Role Key
 * - NEW_SUPABASE_URL: 새 프로젝트 URL
 * - NEW_SUPABASE_SERVICE_ROLE_KEY: 새 프로젝트 Service Role Key
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 확인 (기존 변수명 또는 새 변수명 모두 지원)
// 기존 프로젝트: old_ 프리픽스 또는 OLD_ 프리픽스 우선
// 새 프로젝트: NEW_ 프리픽스 우선, 없으면 표준 변수명 (Supabase2_rebuild)
const OLD_SUPABASE_URL = 
  process.env.OLD_SUPABASE_URL || 
  process.env.old_NEXT_PUBLIC_SUPABASE_URL;

const OLD_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.old_SUPABASE_SERVICE_ROLE_KEY;

// 새 프로젝트: NEW_ 프리픽스 우선, 없으면 표준 변수명 (현재 .env.local 구조)
const NEW_SUPABASE_URL = 
  process.env.NEW_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const NEW_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 기존 프로젝트 정보가 필요합니다.');
  console.error('   .env.local에 다음 중 하나를 추가하세요:');
  console.error('   방법 1: OLD_SUPABASE_URL=https://xxx.supabase.co');
  console.error('           OLD_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   방법 2: old_NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('           old_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('   참고: # old Supabase 섹션에 old_ 프리픽스를 사용하세요.');
  process.exit(1);
}

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 새 프로젝트 정보가 필요합니다.');
  console.error('   .env.local에 다음 중 하나를 추가하세요:');
  console.error('   방법 1: NEW_SUPABASE_URL=https://xxx.supabase.co');
  console.error('           NEW_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   방법 2: NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co (표준 변수명)');
  console.error('           SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (표준 변수명)');
  console.error('');
  console.error('   참고: # Supabase2_rebuild 섹션의 표준 변수명을 사용하세요.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY);

// 검증할 테이블 목록
const TABLES = [
  'users',
  'books',
  'bookshelves',
  'user_books',
  'notes',
  'groups',
  'group_members',
  'group_books',
  'group_notes',
  'transcriptions',
  'ocr_usage_stats',
  'ocr_logs',
];

/**
 * 테이블 레코드 수 조회
 */
async function getTableCount(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`❌ [${tableName}] 레코드 수 조회 오류:`, error.message);
    return null;
  }

  return count || 0;
}

/**
 * 테이블 검증
 */
async function verifyTable(tableName) {
  const oldCount = await getTableCount(oldSupabase, tableName);
  const newCount = await getTableCount(newSupabase, tableName);

  if (oldCount === null || newCount === null) {
    return { table: tableName, status: 'error', oldCount, newCount };
  }

  if (oldCount === newCount) {
    return { table: tableName, status: 'ok', oldCount, newCount };
  } else {
    return { table: tableName, status: 'mismatch', oldCount, newCount };
  }
}

/**
 * Storage 파일 수 비교
 */
async function verifyStorage() {
  console.log('\n📦 Storage 파일 검증...');

  try {
    const { data: oldFiles, error: oldError } = await oldSupabase.storage
      .from('images')
      .list('', { limit: 10000 });

    if (oldError) {
      console.error('❌ 기존 프로젝트 Storage 조회 오류:', oldError.message);
      return null;
    }

    const { data: newFiles, error: newError } = await newSupabase.storage
      .from('images')
      .list('', { limit: 10000 });

    if (newError) {
      console.error('❌ 새 프로젝트 Storage 조회 오류:', newError.message);
      return null;
    }

    // 재귀적으로 파일 수 계산 (간단한 버전)
    const countFiles = (files) => {
      let count = 0;
      for (const file of files || []) {
        if (file.id !== null) {
          count++;
        }
      }
      return count;
    };

    const oldCount = countFiles(oldFiles);
    const newCount = countFiles(newFiles);

    return { oldCount, newCount, match: oldCount === newCount };
  } catch (error) {
    console.error('❌ Storage 검증 오류:', error.message);
    return null;
  }
}

/**
 * 메인 검증 함수
 */
async function verifyMigration() {
  console.log('🔍 Supabase 데이터 이관 검증 시작...\n');
  console.log(`기존 프로젝트: ${OLD_SUPABASE_URL}`);
  console.log(`새 프로젝트: ${NEW_SUPABASE_URL}\n`);

  // 테이블 검증
  console.log('📊 테이블 데이터 검증...\n');
  const results = [];

  for (const table of TABLES) {
    const result = await verifyTable(table);
    results.push(result);

    if (result.status === 'ok') {
      console.log(`✅ [${table}] 일치: ${result.oldCount}개`);
    } else if (result.status === 'mismatch') {
      console.log(`⚠️  [${table}] 불일치: 기존 ${result.oldCount}개, 새 ${result.newCount}개`);
    } else {
      console.log(`❌ [${table}] 검증 실패`);
    }
  }

  // Storage 검증
  const storageResult = await verifyStorage();
  if (storageResult) {
    if (storageResult.match) {
      console.log(`✅ Storage 파일 일치: ${storageResult.oldCount}개`);
    } else {
      console.log(`⚠️  Storage 파일 불일치: 기존 ${storageResult.oldCount}개, 새 ${storageResult.newCount}개`);
    }
  }

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 검증 결과 요약');
  console.log('='.repeat(50));

  const okCount = results.filter(r => r.status === 'ok').length;
  const mismatchCount = results.filter(r => r.status === 'mismatch').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log(`✅ 일치: ${okCount}개 테이블`);
  console.log(`⚠️  불일치: ${mismatchCount}개 테이블`);
  console.log(`❌ 오류: ${errorCount}개 테이블`);
  console.log(`📦 총: ${results.length}개 테이블`);

  if (storageResult) {
    console.log(`\n📦 Storage: ${storageResult.match ? '✅ 일치' : '⚠️  불일치'}`);
  }

  console.log('='.repeat(50));

  // 전체 성공 여부
  const allOk = okCount === results.length && (!storageResult || storageResult.match);
  if (allOk) {
    console.log('\n✅ 모든 데이터가 정상적으로 이관되었습니다!');
    process.exit(0);
  } else {
    console.log('\n⚠️  일부 데이터가 일치하지 않습니다. 확인이 필요합니다.');
    process.exit(1);
  }
}

// 실행
verifyMigration().catch(error => {
  console.error('\n❌ 검증 중 치명적 오류 발생:', error);
  process.exit(1);
});
