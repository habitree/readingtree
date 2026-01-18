/**
 * 환경 변수 확인 스크립트
 * 
 * 사용 방법:
 * node scripts/check-env-vars.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 환경 변수 확인\n');
console.log('='.repeat(50));

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isValid = !!value && value !== '';
  
  if (isValid) {
    // 값의 일부만 표시 (보안)
    const displayValue = value.length > 30 
      ? value.substring(0, 30) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: 설정되지 않음`);
    allValid = false;
  }
});

console.log('='.repeat(50));

if (allValid) {
  console.log('\n✅ 모든 필수 환경 변수가 설정되어 있습니다.');
  console.log('💡 개발 서버를 재시작했는지 확인하세요: npm run dev');
} else {
  console.log('\n❌ 일부 환경 변수가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일을 확인하고 다음을 설정하세요:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

console.log('\n');
