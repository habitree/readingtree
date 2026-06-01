"use server";

/**
 * 스탬프(reading_logs 한 행) 공유 전용 server actions.
 *
 * - getStampForShare(logId): 공유 다이얼로그 / 공개 페이지에서 사용. RLS 통한 권한 처리
 *   (본인 OR is_public=true) — anon 클라이언트 호출 가능.
 * - setStampPublic(logId, isPublic): 본인 only. reading_logs.is_public UPDATE.
 *
 * picker 분리 설계와 동일하게, 노트 공유(`app/actions/share.ts`)와 분리된 별도 파일.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { isValidUUID } from "@/lib/utils/validation";

export interface StampShareData {
  /** reading_logs.id */
  id: string;
  userId: string;
  isPublic: boolean;
  /** 사진(image_urls) — 첫 장이 대표(image_url) */
  imageUrls: string[];
  /** 페이지 구간 */
  startPage: number | null;
  endPage: number | null;
  /** 시간 */
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  /** 페이스 (초/페이지) */
  paceSecondsPerPage: number | null;
  memo: string | null;
  createdAt: string;
  /** 책 정보 */
  book: {
    id: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    totalPages: number | null;
  } | null;
  /** 사용자 표시 정보 (display_name, avatar) */
  profile: {
    name: string | null;
    avatarUrl: string | null;
  } | null;
}

/**
 * 스탬프 공유용 데이터 조회.
 * RLS가 권한 처리: 본인 OR is_public=true 만 row 반환.
 * 비공개·존재하지 않음 → null.
 *
 * 클라이언트(다이얼로그)와 공개 페이지 양쪽에서 호출. anon 컨텍스트도 동작.
 */
export async function getStampForShare(logId: string): Promise<StampShareData | null> {
  if (!logId || !isValidUUID(logId)) return null;

  const supabase = await createServerSupabaseClient();

  const { data: log, error } = await supabase
    .from("reading_logs")
    .select(
      `
      id,
      user_id,
      is_public,
      image_url,
      image_urls,
      start_page,
      end_page,
      started_at,
      ended_at,
      reading_duration_seconds,
      pace_seconds_per_page,
      memo,
      created_at,
      user_books!inner (
        books (
          id,
          title,
          author,
          cover_image_url,
          total_pages
        )
      )
    `,
    )
    .eq("id", logId)
    .single();

  if (error || !log) return null;

  // 사용자 정보 조회 (별도 쿼리; users 테이블)
  // RLS상 본인이면 자기 정보, anon이면 공개 가능한 컬럼만 조회되어야 함.
  // 노트 공유와 동일하게 service-side는 page.tsx에서 createOgServiceSupabaseClient 사용.
  // 여기서는 일반 클라이언트로 시도, 실패 시 null.
  let profile: StampShareData["profile"] = null;
  try {
    const { data: user } = await supabase
      .from("users")
      .select("name, avatar_url")
      .eq("id", log.user_id)
      .maybeSingle();
    if (user) {
      profile = {
        name: user.name ?? null,
        avatarUrl: user.avatar_url ?? null,
      };
    }
  } catch {
    // 익명 컨텍스트 등에서 실패 시 무시
  }

  const userBooks = log.user_books as unknown as
    | {
        books?: {
          id: string;
          title: string;
          author: string | null;
          cover_image_url: string | null;
          total_pages: number | null;
        } | null;
      }
    | null;
  const bookRow = userBooks?.books ?? null;

  // image_urls가 비어있으면 image_url 한 장으로 폴백
  const imageUrls: string[] = Array.isArray(log.image_urls) && log.image_urls.length > 0
    ? log.image_urls
    : log.image_url
      ? [log.image_url]
      : [];

  return {
    id: log.id,
    userId: log.user_id,
    isPublic: !!log.is_public,
    imageUrls,
    startPage: log.start_page ?? null,
    endPage: log.end_page ?? null,
    startedAt: log.started_at ?? null,
    endedAt: log.ended_at ?? null,
    durationSeconds: log.reading_duration_seconds ?? 0,
    paceSecondsPerPage: log.pace_seconds_per_page ?? null,
    memo: log.memo ?? null,
    createdAt: log.created_at,
    book: bookRow
      ? {
          id: bookRow.id,
          title: bookRow.title,
          author: bookRow.author,
          coverImageUrl: bookRow.cover_image_url,
          totalPages: bookRow.total_pages,
        }
      : null,
    profile,
  };
}

/**
 * 스탬프 공개 상태 토글. 본인만 호출 가능.
 *
 * 공유 다이얼로그에서 "링크 복사" 누르는 시점에 비공개면 자동으로 공개로 전환.
 * 또는 사용자가 공개 토글을 직접 조작.
 */
export async function setStampPublic(
  logId: string,
  isPublic: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!logId || !isValidUUID(logId)) {
    return { success: false, error: "잘못된 스탬프 ID" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("reading_logs")
    .update({ is_public: isPublic })
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
