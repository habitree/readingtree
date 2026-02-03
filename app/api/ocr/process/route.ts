import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromImage } from "@/lib/api/ocr";
import { createOrUpdateTranscription, updateTranscriptionStatus, verifyNoteOwnership } from "@/app/actions/notes";
import { recordOcrSuccess, recordOcrFailure } from "@/app/actions/ocr";
import { correctOcrText, isOcrCorrectionAvailable } from "@/lib/ai/ocr-correction";
import type { User } from "@supabase/supabase-js";

/**
 * OCR 실제 처리 API
 * Queue에서 호출되어 실제 OCR 처리를 수행합니다.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let noteId: string | undefined;
  let imageUrl: string | undefined;
  let user: User | null = null;

  try {
    // 인증 확인 (내부 API 호출이지만 RLS 정책을 통과하기 위해 필요)
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    
    user = authUser;

    console.log("[OCR Process] 인증 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("[OCR Process] 인증 실패:", {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    noteId = body.noteId;
    imageUrl = body.imageUrl;

    console.log("[OCR Process] 처리 시작:", { noteId, imageUrl: imageUrl?.substring(0, 100) + "..." });

    // 파라미터 검증
    if (!noteId || !imageUrl) {
      const errorMsg = "noteId와 imageUrl이 필요합니다.";
      console.error("[OCR Process]", errorMsg, { noteId, hasImageUrl: !!imageUrl });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 기록 소유 확인 (RLS 정책 통과를 위해 필요)
    console.log("[OCR Process] 기록 소유 확인 시작:", { noteId, userId: user.id });
    const hasOwnership = await verifyNoteOwnership(noteId, user.id);
    console.log("[OCR Process] 기록 소유 확인 결과:", { hasOwnership });

    if (!hasOwnership) {
      return NextResponse.json(
        { error: "권한이 없습니다. 해당 기록에 대한 OCR 처리를 요청할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // OCR 처리 (Google Cloud Run OCR)
    console.log("[OCR Process] OCR API 호출 시작");
    const rawExtractedText = await extractTextFromImage(imageUrl);
    console.log("[OCR Process] OCR API 호출 완료, 추출된 텍스트 길이:", rawExtractedText.length);

    // GPT를 사용한 텍스트 보정 (API 키가 있는 경우에만)
    let finalText = rawExtractedText;
    if ((await isOcrCorrectionAvailable()) && rawExtractedText.length > 0) {
      console.log("[OCR Process] GPT 텍스트 보정 시작");
      try {
        const correctionResult = await correctOcrText(rawExtractedText);
        finalText = correctionResult.correctedText;
        console.log("[OCR Process] GPT 텍스트 보정 완료:", {
          wasModified: correctionResult.wasModified,
          correctionDuration: `${correctionResult.duration}ms`,
          originalLength: rawExtractedText.length,
          correctedLength: finalText.length,
        });
      } catch (correctionError) {
        console.warn("[OCR Process] GPT 보정 실패, 원본 텍스트 사용:", correctionError);
        // 보정 실패 시 원본 텍스트 사용 (서비스 중단 방지)
        finalText = rawExtractedText;
      }
    } else {
      console.log("[OCR Process] GPT 보정 건너뜀 (API 키 미설정 또는 빈 텍스트)");
    }

    // Transcriptions 테이블에 저장 (보정된 텍스트 + 원본 텍스트)
    await createOrUpdateTranscription(noteId, finalText, rawExtractedText);
    console.log("[OCR Process] Transcription 저장 완료");

    // 상태 업데이트 확인 (completed로 변경되었는지 확인)
    const { data: transcription } = await supabase
      .from("transcriptions")
      .select("id, status, extracted_text")
      .eq("note_id", noteId)
      .maybeSingle();

    if (transcription) {
      console.log("[OCR Process] Transcription 상태 확인:", {
        transcriptionId: transcription.id,
        status: transcription.status,
        extractedTextLength: transcription.extracted_text?.length || 0,
      });

      // 상태가 completed가 아니면 강제로 업데이트
      if (transcription.status !== "completed") {
        console.warn("[OCR Process] 상태가 completed가 아닙니다. 강제 업데이트 시도:", transcription.status);
        await updateTranscriptionStatus(noteId, "completed");
        console.log("[OCR Process] 상태를 'completed'로 강제 업데이트 완료");
      }
    } else {
      console.warn("[OCR Process] Transcription을 찾을 수 없습니다. noteId:", noteId);
    }

    const duration = Date.now() - startTime;
    console.log(`[OCR Process] 처리 완료: noteId=${noteId}, 소요시간=${duration}ms`);

    // OCR 성공 통계 기록
    try {
      await recordOcrSuccess(user.id, noteId, duration);
      console.log(`[OCR Process] 성공 통계 기록 완료: userId=${user.id}`);
    } catch (statsError) {
      console.error("[OCR Process] 통계 기록 실패 (계속 진행):", statsError);
      // 통계 기록 실패해도 OCR 처리는 성공으로 간주
    }

    return NextResponse.json({
      success: true,
      extractedText: finalText,
      textLength: finalText.length,
      duration,
      corrected: finalText !== rawExtractedText,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    
    // Google Vision API 설정 확인 (서비스 계정 파일 경로만)
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasServiceAccount = !!credentialsPath;
    
    console.error("=".repeat(80));
    console.error("[OCR Process] ========== OCR 처리 오류 발생 ==========");
    console.error("[OCR Process] 에러 메시지:", errorMessage);
    console.error("[OCR Process] Note ID:", noteId);
    console.error("[OCR Process] Image URL:", imageUrl?.substring(0, 100) + "...");
    console.error("[OCR Process] 처리 시간:", `${duration}ms`);
    console.error("[OCR Process] Google Vision API 설정:", {
      authMethod: "service_account_file",
      hasServiceAccount,
      credentialsPath: credentialsPath || "미설정",
      status: hasServiceAccount ? "설정됨" : "미설정",
    });
    if (error instanceof Error) {
      console.error("[OCR Process] 스택 트레이스:", error.stack);
      console.error("[OCR Process] 에러 이름:", error.name);
      if (error.cause) {
        console.error("[OCR Process] 에러 원인:", error.cause);
      }
    }
    console.error("=".repeat(80));

    // 실패 시 transcription 상태를 "failed"로 업데이트
    if (noteId) {
      try {
        await updateTranscriptionStatus(noteId, "failed");
        console.log(`[OCR Process] Transcription 상태를 'failed'로 업데이트: noteId=${noteId}`);
      } catch (statusError) {
        console.error("[OCR Process] Transcription 상태 업데이트 실패:", statusError);
      }
    }

    // OCR 실패 통계 기록
    if (user) {
      try {
        await recordOcrFailure(user.id, noteId, errorMessage, duration);
        console.log(`[OCR Process] 실패 통계 기록 완료: userId=${user.id}`);
      } catch (statsError) {
        console.error("[OCR Process] 통계 기록 실패:", statsError);
        // 통계 기록 실패해도 에러 응답은 계속 진행
      }
    }

    // 실패 시 재시도 로직은 Queue 시스템에서 처리
    return NextResponse.json(
      {
        error: errorMessage,
        noteId,
        duration,
      },
      { status: 500 }
    );
  }
}

