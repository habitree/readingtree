/**
 * 서버 액션 표준 반환 타입.
 *
 * 신규 서버 액션은 반드시 이 타입으로 반환하고, 기존 액션은 수정 시 점진 전환한다.
 *
 * 사용 예시:
 *   export async function updateBook(...): Promise<ActionResult<Book>> {
 *     const user = await getCurrentUser();
 *     if (!user) return fail("UNAUTHORIZED");
 *     const { data, error } = await supabase...;
 *     if (error) return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
 *     return ok(data);
 *   }
 */

export type KnownErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "RATE_LIMITED"
  | "INSUFFICIENT_POINTS"
  | "FEATURE_LOCKED"
  | "SUBSCRIPTION_REQUIRED"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export type ActionSuccess<T> = { success: true; data: T };

export type ActionFailure<E extends string = KnownErrorCode> = {
  success: false;
  code: E;
  message: string;
  meta?: Record<string, unknown>;
};

export type ActionResult<T = void, E extends string = KnownErrorCode> =
  | ActionSuccess<T>
  | ActionFailure<E>;

export function isActionSuccess<T, E extends string>(
  result: ActionResult<T, E>,
): result is ActionSuccess<T> {
  return result.success === true;
}

export function isActionFailure<T, E extends string>(
  result: ActionResult<T, E>,
): result is ActionFailure<E> {
  return result.success === false;
}
