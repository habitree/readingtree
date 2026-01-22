/**
 * AI 스트림 파서 유틸리티
 * OpenAI, Anthropic, Gemini 등 다양한 Provider의 스트리밍 응답을 파싱하는 공통 유틸리티
 */

// 스트림 콜백 인터페이스
export interface StreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

// SSE 이벤트 타입
export interface SSEEvent {
  event?: string;
  data: string;
}

/**
 * SSE 라인 파서
 * Server-Sent Events 형식의 스트림에서 data 라인을 추출
 * @param line SSE 라인
 * @returns data 값 또는 null
 */
export function parseSSELine(line: string): string | null {
  if (line.startsWith("data: ")) {
    return line.slice(6);
  }
  return null;
}

/**
 * ReadableStream을 SSE 이벤트로 파싱하는 유틸리티
 * @param stream ReadableStream
 * @param onEvent 이벤트 콜백
 * @param onError 에러 콜백
 */
export async function parseSSEStream(
  stream: ReadableStream,
  onEvent: (data: string) => void,
  onError?: (error: string) => void
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
        const data = parseSSELine(line);
        if (data !== null) {
          onEvent(data);
        }
      }
    }

    // 남은 버퍼 처리
    if (buffer.trim()) {
      const data = parseSSELine(buffer);
      if (data !== null) {
        onEvent(data);
      }
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error.message : "스트림 파싱 오류");
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * OpenAI 스트림 응답에서 콘텐츠 추출
 * @param data JSON 문자열
 * @returns 콘텐츠 텍스트 또는 null
 */
export function extractOpenAIContent(data: string): string | null {
  if (data === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

/**
 * Anthropic 스트림 응답에서 콘텐츠 추출
 * @param data JSON 문자열
 * @returns { content: 텍스트, isDone: 완료 여부 }
 */
export function extractAnthropicContent(data: string): { content: string | null; isDone: boolean } {
  try {
    const parsed = JSON.parse(data);

    if (parsed.type === "content_block_delta") {
      return { content: parsed.delta?.text || null, isDone: false };
    }

    if (parsed.type === "message_stop") {
      return { content: null, isDone: true };
    }

    return { content: null, isDone: false };
  } catch {
    return { content: null, isDone: false };
  }
}

/**
 * Gemini 스트림 응답에서 콘텐츠 추출
 * @param data JSON 문자열
 * @returns 콘텐츠 텍스트 또는 null
 */
export function extractGeminiContent(data: string): string | null {
  try {
    const parsed = JSON.parse(data);
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

/**
 * 범용 스트림 파서
 * Provider 타입에 따라 적절한 파서를 선택하여 스트림을 파싱
 * @param stream ReadableStream
 * @param provider Provider 타입 ("openai" | "anthropic" | "gemini")
 * @param callbacks 스트림 콜백
 */
export async function parseProviderStream(
  stream: ReadableStream,
  provider: "openai" | "anthropic" | "gemini",
  callbacks: StreamCallbacks
): Promise<void> {
  await parseSSEStream(
    stream,
    (data) => {
      let content: string | null = null;
      let isDone = false;

      switch (provider) {
        case "openai":
          if (data === "[DONE]") {
            isDone = true;
          } else {
            content = extractOpenAIContent(data);
          }
          break;

        case "anthropic": {
          const result = extractAnthropicContent(data);
          content = result.content;
          isDone = result.isDone;
          break;
        }

        case "gemini":
          content = extractGeminiContent(data);
          break;
      }

      if (content) {
        callbacks.onContent(content);
      }

      if (isDone) {
        callbacks.onDone();
      }
    },
    callbacks.onError
  );

  // 스트림이 끝나면 완료 콜백 호출
  callbacks.onDone();
}

/**
 * 텍스트를 SSE 형식으로 인코딩
 * @param text 인코딩할 텍스트
 * @returns SSE 형식 문자열
 */
export function encodeSSE(text: string): string {
  return `data: ${JSON.stringify({ content: text })}\n\n`;
}

/**
 * SSE 완료 이벤트 생성
 * @returns SSE 완료 문자열
 */
export function encodeSSEDone(): string {
  return `data: [DONE]\n\n`;
}

/**
 * SSE 에러 이벤트 생성
 * @param error 에러 메시지
 * @returns SSE 에러 문자열
 */
export function encodeSSEError(error: string): string {
  return `data: ${JSON.stringify({ error })}\n\n`;
}
