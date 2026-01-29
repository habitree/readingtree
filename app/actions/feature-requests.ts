"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  FeatureRequest,
  FeatureRequestWithUser,
  FeatureRequestDetail,
  FeatureRequestStatus,
  FeatureRequestCommentWithUser,
  GetFeatureRequestsOptions,
  CreateFeatureRequestData,
  UpdateFeatureRequestData,
  CreateCommentData,
} from "@/types/feature-request";

// ============================================
// 조회 함수
// ============================================

/**
 * 기능 요청 목록 조회
 * 비로그인 사용자도 조회 가능 (공개)
 */
export async function getFeatureRequests(
  options: GetFeatureRequestsOptions = {}
): Promise<{
  data: FeatureRequestWithUser[];
  total: number;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    status,
    sortBy = "vote_count",
    sortOrder = "desc",
    limit = 20,
    offset = 0,
    search,
  } = options;

  // 기본 쿼리
  let query = supabase
    .from("feature_requests")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url
      )
    `,
      { count: "exact" }
    );

  // 상태 필터
  if (status) {
    query = query.eq("status", status);
  }

  // 검색
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 고정된 항목 먼저, 그 다음 정렬 기준 적용
  query = query
    .order("is_pinned", { ascending: false })
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("기능 요청 목록 조회 오류:", error);
    throw new Error(`기능 요청 목록 조회 실패: ${error.message}`);
  }

  return {
    data: (data || []) as FeatureRequestWithUser[],
    total: count || 0,
  };
}

/**
 * 인기 기능 요청 조회 (홈 프리뷰용)
 */
export async function getTopFeatureRequests(
  limit: number = 4
): Promise<FeatureRequestWithUser[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("feature_requests")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .not("status", "in", '("completed","declined")')
    .order("is_pinned", { ascending: false })
    .order("vote_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("인기 기능 요청 조회 오류:", error);
    return [];
  }

  return (data || []) as FeatureRequestWithUser[];
}

/**
 * 기능 요청 상세 조회
 */
export async function getFeatureRequestById(
  id: string
): Promise<FeatureRequestDetail | null> {
  const supabase = await createServerSupabaseClient();

  // 기능 요청 조회
  const { data: request, error: requestError } = await supabase
    .from("feature_requests")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("id", id)
    .single();

  if (requestError || !request) {
    console.error("기능 요청 상세 조회 오류:", requestError);
    return null;
  }

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 투표 여부 확인
  let hasVoted = false;
  if (user) {
    const { data: vote } = await supabase
      .from("feature_request_votes")
      .select("id")
      .eq("feature_request_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasVoted = !!vote;
  }

  // 댓글 수 조회
  const { count: commentCount } = await supabase
    .from("feature_request_comments")
    .select("*", { count: "exact", head: true })
    .eq("feature_request_id", id);

  return {
    ...(request as FeatureRequestWithUser),
    hasVoted,
    commentCount: commentCount || 0,
  };
}

/**
 * 사용자가 투표한 요청 ID 목록 조회
 */
export async function getUserVotedRequestIds(): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("feature_request_votes")
    .select("feature_request_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("투표한 요청 조회 오류:", error);
    return [];
  }

  return (data || []).map((v) => v.feature_request_id);
}

// ============================================
// CRUD 함수
// ============================================

/**
 * 기능 요청 생성
 */
export async function createFeatureRequest(
  data: CreateFeatureRequestData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 입력 검증
  if (!data.title || data.title.trim().length < 5) {
    return { success: false, error: "제목은 5자 이상 입력해주세요." };
  }

  if (!data.description || data.description.trim().length < 20) {
    return { success: false, error: "설명은 20자 이상 입력해주세요." };
  }

  if (data.title.length > 200) {
    return { success: false, error: "제목은 200자 이하로 입력해주세요." };
  }

  // 기능 요청 생성
  const { data: request, error } = await supabase
    .from("feature_requests")
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      description: data.description.trim(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("기능 요청 생성 오류:", error);
    return { success: false, error: "기능 요청 생성에 실패했습니다." };
  }

  revalidatePath("/feature-requests");
  revalidatePath("/");
  return { success: true, id: request.id };
}

/**
 * 기능 요청 수정
 */
export async function updateFeatureRequest(
  id: string,
  data: UpdateFeatureRequestData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 기존 요청 조회 (권한 확인)
  const { data: existing, error: existingError } = await supabase
    .from("feature_requests")
    .select("user_id")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: "기능 요청을 찾을 수 없습니다." };
  }

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.is_admin === true;
  const isOwner = existing.user_id === user.id;

  // 권한 검증
  if (!isOwner && !isAdmin) {
    return { success: false, error: "수정 권한이 없습니다." };
  }

  // 일반 사용자는 제목/설명만 수정 가능
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) {
    if (data.title.trim().length < 5) {
      return { success: false, error: "제목은 5자 이상 입력해주세요." };
    }
    updateData.title = data.title.trim();
  }

  if (data.description !== undefined) {
    if (data.description.trim().length < 20) {
      return { success: false, error: "설명은 20자 이상 입력해주세요." };
    }
    updateData.description = data.description.trim();
  }

  // 관리자만 상태, 응답, 고정 수정 가능
  if (isAdmin) {
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.admin_response !== undefined) {
      updateData.admin_response = data.admin_response;
    }
    if (data.is_pinned !== undefined) {
      updateData.is_pinned = data.is_pinned;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "수정할 내용이 없습니다." };
  }

  const { error } = await supabase
    .from("feature_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("기능 요청 수정 오류:", error);
    return { success: false, error: "수정에 실패했습니다." };
  }

  revalidatePath("/feature-requests");
  revalidatePath(`/feature-requests/${id}`);
  return { success: true };
}

/**
 * 기능 요청 삭제
 */
export async function deleteFeatureRequest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 기존 요청 조회 (권한 확인)
  const { data: existing, error: existingError } = await supabase
    .from("feature_requests")
    .select("user_id")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: "기능 요청을 찾을 수 없습니다." };
  }

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.is_admin === true;
  const isOwner = existing.user_id === user.id;

  if (!isOwner && !isAdmin) {
    return { success: false, error: "삭제 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("feature_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("기능 요청 삭제 오류:", error);
    return { success: false, error: "삭제에 실패했습니다." };
  }

  revalidatePath("/feature-requests");
  revalidatePath("/");
  return { success: true };
}

// ============================================
// 투표 함수
// ============================================

/**
 * 투표 토글 (추가/취소)
 */
export async function toggleVote(
  featureRequestId: string
): Promise<{ success: boolean; voted: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, voted: false, error: "로그인이 필요합니다." };
  }

  // 기존 투표 확인
  const { data: existingVote, error: voteError } = await supabase
    .from("feature_request_votes")
    .select("id")
    .eq("feature_request_id", featureRequestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (voteError) {
    console.error("투표 확인 오류:", voteError);
    return { success: false, voted: false, error: "투표 확인에 실패했습니다." };
  }

  if (existingVote) {
    // 투표 취소
    const { error: deleteError } = await supabase
      .from("feature_request_votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      console.error("투표 취소 오류:", deleteError);
      return { success: false, voted: true, error: "투표 취소에 실패했습니다." };
    }

    revalidatePath("/feature-requests");
    revalidatePath(`/feature-requests/${featureRequestId}`);
    return { success: true, voted: false };
  } else {
    // 투표 추가
    const { error: insertError } = await supabase
      .from("feature_request_votes")
      .insert({
        feature_request_id: featureRequestId,
        user_id: user.id,
      });

    if (insertError) {
      console.error("투표 추가 오류:", insertError);
      return { success: false, voted: false, error: "투표에 실패했습니다." };
    }

    revalidatePath("/feature-requests");
    revalidatePath(`/feature-requests/${featureRequestId}`);
    return { success: true, voted: true };
  }
}

// ============================================
// 댓글 함수
// ============================================

/**
 * 댓글 목록 조회
 */
export async function getComments(
  featureRequestId: string
): Promise<FeatureRequestCommentWithUser[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("feature_request_comments")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url,
        is_admin
      )
    `
    )
    .eq("feature_request_id", featureRequestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("댓글 조회 오류:", error);
    return [];
  }

  return (data || []) as FeatureRequestCommentWithUser[];
}

