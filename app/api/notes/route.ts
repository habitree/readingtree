import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNotes } from "@/app/actions/notes";
import type { NoteType } from "@/types/note";

/**
 * 기록 목록 조회 API
 * GET /api/notes?bookId=xxx&type=xxx&limit=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId") || undefined;
    const type = (searchParams.get("type") as NoteType) || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;

    // bookId 검증 (UUID 형식)
    if (bookId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId)) {
      return NextResponse.json(
        { error: "유효하지 않은 책 ID입니다." },
        { status: 400 }
      );
    }

    // limit 검증
    if (limit && (limit < 1 || limit > 100)) {
      return NextResponse.json(
        { error: "limit은 1 이상 100 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 기록 조회
    const notes = await getNotes(bookId, type);

    // limit 적용
    const limitedNotes = limit ? notes.slice(0, limit) : notes;

    return NextResponse.json({
      notes: limitedNotes,
      total: notes.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "기록 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
