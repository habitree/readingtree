/**
 * OCR 텍스트 보정 모듈
 * AI API를 사용하여 OCR 추출 텍스트의 오타 및 오인식 문자를 자연스럽게 보정합니다.
 *
 * 지원 프로바이더: OpenAI, Google (Gemini), Anthropic
 */

import type { AIProvider } from "@/types/ai/settings";
import type { OcrCorrectionSettings } from "@/types/ai/ocr-settings";
import { DEFAULT_OCR_CORRECTION_SETTINGS, calculateCost } from "@/types/ai/ocr-settings";

// 설정 캐시 (모듈 레벨, 1분 TTL)
let settingsCache: OcrCorrectionSettings | null = null;
let settingsCacheTime: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1분

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
  /** 사용된 프로바이더 */
  provider?: AIProvider;
  /** 사용된 모델 ID */
  modelId?: string;
  /** 입력 토큰 수 */
  inputTokens?: number;
  /** 출력 토큰 수 */
  outputTokens?: number;
  /** 예상 비용 (USD) */
  estimatedCostUsd?: number;
}

/**
 * OCR 보정용 시스템 프롬프트
 */
const SYSTEM_PROMPT = `당신은 OCR(광학 문자 인식)로 추출된 텍스트를 보정하는 전문가입니다.

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

/**
 * DB에서 활성 설정을 가져옵니다 (캐시 사용)
 */
async function getSettings(): Promise<OcrCorrectionSettings> {
  const now = Date.now();

  // 캐시 유효하면 반환
  if (settingsCache && now - settingsCacheTime < CACHE_TTL_MS) {
    return settingsCache;
  }

  try {
    // 동적 import로 순환 참조 방지
    const { getActiveOcrCorrectionSettings } = await import("@/app/actions/ai/ocr-settings");
    const settings = await getActiveOcrCorrectionSettings();

    settingsCache = settings;
    settingsCacheTime = now;

    return settings;
  } catch (error) {
    console.warn("[OCR Correction] 설정 조회 실패, 기본값 사용:", error);

    // 기본 설정 반환
    return {
      id: "default",
      ...DEFAULT_OCR_CORRECTION_SETTINGS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * OpenAI로 텍스트 보정
 */
async function correctWithOpenAI(
  text: string,
  settings: OcrCorrectionSettings
): Promise<OcrCorrectionResult & { inputTokens?: number; outputTokens?: number }> {
  const startTime = Date.now();
  const { getOpenAIClient } = await import("./providers/openai");
  const openai = getOpenAIClient();

  const userPrompt = `다음 OCR 추출 텍스트를 보정해주세요. 원문을 최대한 유지하면서 명백한 오타와 오인식만 수정합니다.

---
${text}
---

보정된 텍스트:`;

  const completion = await openai.chat.completions.create({
    model: settings.modelId,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: settings.generationSettings.maxOutputTokens,
    temperature: settings.generationSettings.temperature,
  });

  const correctedText = completion.choices[0]?.message?.content?.trim() || text;
  const duration = Date.now() - startTime;

  // 토큰 사용량
  const inputTokens = completion.usage?.prompt_tokens;
  const outputTokens = completion.usage?.completion_tokens;

  // 변경 여부 확인
  const normalizedOriginal = text.replace(/\s+/g, " ").trim();
  const normalizedCorrected = correctedText.replace(/\s+/g, " ").trim();
  const wasModified = normalizedOriginal !== normalizedCorrected;

  return {
    correctedText,
    originalText: text,
    wasModified,
    duration,
    provider: "openai",
    modelId: settings.modelId,
    inputTokens,
    outputTokens,
  };
}

/**
 * Gemini로 텍스트 보정
 */
async function correctWithGemini(
  text: string,
  settings: OcrCorrectionSettings
): Promise<OcrCorrectionResult & { inputTokens?: number; outputTokens?: number }> {
  const startTime = Date.now();
  const { getGeminiClient } = await import("./providers/gemini");
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: settings.modelId });

  const fullPrompt = `${SYSTEM_PROMPT}

다음 OCR 추출 텍스트를 보정해주세요. 원문을 최대한 유지하면서 명백한 오타와 오인식만 수정합니다.

---
${text}
---

