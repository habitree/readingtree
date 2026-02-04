/**
 * OCR 일괄 보정 스크립트
 * 기존 transcription 데이터에 GPT 보정을 일괄 적용합니다.
 *
 * 실행: npx tsx scripts/ocr-batch-correction.ts
 * 옵션: npx tsx scripts/ocr-batch-correction.ts --limit 10
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// .env.local 로드
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

// 서비스 롤 키로 Supabase 클라이언트 생성 (RLS 우회)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OCR 보정 함수 (OpenAI 직접 호출)
async function correctOcrText(text: string): Promise<{
  correctedText: string;
  wasModified: boolean;
  inputTokens?: number;
  outputTokens?: number;
}> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.warn("OPENAI_API_KEY가 없습니다. 원본 반환.");
    return { correctedText: text, wasModified: false };
  }

  if (!text || text.trim().length < 5) {
    return { correctedText: text, wasModified: false };
  }

  const systemPrompt = `당신은 OCR(광학 문자 인식)로 추출된 텍스트를 보정하는 전문가입니다.

## 핵심 원칙
1. **원문 최대 보존**: 원본 텍스트의 의미, 문체, 표현을 최대한 유지합니다.
2. **최소 수정**: 명백한 오류만 수정하고, 불확실한 경우 원문을 유지합니다.

## 수정 대상
- OCR 오인식으로 인한 잘못된 글자 (예: '틀' → '를', '옳' → '을')
- 명백한 오타 (예: '하뚜' → '하루', '눔' → '눈')
- 깨진 문자나 특수문자 오류
- 불필요하게 삽입된 공백이나 줄바꿈
- 한글 자음/모음 분리 오류

## 수정하지 않는 것
- 저자의 의도적인 문체나 표현
- 원문의 문장 구조나 어순
- 확실하지 않은 수정

## 출력 형식
- 보정된 텍스트만 출력합니다.
- 설명, 주석, 마크다운 포맷 없이 순수 텍스트만 반환합니다.`;

  const userPrompt = `다음 OCR 추출 텍스트를 보정해주세요. 원문을 최대한 유지하면서 명백한 오타와 오인식만 수정합니다.

---
${text}
---

보정된 텍스트:`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API 오류");
    }

    const data = await response.json();
    const correctedText = data.choices[0]?.message?.content?.trim() || text;

    // 변경 여부 확인
    const normalizedOriginal = text.replace(/\s+/g, " ").trim();
    const normalizedCorrected = correctedText.replace(/\s+/g, " ").trim();
    const wasModified = normalizedOriginal !== normalizedCorrected;

    return {
      correctedText,
      wasModified,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
  } catch (error) {
    console.error("보정 실패:", error);
    return { correctedText: text, wasModified: false };
  }
}

async function main() {
  // 명령행 인수에서 limit 파싱
  const args = process.argv.slice(2);
  let limit = 150; // 기본값: 전체
  const limitIndex = args.indexOf("--limit");
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
  }

  console.log("=".repeat(60));
  console.log("OCR 일괄 보정 시작");
  console.log("=".repeat(60));

  // 1. 아직 보정되지 않은 데이터 조회
  // raw_extracted_text와 extracted_text가 동일한 것 = 아직 보정 안됨
  const { data: allData, error: fetchError } = await supabase
    .from("transcriptions")
    .select("id, note_id, extracted_text, raw_extracted_text")
    .eq("status", "completed")
    .limit(limit);

  if (fetchError) {
    console.error("대상 조회 실패:", fetchError);
    process.exit(1);
  }

  // 아직 보정되지 않은 데이터 필터링 (raw_extracted_text == extracted_text)
  const targets = allData?.filter(
    (item) => item.raw_extracted_text === item.extracted_text
  ) || [];

  if (targets.length === 0) {
    console.log("✅ 보정할 데이터가 없습니다. 모든 데이터가 이미 보정되었습니다.");
    process.exit(0);
  }

  console.log(`\n📊 보정 대상: ${targets.length}건 (limit: ${limit})\n`);

  let successCount = 0;
  let failedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;

    try {
      const originalText = target.raw_extracted_text || target.extracted_text;

      if (!originalText || originalText.trim().length < 5) {
        console.log(`${progress} ⏭️ ID: ${target.id.slice(0, 8)}... (텍스트 너무 짧음)`);
        successCount++;
        continue;
      }

      // GPT 보정 실행
      console.log(`${progress} 🔄 ID: ${target.id.slice(0, 8)}... 보정 중... (${originalText.length}자)`);
      const result = await correctOcrText(originalText);

      // DB 업데이트 (보정된 텍스트로 extracted_text 업데이트)
      const { error: updateError } = await supabase
        .from("transcriptions")
        .update({
          extracted_text: result.correctedText,
          // raw_extracted_text는 그대로 유지 (원본 보존)
        })
        .eq("id", target.id);

      if (updateError) {
        throw new Error(`DB 업데이트 실패: ${updateError.message}`);
      }

      if (result.wasModified) {
        console.log(`${progress} ✅ ID: ${target.id.slice(0, 8)}... 수정됨 (${result.inputTokens}→${result.outputTokens} tokens)`);
        modifiedCount++;
      } else {
        console.log(`${progress} ✅ ID: ${target.id.slice(0, 8)}... 변경 없음`);
      }
      successCount++;

      // API Rate limit 방지
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (error) {
      console.error(`${progress} ❌ ID: ${target.id.slice(0, 8)}... 실패:`, error);
      failedCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 실행 결과");
  console.log("=".repeat(60));
  console.log(`전체: ${targets.length}건`);
  console.log(`성공: ${successCount}건`);
  console.log(`실패: ${failedCount}건`);
  console.log(`수정됨: ${modifiedCount}건`);
  console.log("=".repeat(60));
}

main().catch(console.error);
