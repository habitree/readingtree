import type {
  ActionFailure,
  ActionResult,
  ActionSuccess,
  KnownErrorCode,
} from "@/types/action-result";

/**
 * 표준 에러 메시지 (한국어).
 *
 * - 사용자 표시용 메시지는 이 맵을 통해 결정한다.
 * - 원본(개발자용) 에러는 `meta.cause`에 보존한다.
 */
export const ERROR_MESSAGES: Record<KnownErrorCode, string> = {
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "이 작업을 수행할 권한이 없습니다.",
  NOT_FOUND: "요청한 항목을 찾을 수 없습니다.",
  VALIDATION_ERROR: "입력값을 확인해주세요.",
  DUPLICATE: "이미 등록된 항목입니다.",
  RATE_LIMITED: "너무 많은 요청이 발생했어요. 잠시 후 다시 시도해주세요.",
  INSUFFICIENT_POINTS: "포인트가 부족합니다.",
  FEATURE_LOCKED: "이 기능은 현재 사용할 수 없습니다.",
  SUBSCRIPTION_REQUIRED: "프리미엄 구독이 필요한 기능이에요.",
  QUOTA_EXCEEDED: "이번 달 사용 한도를 초과했습니다.",
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  EXTERNAL_SERVICE_ERROR: "외부 서비스에 일시적인 문제가 발생했어요.",
  INTERNAL_ERROR: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
};

export function resolveErrorMessage(code: KnownErrorCode, override?: string): string {
  return override ?? ERROR_MESSAGES[code];
}

/**
 * 성공 결과를 생성한다.
 */
export function ok(): ActionSuccess<void>;
export function ok<T>(data: T): ActionSuccess<T>;
export function ok<T>(data?: T): ActionSuccess<T | undefined> {
  return { success: true, data };
}

/**
 * 실패 결과를 생성한다. `message`를 전달하지 않으면 표준 한국어 메시지로 매핑한다.
 *
 *   return fail("UNAUTHORIZED");
 *   return fail("DUPLICATE", { message: "이미 서재에 있는 책이에요", meta: { bookId } });
 */
export function fail<E extends KnownErrorCode = KnownErrorCode>(
  code: E,
  options?: { message?: string; meta?: Record<string, unknown> },
): ActionFailure<E> {
  return {
    success: false,
    code,
    message: resolveErrorMessage(code, options?.message),
    meta: options?.meta,
  };
}

/**
 * 예상치 못한 예외를 `ActionFailure`로 정규화한다.
 * 서버 액션 try/catch에서 사용한다.
 */
export function failFromException(error: unknown): ActionFailure<"INTERNAL_ERROR"> {
  const cause = error instanceof Error ? error.message : String(error);
  return {
    success: false,
    code: "INTERNAL_ERROR",
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    meta: { cause },
  };
}

/**
 * 두 개 이상의 `ActionResult`를 첫 실패에서 단락 평가한다.
 * 모두 성공하면 마지막 성공값을 반환한다.
 */
export function chain<T>(...results: ActionResult<T>[]): ActionResult<T> {
  for (const result of results) {
    if (!result.success) return result;
  }
  return results[results.length - 1];
}

/**
 * 클라이언트에서 ActionResult를 소비할 때 사용자 메시지 뽑아내기.
 */
export function extractUserMessage<T, E extends string>(
  result: ActionResult<T, E>,
  fallback = "요청 처리에 실패했어요",
): string | null {
  return result.success ? null : result.message || fallback;
}
