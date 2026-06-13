import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromImage } from "@/lib/api/ocr";
import { correctOcrText, isOcrCorrectionAvailable } from "@/lib/ai/ocr-correction";
import { recordOcrSuccess, recordOcrFailure } from "@/app/actions/ai/ocr";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { checkFeatureAccess } from "@/app/actions/subscription";
import { spendPoints } from "@/app/actions/points";

/**
 * 동기 OCR API (인라인 스캐너 전용)
 *
 * 기존 /api/ocr 는 note 가 먼저 존재해야 하고 백그라운드(after) + 폴링으로 동작한다.
 * 스캐너는 "촬영 → 즉시 텍스트 → 편집 후 저장" 인라인 UX 라 동기 응답이 필요하다.
 * 이 엔드포인트는 note 없이 사용자 소유 스토리지 이미지 URL 을 받아 텍스트를 즉시 반환한다.
 *
 * 비용/쿼터 가드는 /api/ocr 와 동일(레이트리밋 15/분 + OCR feature access + 포인트 폴백).
 * 남용 방지: imageUrl 은 반드시 본인 Supabase Storage(images 버킷)의 본인 폴더 경로여야 한다.
 */
export const maxDuration = 60;

const STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/images/";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // 레이트리밋 (분당 15회 - OCR 비용 보호, /api/ocr 와 동일)
    const rateLimitResult = await checkRateLimit(request, 15);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    // OCR 사용 한도 체크 (/api/ocr 와 동일 정책)
    const access = await checkFeatureAccess("ocr", user);
    if (!access.allowed) {
      if (access.canUseWithPoints) {
        const spendResult = await spendPoints("ocr_process", {
          user,
          description: "OCR 추가 사용(스캔)",
        });
        if (!spendResult.success) {
          return NextResponse.json(
            { error: `이번 달 OCR 한도(${access.limit}회)에 도달했습니다. 포인트가 부족합니다. (필요: ${access.pointCost}P)` },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json(
          { error: `이번 달 OCR 한도(${access.limit}회)에 도달했습니다.` },
          { status: 403 },
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl이 필요합니다." }, { status: 400 });
    }

    // 남용 방지: 본인 스토리지 폴더 경로의 이미지만 허용
    // 업로드 경로 형식: .../public/images/{photos|transcriptions}/{userId}/{file}
    const ownsImage =
      imageUrl.includes(STORAGE_PUBLIC_MARKER) && imageUrl.includes(`/${user.id}/`);
    if (!ownsImage) {
      return NextResponse.json(
        { error: "본인이 업로드한 이미지만 처리할 수 있습니다." },
        { status: 400 },
      );
    }

    // OCR 추출 (Google Cloud Run)
    const rawText = await extractTextFromImage(imageUrl);

    // AI 보정 (키 있을 때만, 실패해도 원본 사용)
    let finalText = rawText;
    let corrected = false;
    if ((await isOcrCorrectionAvailable()) && rawText.length > 0) {
      try {
        const result = await correctOcrText(rawText);
        finalText = result.correctedText;
        corrected = result.wasModified;
      } catch {
        finalText = rawText;
      }
    }

    const duration = Date.now() - startTime;

    // 통계 기록 (실패해도 응답은 성공 유지)
    try {
      await recordOcrSuccess(user.id, undefined, duration);
    } catch {
      // noop
    }

    return NextResponse.json({
      text: finalText,
      textLength: finalText.length,
      corrected,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[OCR Scan] 처리 오류:", errorMessage);

    if (userId) {
      try {
        await recordOcrFailure(userId, undefined, errorMessage, duration);
      } catch {
        // noop
      }
    }

    return NextResponse.json({ error: "OCR 처리에 실패했습니다." }, { status: 500 });
  }
}
