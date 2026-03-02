"use server";

/**
 * AI 설정 관리 서버 액션
 *
 * 관리자가 AI 챗봇 시스템의 전체 설정을 관리할 수 있습니다.
 * - 모델 제공자 및 모델 선택
 * - 시스템 프롬프트 커스터마이징
 * - 컨텍스트 및 메모리 설정
 * - 생성 파라미터 조정
 * - 연결 테스트
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "../auth";
import type {
  AISettings,
  AIProvider,
  AISettingsFormData,
  AIConnectionTestResult,
  ContextSettings,
  GenerationSettings,
  MemorySettings,
  DEFAULT_AI_SETTINGS,
} from "@/types/ai";
import { DEFAULT_AI_SETTINGS as DefaultSettings } from "@/types/ai";

// 관리자 권한 확인 헬퍼
async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

/**
 * 현재 활성화된 AI 설정 조회
 */
export async function getActiveAISettings(): Promise<AISettings | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    // 설정이 없는 경우 기본값 반환
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("AI 설정 조회 실패:", error);
    return null;
  }

  return transformDbRowToSettings(data);
}

/**
 * 모든 AI 설정 목록 조회 (관리자용)
 */
export async function getAllAISettings(): Promise<AISettings[]> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("AI 설정 목록 조회 실패:", error);
    return [];
  }

  return (data || []).map(transformDbRowToSettings);
}

/**
 * AI 설정 생성 (관리자용)
 */
export async function createAISettings(
  formData: AISettingsFormData
): Promise<AISettings> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  // 새 설정을 활성화할 경우 기존 활성 설정 비활성화
  const { error: deactivateError } = await supabase
    .from("ai_settings")
    .update({ is_active: false })
    .eq("is_active", true);

  if (deactivateError) {
    console.error("기존 설정 비활성화 실패:", deactivateError);
  }

  const { data, error } = await supabase
    .from("ai_settings")
    .insert({
      provider: formData.provider,
      model_id: formData.modelId,
      system_prompt_template: formData.systemPromptTemplate,
      welcome_message: formData.welcomeMessage,
      context_settings: formData.contextSettings,
      generation_settings: formData.generationSettings,
      memory_settings: formData.memorySettings,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("AI 설정 생성 실패:", error);
    throw new Error("AI 설정 생성에 실패했습니다.");
  }

  return transformDbRowToSettings(data);
}

/**
 * AI 설정 업데이트 (관리자용)
 */
export async function updateAISettings(
  id: string,
  formData: Partial<AISettingsFormData>
): Promise<AISettings> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (formData.provider !== undefined) {
    updateData.provider = formData.provider;
  }
  if (formData.modelId !== undefined) {
    updateData.model_id = formData.modelId;
  }
  if (formData.systemPromptTemplate !== undefined) {
    updateData.system_prompt_template = formData.systemPromptTemplate;
  }
  if (formData.welcomeMessage !== undefined) {
    updateData.welcome_message = formData.welcomeMessage;
  }
  if (formData.contextSettings !== undefined) {
    updateData.context_settings = formData.contextSettings;
  }
  if (formData.generationSettings !== undefined) {
    updateData.generation_settings = formData.generationSettings;
  }
  if (formData.memorySettings !== undefined) {
    updateData.memory_settings = formData.memorySettings;
  }

  const { data, error } = await supabase
    .from("ai_settings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("AI 설정 업데이트 실패:", error);
    throw new Error("AI 설정 업데이트에 실패했습니다.");
  }

  return transformDbRowToSettings(data);
}

/**
 * AI 설정 활성화/비활성화 (관리자용)
 */
export async function setAISettingsActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  // 활성화할 경우 기존 활성 설정 비활성화
  if (isActive) {
    const { error: deactivateError } = await supabase
      .from("ai_settings")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      console.error("기존 설정 비활성화 실패:", deactivateError);
    }
  }

  const { error } = await supabase
    .from("ai_settings")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("AI 설정 상태 변경 실패:", error);
    throw new Error("AI 설정 상태 변경에 실패했습니다.");
  }
}

/**
 * AI 설정 삭제 (관리자용)
 */
