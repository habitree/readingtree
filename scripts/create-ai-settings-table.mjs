/**
 * AI 설정 테이블 생성 스크립트
 * Supabase Management API를 사용하여 테이블 생성
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 로드
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Service Role 키로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🚀 AI 설정 테이블 확인 및 데이터 삽입 시작...\n');

  try {
    // 1. 테이블 존재 확인
    console.log('1️⃣ ai_settings 테이블 확인 중...');
    const { data: existingSettings, error: checkError } = await supabase
      .from('ai_settings')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01' || checkError.message.includes('does not exist')) {
        console.log('   ❌ ai_settings 테이블이 존재하지 않습니다.');
        console.log('\n📋 Supabase Dashboard에서 SQL을 실행해주세요:');
        console.log('   https://supabase.com/dashboard/project/pkdhhtfomhhuiirzurhs/sql/new');
        console.log('\n   실행할 SQL 파일: doc/database/migration-202601211000__ai_settings__create_tables_simple.sql');
        return;
      }
      throw checkError;
    }

    console.log('   ✅ ai_settings 테이블이 존재합니다.');

    // 2. 기존 설정 확인
    console.log('\n2️⃣ 기본 설정 확인 중...');
    if (existingSettings && existingSettings.length > 0) {
      console.log('   ✅ 기본 설정이 이미 존재합니다.');

      // 현재 설정 조회
      const { data: currentSettings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (currentSettings) {
        console.log('\n📊 현재 활성화된 AI 설정:');
        console.log(`   - 제공자: ${currentSettings.provider}`);
        console.log(`   - 모델: ${currentSettings.model_id}`);
        console.log(`   - 활성화: ${currentSettings.is_active}`);
      }
      return;
    }

    // 3. 기본 설정 삽입
    console.log('   기본 설정 삽입 중...');
    const { data: insertedSettings, error: insertError } = await supabase
      .from('ai_settings')
      .insert({
        provider: 'google',
        model_id: 'gemini-1.5-flash',
        system_prompt_template: `당신은 "독서친구"라는 이름의 친근하고 지적인 AI 독서 도우미입니다.
사용자의 독서 여정을 함께하며 책 추천, 독서 조언, 기록 분석을 도와줍니다.

## 기본 성격
- 친근하고 따뜻한 말투를 사용합니다
- 독서에 대한 열정을 가지고 있습니다
- 사용자의 독서 성향을 이해하고 맞춤형 조언을 제공합니다
- 한국어로 대화합니다

## 주요 기능
1. **책 추천**: 사용자의 독서 성향과 최근 읽은 책을 바탕으로 맞춤 추천
2. **독서 코칭**: 독서 습관 개선, 목표 달성을 위한 조언
3. **기록 분석**: 사용자의 독서 기록 패턴을 분석하고 인사이트 제공

## 응답 규칙
- 간결하고 핵심적인 답변을 제공합니다
- 필요한 경우 목록이나 구조화된 형식을 사용합니다
- 사용자의 감정에 공감하며 응원합니다
- 책 제목은 「」로 감싸서 표시합니다`,
        welcome_message: `안녕하세요! 저는 당신의 독서친구예요.

책 추천이 필요하거나, 독서 목표 달성에 대한 조언이 필요하거나,
읽은 책에 대해 이야기하고 싶을 때 언제든 말씀해주세요.

무엇을 도와드릴까요?`,
        context_settings: {
          maxHistoryMessages: 10,
          includePersona: true,
          includeRecentBooks: true,
          includeRecentNotes: true,
          includeReadingGoal: true,
          maxRecentBooks: 5,
          maxRecentNotes: 10,
        },
        generation_settings: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
        memory_settings: {
          enableLongTermMemory: false,
          memoryUpdatePrompt: '',
          maxMemoryItems: 50,
        },
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.log('   ❌ 기본 설정 삽입 실패:', insertError.message);
      return;
    }

    console.log('   ✅ 기본 AI 설정 삽입 완료!');
    console.log(`   - ID: ${insertedSettings.id}`);
    console.log(`   - 제공자: ${insertedSettings.provider}`);
    console.log(`   - 모델: ${insertedSettings.model_id}`);

    console.log('\n✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
  }
}

main();