/**
 * 댓글 작성
 */
export async function createComment(
  featureRequestId: string,
  data: CreateCommentData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 입력 검증
  if (!data.content || data.content.trim().length < 2) {
    return { success: false, error: "댓글을 2자 이상 입력해주세요." };
  }

  // 관리자 여부 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.is_admin === true;

  // 댓글 작성
  const { error } = await supabase.from("feature_request_comments").insert({
    feature_request_id: featureRequestId,
    user_id: user.id,
    content: data.content.trim(),
    is_admin_comment: isAdmin,
  });

  if (error) {
    console.error("댓글 작성 오류:", error);
    return { success: false, error: "댓글 작성에 실패했습니다." };
  }

  revalidatePath(`/feature-requests/${featureRequestId}`);
  return { success: true };
}

/**
 * 댓글 수정
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 입력 검증
  if (!content || content.trim().length < 2) {
    return { success: false, error: "댓글을 2자 이상 입력해주세요." };
  }

  // 기존 댓글 조회 (권한 확인)
  const { data: existing, error: existingError } = await supabase
    .from("feature_request_comments")
    .select("user_id, feature_request_id")
    .eq("id", commentId)
    .single();

  if (existingError || !existing) {
    return { success: false, error: "댓글을 찾을 수 없습니다." };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: "수정 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("feature_request_comments")
    .update({ content: content.trim() })
    .eq("id", commentId);

  if (error) {
    console.error("댓글 수정 오류:", error);
    return { success: false, error: "댓글 수정에 실패했습니다." };
  }

  revalidatePath(`/feature-requests/${existing.feature_request_id}`);
  return { success: true };
}

/**
 * 댓글 삭제
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 기존 댓글 조회 (권한 확인)
  const { data: existing, error: existingError } = await supabase
    .from("feature_request_comments")
    .select("user_id, feature_request_id")
    .eq("id", commentId)
    .single();

  if (existingError || !existing) {
    return { success: false, error: "댓글을 찾을 수 없습니다." };
  }

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.is_admin === true;
  const isOwner = existing.user_id === user.id;

  if (!isOwner && !isAdmin) {
    return { success: false, error: "삭제 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("feature_request_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("댓글 삭제 오류:", error);
    return { success: false, error: "댓글 삭제에 실패했습니다." };
  }

  revalidatePath(`/feature-requests/${existing.feature_request_id}`);
  return { success: true };
}

// ============================================
// 관리자 전용 함수
// ============================================

/**
 * 기능 요청 상태 변경 (관리자 전용)
 */
