/**
 * Gemini AI Provider
 * Google Gemini API 클라이언트 및 유틸리티
 */

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";

// 타입 정의
export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
}

export interface GeminiChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiStreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

// 기본 모델 설정
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

/**
 * Gemini API 클라이언트 초기화
 * @returns GoogleGenerativeAI 인스턴스
 * @throws API 키가 설정되지 않은 경우 에러 발생
 */
export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Gemini 모델 인스턴스 가져오기
 * @param modelId 모델 ID (기본값: gemini-2.0-flash)
 * @returns GenerativeModel 인스턴스
 */
export function getGeminiModel(modelId: string = DEFAULT_MODEL): GenerativeModel {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({ model: modelId });
}

/**
 * Gemini를 사용한 텍스트 생성
 * @param prompt 프롬프트 텍스트
 * @param options 생성 옵션
 * @returns 생성된 텍스트
 */
export async function generateWithGemini(
  prompt: string,
  options?: GeminiGenerateOptions
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: options?.model || DEFAULT_MODEL
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      topP: options?.topP,
    },
  });

  return result.response.text().trim();
}

/**
 * Gemini를 사용한 책 요약
 * 기존 summarizeBookDescription의 Gemini 부분만 추출
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (25~35자 이내)
 */
export async function summarizeWithGemini(description: string): Promise<string> {
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

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  const result = await model.generateContent(prompt);
  let summary = result.response.text().trim();

  // 후처리: 특수문자 제거
  summary = summary
    .replace(/["'`*]/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return summary;
}

/**
 * Gemini 채팅 세션 생성
 * @param options 생성 옵션
 * @param systemPrompt 시스템 프롬프트
 * @param history 대화 기록
 * @returns ChatSession 인스턴스
 */
export function createGeminiChatSession(
  options: GeminiGenerateOptions,
  systemPrompt?: string,
  history?: GeminiChatMessage[]
): ChatSession {
  const model = getGeminiModel(options.model);

  return model.startChat({
    history: history || [],
    systemInstruction: systemPrompt ? {
      role: "user",
      parts: [{ text: systemPrompt }],
    } : undefined,
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      topP: options.topP,
    },
  });
}

/**
 * Gemini 스트리밍 메시지 전송 (채팅 API에서 사용)
 * @param chat ChatSession 인스턴스
 * @param message 사용자 메시지
 * @param callbacks 스트리밍 콜백
 */
export async function streamGeminiMessage(
  chat: ChatSession,
  message: string,
  callbacks: GeminiStreamCallbacks
): Promise<void> {
  try {
    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        callbacks.onContent(chunkText);
      }
    }

    callbacks.onDone();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : "Gemini 스트리밍 오류");
  }
}
