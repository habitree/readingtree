import { toast as sonnerToast } from "sonner";
import type {
  ActionFailure,
  ActionResult,
} from "@/types/action-result";

/**
 * 표준 토스트 래퍼.
 *
 * 신규 코드는 반드시 이 모듈을 사용한다. 기존 코드는 수정 시 점진 전환.
 *
 * 정책:
 *   - success: 3초
 *   - info:    4초
 *   - warning: 5초
 *   - error:   7초 + 닫기 버튼
 *   - loading: 수동 닫기
 *
 * 한국어 메시지 원칙: ~요/~해요 톤 통일, 구체적 행동 유도.
 */

type ToastId = string | number;

type ActionConfig = {
  label: string;
  onClick: () => void;
};

type BaseOptions = {
  description?: string;
  id?: ToastId;
  duration?: number;
  action?: ActionConfig;
};

type PointBadgeOptions = BaseOptions & {
  points: number;
  viewHref?: string;
  viewLabel?: string;
};

type PromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
};

const DURATIONS = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 7000,
} as const;

function buildOptions(defaults: { duration: number }, options?: BaseOptions) {
  const result: Record<string, unknown> = {
    duration: options?.duration ?? defaults.duration,
  };
  if (options?.description) result.description = options.description;
  if (options?.id !== undefined) result.id = options.id;
  if (options?.action) result.action = options.action;
  return result;
}

export const notify = {
  success(message: string, options?: BaseOptions): ToastId {
    return sonnerToast.success(
      message,
      buildOptions({ duration: DURATIONS.success }, options),
    );
  },

  info(message: string, options?: BaseOptions): ToastId {
    return sonnerToast.info(
      message,
      buildOptions({ duration: DURATIONS.info }, options),
    );
  },

  warning(message: string, options?: BaseOptions): ToastId {
    return sonnerToast.warning(
      message,
      buildOptions({ duration: DURATIONS.warning }, options),
    );
  },

  error(
    message: string | Error | ActionFailure,
    options?: BaseOptions,
  ): ToastId {
    const text =
      message instanceof Error
        ? message.message
        : typeof message === "string"
          ? message
          : message.message;
    return sonnerToast.error(text, {
      ...buildOptions({ duration: DURATIONS.error }, options),
      closeButton: true,
    });
  },

  /**
   * ActionResult를 소비해 성공/실패를 한 번에 처리한다.
   *
   *   const result = await addBook(...);
   *   notify.fromResult(result, { successMessage: "서재에 추가했어요" });
   */
  fromResult<T>(
    result: ActionResult<T>,
    options: {
      successMessage: string | ((data: T) => string);
      successOptions?: BaseOptions;
      errorOptions?: BaseOptions;
    },
  ): ToastId {
    if (result.success) {
      const message =
        typeof options.successMessage === "function"
          ? options.successMessage(result.data)
          : options.successMessage;
      return this.success(message, options.successOptions);
    }
    return this.error(result.message, options.errorOptions);
  },

  loading(message: string, options?: BaseOptions): ToastId {
    return sonnerToast.loading(message, {
      ...buildOptions({ duration: Infinity }, options),
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    options?: BaseOptions,
  ): ToastId | string | number {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...buildOptions({ duration: DURATIONS.success }, options),
    }) as ToastId;
  },

  /**
   * 포인트 적립 피드백. Phase 3A의 N2 패턴을 표준화.
   *
   *   notify.pointBadge("기록을 저장했어요", { points: 15, viewHref: "/points" })
   */
  pointBadge(message: string, options: PointBadgeOptions): ToastId {
    const { points, viewHref, viewLabel, ...rest } = options;
    const description =
      (rest.description ? rest.description + " · " : "") +
      `+${points.toLocaleString()}P 적립`;

    const action: ActionConfig | undefined = viewHref
      ? {
          label: viewLabel ?? "내 포인트 보기",
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = viewHref;
            }
          },
        }
      : rest.action;

    return this.success(message, {
      ...rest,
      description,
      action,
    });
  },

  /**
   * 액션 버튼이 있는 토스트 단축.
   *
   *   notify.withAction("이미 서재에 있어요", {
   *     label: "해당 책으로 이동",
   *     onClick: () => router.push(`/books/${id}`),
   *   })
   */
  withAction(
    message: string,
    action: ActionConfig,
    options?: Omit<BaseOptions, "action"> & { kind?: "success" | "info" | "warning" | "error" },
  ): ToastId {
    const kind = options?.kind ?? "info";
    return this[kind](message, { ...options, action });
  },

  dismiss(id?: ToastId) {
    sonnerToast.dismiss(id);
  },
};

export type { BaseOptions as NotifyOptions, ActionConfig as NotifyAction };