보정된 텍스트:`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: settings.generationSettings.temperature,
      maxOutputTokens: settings.generationSettings.maxOutputTokens,
    },
  });

  const correctedText = result.response.text().trim() || text;
  const duration = Date.now() - startTime;

  // Gemini 토큰 사용량 (usageMetadata가 있는 경우)
  const usageMetadata = result.response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount;
  const outputTokens = usageMetadata?.candidatesTokenCount;

  // 변경 여부 확인
  const normalizedOriginal = text.replace(/\s+/g, " ").trim();
  const normalizedCorrected = correctedText.replace(/\s+/g, " ").trim();
  const wasModified = normalizedOriginal !== normalizedCorrected;

  return {
    correctedText,
    originalText: text,
    wasModified,
    duration,
    provider: "google",
    modelId: settings.modelId,
    inputTokens,
    outputTokens,
  };
}

/**
 * Anthropic으로 텍스트 보정
 */
async function correctWithAnthropic(
  text: string,
  settings: OcrCorrectionSettings
): Promise<OcrCorrectionResult & { inputTokens?: number; outputTokens?: number }> {
  const startTime = Date.now();
  const { getAnthropicApiKey } = await import("./providers/anthropic");
  const apiKey = getAnthropicApiKey();

  const userPrompt = `다음 OCR 추출 텍스트를 보정해주세요. 원문을 최대한 유지하면서 명백한 오타와 오인식만 수정합니다.

---
${text}
---

보정된 텍스트:`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: settings.modelId,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: settings.generationSettings.maxOutputTokens,
      temperature: settings.generationSettings.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  const data = await response.json();
  const textContent = data.content?.find((block: { type: string }) => block.type === "text");
  const correctedText = textContent?.text?.trim() || text;
  const duration = Date.now() - startTime;

  // Anthropic 토큰 사용량
  const inputTokens = data.usage?.input_tokens;
  const outputTokens = data.usage?.output_tokens;

  // 변경 여부 확인
  const normalizedOriginal = text.replace(/\s+/g, " ").trim();
  const normalizedCorrected = correctedText.replace(/\s+/g, " ").trim();
  const wasModified = normalizedOriginal !== normalizedCorrected;

  return {
    correctedText,
    originalText: text,
    wasModified,
    duration,
    provider: "anthropic",
    modelId: settings.modelId,
    inputTokens,
    outputTokens,
  };
}

/**
 * OCR 추출 텍스트를 AI로 보정합니다.
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
    // 설정 조회
    const settings = await getSettings();

    let result: OcrCorrectionResult;

    // 프로바이더별 보정 실행
    switch (settings.provider) {
      case "openai":
        result = await correctWithOpenAI(extractedText, settings);
        break;
      case "google":
        result = await correctWithGemini(extractedText, settings);
        break;
      case "anthropic":
        result = await correctWithAnthropic(extractedText, settings);
        break;
      default:
        // 기본값: OpenAI
        result = await correctWithOpenAI(extractedText, {
          ...settings,
          provider: "openai",
          modelId: "gpt-4o-mini",
        });
    }

    // 비용 계산
    if (result.inputTokens && result.outputTokens && result.provider && result.modelId) {
      result.estimatedCostUsd = calculateCost(result.provider, result.modelId, {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      });
    }

    console.log("[OCR Correction] 보정 완료:", {
      provider: result.provider,
      model: result.modelId,
      originalLength: extractedText.length,
      correctedLength: result.correctedText.length,
      wasModified: result.wasModified,
      duration: `${result.duration}ms`,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCostUsd ? `$${result.estimatedCostUsd.toFixed(6)}` : "N/A",
    });

    return result;
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
 * 설정된 프로바이더의 API 키가 있는지 확인합니다.
 */
export async function isOcrCorrectionAvailable(): Promise<boolean> {
  try {
    const settings = await getSettings();

    switch (settings.provider) {
      case "openai":
        return !!process.env.OPENAI_API_KEY;
      case "google":
        return !!process.env.GEMINI_API_KEY;
      case "anthropic":
        return !!process.env.ANTHROPIC_API_KEY;
      default:
        return !!process.env.OPENAI_API_KEY;
    }
  } catch {
    // 설정 조회 실패 시 OpenAI 기본 확인
    return !!process.env.OPENAI_API_KEY;
  }
}

/**
 * 설정 캐시 초기화
 * 설정 변경 시 호출하여 즉시 새 설정 적용
 */
export function invalidateOcrSettingsCache(): void {
  settingsCache = null;
  settingsCacheTime = 0;
}
