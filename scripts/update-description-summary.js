#!/usr/bin/env node
/**
 * description_summary 데이터 업데이트 스크립트
 *
 * 새로운 프롬프트 기준(50~70자 이내, 완결된 평서문 2~3문장)으로
 * 기존 description_summary 데이터를 재생성합니다.
 *
 * UI 기준: 책소개 컬럼 최소 300px, 12px 텍스트로 2~3줄 표시
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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase 클라이언트 초기화
let supabaseClient = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (error) {
  console.error('❌ @supabase/supabase-js 로드 실패:', error.message);
  console.error('   npm install @supabase/supabase-js');
  process.exit(1);
}

// Gemini API 클라이언트 초기화
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} catch (error) {
  console.error('❌ @google/generative-ai 로드 실패:', error.message);
  console.error('   npm install @google/generative-ai');
  process.exit(1);
}

// OpenAI GPT API 클라이언트 초기화
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai = null;
if (OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  } catch (error) {
    console.warn('⚠️  OpenAI 패키지 로드 실패 (선택사항):', error.message);
    console.warn('   npm install openai');
  }
}

/**
 * 책소개를 50~70자 이내의 완결된 평서문 2~3문장으로 요약
 * @param {string} description 원본 책소개 텍스트
 * @returns {Promise<string>} 요약된 텍스트
 */
