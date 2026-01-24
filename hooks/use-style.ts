"use client";

/**
 * UI 스타일 관련 커스텀 훅
 *
 * 사용자가 선택한 UI 스타일에 따라 메시지와 테마를 제공합니다.
 */

import { useMemo } from "react";
import type { UIStyleKey } from "@/types/style";
import { DEFAULT_STYLE, UI_STYLES } from "@/types/style";
import {
  STYLE_MESSAGES,
  GREETING_EMOJIS,
  getTimeOfDay,
  formatStreakMessage,
  type StyleMessages,
  type TimeGreeting,
} from "@/lib/constants/style-messages";

export interface UseStyleOptions {
  /**
   * 사용자의 UI 스타일 키
   * undefined인 경우 기본값(minimal) 사용
   */
  userStyle?: UIStyleKey | null;
}

export interface UseStyleReturn {
  /** 현재 스타일 키 */
  style: UIStyleKey;
  /** 스타일 정보 */
  styleInfo: (typeof UI_STYLES)[UIStyleKey];
  /** 스타일별 메시지 */
  messages: StyleMessages;
  /** 현재 시간대에 맞는 인사말 */
  greeting: {
    text: string;
    emoji: string;
  };
  /** 스트릭 메시지 생성 */
  getStreakMessage: (count: number) => string;
  /** 빈 상태 메시지 */
  getEmptyMessage: (type: "noRecords" | "noBooks" | "noNotes" | "noGoal") => string;
  /** 액션 메시지 */
  getActionMessage: (type: "addBook" | "writeNote" | "setGoal" | "viewMore") => string;
  /** 동기부여 메시지 */
  getMotivationalMessage: (
    type?: "default" | "quoteFocused" | "reflectionFocused" | "visualFocused"
  ) => string;
}

/**
 * UI 스타일 훅
 *
 * @example
 * ```tsx
 * function MyComponent({ userStyle }: { userStyle?: UIStyleKey }) {
 *   const { greeting, getStreakMessage, messages } = useStyle({ userStyle });
 *
 *   return (
 *     <div>
 *       <h1>{greeting.emoji} {greeting.text}</h1>
 *       <p>{getStreakMessage(7)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStyle({ userStyle }: UseStyleOptions = {}): UseStyleReturn {
  const style = userStyle ?? DEFAULT_STYLE;

  return useMemo(() => {
    const styleInfo = UI_STYLES[style];
    const messages = STYLE_MESSAGES[style];
    const timeOfDay = getTimeOfDay();

    const greeting = {
      text: messages.greeting[timeOfDay],
      emoji: GREETING_EMOJIS[style][timeOfDay],
    };

    const getStreakMessage = (count: number) => formatStreakMessage(style, count);

    const getEmptyMessage = (
      type: "noRecords" | "noBooks" | "noNotes" | "noGoal"
    ) => messages.empty[type];

    const getActionMessage = (
      type: "addBook" | "writeNote" | "setGoal" | "viewMore"
    ) => messages.action[type];

    const getMotivationalMessage = (
      type: "default" | "quoteFocused" | "reflectionFocused" | "visualFocused" = "default"
    ) => messages.motivational[type];

    return {
      style,
      styleInfo,
      messages,
      greeting,
      getStreakMessage,
      getEmptyMessage,
      getActionMessage,
      getMotivationalMessage,
    };
  }, [style]);
}

/**
 * 스타일 테마 색상 클래스 매핑
 */
export const STYLE_THEME_CLASSES: Record<UIStyleKey, {
  bg: string;
  bgSubtle: string;
  text: string;
  border: string;
  accent: string;
}> = {
  minimal: {
    bg: "bg-zinc-100 dark:bg-zinc-900",
    bgSubtle: "bg-zinc-50 dark:bg-zinc-950",
    text: "text-zinc-900 dark:text-zinc-100",
    border: "border-zinc-200 dark:border-zinc-800",
    accent: "text-zinc-600 dark:text-zinc-400",
  },
  warm: {
    bg: "bg-orange-100 dark:bg-orange-900",
    bgSubtle: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-900 dark:text-orange-100",
    border: "border-orange-200 dark:border-orange-800",
    accent: "text-orange-600 dark:text-orange-400",
  },
  professional: {
    bg: "bg-slate-100 dark:bg-slate-900",
    bgSubtle: "bg-slate-50 dark:bg-slate-950",
    text: "text-slate-900 dark:text-slate-100",
    border: "border-slate-200 dark:border-slate-800",
    accent: "text-slate-600 dark:text-slate-400",
  },
  poetic: {
    bg: "bg-violet-100 dark:bg-violet-900",
    bgSubtle: "bg-violet-50 dark:bg-violet-950",
    text: "text-violet-900 dark:text-violet-100",
    border: "border-violet-200 dark:border-violet-800",
    accent: "text-violet-600 dark:text-violet-400",
  },
};
