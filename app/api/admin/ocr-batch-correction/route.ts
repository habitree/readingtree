/**
 * OCR 일괄 보정 API
 * 기존 transcription 데이터에 GPT 보정을 일괄 적용합니다.
 *
 * GET: 보정 대상 통계 조회
 * POST: 일괄 보정 실행
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { correctOcrText } from "@/lib/ai/ocr-correction";
import { recordOcrCorrectionLog } from "@/app/actions/ai/ocr-settings";

/**
 * 관리자 권한 확인
 */
async function checkAdminPermission() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "로그인이 필요합니다." };
  }

  const { data: userProfile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();

  if (!userProfile || !userProfile.is_admin) {
    return { supabase, user: null, error: "관리자 권한이 필요합니다." };
  }

  return { supabase, user, error: null };
}

/**
 * GET: 보정 대상 통계 조회
 */
export async function GET() {
  const { supabase, user, error: authError } = await checkAdminPermission();

  if (authError || !user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    // raw_extracted_text가 NULL인 데이터 (보정 전 데이터)
    const { data: pendingData, error: pendingError } = await supabase
      .from("transcriptions")
      .select("id, note_id, extracted_text, raw_extracted_text, status")
      .is("raw_extracted_text", null)
      .eq("status", "completed");

    if (pendingError) {
      console.error("[OCR Batch] 데이터 조회 실패:", pendingError);
      return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
    }

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

    return NextResponse.json({
      stats: {
        total: totalCount || 0,
        corrected: correctedCount || 0,
        pending: pending.length,
      },
      pendingItems: pending.map((item) => ({
        id: item.id,
        noteId: item.note_id,
        textLength: item.extracted_text?.length || 0,
      })),
    });
  } catch (error) {
    console.error("[OCR Batch] 통계 조회 오류:", error);
    return NextResponse.json({ error: "통계 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/**
 * POST: 일괄 보정 실행
 * Body: { batchSize?: number, dryRun?: boolean }
 */
export async function POST(request: Request) {
  const { supabase, user, error: authError } = await checkAdminPermission();

  if (authError || !user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 10, 50); // 최대 50개씩
    const dryRun = body.dryRun || false;

    // 보정 대상 조회
    const { data: targets, error: fetchError } = await supabase
      .from("transcriptions")
      .select("id, note_id, extracted_text")
      .is("raw_extracted_text", null)
      .eq("status", "completed")
      .limit(batchSize);

    if (fetchError) {
      console.error("[OCR Batch] 대상 조회 실패:", fetchError);
      return NextResponse.json({ error: "대상 조회 실패" }, { status: 500 });
    }

    if (!targets || targets.length === 0) {
      return NextResponse.json({
        message: "보정할 데이터가 없습니다.",
        processed: 0,
        success: 0,
        failed: 0,
      });
    }

    const results: {
      id: string;
      noteId: string;
      success: boolean;
      wasModified?: boolean;
      error?: string;
    }[] = [];

    for (const target of targets) {
      try {
        const originalText = target.extracted_text;

        if (!originalText || originalText.trim().length < 5) {
          // 텍스트가 너무 짧으면 원본 그대로 저장
          if (!dryRun) {
            await supabase
              .from("transcriptions")
              .update({
                raw_extracted_text: originalText,
              })
              .eq("id", target.id);
          }

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

        if (!dryRun) {
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

    return NextResponse.json({
      message: dryRun ? "Dry run 완료 (실제 변경 없음)" : "일괄 보정 완료",
      processed: results.length,
      success: successCount,
      failed: failedCount,
      modified: modifiedCount,
      results,
    });
  } catch (error) {
    console.error("[OCR Batch] 일괄 보정 오류:", error);
    return NextResponse.json({ error: "일괄 보정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
