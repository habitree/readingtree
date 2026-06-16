/**
 * AI 자동 태깅 모듈
 * 노트 내용을 분석하여 관련 태그를 추천합니다.
 *
 * 지원 프로바이더: Google (Gemini), OpenAI, Anthropic
 */

import type { AIProvider } from "@/types/ai/settings";

/**
 * 자동 태깅 결과
 */
export interface AutoTaggingResult {
  tags: string[];
  provider?: AIProvider;
  modelId?: string;
  duration: number;
}

/**
 * 태깅용 시스템 프롬프트
 */
const SYSTEM_PROMPT = `당신은 독서 기록에 태그를 추천하는 전문가입니다.

## 핵심 원칙
1. **관련성**: 기록 내용과 직접적으로 관련된 태그만 생성
2. **일관성**: 사용자의 기존 태그와 일치하는 표현 우선 사용
3. **간결성**: 태그는 1~4단어, 최대 5개 추천

## 태그 유형 (적절히 조합)
- 주제/분야: 철학, 심리학, 자기계발, 소설 등
- 감정/분위기: 감동, 위로, 동기부여 등
- 액션: 다시읽기, 인용, 실천 등

## 출력 형식
JSON 배열로만 반환: ["태그1", "태그2", "태그3"]
- 다른 설명이나 주석 없이 순수 JSON 배열만 출력
- 최소 2개, 최대 5개
- 각 태그는 한국어 우선, 50자 이하`;

/**
 * 사용자 프롬프트 생성
 */
function buildUserPrompt(
  content: string,
  existingTags: string[]
): string {
  let prompt = `다음 독서 기록에 어울리는 태그를 추천해주세요.

---
${content.slice(0, 2000)}
---`;

  if (existingTags.length > 0) {
    prompt += `\n\n사용자의 기존 태그 (가능하면 이 중에서 선택): ${existingTags.slice(0, 30).join(", ")}`;
  }

  prompt += "\n\n추천 태그 (JSON 배열):";
  return prompt;
}

/**
 * AI 응답에서 태그 배열 파싱
 */
function parseTagsFromResponse(text: string): string[] {
  // JSON 배열 추출 시도
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim())
      .filter((t) => t.length <= 50)
      .slice(0, 5);
  } catch {
    return [];
  }
}

/**
 * Gemini로 태그 생성
 */
async function tagWithGemini(
  content: string,
  existingTags: string[]
): Promise<AutoTaggingResult> {
  const startTime = Date.now();
  const { getGeminiClient } = await import("./providers/gemini");
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(content, existingTags)}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 200,
    },
  });

  const responseText = result.response.text().trim();
  const tags = parseTagsFromResponse(responseText);

  return {
    tags,
    provider: "google",
    modelId: "gemini-2.0-flash",
    duration: Date.now() - startTime,
  };
}

/**
 * OpenAI로 태그 생성
 */
async function tagWithOpenAI(
  content: string,
  existingTags: string[]
): Promise<AutoTaggingResult> {
  const startTime = Date.now();
  const { getOpenAIClient } = await import("./providers/openai");
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(content, existingTags) },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  const responseText = completion.choices[0]?.message?.content?.trim() || "[]";
  const tags = parseTagsFromResponse(responseText);

  return {
    tags,
    provider: "openai",
    modelId: "gpt-4o-mini",
    duration: Date.now() - startTime,
  };
}

/**
 * Anthropic으로 태그 생성
 */
async function tagWithAnthropic(
  content: string,
  existingTags: string[]
): Promise<AutoTaggingResult> {
  const startTime = Date.now();
  const { getAnthropicApiKey } = await import("./providers/anthropic");
  const apiKey = getAnthropicApiKey();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(content, existingTags) }],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  const data = await response.json();
  const textContent = data.content?.find((block: { type: string }) => block.type === "text");
  const responseText = textContent?.text?.trim() || "[]";
  const tags = parseTagsFromResponse(responseText);

  return {
    tags,
    provider: "anthropic",
    modelId: "claude-haiku-4-5",
    duration: Date.now() - startTime,
  };
}

/**
 * 노트 내용에서 AI 태그를 추천합니다.
 *
 * @param noteContent 노트 텍스트 내용 (quote + memo 합친 것)
 * @param existingUserTags 사용자의 기존 태그 목록 (일관성을 위해)
 * @returns 추천 태그 배열
 */
export async function generateAutoTags(
  noteContent: string,
  existingUserTags: string[] = []
): Promise<AutoTaggingResult> {
  // 내용이 너무 짧으면 스킵
  if (!noteContent || noteContent.trim().length < 10) {
    return { tags: [], duration: 0 };
  }

  // Gemini → OpenAI → Anthropic 폴백
  try {
    if (process.env.GEMINI_API_KEY) {
      return await tagWithGemini(noteContent, existingUserTags);
    }
  } catch (error) {
    console.warn("[AutoTagging] Gemini 실패:", error);
  }

  try {
    if (process.env.OPENAI_API_KEY) {
      return await tagWithOpenAI(noteContent, existingUserTags);
    }
  } catch (error) {
    console.warn("[AutoTagging] OpenAI 실패:", error);
  }

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      return await tagWithAnthropic(noteContent, existingUserTags);
    }
  } catch (error) {
    console.warn("[AutoTagging] Anthropic 실패:", error);
  }

  console.error("[AutoTagging] 모든 프로바이더 실패");
  return { tags: [], duration: 0 };
}
