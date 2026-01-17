/**
 * Supabase 데이터 이관 스크립트
 * 
 * 기존 Supabase 프로젝트에서 새 프로젝트로 데이터를 이관합니다.
 * 
 * 사용 방법:
 * 1. .env.local에 기존 및 새 프로젝트 정보 설정
 * 2. node scripts/migrate-supabase-data.js 실행
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
// 기존 프로젝트: OLD_SUPABASE_URL 또는 첫 번째 NEXT_PUBLIC_SUPABASE_URL
// 새 프로젝트: NEW_SUPABASE_URL 또는 두 번째 NEXT_PUBLIC_SUPABASE_URL (Supabase2_rebuild)
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_SUPABASE_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// 새 프로젝트는 별도 변수명이 필요하므로 명시적으로 요구
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SUPABASE_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 기존 프로젝트 정보가 필요합니다.');
  console.error('   .env.local에 다음 중 하나를 추가하세요:');
  console.error('   방법 1: OLD_SUPABASE_URL=https://xxx.supabase.co');
  console.error('           OLD_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('   방법 2: NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co (기존 프로젝트)');
  console.error('           SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (기존 프로젝트)');
  process.exit(1);
}

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 새 프로젝트 정보가 필요합니다.');
  console.error('   .env.local에 다음을 추가하세요:');
  console.error('   NEW_SUPABASE_URL=https://xxx.supabase.co');
  console.error('   NEW_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('   참고: Supabase2_rebuild 블록의 값들을 사용하세요.');
  process.exit(1);
}

// Supabase 클라이언트 생성
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY);

// 이관할 테이블 목록 (외래 키 의존성 순서)
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

// 배치 크기 (한 번에 처리할 레코드 수)
const BATCH_SIZE = 100;

/**
 * 새 스키마의 컬럼 목록 조회
 */
async function getNewTableColumns(tableName) {
  try {
    // 실제 데이터가 있는지 확인하여 컬럼 정보 추출
    const { data: sampleData } = await newSupabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleData && sampleData.length > 0) {
      return Object.keys(sampleData[0]);
    }

    // 데이터가 없는 경우, 스키마 파일에서 정의된 컬럼 목록 사용
    // (하지만 Supabase API로는 직접 조회 불가하므로 null 반환)
    return null;
  } catch (error) {
    // 테이블이 비어있거나 오류가 발생해도 계속 진행
    return null;
  }
}

/**
 * 데이터 정제 함수
 */
function cleanData(tableName, record) {
  const cleaned = { ...record };

  // notes 테이블의 page_number 정제
  if (tableName === 'notes' && cleaned.page_number !== null && cleaned.page_number !== undefined) {
    // 줄바꿈이나 공백 제거 후 정수로 변환 시도
    const cleanedPageNumber = String(cleaned.page_number)
      .replace(/\s+/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
      .trim();
    
    const pageNum = parseInt(cleanedPageNumber, 10);
    if (isNaN(pageNum) || pageNum < 0) {
      // 정수로 변환 불가능하거나 음수면 null로 설정
      cleaned.page_number = null;
    } else {
      cleaned.page_number = pageNum;
    }
  }

  return cleaned;
}

/**
 * 테이블 데이터 이관
 */
async function migrateTable(tableName) {
  console.log(`\n📦 [${tableName}] 데이터 이관 시작...`);

  try {
    // users 테이블은 auth.users 외래 키 제약 조건 때문에 특별 처리
    if (tableName === 'users') {
      console.log(`⚠️  [${tableName}] users 테이블은 auth.users를 참조하므로 건너뜁니다.`);
      console.log(`   사용자가 새 프로젝트에서 직접 로그인하면 자동으로 생성됩니다.`);
      console.log(`   또는 Supabase Dashboard의 Database → Backups 기능을 사용하세요.`);
      return 0;
    }

    // 1. 새 스키마의 컬럼 목록 조회 (스키마 불일치 방지)
    let newTableColumns = null;
    try {
      newTableColumns = await getNewTableColumns(tableName);
      if (newTableColumns) {
        console.log(`   📋 새 스키마 컬럼 확인: ${newTableColumns.length}개 컬럼`);
      }
    } catch (err) {
      // 테이블이 비어있거나 오류가 발생해도 계속 진행
      console.log(`   ⚠️  컬럼 정보를 확인할 수 없습니다. 전체 데이터를 시도합니다.`);
    }

    // 2. 기존 데이터 조회
    let offset = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await oldSupabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        console.error(`❌ [${tableName}] 데이터 조회 오류:`, error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // 3. 데이터 정제 및 필터링
      const cleanedData = data.map(record => {
        let cleaned = cleanData(tableName, record);

        // 새 스키마에 없는 컬럼 제거
        if (newTableColumns) {
          const filtered = {};
          for (const key of newTableColumns) {
            if (cleaned.hasOwnProperty(key)) {
              filtered[key] = cleaned[key];
            }
          }
          cleaned = filtered;
        }

        return cleaned;
      });

      // 4. 새 프로젝트에 데이터 삽입
      const { error: insertError } = await newSupabase
        .from(tableName)
        .insert(cleanedData);

      if (insertError) {
        // 중복 키 오류는 무시 (이미 이관된 데이터)
        if (insertError.code === '23505') {
          console.log(`   ⚠️  [${tableName}] 일부 데이터가 이미 존재합니다. 건너뜁니다.`);
          totalSkipped += cleanedData.length;
        } else {
          // 외래 키 제약 조건 오류는 상세 정보 출력
          if (insertError.code === '23503') {
            console.error(`❌ [${tableName}] 외래 키 제약 조건 위반:`, insertError.message);
            console.error(`   참조하는 테이블의 데이터가 먼저 이관되어야 합니다.`);
            console.error(`   예: users 테이블 오류 → auth.users가 없거나, books 테이블 오류 → books 테이블 이관 실패`);
          } else {
            console.error(`❌ [${tableName}] 데이터 삽입 오류:`, insertError.message);
          }
          throw insertError;
        }
      } else {
        totalMigrated += cleanedData.length;
      }

      offset += BATCH_SIZE;

      if (totalMigrated > 0) {
        console.log(`   ✅ ${totalMigrated}개 레코드 이관 완료...`);
      }

      // API Rate Limit 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (totalMigrated > 0) {
      console.log(`✅ [${tableName}] 데이터 이관 완료: 총 ${totalMigrated}개 레코드`);
    } else if (totalSkipped > 0) {
      console.log(`⚠️  [${tableName}] 모든 데이터가 이미 존재합니다: ${totalSkipped}개 레코드`);
    } else {
      console.log(`✅ [${tableName}] 데이터 이관 완료: 총 0개 레코드 (데이터 없음)`);
    }

    return totalMigrated;
  } catch (error) {
    console.error(`❌ [${tableName}] 이관 실패:`, error.message);
    throw error;
  }
}

/**
 * 시퀀스 값 업데이트
 */
async function updateSequences() {
  console.log('\n🔄 시퀀스 값 업데이트...');

  try {
    // 각 테이블의 ID 시퀀스 업데이트
    const sequenceQueries = [
      "SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id::text::bigint), 1) FROM users), true);",
      "SELECT setval('books_id_seq', (SELECT COALESCE(MAX(id::text::bigint), 1) FROM books), true);",
      // UUID를 사용하는 테이블은 시퀀스가 없을 수 있음
    ];

    for (const query of sequenceQueries) {
      try {
        const { error } = await newSupabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`   ⚠️  시퀀스 업데이트 건너뜀: ${error.message}`);
        }
      } catch (err) {
        // 시퀀스가 없으면 무시
        console.log(`   ⚠️  시퀀스가 존재하지 않습니다.`);
      }
    }

    console.log('✅ 시퀀스 값 업데이트 완료');
  } catch (error) {
    console.error('❌ 시퀀스 업데이트 실패:', error.message);
  }
}

