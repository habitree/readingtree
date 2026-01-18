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
// 명시적으로 제공된 URL 우선 사용
const OLD_SUPABASE_URL = 
  process.env.OLD_SUPABASE_URL || 
  process.env.old_NEXT_PUBLIC_SUPABASE_URL ||
  'https://tpourpuxuqsorohlydug.supabase.co';  // 명시적으로 제공된 기존 프로젝트 URL

const OLD_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.old_SUPABASE_SERVICE_ROLE_KEY;

// 새 프로젝트: 명시적으로 제공된 URL 우선 사용
// 주의: NEXT_PUBLIC_SUPABASE_URL이 기존 프로젝트 URL로 설정되어 있을 수 있으므로
// 하드코딩된 새 프로젝트 URL을 우선 사용
const NEW_SUPABASE_URL = 
  process.env.NEW_SUPABASE_URL || 
  'https://pkdhhtfomhhuiirzurhs.supabase.co';  // 명시적으로 제공된 새 프로젝트 URL (우선)
  
// NEXT_PUBLIC_SUPABASE_URL이 새 프로젝트 URL인지 확인
if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://pkdhhtfomhhuiirzurhs.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === OLD_SUPABASE_URL) {
  console.warn('⚠️  경고: NEXT_PUBLIC_SUPABASE_URL이 기존 프로젝트 URL로 설정되어 있습니다.');
  console.warn('   하드코딩된 새 프로젝트 URL을 사용합니다.');
}

// 새 프로젝트 Service Role Key: NEW_SUPABASE_SERVICE_ROLE_KEY 우선 사용
// 주의: NEW_SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않으면 SUPABASE_SERVICE_ROLE_KEY 사용
// 하지만 SUPABASE_SERVICE_ROLE_KEY가 새 프로젝트의 키인지 확인 필요
const NEW_SUPABASE_SERVICE_ROLE_KEY = 
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;
  
// Service Role Key 확인
if (!NEW_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 새 프로젝트의 Service Role Key가 설정되지 않았습니다.');
  console.error('   .env.local에 다음 중 하나를 추가하세요:');
  console.error('   - NEW_SUPABASE_SERVICE_ROLE_KEY=새_프로젝트의_service_role_key');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY=새_프로젝트의_service_role_key');
  console.error('');
  console.error('   새 프로젝트의 Service Role Key는 Supabase Dashboard → Settings → API에서 확인할 수 있습니다.');
  process.exit(1);
}

// 환경 변수 검증: 기존과 새 프로젝트 URL이 달라야 함
if (OLD_SUPABASE_URL === NEW_SUPABASE_URL) {
  console.error('❌ 경고: 기존 프로젝트와 새 프로젝트 URL이 동일합니다!');
  console.error(`   기존 프로젝트: ${OLD_SUPABASE_URL}`);
  console.error(`   새 프로젝트: ${NEW_SUPABASE_URL}`);
  console.error('');
  console.error('   .env.local 파일을 확인하세요:');
  console.error('   - old_NEXT_PUBLIC_SUPABASE_URL: 기존 프로젝트 URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL: 새 프로젝트 URL (https://pkdhhtfomhhuiirzurhs.supabase.co)');
  console.error('');
  console.error('   계속 진행하시겠습니까? (잘못된 설정일 수 있습니다)');
  // process.exit(1); // 주석 처리: 사용자가 확인 후 진행할 수 있도록
}

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
  console.error('');
  console.error('   현재 설정 상태:');
  console.error(`   - NEW_SUPABASE_URL: ${NEW_SUPABASE_URL || '❌ 미설정'}`);
  console.error(`   - NEW_SUPABASE_SERVICE_ROLE_KEY: ${NEW_SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
  console.error(`   - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
  process.exit(1);
}

