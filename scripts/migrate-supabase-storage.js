/**
 * Supabase Storage 파일 이관 스크립트
 * 
 * 기존 Supabase 프로젝트의 Storage 버킷에서 새 프로젝트로 파일을 이관합니다.
 * 
 * 사용 방법:
 * 1. .env.local에 기존 및 새 프로젝트 정보 설정
 * 2. node scripts/migrate-supabase-storage.js 실행
 * 
 * 환경 변수:
 * - OLD_SUPABASE_URL: 기존 프로젝트 URL
 * - OLD_SUPABASE_SERVICE_ROLE_KEY: 기존 프로젝트 Service Role Key
 * - NEW_SUPABASE_URL: 새 프로젝트 URL
 * - NEW_SUPABASE_SERVICE_ROLE_KEY: 새 프로젝트 Service Role Key
 * - BUCKET_NAME: 이관할 버킷 이름 (기본값: images)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 확인 (기존 변수명 또는 새 변수명 모두 지원)
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_SUPABASE_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// 새 프로젝트는 별도 변수명이 필요
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SUPABASE_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME || 'images';

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

/**
 * 버킷의 모든 파일 목록 가져오기
 */
async function listAllFiles(supabase, bucketName) {
  const files = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  while (hasMore) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error(`❌ 파일 목록 조회 오류:`, error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    // 디렉토리인 경우 재귀적으로 탐색
    for (const item of data) {
      if (item.id === null) {
        // 디렉토리
        const subFiles = await listFilesRecursive(supabase, bucketName, item.name);
        files.push(...subFiles);
      } else {
        // 파일
        files.push(item.name);
      }
    }

    offset += limit;
    hasMore = data.length === limit;
  }

  return files;
}

/**
 * 디렉토리 재귀 탐색
 */
async function listFilesRecursive(supabase, bucketName, folderPath) {
  const files = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

  while (hasMore) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error(`❌ 디렉토리 조회 오류 [${folderPath}]:`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of data) {
      if (item.id === null) {
        // 하위 디렉토리
        const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
        const subFiles = await listFilesRecursive(supabase, bucketName, subPath);
        files.push(...subFiles);
      } else {
        // 파일
        const filePath = folderPath ? `${folderPath}/${item.name}` : item.name;
        files.push(filePath);
      }
    }

    offset += limit;
    hasMore = data.length === limit;
  }

  return files;
}

/**
 * 파일 다운로드
 */
async function downloadFile(supabase, bucketName, filePath) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);

  if (error) {
    console.error(`❌ 파일 다운로드 오류 [${filePath}]:`, error.message);
    throw error;
  }

  return data;
}

/**
 * 파일 업로드
 */
async function uploadFile(supabase, bucketName, filePath, fileData) {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileData, {
      upsert: true, // 기존 파일 덮어쓰기
      contentType: fileData.type || 'application/octet-stream',
    });

  if (error) {
    console.error(`❌ 파일 업로드 오류 [${filePath}]:`, error.message);
    throw error;
  }
}

/**
 * 단일 파일 이관
 */
async function migrateFile(filePath) {
  try {
    // 1. 기존 프로젝트에서 파일 다운로드
    const fileData = await downloadFile(oldSupabase, BUCKET_NAME, filePath);

    // 2. 새 프로젝트에 파일 업로드
    await uploadFile(newSupabase, BUCKET_NAME, filePath, fileData);

    return true;
  } catch (error) {
    console.error(`   ❌ [${filePath}] 이관 실패:`, error.message);
    return false;
  }
}

/**
 * 메인 이관 함수
 */
async function migrateStorage() {
  console.log('🚀 Supabase Storage 파일 이관 시작...\n');
  console.log(`버킷: ${BUCKET_NAME}`);
  console.log(`기존 프로젝트: ${OLD_SUPABASE_URL}`);
  console.log(`새 프로젝트: ${NEW_SUPABASE_URL}\n`);

  // 새 프로젝트에 버킷이 존재하는지 확인
  const { data: buckets, error: bucketError } = await newSupabase.storage.listBuckets();
  if (bucketError) {
    console.error('❌ 버킷 목록 조회 오류:', bucketError.message);
    process.exit(1);
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.error(`❌ 새 프로젝트에 '${BUCKET_NAME}' 버킷이 존재하지 않습니다.`);
    console.error('   먼저 Supabase Dashboard에서 버킷을 생성하세요.');
    process.exit(1);
  }

  console.log('📋 파일 목록 조회 중...');
  const files = await listAllFiles(oldSupabase, BUCKET_NAME);
  console.log(`✅ 총 ${files.length}개 파일 발견\n`);

  if (files.length === 0) {
    console.log('⚠️  이관할 파일이 없습니다.');
    return;
  }

  // 파일 이관
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    process.stdout.write(`\r${progress} ${filePath}...`);

    const success = await migrateFile(filePath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // API Rate Limit 방지를 위한 지연
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n');
  console.log('='.repeat(50));
  console.log('📊 이관 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}개 파일`);
  console.log(`❌ 실패: ${failCount}개 파일`);
  console.log(`📦 총: ${files.length}개 파일`);
  console.log('='.repeat(50));
}

// 실행
migrateStorage().catch(error => {
  console.error('\n❌ 이관 중 치명적 오류 발생:', error);
  process.exit(1);
});