/**
 * 메인 이관 함수
 */
async function migrateData() {
  console.log('🚀 Supabase 데이터 이관 시작...\n');
  console.log(`기존 프로젝트: ${OLD_SUPABASE_URL}`);
  console.log(`새 프로젝트: ${NEW_SUPABASE_URL}\n`);

  // 테이블 존재 여부 확인
  console.log('📋 테이블 존재 여부 확인...');
  for (const table of TABLES) {
    const { data, error } = await newSupabase
      .from(table)
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error(`❌ [${table}] 테이블이 존재하지 않거나 접근할 수 없습니다:`, error.message);
      console.error('   먼저 schema.sql을 실행하여 스키마를 생성하세요.');
      process.exit(1);
    }
  }
  console.log('✅ 모든 테이블이 존재합니다.\n');

  // 데이터 이관
  const results = {};
  for (const table of TABLES) {
    try {
      const count = await migrateTable(table);
      results[table] = count;
    } catch (error) {
      console.error(`❌ [${table}] 이관 중 오류 발생. 다음 테이블로 진행합니다.`);
      results[table] = { error: error.message };
      
      // 외래 키 제약 조건 오류인 경우 경고 메시지 추가
      if (error.code === '23503') {
        console.error(`   💡 참조하는 테이블의 데이터를 먼저 이관해야 합니다.`);
        console.error(`   💡 예: users 테이블 오류 → auth.users가 없거나, books 테이블 오류 → books 테이블 이관 실패`);
      }
    }
  }

  // 시퀀스 업데이트
  await updateSequences();

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 이관 결과 요약');
  console.log('='.repeat(50));
  for (const [table, count] of Object.entries(results)) {
    if (typeof count === 'number') {
      console.log(`✅ ${table}: ${count}개 레코드`);
    } else {
      console.log(`❌ ${table}: 오류 - ${count.error}`);
    }
  }
  console.log('='.repeat(50));
  
  // users 테이블 관련 안내
  if (results['users'] === 0 || (typeof results['users'] === 'object' && results['users'].error)) {
    console.log('\n💡 users 테이블 안내:');
    console.log('   users 테이블은 auth.users를 참조하므로 자동 이관되지 않습니다.');
    console.log('   사용자가 새 프로젝트에서 직접 로그인하면 자동으로 생성됩니다.');
    console.log('   또는 Supabase Dashboard의 Database → Backups 기능을 사용하세요.');
  }
}

// 실행
migrateData().catch(error => {
  console.error('\n❌ 이관 중 치명적 오류 발생:', error);
  process.exit(1);
});
