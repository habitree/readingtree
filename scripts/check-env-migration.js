/**
 * 마이그레이션용 환경 변수 확인 스크립트
 */
require('dotenv').config({ path: '.env.local' });

const OLD_URL = process.env.OLD_SUPABASE_URL || process.env.old_NEXT_PUBLIC_SUPABASE_URL;
const NEW_URL = process.env.NEW_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.old_SUPABASE_SERVICE_ROLE_KEY;
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('='.repeat(60));
console.log('환경 변수 확인 (마이그레이션용)');
console.log('='.repeat(60));
console.log('');
console.log('기존 프로젝트 (OLD):');
console.log(`  URL: ${OLD_URL || '❌ 미설정'}`);
console.log(`  Service Key: ${OLD_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
console.log('');
console.log('새 프로젝트 (NEW):');
console.log(`  URL: ${NEW_URL || '❌ 미설정'}`);
console.log(`  Service Key: ${NEW_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
console.log('');

if (OLD_URL && NEW_URL) {
  if (OLD_URL === NEW_URL) {
    console.log('❌ 경고: 기존 프로젝트와 새 프로젝트 URL이 동일합니다!');
    console.log('');
    console.log('올바른 설정:');
    console.log('  - old_NEXT_PUBLIC_SUPABASE_URL: 기존 프로젝트 URL');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL: 새 프로젝트 URL (https://pkdhhtfomhhuiirzurhs.supabase.co)');
  } else {
    console.log('✅ 환경 변수 설정이 올바릅니다.');
    console.log(`   기존: ${OLD_URL}`);
    console.log(`   새: ${NEW_URL}`);
  }
} else {
  console.log('❌ 환경 변수가 누락되었습니다.');
  console.log('');
  console.log('필수 환경 변수:');
  console.log('  - old_NEXT_PUBLIC_SUPABASE_URL (기존 프로젝트 URL)');
  console.log('  - old_SUPABASE_SERVICE_ROLE_KEY (기존 프로젝트 Service Role Key)');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL (새 프로젝트 URL)');
  console.log('  - NEW_SUPABASE_SERVICE_ROLE_KEY (새 프로젝트 Service Role Key)');
}

console.log('');