// 환경 변수 확인 로그
console.log('🔍 환경 변수 확인:');
console.log(`   OLD_SUPABASE_URL: ${OLD_SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정'}`);
if (OLD_SUPABASE_URL) {
  console.log(`   기존 프로젝트 URL: ${OLD_SUPABASE_URL}`);
}
console.log(`   OLD_SUPABASE_SERVICE_ROLE_KEY: ${OLD_SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
console.log(`   NEW_SUPABASE_URL: ${NEW_SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정'}`);
if (NEW_SUPABASE_URL) {
  console.log(`   새 프로젝트 URL: ${NEW_SUPABASE_URL}`);
}
console.log(`   NEW_SUPABASE_SERVICE_ROLE_KEY: ${NEW_SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 미설정'}`);

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

// UUID 매핑: 기존 프로젝트 UUID → 새 프로젝트 UUID (이메일 기준)
const USER_UUID_MAPPING = {
  // cdhnaya@kakao.com
  '7f47d5b6-ce22-4c52-8f97-5e048e523ec4': '60538115-0957-41c7-b52e-f18b62ec569b',
  // cdhrich@gmail.com
  'f6647230-9b37-4bce-a7c2-162d7e68280a': '336282aa-ddee-41bb-9e78-1f71e87efed1',
  // cdhrich@naver.com (새 프로젝트에 이미 존재하는 사용자)
  'ba1e0451-eec9-4790-a5f0-a775fb88561a': '031d63c6-0927-4a12-bc07-98b7441144df',
};

// 마이그레이션에서 제외할 사용자 ID 목록 (매핑되지 않은 사용자만 제외)
// 매핑된 사용자는 제외 목록에서 제거 (데이터를 새 UUID로 이관해야 함)
const EXCLUDED_USER_IDS = [
  '8c5e2b10-071b-403b-bb8d-a29419eccd58',  // chocolate82@gmail.com (매핑 없음)
  '5573a23a-977d-48dc-a160-f5d5e77a107a',  // netsgo0319@gmail.com (매핑 없음)
];

/**
 * 제외할 사용자 정보 조회 및 확인
 */
async function getExcludedUsersInfo() {
  console.log('\n🔍 제외할 사용자 확인 중...');
  
  if (EXCLUDED_USER_IDS.length === 0) {
    console.log('   제외할 사용자가 없습니다.');
    return [];
  }
  
  try {
    const excludedUsers = [];
    
    for (const userId of EXCLUDED_USER_IDS) {
      const { data: user, error } = await oldSupabase
        .from('users')
        .select('id, email, name, created_at')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.log(`   ⚠️  사용자 조회 오류 (ID: ${userId}): ${error.message}`);
      } else if (user) {
        excludedUsers.push(user);
        console.log(`   ⚠️  제외 대상: ${user.email || user.name || user.id} (ID: ${user.id})`);
      } else {
        console.log(`   ⚠️  사용자를 찾을 수 없음 (ID: ${userId})`);
      }
    }
    
    if (excludedUsers.length > 0) {
      console.log(`\n📋 마이그레이션에서 제외할 사용자: ${excludedUsers.length}명`);
      excludedUsers.forEach(user => {
        console.log(`   - ${user.email || user.name || user.id} (ID: ${user.id})`);
      });
    }
    
    return EXCLUDED_USER_IDS;
  } catch (error) {
    console.error('❌ 사용자 정보 확인 중 오류:', error.message);
    return EXCLUDED_USER_IDS; // 오류가 있어도 지정된 ID는 제외
  }
}

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
 * UUID 매핑 함수: 기존 UUID를 새 UUID로 변환
 */
function mapUserId(oldUserId) {
  if (!oldUserId) return oldUserId;
  return USER_UUID_MAPPING[oldUserId] || oldUserId;
}

/**
 * 매핑된 UUID가 실제로 존재하는지 확인
 * @param {string[]} userIds - 확인할 UUID 배열
 * @param {string} referencedTable - 'auth.users' 또는 'public.users'
 * @returns {Promise<Set<string>>} 존재하는 UUID Set
 */
async function validateMappedUserIds(userIds, referencedTable) {
  if (!userIds || userIds.length === 0) {
    return new Set();
  }

  const validUserIds = new Set();
  
  try {
    // referencedTable이 'auth.users'인지 'public.users'인지에 따라 검증
    if (referencedTable === 'auth.users') {
      // auth.users는 직접 쿼리할 수 없으므로, public.users를 통해 확인
      // auth.users.id와 public.users.id는 동일하므로 public.users로 확인 가능
      const { data, error } = await newSupabase
        .from('users')
        .select('id')
        .in('id', userIds);
      
      if (error) {
        console.error(`   ⚠️  UUID 검증 오류 (${referencedTable}):`, error.message);
      } else if (data) {
        data.forEach(user => validUserIds.add(user.id));
      }
    } else if (referencedTable === 'public.users') {
      const { data, error } = await newSupabase
        .from('users')
        .select('id')
        .in('id', userIds);
      
      if (error) {
        console.error(`   ⚠️  UUID 검증 오류 (${referencedTable}):`, error.message);
      } else if (data) {
        data.forEach(user => validUserIds.add(user.id));
      }
    }
  } catch (error) {
    console.error(`   ⚠️  UUID 검증 중 예외 발생:`, error.message);
  }
  
  return validUserIds;
}

/**
 * 테이블이 참조하는 사용자 테이블 확인
 * @param {string} tableName - 테이블명
 * @returns {string} 'auth.users' 또는 'public.users'
 */
function getReferencedUserTable(tableName) {
  // auth.users를 참조하는 테이블
  const authUsersTables = ['bookshelves', 'ocr_usage_stats', 'ocr_logs'];
  
  if (authUsersTables.includes(tableName)) {
    return 'auth.users';
  }
  
  // public.users를 참조하는 테이블 (기본값)
  return 'public.users';
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

  // UUID 매핑: user_id 또는 leader_id를 새 UUID로 변환
  if (cleaned.user_id) {
    const mappedUserId = mapUserId(cleaned.user_id);
    cleaned.user_id = mappedUserId;
  }

  if (cleaned.leader_id) {
    const mappedLeaderId = mapUserId(cleaned.leader_id);
    cleaned.leader_id = mappedLeaderId;
  }

  // user_books 테이블: completed_dates와 reading_reason 컬럼은 유지
  // 마이그레이션 후 스키마에 추가되므로 필터링하지 않음
  // if (tableName === 'user_books') {
  //   // 이제는 제거하지 않음 - 마이그레이션으로 스키마에 추가됨
  // }

  return cleaned;
}

/**
 * 테이블 데이터 이관
 */
async function migrateTable(tableName, excludedUserIds = []) {
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
    let totalExcluded = 0;
    let hasMore = true;

    while (hasMore) {
      let query = oldSupabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + BATCH_SIZE - 1);

      // 제외할 사용자 필터링 (user_id 또는 leader_id 컬럼이 있는 경우)
      if (excludedUserIds.length > 0) {
        if (tableName === 'groups') {
          // groups 테이블은 leader_id로 필터링
          for (const userId of excludedUserIds) {
            query = query.neq('leader_id', userId);
          }
        } else if (tableName === 'user_books' || tableName === 'notes' || tableName === 'group_members' || tableName === 'ocr_usage_stats' || tableName === 'ocr_logs') {
          // user_id로 필터링
          for (const userId of excludedUserIds) {
            query = query.neq('user_id', userId);
          }
        }
        // group_notes는 user_id가 없으므로 필터링하지 않음
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(`❌ [${tableName}] 데이터 조회 오류:`);
        
        // 오류 객체가 문자열인 경우 파싱 시도
        let errorObj = error;
        if (typeof error === 'string') {
          try {
            errorObj = JSON.parse(error);
          } catch (e) {
            // 파싱 실패 시 원본 문자열 사용
            errorObj = { message: error };
          }
        }
        
        // 오류 메시지가 JSON 문자열인 경우 다시 파싱
        if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.startsWith('{')) {
          try {
            const parsedMessage = JSON.parse(errorObj.message);
            errorObj = { ...errorObj, ...parsedMessage };
          } catch (e) {
            // 파싱 실패 시 원본 유지
          }
        }
        
        // 불완전한 JSON 문자열인 경우 ({" 로 시작하는 경우) 건너뛰기
        if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim() === '{"') {
          console.error(`   ⚠️  불완전한 오류 메시지 (데이터 조회 중단): ${errorObj.message}`);
          console.error(`   💡 이 배치를 건너뛰고 다음 배치로 진행합니다.`);
          hasMore = false;
          break;
        }
        
        console.error(`   코드: ${errorObj.code || 'N/A'}`);
        console.error(`   메시지: ${errorObj.message || JSON.stringify(errorObj)}`);
        if (errorObj.details) {
          console.error(`   상세: ${errorObj.details}`);
        }
        if (errorObj.hint) {
          console.error(`   힌트: ${errorObj.hint}`);
        }
        console.error(`   전체 오류 객체:`, JSON.stringify(errorObj, null, 2));
        throw errorObj;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // 4. 데이터 정제 및 필터링
      const cleanedData = data
        .map(record => {
          let cleaned = cleanData(tableName, record);

          // 제외할 사용자 데이터 필터링 (이중 체크)
          if (excludedUserIds.length > 0) {
            if (tableName === 'groups' && excludedUserIds.includes(cleaned.leader_id)) {
              totalExcluded++;
              return null;
            } else if ((tableName === 'user_books' || tableName === 'notes' || tableName === 'group_members' || tableName === 'ocr_usage_stats' || tableName === 'ocr_logs') && excludedUserIds.includes(cleaned.user_id)) {
              totalExcluded++;
              return null;
            }
            // group_notes는 user_id가 없으므로 필터링하지 않음
          }

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
        })
        .filter(record => record !== null); // null 제거

      // cleanedData가 비어있으면 건너뛰기
      if (cleanedData.length === 0) {
        offset += BATCH_SIZE;
        continue;
      }

      // 4.5 UUID 검증 및 필터링 (외래 키 제약 조건 위반 방지)
      const referencedTable = getReferencedUserTable(tableName);
      
      // user_id와 leader_id 수집
      const userIdsToValidate = new Set();
      cleanedData.forEach(record => {
        if (record.user_id) {
          userIdsToValidate.add(record.user_id);
        }
        if (record.leader_id) {
          userIdsToValidate.add(record.leader_id);
        }
      });

      // UUID 검증 (존재하는 UUID만 수집)
      let validUserIds = new Set();
      if (userIdsToValidate.size > 0) {
        validUserIds = await validateMappedUserIds(Array.from(userIdsToValidate), referencedTable);
        
        if (validUserIds.size < userIdsToValidate.size) {
          const invalidUserIds = Array.from(userIdsToValidate).filter(id => !validUserIds.has(id));
          console.log(`   ⚠️  존재하지 않는 UUID 발견: ${invalidUserIds.length}개 (필터링됨)`);
        }
      }

      // 매핑되지 않은 UUID와 존재하지 않는 UUID를 가진 레코드 필터링
      const validData = cleanedData.filter(record => {
        // user_id 확인
        if (record.user_id) {
          const originalUserId = record.user_id;
          const mappedUserId = mapUserId(originalUserId);
          
          // 매핑되지 않은 UUID 확인 (매핑 테이블에 없고, 원본과 동일한 경우)
          const isMapped = USER_UUID_MAPPING[originalUserId] !== undefined;
          if (!isMapped && mappedUserId === originalUserId) {
            // 매핑되지 않은 UUID이지만, 새 프로젝트에 존재할 수 있음
            // validUserIds에 있으면 통과
            if (!validUserIds.has(mappedUserId)) {
              return false; // 매핑되지 않았고 존재하지도 않음
            }
          } else {
            // 매핑된 UUID인 경우, 실제로 존재하는지 확인
            if (!validUserIds.has(mappedUserId)) {
              return false; // 매핑되었지만 존재하지 않음
            }
          }
        }
        
        // leader_id 확인 (groups 테이블)
        if (record.leader_id) {
          const originalLeaderId = record.leader_id;
          const mappedLeaderId = mapUserId(originalLeaderId);
          
          const isMapped = USER_UUID_MAPPING[originalLeaderId] !== undefined;
          if (!isMapped && mappedLeaderId === originalLeaderId) {
            if (!validUserIds.has(mappedLeaderId)) {
              return false;
            }
          } else {
            if (!validUserIds.has(mappedLeaderId)) {
              return false;
            }
          }
        }
        
        return true;
      });

      // 필터링된 레코드 수 로그
      if (validData.length < cleanedData.length) {
        const filteredCount = cleanedData.length - validData.length;
        console.log(`   ⚠️  외래 키 제약 조건을 만족하지 않는 레코드 필터링: ${filteredCount}개`);
      }

      // validData가 비어있으면 건너뛰기
      if (validData.length === 0) {
        offset += BATCH_SIZE;
        continue;
      }

      // 5. 새 프로젝트에 데이터 삽입 (덮어쓰기 모드: UPSERT 사용)
      // 중복된 데이터는 업데이트하고, 없는 데이터는 삽입
      // validData 사용 (UUID 검증 완료된 데이터만)
      const { error: insertError } = await newSupabase
        .from(tableName)
        .upsert(validData, { 
          onConflict: 'id',  // id를 기준으로 중복 처리
          ignoreDuplicates: false  // 중복 시 업데이트
        });

      if (insertError) {
        // 외래 키 제약 조건 오류는 상세 정보 출력
        if (insertError.code === '23503') {
          console.error(`❌ [${tableName}] 외래 키 제약 조건 위반 (UUID 검증 후에도 발생):`);
          console.error(`   메시지: ${insertError.message || JSON.stringify(insertError)}`);
          
          // 문제가 되는 레코드의 UUID 확인
          if (validData.length > 0) {
            const problematicUserIds = new Set();
            const problematicLeaderIds = new Set();
            
            validData.forEach(record => {
              if (record.user_id) problematicUserIds.add(record.user_id);
              if (record.leader_id) problematicLeaderIds.add(record.leader_id);
            });
            
            if (problematicUserIds.size > 0) {
              console.error(`   문제가 되는 user_id 목록 (처음 5개):`, Array.from(problematicUserIds).slice(0, 5));
              
              // 매핑된 UUID인지 확인
              const mappedUserIds = Array.from(problematicUserIds).filter(id => {
                // 역매핑 확인 (새 UUID → 기존 UUID)
                return Object.values(USER_UUID_MAPPING).includes(id);
              });
              if (mappedUserIds.length > 0) {
                console.error(`   매핑된 UUID (새 프로젝트):`, mappedUserIds.slice(0, 5).map(id => id.substring(0, 8) + '...'));
              }
              
              // 존재하지 않는 UUID 확인
              const nonExistentUserIds = Array.from(problematicUserIds).filter(id => !validUserIds.has(id));
              if (nonExistentUserIds.length > 0) {
                console.error(`   ⚠️  존재하지 않는 UUID:`, nonExistentUserIds.slice(0, 5).map(id => id.substring(0, 8) + '...'));
              }
            }
            if (problematicLeaderIds.size > 0) {
              console.error(`   문제가 되는 leader_id 목록 (처음 5개):`, Array.from(problematicLeaderIds).slice(0, 5));
              
              const mappedLeaderIds = Array.from(problematicLeaderIds).filter(id => {
                return Object.values(USER_UUID_MAPPING).includes(id);
              });
              if (mappedLeaderIds.length > 0) {
                console.error(`   매핑된 UUID (새 프로젝트):`, mappedLeaderIds.slice(0, 5).map(id => id.substring(0, 8) + '...'));
              }
              
              const nonExistentLeaderIds = Array.from(problematicLeaderIds).filter(id => !validUserIds.has(id));
              if (nonExistentLeaderIds.length > 0) {
                console.error(`   ⚠️  존재하지 않는 UUID:`, nonExistentLeaderIds.slice(0, 5).map(id => id.substring(0, 8) + '...'));
              }
            }
          }
          
          console.error(`   참조하는 테이블: ${referencedTable}`);
          console.error(`   💡 UUID 검증을 통과했지만 여전히 오류가 발생했습니다.`);
          console.error(`   💡 참조하는 테이블의 데이터가 먼저 이관되어야 합니다.`);
        } else {
          console.error(`❌ [${tableName}] 데이터 삽입/업데이트 오류:`);
          console.error(`   코드: ${insertError.code || 'N/A'}`);
          console.error(`   메시지: ${insertError.message || JSON.stringify(insertError)}`);
          console.error(`   상세:`, insertError);
        }
        throw insertError;
      } else {
        totalMigrated += validData.length;
      }

      offset += BATCH_SIZE;

      if (totalMigrated > 0) {
        console.log(`   ✅ ${totalMigrated}개 레코드 이관 완료...`);
      }

      // API Rate Limit 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (totalExcluded > 0) {
      console.log(`   ⚠️  제외된 레코드: ${totalExcluded}개 (데이터 작업이 없는 사용자)`);
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

  // 제외할 사용자 확인 (명시적으로 지정된 사용자)
  const excludedUserIds = await getExcludedUsersInfo();
  if (excludedUserIds.length > 0) {
    console.log(`\n⚠️  다음 사용자들의 데이터는 이관에서 제외됩니다: ${excludedUserIds.length}명`);
    console.log('   (명시적으로 지정된 사용자)\n');
  }

  // UUID 매핑 정보 출력
  console.log('🔄 UUID 매핑 정보:');
  for (const [oldId, newId] of Object.entries(USER_UUID_MAPPING)) {
    console.log(`   ${oldId.substring(0, 8)}... → ${newId.substring(0, 8)}...`);
  }
  console.log('');

  // 테이블 존재 여부 확인
  console.log('📋 테이블 존재 여부 확인...');
  for (const table of TABLES) {
    const { data, error } = await newSupabase
      .from(table)
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error(`❌ [${table}] 테이블이 존재하지 않거나 접근할 수 없습니다:`, error.message);
      if (error.message && error.message.includes('Invalid API key')) {
        console.error('   💡 Service Role Key가 올바르지 않거나 새 프로젝트의 키가 아닙니다.');
        console.error('   💡 .env.local에서 NEW_SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
        console.error('   💡 새 프로젝트의 Service Role Key는 Supabase Dashboard → Settings → API에서 확인할 수 있습니다.');
      } else {
        console.error('   먼저 schema.sql을 실행하여 스키마를 생성하세요.');
      }
      process.exit(1);
    }
  }
  console.log('✅ 모든 테이블이 존재합니다.\n');

  // 데이터 이관
  const results = {};
  for (const table of TABLES) {
    try {
      const count = await migrateTable(table, excludedUserIds);
      results[table] = count;
    } catch (error) {
      console.error(`❌ [${table}] 이관 중 오류 발생. 다음 테이블로 진행합니다.`);
      const errorMessage = error.message || JSON.stringify(error);
      results[table] = { error: errorMessage };
      
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
