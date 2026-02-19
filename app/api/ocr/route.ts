import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyNoteOwnership, createTranscriptionInitial } from "@/app/actions/notes";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

/**
 * OCR 처리 요청 API
 * 즉시 응답하고 after()로 백그라운드 OCR 처리를 보장합니다.
 * 실제 OCR 처리는 /api/ocr/process에서 수행됩니다.
 */
export async function POST(request: NextRequest) {
  console.log("[OCR] 요청 수신 시작");

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
    console.log("[OCR] Supabase 클라이언트 생성 완료");

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("[OCR] 인증 확인:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error("[OCR] 인증 실패:", {
        authError: authError?.message,
        hasUser: !!user,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, imageUrl } = body;

    console.log("[OCR] 요청 본문 파싱 완료:", {
      noteId,
      hasImageUrl: !!imageUrl,
      imageUrlPreview: imageUrl?.substring(0, 100) + "...",
    });

    if (!noteId || !imageUrl) {
      console.error("[OCR] 파라미터 누락:", { noteId, hasImageUrl: !!imageUrl });
      return NextResponse.json(
        { error: "noteId와 imageUrl이 필요합니다." },
        { status: 400 }
      );
    }

    // 기록 소유 확인
    console.log("[OCR] 기록 소유 확인 시작:", { noteId, userId: user.id });
    const hasOwnership = await verifyNoteOwnership(noteId, user.id);
    console.log("[OCR] 기록 소유 확인 결과:", { hasOwnership });

    if (!hasOwnership) {
      return NextResponse.json(
        { error: "권한이 없습니다. 해당 기록에 대한 OCR 처리를 요청할 권한이 없습니다." },
        { status: 403 }
      );
    }

    // OCR 처리 시작 전 transcription 초기 상태 생성
    try {
      await createTranscriptionInitial(noteId);
      console.log(`[OCR] Transcription 초기 상태 생성 완료: noteId=${noteId}`);
    } catch (error) {
      console.error("[OCR] Transcription 초기 상태 생성 실패:", error);
      // 초기 상태 생성 실패해도 OCR 처리는 계속 진행 (이미 존재할 수 있음)
    }

    // after()로 백그라운드 OCR 처리 시작
    // Next.js after()는 응답 전송 후에도 실행이 보장됨 (Vercel 서버리스 호환)
    const origin = request.nextUrl.origin;
    const cookies = request.headers.get("cookie");

    after(async () => {
      try {
        console.log(`[OCR after()] 백그라운드 처리 시작: noteId=${noteId}`);
        const response = await fetch(`${origin}/api/ocr/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookies && { Cookie: cookies }),
          },
          body: JSON.stringify({ noteId, imageUrl }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("[OCR after()] 처리 요청 실패:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            noteId,
          });
        } else {
          console.log(`[OCR after()] 처리 요청 성공: noteId=${noteId}`);
        }
      } catch (error) {
        console.error("[OCR after()] 처리 요청 오류:", {
          error: error instanceof Error ? error.message : String(error),
          noteId,
        });
      }
    });

    // 즉시 응답 반환
    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error("[OCR] 요청 API 오류:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "OCR 요청에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
