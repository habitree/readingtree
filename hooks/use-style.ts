"use client";

/**
 * UI 스타일 관련 커스텀 훅 (따뜻한 스타일 고정)
 *
 * 친근하고 응원하는 톤앤매너의 메시지와 테마를 제공합니다.
 */

import { useMemo } from "react";
import {
  STYLE_MESSAGES,
  GREETING_EMOJIS,
  getTimeOfDay,
  formatStreakMessage,
  type StyleMessages,
} from "@/lib/constants/style-messages";

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
  return useMemo(() => {
    const messages = STYLE_MESSAGES;
    const timeOfDay = getTimeOfDay();

    const greeting = {
      text: messages.greeting[timeOfDay],
      emoji: GREETING_EMOJIS[timeOfDay],
    };

    const getStreakMessage = (count: number) => formatStreakMessage(count);

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
      messages,
      greeting,
      getStreakMessage,
      getEmptyMessage,
      getActionMessage,
      getMotivationalMessage,
    };
  }, []);
}
