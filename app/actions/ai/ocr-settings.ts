"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import type { AIProvider } from "@/types/ai/settings";
import type {
  OcrCorrectionSettings,
  OcrCorrectionSettingsFormData,
  OcrCorrectionStats,
  OcrCorrectionTestResult,
  OcrCorrectionGenerationSettings,
} from "@/types/ai/ocr-settings";
import { DEFAULT_OCR_CORRECTION_SETTINGS, calculateCost } from "@/types/ai/ocr-settings";

// 설정 캐시 (메모리 내 1분 캐시)
let settingsCache: OcrCorrectionSettings | null = null;
let settingsCacheTime: number = 0;
const CACHE_TTL_MS = 60 * 1000; // 1분

/**
 * 관리자 권한 확인
 */
async function checkAdminPermission(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userProfile || !userProfile.is_admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  return user;
}

/**
 * 활성 OCR 보정 설정 조회
 * 캐시된 설정을 반환하거나 DB에서 조회
 */
export async function getActiveOcrCorrectionSettings(): Promise<OcrCorrectionSettings> {
  // 캐시 확인
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < CACHE_TTL_MS) {
    return settingsCache;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ocr_correction_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // 설정이 없으면 기본값 반환
    console.log("[OCR Settings] 활성 설정 없음, 기본값 사용");
    return {
      id: "default",
      ...DEFAULT_OCR_CORRECTION_SETTINGS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // DB 데이터를 타입에 맞게 변환
  const settings: OcrCorrectionSettings = {
    id: data.id,
    provider: data.provider as AIProvider,
    modelId: data.model_id,
    generationSettings: data.generation_settings as OcrCorrectionGenerationSettings,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  // 캐시 업데이트
  settingsCache = settings;
  settingsCacheTime = now;

  return settings;
}

/**
 * OCR 보정 설정 생성 (관리자 전용)
 */
export async function createOcrCorrectionSettings(
  formData: OcrCorrectionSettingsFormData
): Promise<OcrCorrectionSettings> {
  const supabase = await createServerSupabaseClient();
  await checkAdminPermission(supabase);

  // 기존 활성 설정 비활성화
  await supabase
    .from("ocr_correction_settings")
    .update({ is_active: false })
    .eq("is_active", true);

  // 새 설정 생성
  const { data, error } = await supabase
    .from("ocr_correction_settings")
    .insert({
      provider: formData.provider,
      model_id: formData.modelId,
      generation_settings: formData.generationSettings,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[OCR Settings] 설정 생성 실패:", error);
    throw new Error("OCR 보정 설정 생성에 실패했습니다.");
  }

  // 캐시 초기화
  settingsCache = null;

  return {
    id: data.id,
    provider: data.provider as AIProvider,
    modelId: data.model_id,
    generationSettings: data.generation_settings as OcrCorrectionGenerationSettings,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * OCR 보정 설정 수정 (관리자 전용)
 */
export async function updateOcrCorrectionSettings(
  id: string,
  formData: Partial<OcrCorrectionSettingsFormData>
): Promise<OcrCorrectionSettings> {
  const supabase = await createServerSupabaseClient();
  await checkAdminPermission(supabase);

  const updateData: Record<string, unknown> = {};
  if (formData.provider !== undefined) updateData.provider = formData.provider;
  if (formData.modelId !== undefined) updateData.model_id = formData.modelId;
  if (formData.generationSettings !== undefined) updateData.generation_settings = formData.generationSettings;

  const { data, error } = await supabase
    .from("ocr_correction_settings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[OCR Settings] 설정 수정 실패:", error);
    throw new Error("OCR 보정 설정 수정에 실패했습니다.");
  }

  // 캐시 초기화
  settingsCache = null;

  return {
    id: data.id,
    provider: data.provider as AIProvider,
    modelId: data.model_id,
    generationSettings: data.generation_settings as OcrCorrectionGenerationSettings,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * OCR 보정 통계 조회 (관리자 전용)
 */
export async function getOcrCorrectionStats(): Promise<OcrCorrectionStats> {
  const supabase = await createServerSupabaseClient();
  await checkAdminPermission(supabase);

  // 전체 보정 통계 조회
  const { data: allLogs, error: logsError } = await supabase
    .from("ocr_logs")
    .select("status, input_tokens, output_tokens, estimated_cost_usd, created_at");

  if (logsError) {
    console.error("[OCR Stats] 통계 조회 실패:", logsError);
    throw new Error("OCR 보정 통계를 조회할 수 없습니다.");
  }

  const logs = allLogs || [];

  // 이번 달 시작일
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 통계 계산
  const totalCorrections = logs.length;
  const successfulCorrections = logs.filter((l) => l.status === "success").length;
  const failedCorrections = logs.filter((l) => l.status === "failed").length;
  const successRate = totalCorrections > 0 ? Math.round((successfulCorrections / totalCorrections) * 100) : 0;

  // 이번 달 통계
  const thisMonthLogs = logs.filter((l) => l.created_at >= thisMonthStart);
  const thisMonthCorrections = thisMonthLogs.length;
  const thisMonthCostUsd = thisMonthLogs.reduce((sum, l) => sum + (Number(l.estimated_cost_usd) || 0), 0);

  // 평균 토큰
  const logsWithTokens = logs.filter((l) => l.input_tokens != null && l.output_tokens != null);
  const avgInputTokens =
    logsWithTokens.length > 0
      ? Math.round(logsWithTokens.reduce((sum, l) => sum + (l.input_tokens || 0), 0) / logsWithTokens.length)
      : 500;
  const avgOutputTokens =
    logsWithTokens.length > 0
      ? Math.round(logsWithTokens.reduce((sum, l) => sum + (l.output_tokens || 0), 0) / logsWithTokens.length)
      : 300;

  return {
    totalCorrections,
    successfulCorrections,
    failedCorrections,
    successRate,
    thisMonthCorrections,
    thisMonthCostUsd,
    avgInputTokens,
    avgOutputTokens,
  };
}

/**
 * OCR 보정 연결 테스트 (관리자 전용)
 */
export async function testOcrCorrectionConnection(
  provider: AIProvider,
  modelId: string
): Promise<OcrCorrectionTestResult> {
  const supabase = await createServerSupabaseClient();
  await checkAdminPermission(supabase);

  const testText = "테스트 문장입니다. 이 문장은 OCR 보정 연결 테스트용입니다.";
  const startTime = Date.now();

  try {
    let testOutput = "";

    switch (provider) {
      case "openai": {
        const { getOpenAIClient } = await import("@/lib/ai/providers/openai");
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: modelId,
          messages: [
            { role: "system", content: "테스트 문장을 그대로 반환하세요." },
            { role: "user", content: testText },
          ],
          max_tokens: 100,
          temperature: 0.3,
        });
        testOutput = completion.choices[0]?.message?.content || "";
        break;
      }
      case "google": {
        const { generateWithGemini } = await import("@/lib/ai/providers/gemini");
        testOutput = await generateWithGemini(
          `테스트 문장을 그대로 반환하세요: ${testText}`,
          { model: modelId, temperature: 0.3, maxOutputTokens: 100 }
        );
        break;
      }
      case "anthropic": {
        const { generateWithAnthropic } = await import("@/lib/ai/providers/anthropic");
        testOutput = await generateWithAnthropic(
          `테스트 문장을 그대로 반환하세요: ${testText}`,
          { model: modelId, temperature: 0.3, maxTokens: 100 }
        );
        break;
      }
    }

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      provider,
      modelId,
      responseTime,
      testOutput: testOutput.substring(0, 100),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("[OCR Test] 연결 테스트 실패:", error);

    return {
      success: false,
      provider,
      modelId,
      responseTime,
      error: error instanceof Error ? error.message : "연결 테스트 실패",
    };
  }
}

/**
 * OCR 보정 로그 기록 (내부 사용)
 * ocr-correction.ts에서 호출
 */
export async function recordOcrCorrectionLog(params: {
  userId: string;
  noteId?: string;
  provider: AIProvider;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  status: "success" | "failed";
  errorMessage?: string;
  durationMs?: number;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // 비용 계산
  let estimatedCostUsd: number | null = null;
  if (params.inputTokens && params.outputTokens) {
    estimatedCostUsd = calculateCost(params.provider, params.modelId, {
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
    });
  }

  try {
    const { error } = await supabase.from("ocr_logs").insert({
      user_id: params.userId,
      note_id: params.noteId || null,
      provider: params.provider,
      model_id: params.modelId,
      input_tokens: params.inputTokens || null,
      output_tokens: params.outputTokens || null,
      estimated_cost_usd: estimatedCostUsd,
      status: params.status,
      error_message: params.errorMessage || null,
      processing_duration_ms: params.durationMs || null,
    });

    if (error) {
      console.error("[OCR Log] 로그 기록 실패:", error);
    }
  } catch (error) {
    console.error("[OCR Log] 로그 기록 오류:", error);
  }
}

/**
 * 설정 캐시 초기화 (설정 변경 시 호출)
 */
export async function invalidateSettingsCache(): Promise<void> {
  settingsCache = null;
  settingsCacheTime = 0;
}

/**
 * OCR 일괄 보정 대상 통계 조회 (관리자 전용)
 */
export async function getOcrBatchCorrectionStats(): Promise<{
  total: number;
  corrected: number;
  pending: number;
  pendingItems: Array<{ id: string; noteId: string; textLength: number }>;
}> {
  const supabase = await createServerSupabaseClient();
  await checkAdminPermission(supabase);

  // raw_extracted_text가 NULL인 데이터 (보정 전 데이터)
  const { data: pendingData } = await supabase
    .from("transcriptions")
    .select("id, note_id, extracted_text")
    .is("raw_extracted_text", null)
    .eq("status", "completed");

  // 전체 데이터 수
  const { count: totalCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  // 이미 보정된 데이터 수
  const { count: correctedCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true })
    .not("raw_extracted_text", "is", null);

  const pending = pendingData || [];

  return {
    total: totalCount || 0,
    corrected: correctedCount || 0,
    pending: pending.length,
    pendingItems: pending.map((item) => ({
      id: item.id,
      noteId: item.note_id,
      textLength: item.extracted_text?.length || 0,
    })),
  };
}

/**
 * OCR 일괄 보정 실행 (관리자 전용)
 */
export async function runOcrBatchCorrection(
  batchSize: number = 10
): Promise<{
  processed: number;
  success: number;
  failed: number;
  modified: number;
  results: Array<{
    id: string;
    noteId: string;
    success: boolean;
    wasModified?: boolean;
    error?: string;
  }>;
}> {
  const supabase = await createServerSupabaseClient();
  const user = await checkAdminPermission(supabase);

  // 동적 import로 순환 참조 방지
  const { correctOcrText } = await import("@/lib/ai/ocr-correction");

  // 보정 대상 조회 (최대 50개)
  const safeBatchSize = Math.min(batchSize, 50);
  const { data: targets, error: fetchError } = await supabase
    .from("transcriptions")
    .select("id, note_id, extracted_text")
    .is("raw_extracted_text", null)
    .eq("status", "completed")
    .limit(safeBatchSize);

  if (fetchError) {
    console.error("[OCR Batch] 대상 조회 실패:", fetchError);
    throw new Error("대상 조회 실패");
  }

  if (!targets || targets.length === 0) {
    return {
      processed: 0,
      success: 0,
      failed: 0,
      modified: 0,
      results: [],
    };
  }

  const results: Array<{
    id: string;
    noteId: string;
    success: boolean;
    wasModified?: boolean;
    error?: string;
  }> = [];

  for (const target of targets) {
    try {
      const originalText = target.extracted_text;

      if (!originalText || originalText.trim().length < 5) {
        // 텍스트가 너무 짧으면 원본 그대로 저장
        await supabase
          .from("transcriptions")
          .update({ raw_extracted_text: originalText })
          .eq("id", target.id);

        results.push({
          id: target.id,
          noteId: target.note_id,
          success: true,
          wasModified: false,
        });
        continue;
      }

      // GPT 보정 실행
      const correctionResult = await correctOcrText(originalText);

      // DB 업데이트
      const { error: updateError } = await supabase
        .from("transcriptions")
        .update({
          raw_extracted_text: originalText, // 원본 백업
          extracted_text: correctionResult.correctedText, // 보정된 텍스트
        })
        .eq("id", target.id);

      if (updateError) {
        throw new Error(`DB 업데이트 실패: ${updateError.message}`);
      }

      // 로그 기록
      if (correctionResult.provider && correctionResult.modelId) {
        await recordOcrCorrectionLog({
          userId: user.id,
          noteId: target.note_id,
          provider: correctionResult.provider,
          modelId: correctionResult.modelId,
          inputTokens: correctionResult.inputTokens,
          outputTokens: correctionResult.outputTokens,
          status: "success",
          durationMs: correctionResult.duration,
        });
      }

      results.push({
        id: target.id,
        noteId: target.note_id,
        success: true,
        wasModified: correctionResult.wasModified,
      });

      // API Rate limit 방지를 위한 지연
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[OCR Batch] ID ${target.id} 보정 실패:`, error);

      results.push({
        id: target.id,
        noteId: target.note_id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const modifiedCount = results.filter((r) => r.wasModified).length;

  return {
    processed: results.length,
    success: successCount,
    failed: failedCount,
    modified: modifiedCount,
    results,
  };
}
