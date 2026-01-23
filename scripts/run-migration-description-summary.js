#!/usr/bin/env node
/**
 * description_summary 컬럼 길이 확장 마이그레이션 스크립트
 * varchar(50) → varchar(80)
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경 변수 로드
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    }
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화
let supabaseClient = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (error) {
  console.error('❌ @supabase/supabase-js 로드 실패:', error.message);
  process.exit(1);
}

async function runMigration() {
  console.log('🔄 description_summary 컬럼 길이 확장 마이그레이션 시작...\n');

  try {
    // rpc를 통한 SQL 실행 (Supabase에서 직접 SQL 실행)
    const { error } = await supabaseClient.rpc('exec_sql', {
      query: 'ALTER TABLE books ALTER COLUMN description_summary TYPE varchar(80);'
    });

    if (error) {
      // rpc가 없으면 다른 방법 시도
      console.log('ℹ️  rpc 실행 불가, Supabase 대시보드에서 직접 실행해주세요.');
      console.log('\n📋 실행할 SQL:');
      console.log('ALTER TABLE books ALTER COLUMN description_summary TYPE varchar(80);');
      console.log('\n📍 Supabase 대시보드 → SQL Editor에서 위 SQL을 실행해주세요.');
      return false;
    }

    console.log('✅ 마이그레이션 완료: description_summary 컬럼이 varchar(80)으로 확장되었습니다.');
    return true;
  } catch (error) {
    console.log('ℹ️  직접 SQL 실행이 지원되지 않습니다.');
    console.log('\n📋 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
    console.log('ALTER TABLE books ALTER COLUMN description_summary TYPE varchar(80);');
    return false;
  }
}

runMigration()
  .then((success) => {
    if (success) {
      console.log('\n✅ 마이그레이션 스크립트 완료');
    } else {
      console.log('\n⚠️  수동 마이그레이션이 필요합니다.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
