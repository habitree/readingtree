/**
 * OCR 텍스트 보정 모듈
 * GPT API를 사용하여 OCR 추출 텍스트의 오타 및 오인식 문자를 자연스럽게 보정합니다.
 */

import { getOpenAIClient } from "./providers/openai";

// 보정 모델 설정
const CORRECTION_MODEL = "gpt-4o-mini";
const CORRECTION_TEMPERATURE = 0.3; // 낮은 온도로 일관된 보정
const CORRECTION_MAX_TOKENS = 2048;

/**
 * OCR 텍스트 보정 결과
 */
export interface OcrCorrectionResult {
  /** 보정된 텍스트 */
  correctedText: string;
  /** 원본 텍스트 */
  originalText: string;
  /** 보정 여부 (변경 사항이 있는지) */
  wasModified: boolean;
  /** 보정 소요 시간 (ms) */
  duration: number;
}

/**
 * OCR 추출 텍스트를 GPT로 보정합니다.
 *
 * 보정 원칙:
 * - 원문의 의미와 문맥을 최대한 유지
 * - 명백한 오타나 OCR 오인식만 수정
 * - 문체나 표현 방식은 변경하지 않음
 * - 추측성 수정은 최소화
 *
 * @param extractedText OCR로 추출된 원본 텍스트
 * @returns 보정된 텍스트와 메타 정보
 */
export async function correctOcrText(extractedText: string): Promise<OcrCorrectionResult> {
  const startTime = Date.now();

  // 빈 텍스트 처리
  if (!extractedText || extractedText.trim().length === 0) {
    return {
      correctedText: extractedText,
      originalText: extractedText,
      wasModified: false,
      duration: 0,
    };
  }

  // 너무 짧은 텍스트는 보정하지 않음 (5자 미만)
  if (extractedText.trim().length < 5) {
    return {
      correctedText: extractedText,
      originalText: extractedText,
      wasModified: false,
      duration: 0,
    };
  }

  try {
    const openai = getOpenAIClient();

    const systemPrompt = `당신은 OCR(광학 문자 인식)로 추출된 텍스트를 보정하는 전문가입니다.

## 핵심 원칙
1. **원문 최대 보존**: 원본 텍스트의 의미, 문체, 표현을 최대한 유지합니다.
2. **최소 수정**: 명백한 오류만 수정하고, 불확실한 경우 원문을 유지합니다.
3. **자연스러운 수정**: 수정된 부분이 문맥에 자연스럽게 녹아들도록 합니다.

## 수정 대상
- OCR 오인식으로 인한 잘못된 글자 (예: '틀' → '를', '옳' → '을')
- 명백한 오타 (예: '하뚜' → '하루', '눔' → '눈')
- 깨진 문자나 특수문자 오류
- 불필요하게 삽입된 공백이나 줄바꿈
- 한글 자음/모음 분리 오류 (예: 'ㅎㅏㄴㄱㅜㄱ' → '한국')

## 수정하지 않는 것
- 저자의 의도적인 문체나 표현 (신조어, 줄임말 등)
- 원문의 문장 구조나 어순
- 맞춤법이 맞더라도 문맥상 자연스러운 표현
- 확실하지 않은 수정

## 출력 형식
- 보정된 텍스트만 출력합니다.
- 설명, 주석, 마크다운 포맷 없이 순수 텍스트만 반환합니다.
- 수정 사항이 없으면 원문 그대로 반환합니다.`;

    const userPrompt = `다음 OCR 추출 텍스트를 보정해주세요. 원문을 최대한 유지하면서 명백한 오타와 오인식만 수정합니다.

---
${extractedText}
---

보정된 텍스트:`;

    const completion = await openai.chat.completions.create({
      model: CORRECTION_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: CORRECTION_MAX_TOKENS,
      temperature: CORRECTION_TEMPERATURE,
    });

    const correctedText = completion.choices[0]?.message?.content?.trim() || extractedText;
    const duration = Date.now() - startTime;

    // 변경 여부 확인 (공백 정규화 후 비교)
    const normalizedOriginal = extractedText.replace(/\s+/g, " ").trim();
    const normalizedCorrected = correctedText.replace(/\s+/g, " ").trim();
    const wasModified = normalizedOriginal !== normalizedCorrected;

    console.log("[OCR Correction] 보정 완료:", {
      originalLength: extractedText.length,
      correctedLength: correctedText.length,
      wasModified,
      duration: `${duration}ms`,
    });

    return {
      correctedText,
      originalText: extractedText,
      wasModified,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[OCR Correction] 보정 실패, 원문 반환:", error);

    // 보정 실패 시 원문 반환 (서비스 중단 방지)
    return {
      correctedText: extractedText,
      originalText: extractedText,
      wasModified: false,
      duration,
    };
  }
}

/**
 * OCR 텍스트 보정 가능 여부 확인
 * OpenAI API 키가 설정되어 있는지 확인합니다.
 */
export function isOcrCorrectionAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
