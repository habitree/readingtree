/**
 * 기능 요청 관련 타입 정의
 */

/**
 * 기능 요청 상태
 */
export type FeatureRequestStatus =
  | "requested"      // 요청됨
  | "under_review"   // 검토중
  | "planned"        // 계획됨
  | "in_progress"    // 개발중
  | "completed"      // 완료
  | "declined";      // 거절됨

/**
 * 상태별 설정
 */
export const FEATURE_REQUEST_STATUS_CONFIG: Record<
  FeatureRequestStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  }
> = {
  requested: {
    label: "요청됨",
    color: "gray",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
  },
  under_review: {
    label: "검토중",
    color: "amber",
    bgColor: "bg-amber-100 dark:bg-amber-900",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  planned: {
    label: "계획됨",
    color: "blue",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  in_progress: {
    label: "개발중",
    color: "purple",
    bgColor: "bg-purple-100 dark:bg-purple-900",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  completed: {
    label: "완료",
    color: "green",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300",
  },
  declined: {
    label: "거절됨",
    color: "red",
    bgColor: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-700 dark:text-red-300",
  },
};

/**
 * 기능 요청 기본 타입
 */
export interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  vote_count: number;
  admin_response: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 기능 요청 상세 타입 (사용자 정보 포함)
 */
export interface FeatureRequestWithUser extends FeatureRequest {
  users: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

/**
 * 기능 요청 상세 타입 (사용자 정보 + 투표 여부 포함)
 */
export interface FeatureRequestDetail extends FeatureRequestWithUser {
  hasVoted: boolean;
  commentCount: number;
}

/**
 * 기능 요청 투표 타입
 */
export interface FeatureRequestVote {
  id: string;
  feature_request_id: string;
  user_id: string;
  created_at: string;
}

/**
 * 기능 요청 댓글 타입
 */
export interface FeatureRequestComment {
  id: string;
  feature_request_id: string;
  user_id: string;
  content: string;
  is_admin_comment: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 댓글 상세 타입 (사용자 정보 포함)
 */
export interface FeatureRequestCommentWithUser extends FeatureRequestComment {
  users: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_admin: boolean | null;
  } | null;
}

/**
 * 기능 요청 목록 조회 옵션
 */
export interface GetFeatureRequestsOptions {
  status?: FeatureRequestStatus;
  sortBy?: "vote_count" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * 기능 요청 생성 폼 데이터
 */
export interface CreateFeatureRequestData {
  title: string;
  description: string;
}

/**
 * 기능 요청 수정 폼 데이터
 */
export interface UpdateFeatureRequestData {
  title?: string;
  description?: string;
  status?: FeatureRequestStatus;
  admin_response?: string;
  is_pinned?: boolean;
}

/**
 * 댓글 생성 폼 데이터
 */
export interface CreateCommentData {
  content: string;
}
