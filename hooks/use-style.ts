"use client";

/**
 * UI 스타일 관련 커스텀 훅 (따뜻한 스타일 고정)
 *
 * 친근하고 응원하는 톤앤매너의 메시지와 테마를 제공합니다.
 * i18n을 통해 다국어 메시지를 지원합니다.
 */

import { useMemo } from "react";
import {
  STYLE_MESSAGES,
  GREETING_EMOJIS,
  getTimeOfDay,
  getStreakLevel,
  type StyleMessages,
} from "@/lib/constants/style-messages";
import { useTranslation } from "@/lib/i18n";

export interface UseStyleReturn {
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
 * UI 스타일 훅 (따뜻한 스타일 고정)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { greeting, getStreakMessage, messages } = useStyle();
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
export function useStyle(): UseStyleReturn {
  const { t } = useTranslation();

  return useMemo(() => {
    const messages = STYLE_MESSAGES;
    const timeOfDay = getTimeOfDay();

    const greeting = {
      text: t(`style.greeting.${timeOfDay}` as "style.greeting.morning"),
      emoji: GREETING_EMOJIS[timeOfDay],
    };

    const getStreakMessage = (count: number) => {
      const level = getStreakLevel(count);
      return t(`style.streak.${level}` as "style.streak.none", { count });
    };

    const getEmptyMessage = (
      type: "noRecords" | "noBooks" | "noNotes" | "noGoal"
    ) => t(`style.empty.${type}` as "style.empty.noRecords");

    const getActionMessage = (
      type: "addBook" | "writeNote" | "setGoal" | "viewMore"
    ) => t(`style.action.${type}` as "style.action.addBook");

    const getMotivationalMessage = (
      type: "default" | "quoteFocused" | "reflectionFocused" | "visualFocused" = "default"
    ) => t(`style.motivational.${type}` as "style.motivational.default");

    return {
      messages,
      greeting,
      getStreakMessage,
      getEmptyMessage,
      getActionMessage,
      getMotivationalMessage,
    };
  }, [t]);
}
