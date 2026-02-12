import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureBook } from "@/app/actions/books";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const bookData = await request.json();
    const { bookId } = await ensureBook(bookData);
    return NextResponse.json({ bookId });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "책 확인 실패" },
      { status: 400 }
    );
  }
}
