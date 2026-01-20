/**
 * AI 설정 테이블 마이그레이션 실행 스크립트
 *
 * 실행: npx tsx scripts/run-ai-settings-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// .env.local 로드
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("환경 변수가 설정되지 않았습니다:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "OK" : "MISSING");
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "OK" : "MISSING");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log("🚀 AI 설정 테이블 마이그레이션 시작...\n");

  try {
    // 1. ai_settings 테이블 생성
    console.log("1️⃣ ai_settings 테이블 생성 중...");
    const { error: createAiSettingsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.ai_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          provider VARCHAR(20) NOT NULL CHECK (provider IN ('openai', 'google', 'anthropic')),
          model_id VARCHAR(100) NOT NULL,
          system_prompt_template TEXT NOT NULL,
          welcome_message TEXT NOT NULL,
          context_settings JSONB NOT NULL DEFAULT '{
            "maxHistoryMessages": 10,
            "includePersona": true,
            "includeRecentBooks": true,
            "includeRecentNotes": true,
            "includeReadingGoal": true,
            "maxRecentBooks": 5,
            "maxRecentNotes": 10
          }'::jsonb,
          generation_settings JSONB NOT NULL DEFAULT '{
            "temperature": 0.7,
            "maxOutputTokens": 2048,
            "topP": 1.0,
            "frequencyPenalty": 0.0,
            "presencePenalty": 0.0
          }'::jsonb,
          memory_settings JSONB NOT NULL DEFAULT '{
            "enableLongTermMemory": false,
            "memoryUpdatePrompt": "",
            "maxMemoryItems": 50
          }'::jsonb,
          is_active BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `,
    });

    if (createAiSettingsError) {
      // RPC가 없으면 직접 쿼리로 시도
      console.log("   RPC 사용 불가, 직접 쿼리로 시도...");

      // 테이블 존재 여부 확인
      const { data: existingTable } = await supabase
        .from("ai_settings")
        .select("id")
        .limit(1);

      if (existingTable === null) {
        console.log("   ⚠️ ai_settings 테이블이 없습니다. Supabase Dashboard에서 SQL을 실행해주세요.");
        console.log("\n📋 실행할 SQL 파일: doc/database/migration-202601211000__ai_settings__create_tables.sql");
        return false;
      } else {
        console.log("   ✅ ai_settings 테이블이 이미 존재합니다.");
      }
    } else {
      console.log("   ✅ ai_settings 테이블 생성 완료");
    }

    // 2. user_ai_memories 테이블 확인
    console.log("\n2️⃣ user_ai_memories 테이블 확인 중...");
    const { data: existingMemoryTable, error: memoryError } = await supabase
      .from("user_ai_memories")
      .select("id")
      .limit(1);

    if (memoryError && memoryError.code === "42P01") {
      console.log("   ⚠️ user_ai_memories 테이블이 없습니다. Supabase Dashboard에서 SQL을 실행해주세요.");
    } else {
      console.log("   ✅ user_ai_memories 테이블 확인 완료");
    }

    // 3. 기본 설정 확인 및 삽입
    console.log("\n3️⃣ 기본 AI 설정 확인 중...");
    const { data: existingSettings, error: selectError } = await supabase
      .from("ai_settings")
      .select("*")
      .limit(1);

    if (selectError) {
      console.log("   ❌ ai_settings 테이블 조회 실패:", selectError.message);
      console.log("\n📋 Supabase Dashboard에서 다음 SQL을 실행해주세요:");
      console.log("   파일 경로: doc/database/migration-202601211000__ai_settings__create_tables.sql");
      return false;
    }

    if (!existingSettings || existingSettings.length === 0) {
      console.log("   기본 설정 삽입 중...");

      const { error: insertError } = await supabase.from("ai_settings").insert({
        provider: "google",
        model_id: "gemini-1.5-flash",
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
          memoryUpdatePrompt: "",
          maxMemoryItems: 50,
        },
        is_active: true,
      });

      if (insertError) {
        console.log("   ❌ 기본 설정 삽입 실패:", insertError.message);
        return false;
      }

      console.log("   ✅ 기본 AI 설정 삽입 완료");
    } else {
      console.log("   ✅ 기본 설정이 이미 존재합니다.");
    }

    console.log("\n✅ 마이그레이션 완료!");
    return true;
  } catch (error) {
    console.error("\n❌ 마이그레이션 실패:", error);
    return false;
  }
}

// 실행
runMigration().then((success) => {
  process.exit(success ? 0 : 1);
});