export async function updateFeatureRequestStatus(
  id: string,
  status: FeatureRequestStatus,
  adminResponse?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (userProfile?.is_admin !== true) {
    return { success: false, error: "관리자 권한이 필요합니다." };
  }

  const updateData: Record<string, unknown> = { status };
  if (adminResponse !== undefined) {
    updateData.admin_response = adminResponse;
  }

  const { error } = await supabase
    .from("feature_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("상태 변경 오류:", error);
    return { success: false, error: "상태 변경에 실패했습니다." };
  }

  revalidatePath("/feature-requests");
  revalidatePath(`/feature-requests/${id}`);
  return { success: true };
}

/**
 * 기능 요청 고정/해제 (관리자 전용)
 */
export async function togglePin(
  id: string
): Promise<{ success: boolean; pinned: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, pinned: false, error: "로그인이 필요합니다." };
  }

  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (userProfile?.is_admin !== true) {
    return { success: false, pinned: false, error: "관리자 권한이 필요합니다." };
  }

  // 현재 상태 확인
  const { data: existing, error: existingError } = await supabase
    .from("feature_requests")
    .select("is_pinned")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return { success: false, pinned: false, error: "기능 요청을 찾을 수 없습니다." };
  }

  const newPinnedState = !existing.is_pinned;

  const { error } = await supabase
    .from("feature_requests")
    .update({ is_pinned: newPinnedState })
    .eq("id", id);

  if (error) {
    console.error("고정 상태 변경 오류:", error);
    return { success: false, pinned: existing.is_pinned, error: "고정 상태 변경에 실패했습니다." };
  }

  revalidatePath("/feature-requests");
  return { success: true, pinned: newPinnedState };
}
