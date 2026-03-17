import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyNoteOwnership, createTranscriptionInitial } from "@/app/actions/notes";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { checkFeatureAccess } from "@/app/actions/subscription";
import { spendPoints } from "@/app/actions/points";

/**
 * OCR 처리 요청 API
 * 즉시 응답하고 after()로 백그라운드 OCR 처리를 보장합니다.
 * 실제 OCR 처리는 /api/ocr/process에서 수행됩니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting (분당 15회 - OCR API 비용 보호)
    const rateLimitResult = await checkRateLimit(request, 15);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // OCR 사용 한도 체크
    const access = await checkFeatureAccess("ocr", user);
    if (!access.allowed) {
      if (access.canUseWithPoints) {
        // 포인트로 추가 사용 시도
        const spendResult = await spendPoints("ocr_process", {
          user,
          description: "OCR 추가 사용",
        });
        if (!spendResult.success) {
          return NextResponse.json(
            { error: `이번 달 OCR 한도(${access.limit}회)에 도달했습니다. 포인트가 부족합니다. (필요: ${access.pointCost}P)` },
            { status: 403 }
          );
        }
        // 포인트 차감 성공 → 계속 진행
      } else {
        return NextResponse.json(
          { error: `이번 달 OCR 한도(${access.limit}회)에 도달했습니다.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { noteId, imageUrl } = body;

    if (!noteId || !imageUrl) {
      return NextResponse.json(
        { error: "noteId와 imageUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // 기록 소유 확인
    const hasOwnership = await verifyNoteOwnership(noteId, user.id);

    if (!hasOwnership) {
      return NextResponse.json(
        { error: "권한이 없습니다. 해당 기록에 대한 OCR 처리를 요청할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // OCR 처리 시작 전 transcription 초기 상태 생성
    try {
      await createTranscriptionInitial(noteId);
    } catch {
      // 초기 상태 생성 실패해도 OCR 처리는 계속 진행 (이미 존재할 수 있음)
    }

    // after()로 백그라운드 OCR 처리 시작
    // Next.js after()는 응답 전송 후에도 실행이 보장됨 (Vercel 서버리스 호환)
    const origin = request.nextUrl.origin;
    const cookies = request.headers.get("cookie");

    after(async () => {
      try {
        const response = await fetch(`${origin}/api/ocr/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookies && { Cookie: cookies }),
          },
          body: JSON.stringify({ noteId, imageUrl }),
        });

        if (!response.ok) {
          console.error("[OCR] 백그라운드 처리 실패:", response.status);
        }
      } catch (error) {
        console.error("[OCR] 백그라운드 처리 오류:", error instanceof Error ? error.message : String(error));
      }
    });

    // 즉시 응답 반환
    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error("[OCR] 요청 API 오류:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "OCR 요청에 실패했습니다." },
      { status: 500 }
    );
  }
}
