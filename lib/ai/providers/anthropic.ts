/**
 * Anthropic Provider
 * Anthropic API 클라이언트 및 유틸리티
 * SDK 대신 fetch API를 직접 사용
 */

// 타입 정의
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AnthropicStreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export interface AnthropicChatSettings {
  temperature: number;
  maxOutputTokens: number;
}

// Anthropic API 응답 타입
interface AnthropicContentBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// 기본 모델 설정
const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Anthropic API 키 가져오기
 * @returns API 키
 * @throws API 키가 설정되지 않은 경우 에러 발생
 */
export function getAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  return apiKey;
}

/**
 * Anthropic API 호출 (스트리밍 응답)
 * app/api/chat/route.ts의 callAnthropic 함수에서 추출
 * @param modelId 모델 ID
 * @param systemPrompt 시스템 프롬프트
 * @param chatHistory 대화 기록
 * @param message 사용자 메시지
 * @param settings 생성 설정
 * @returns ReadableStream
 */
export async function callAnthropic(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: AnthropicChatSettings
): Promise<ReadableStream> {
  const apiKey = getAnthropicApiKey();

  const messages = [
    ...chatHistory.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt,
      messages,
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  return response.body!;
}

/**
 * Anthropic 스트림 파서
 * app/api/chat/route.ts의 parseAnthropicStream 함수에서 추출
 * @param stream ReadableStream
 * @param onContent 콘텐츠 콜백
 * @param onDone 완료 콜백
 * @param onError 에러 콜백
 */
export async function parseAnthropicStream(
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

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta") {
              const text = parsed.delta?.text;
              if (text) {
                onContent(text);
              }
            } else if (parsed.type === "message_stop") {
              onDone();
            }
          } catch {
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
 * Anthropic를 사용한 텍스트 생성 (비스트리밍)
 * fetch API를 사용하여 직접 호출
 * @param prompt 프롬프트 텍스트
 * @param options 생성 옵션
 * @returns 생성된 텍스트
 */
export async function generateWithAnthropic(
  prompt: string,
  options?: AnthropicGenerateOptions
): Promise<string> {
  const apiKey = getAnthropicApiKey();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  const data: AnthropicResponse = await response.json();

  // Anthropic 응답에서 텍스트 추출
  const textContent = data.content.find((block) => block.type === "text");
  return textContent ? textContent.text.trim() : "";
}

/**
 * Anthropic를 사용한 책 요약
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (25~35자 이내)
 */
export async function summarizeWithAnthropic(description: string): Promise<string> {
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

  let summary = await generateWithAnthropic(prompt, {
    model: DEFAULT_MODEL,
    maxTokens: 100,
    temperature: DEFAULT_TEMPERATURE,
  });

  // 후처리: 특수문자 제거
  summary = summary
    .replace(/["'`*]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return summary;
}

/**
 * Anthropic 스트리밍 채팅 (편의 함수)
 * @param modelId 모델 ID
 * @param systemPrompt 시스템 프롬프트
 * @param chatHistory 대화 기록
 * @param message 사용자 메시지
 * @param settings 생성 설정
 * @param callbacks 스트리밍 콜백
 */
export async function streamAnthropicChat(
  modelId: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  message: string,
  settings: AnthropicChatSettings,
  callbacks: AnthropicStreamCallbacks
): Promise<void> {
  const stream = await callAnthropic(modelId, systemPrompt, chatHistory, message, settings);
  await parseAnthropicStream(stream, callbacks.onContent, callbacks.onDone, callbacks.onError);
}