export async function deleteAISettings(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("ai_settings").delete().eq("id", id);

  if (error) {
    console.error("AI 설정 삭제 실패:", error);
    throw new Error("AI 설정 삭제에 실패했습니다.");
  }
}

/**
 * AI 연결 테스트 (관리자용)
 */
export async function testAIConnection(
  provider: AIProvider,
  modelId: string
): Promise<AIConnectionTestResult> {
  await requireAdmin();

  const startTime = Date.now();

  try {
    let testResponse: string;

    switch (provider) {
      case "openai":
        testResponse = await testOpenAIConnection(modelId);
        break;
      case "google":
        testResponse = await testGoogleConnection(modelId);
        break;
      case "anthropic":
        testResponse = await testAnthropicConnection(modelId);
        break;
      default:
        throw new Error(`지원하지 않는 제공자: ${provider}`);
    }

    return {
      success: true,
      provider,
      modelId,
      responseTime: Date.now() - startTime,
      testResponse,
    };
  } catch (error) {
    return {
      success: false,
      provider,
      modelId,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * OpenAI 연결 테스트
 */
async function testOpenAIConnection(modelId: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 10,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API 오류");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "응답 없음";
}

/**
 * Google AI 연결 테스트
 */
async function testGoogleConnection(modelId: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });

  const result = await model.generateContent("Hi");
  return result.response.text() || "응답 없음";
}

/**
 * Anthropic 연결 테스트
 */
async function testAnthropicConnection(modelId: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API 오류");
  }

  const data = await response.json();
  return data.content[0]?.text || "응답 없음";
}

/**
 * API 키 설정 상태 확인 (관리자용)
 */
export async function getAPIKeyStatus(): Promise<{
  openai: boolean;
  google: boolean;
  anthropic: boolean;
}> {
  await requireAdmin();

  return {
    openai: !!process.env.OPENAI_API_KEY,
    google: !!process.env.GEMINI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  };
}

/**
 * 기본 AI 설정 초기화 (관리자용)
 */
export async function initializeDefaultAISettings(): Promise<AISettings> {
  await requireAdmin();

  const existing = await getActiveAISettings();
  if (existing) {
    return existing;
  }

  return createAISettings({
    provider: DefaultSettings.provider,
    modelId: DefaultSettings.modelId,
    systemPromptTemplate: DefaultSettings.systemPromptTemplate,
    welcomeMessage: DefaultSettings.welcomeMessage,
    contextSettings: DefaultSettings.contextSettings,
    generationSettings: DefaultSettings.generationSettings,
    memorySettings: DefaultSettings.memorySettings,
  });
}

/**
 * DB Row를 AISettings 타입으로 변환
 */
function transformDbRowToSettings(row: any): AISettings {
  return {
    id: row.id,
    provider: row.provider,
    modelId: row.model_id,
    systemPromptTemplate: row.system_prompt_template,
    welcomeMessage: row.welcome_message,
    contextSettings: row.context_settings as ContextSettings,
    generationSettings: row.generation_settings as GenerationSettings,
    memorySettings: row.memory_settings as MemorySettings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Chat API에서 사용할 설정 조회 (캐시 가능)
 */
export async function getAISettingsForChat(): Promise<{
  provider: AIProvider;
  modelId: string;
  systemPromptTemplate: string;
  contextSettings: ContextSettings;
  generationSettings: GenerationSettings;
  memorySettings: MemorySettings;
}> {
  const settings = await getActiveAISettings();

  if (!settings) {
    // 기본 설정 사용
    return {
      provider: DefaultSettings.provider,
      modelId: DefaultSettings.modelId,
      systemPromptTemplate: DefaultSettings.systemPromptTemplate,
      contextSettings: DefaultSettings.contextSettings,
      generationSettings: DefaultSettings.generationSettings,
      memorySettings: DefaultSettings.memorySettings,
    };
  }

  return {
    provider: settings.provider,
    modelId: settings.modelId,
    systemPromptTemplate: settings.systemPromptTemplate,
    contextSettings: settings.contextSettings,
    generationSettings: settings.generationSettings,
    memorySettings: settings.memorySettings,
  };
}