async function summarizeBookDescription(description) {
  if (!description || description.trim().length === 0) {
    return "";
  }

  // 이미 짧은 경우 그대로 반환
  if (description.length <= 70) {
    return description.trim();
  }

  const prompt = `다음 책소개를 다음 조건에 정확히 맞게 요약해주세요:

필수 조건:
1. 정확히 50자 이상 70자 이하의 한국어 문장으로 작성
2. 반드시 완전한 문장으로 끝나야 합니다. 문장이 중간에 끊기거나 미완성되면 안 됩니다
3. 문장 끝에 마침표(.)를 포함하여 의미가 완결되도록 작성
4. 평서문 형식으로 작성 (의문문, 감탄문 사용 금지)
5. 따옴표(" '), 백틱(\`), 별표(*), 줄바꿈, 이모지, 특수기호 사용 절대 금지
6. 요약 텍스트만 반환하고 다른 설명이나 주석은 포함하지 마세요

중요: 문장이 70자를 초과하면 안 되며, 반드시 완전한 의미를 가진 문장으로 끝나야 합니다.

책소개:
${description}`;

  let summary = "";

  // 1. Gemini API 시도
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    summary = result.response.text().trim();
  } catch (geminiError) {
    console.error('[Gemini] 책소개 요약 실패, GPT API로 fallback:', geminiError.message);
    
    // 2. Gemini 실패 시 GPT API로 fallback
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "당신은 책소개를 간결하게 요약하는 전문가입니다. 요약 텍스트만 반환하세요.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        
        summary = completion.choices[0]?.message?.content?.trim() || "";
        
        if (!summary) {
          throw new Error("GPT API 응답이 비어있습니다.");
        }
      } catch (gptError) {
        console.error('[GPT] 책소개 요약 실패:', gptError.message);
        // GPT도 실패하면 원본 텍스트를 70자로 자르고 문장 완결 처리
        return truncateToCompleteSentence(description, 70);
      }
    } else {
      // GPT API가 설정되지 않았으면 원본 텍스트를 70자로 자르고 문장 완결 처리
      return truncateToCompleteSentence(description, 70);
    }
  }

  // summary가 있으면 후처리 진행
  if (summary) {
    // 특수문자 제거 (따옴표, 백틱, *, 줄바꿈, 이모지 등)
    summary = summary
      .replace(/["'`*]/g, "") // 따옴표, 백틱, * 제거
      .replace(/\n/g, " ") // 줄바꿈을 공백으로
      .replace(/\s+/g, " ") // 연속된 공백을 하나로
      .trim();

    // 70자 초과 시 자르기 (문장이 끊기지 않도록 완전한 문장으로)
    if (summary.length > 70) {
      summary = truncateToCompleteSentence(summary, 70);
    }

    // 50자 미만이면 원본에서 적절히 자르고 완결된 문장으로 처리
    if (summary.length < 50) {
      return truncateToCompleteSentence(description, 70, 50);
    }

    return summary;
  }

  // summary가 없으면 원본 텍스트를 70자로 자르고 문장 완결 처리
  return truncateToCompleteSentence(description, 70);
}

/**
 * 텍스트를 지정된 길이 이내로 자르되, 문장이 완결되도록 처리
 * @param {string} text 원본 텍스트
 * @param {number} maxLength 최대 길이
 * @param {number} minLength 최소 길이 (옵션, 기본값 50)
 * @returns {string} 완결된 문장으로 처리된 텍스트
 */
function truncateToCompleteSentence(text, maxLength, minLength = 50) {
  if (!text || text.trim().length === 0) {
    return "";
  }

  const trimmedText = text.trim();

  // 이미 maxLength 이하면 그대로 반환 (문장 부호 확인)
  if (trimmedText.length <= maxLength) {
    // 마지막 문자가 문장 부호가 아니면 마침표 추가
    if (!trimmedText.match(/[.!?]$/)) {
      return trimmedText + ".";
    }
    return trimmedText;
  }

  // maxLength 범위 내에서 마지막 문장 부호(., !, ?) 찾기
  const searchRange = trimmedText.substring(0, maxLength);
  const lastPeriod = searchRange.lastIndexOf(".");
  const lastExclamation = searchRange.lastIndexOf("!");
  const lastQuestion = searchRange.lastIndexOf("?");
  const lastPunctuation = Math.max(lastPeriod, lastExclamation, lastQuestion);

  // minLength 이상에서 문장 부호를 찾으면 그 위치에서 자르기
  if (lastPunctuation >= minLength - 1) {
    return trimmedText.substring(0, lastPunctuation + 1);
  }

  // 문장 부호가 없거나 너무 앞에 있으면, 공백 기준으로 자르고 마침표 추가
  const lastSpace = searchRange.lastIndexOf(" ");
  if (lastSpace >= minLength - 5) {
    const truncated = trimmedText.substring(0, lastSpace).trim();
    if (!truncated.match(/[.!?]$/)) {
      return truncated + ".";
    }
    return truncated;
  }

  // 공백도 적절한 위치에 없으면 maxLength에서 자르고 마침표 추가
  const truncated = trimmedText.substring(0, maxLength).trim();
  if (!truncated.match(/[.!?]$/)) {
    return truncated + ".";
  }
  return truncated;
}

/**
 * description_summary 업데이트 메인 함수
 */
async function updateDescriptionSummaries() {
  console.log('🔄 description_summary 업데이트 시작...\n');

  try {
    // summary가 있고 description_summary가 있는 모든 책 조회
    const { data: books, error: fetchError } = await supabaseClient
      .from('books')
      .select('id, title, summary, description_summary')
      .not('summary', 'is', null)
      .not('summary', 'eq', '')
      .not('description_summary', 'is', null)
      .not('description_summary', 'eq', '');

    if (fetchError) {
      console.error('❌ 책 목록 조회 실패:', fetchError.message);
      process.exit(1);
    }

    if (!books || books.length === 0) {
      console.log('✅ 업데이트할 책이 없습니다.');
      return;
    }

    console.log(`📚 총 ${books.length}권의 책을 업데이트합니다.\n`);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 5; // API 호출 제한을 고려한 배치 크기

    // 배치로 처리
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (book) => {
          try {
            if (!book.summary || book.summary.trim().length === 0) {
              console.log(`⏭️  [${book.title || book.id}] summary가 없어 스킵합니다.`);
              return;
            }

            console.log(`📖 [${book.title || book.id}] 요약 생성 중...`);
            
            // 새로운 프롬프트로 요약 생성
            const newSummary = await summarizeBookDescription(book.summary);
            
            if (!newSummary || newSummary.trim().length === 0) {
              console.log(`⚠️  [${book.title || book.id}] 요약 생성 실패 (빈 결과)`);
              errorCount++;
              return;
            }

            // DB 업데이트
            const { error: updateError } = await supabaseClient
              .from('books')
              .update({ description_summary: newSummary.trim() })
              .eq('id', book.id);

            if (updateError) {
              console.error(`❌ [${book.title || book.id}] 업데이트 실패:`, updateError.message);
              errorCount++;
            } else {
              console.log(`✅ [${book.title || book.id}] 업데이트 완료: "${newSummary}"`);
              successCount++;
            }

            // API 호출 제한을 고려한 딜레이 (Gemini API는 분당 60회 제한)
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`❌ [${book.title || book.id}] 처리 중 오류:`, error.message);
            errorCount++;
          }
        })
      );

      // 배치 간 딜레이
      if (i + batchSize < books.length) {
        console.log(`\n⏳ 다음 배치 처리 대기 중... (${i + batchSize}/${books.length})\n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 업데이트 완료');
    console.log(`✅ 성공: ${successCount}권`);
    console.log(`❌ 실패: ${errorCount}권`);
    console.log(`📚 전체: ${books.length}권`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ 업데이트 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
updateDescriptionSummaries()
  .then(() => {
    console.log('\n✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
