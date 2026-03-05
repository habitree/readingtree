import { NextResponse } from "next/server";
import { getSampleUserId } from "@/app/actions/sample";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 임시 진단 API: 게스트 독서달력 샘플 데이터 조회 확인
 * 확인 후 삭제 필요
 */
export async function GET() {
  try {
    const sampleUserId = await getSampleUserId();
    const supabase = createAdminSupabaseClient();

    // 샘플 사용자 정보
    const { data: userInfo } = await supabase
      .from("users")
      .select("id, email, name, is_admin")
      .eq("id", sampleUserId)
      .maybeSingle();

    // KST 기준 현재 월
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const year = kst.getUTCFullYear();
    const month = kst.getUTCMonth() + 1;

    const startDate = new Date(Date.UTC(year, month - 1, 1) - 9 * 60 * 60 * 1000);
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59) - 9 * 60 * 60 * 1000);

    // 노트 수 조회
    const { data: notes, error: notesError, count } = await supabase
      .from("notes")
      .select("id, created_at, type, book_id", { count: "exact" })
      .eq("user_id", sampleUserId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .limit(5);

    // books JOIN 테스트
    const { data: notesWithBooks, error: joinError } = await supabase
      .from("notes")
      .select("id, book_id, books(id, title, cover_image_url)")
      .eq("user_id", sampleUserId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .limit(3);

    return NextResponse.json({
      sampleUserId,
      userInfo,
      dateRange: {
        year,
        month,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      notesQuery: {
        error: notesError?.message ?? null,
        count,
        sample: notes?.slice(0, 3),
      },
      joinQuery: {
        error: joinError?.message ?? null,
        sample: notesWithBooks,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
