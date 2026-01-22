/**
 * OpenAI Provider
 * OpenAI API 클라이언트 및 유틸리티
 */

import OpenAI from "openai";

// 타입 정의
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OpenAIStreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export interface OpenAIChatSettings {
  temperature: number;
  maxOutputTokens: number;
}

// 기본 모델 설정
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;

/**
 * OpenAI API 클라이언트 초기화
 * @returns OpenAI 인스턴스
 * @throws API 키가 설정되지 않은 경우 에러 발생
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  return new OpenAI({ apiKey });
}

/**
 * OpenAI API 호출 (스트리밍 응답)
 * app/api/chat/route.ts의 callOpenAI 함수에서 추출
 * @param modelId 모델 ID
 * @param systemPrompt 시스템 프롬프트
 * @param chatHistory 대화 기록
 * @param message 사용자 메시지
 * @param settings 생성 설정
 * @returns ReadableStream
 */
export async function callOpenAI(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: OpenAIChatSettings
): Promise<ReadableStream> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API 오류");
  }

  return response.body!;
}

/**
 * OpenAI 스트림 파서
 * app/api/chat/route.ts의 parseOpenAIStream 함수에서 추출
 * @param stream ReadableStream
 * @param onContent 콘텐츠 콜백
 * @param onDone 완료 콜백
 * @param onError 에러 콜백
 */
export async function parseOpenAIStream(
  stream: ReadableStream,
  onContent: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone();
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onContent(content);
            }
          } catch (e) {
            // 파싱 오류 무시
          }
        }
      }
    }
    onDone();
  } catch (error) {
    onError(error instanceof Error ? error.message : "스트림 오류");
  }
}

/**
 * OpenAI를 사용한 텍스트 생성 (비스트리밍)
 * @param prompt 프롬프트 텍스트
 * @param options 생성 옵션
 * @returns 생성된 텍스트
 */
export async function generateWithOpenAI(
  prompt: string,
  options?: OpenAIGenerateOptions
): Promise<string> {
  const openai = getOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: options?.model || DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

/**
 * OpenAI를 사용한 책 요약
 * 기존 summarizeBookDescription의 OpenAI (fallback) 부분 추출
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (25~35자 이내)
 */
export async function summarizeWithOpenAI(description: string): Promise<string> {
  if (!description || description.trim().length === 0) {
    return "";
  }

  // 이미 짧은 경우 그대로 반환
  if (description.length <= 35) {
    return description.trim();
  }

  const prompt = `다음 책소개를 다음 조건에 정확히 맞게 요약해주세요:

필수 조건:
1. 정확히 25자 이상 35자 이하의 한국어 문장으로 작성
2. 반드시 완전한 문장으로 끝나야 합니다. 문장이 중간에 끊기거나 미완성되면 안 됩니다
3. 문장 끝에 마침표(.)를 포함하여 의미가 완결되도록 작성
4. 평서문 형식으로 작성 (의문문, 감탄문 사용 금지)
5. 따옴표(" '), 백틱(\`), 별표(*), 줄바꿈, 이모지, 특수기호 사용 절대 금지
6. 요약 텍스트만 반환하고 다른 설명이나 주석은 포함하지 마세요

중요: 문장이 35자를 초과하면 안 되며, 반드시 완전한 의미를 가진 문장으로 끝나야 합니다.

책소개:
${description}`;

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
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
    temperature: DEFAULT_TEMPERATURE,
  });

  let summary = completion.choices[0]?.message?.content?.trim() || "";

  if (!summary) {
    throw new Error("OpenAI API 응답이 비어있습니다.");
  }

  // 후처리: 특수문자 제거
  summary = summary
    .replace(/["'`*]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return summary;
}

/**
 * OpenAI 스트리밍 채팅 (편의 함수)
 * @param modelId 모델 ID
 * @param systemPrompt 시스템 프롬프트
 * @param chatHistory 대화 기록
 * @param message 사용자 메시지
 * @param settings 생성 설정
 * @param callbacks 스트리밍 콜백
 */
export async function streamOpenAIChat(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: OpenAIChatSettings,
  callbacks: OpenAIStreamCallbacks
): Promise<void> {
  const stream = await callOpenAI(modelId, systemPrompt, chatHistory, message, settings);
  await parseOpenAIStream(stream, callbacks.onContent, callbacks.onDone, callbacks.onError);
}
