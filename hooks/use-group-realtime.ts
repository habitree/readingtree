"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n";

interface RealtimeEvent {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  payload: any;
  timestamp: Date;
}

interface UseGroupRealtimeOptions {
  /** 그룹 ID */
  groupId: string;
  /** 현재 사용자 ID (자신의 변경은 무시) */
  currentUserId?: string;
  /** 새 기록 공유 시 콜백 */
  onNewSharedNote?: (note: any) => void;
  /** 새 멤버 가입 시 콜백 */
  onMemberJoined?: (member: any) => void;
  /** 멤버 탈퇴/강퇴 시 콜백 */
  onMemberLeft?: (member: any) => void;
  /** 모든 이벤트 콜백 */
  onEvent?: (event: RealtimeEvent) => void;
  /** 토스트 알림 표시 여부 */
  showToast?: boolean;
  /** 연결 상태 변경 콜백 */
  onConnectionChange?: (connected: boolean) => void;
}

interface UseGroupRealtimeReturn {
  /** 연결 상태 */
  isConnected: boolean;
  /** 최근 이벤트 */
  lastEvent: RealtimeEvent | null;
  /** 연결 재시도 */
  reconnect: () => void;
  /** 연결 해제 */
  disconnect: () => void;
}

/**
 * 실시간 그룹 알림 훅
 *
 * Supabase Realtime을 사용하여 그룹 활동을 실시간으로 구독합니다.
 * - 새 기록 공유
 * - 새 멤버 가입
 * - 멤버 탈퇴/강퇴
 *
 * 심리학적 효과:
 * - 소속감 (Relatedness): 팀원 활동 실시간 확인
 * - 사회적 책임감: "팀원들이 기다리고 있어요" 느낌
 * - 긍정적 경쟁: 다른 멤버 활동에 자극
 */
export function useGroupRealtime({
  groupId,
  currentUserId,
  onNewSharedNote,
  onMemberJoined,
  onMemberLeft,
  onEvent,
  showToast = true,
  onConnectionChange,
}: UseGroupRealtimeOptions): UseGroupRealtimeReturn {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // 이벤트 핸들러
  const handleSharedNoteInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      // 자신의 변경은 무시
      if (payload.new?.shared_by === currentUserId) {
        return;
      }

      const event: RealtimeEvent = {
        type: "INSERT",
        table: "group_notes",
        payload: payload.new,
        timestamp: new Date(),
      };

      setLastEvent(event);
      onEvent?.(event);
      onNewSharedNote?.(payload.new);

      // 토스트 알림
      if (showToast && payload.new) {
        toast.info(t("groupRealtime.newNoteShared"), {
          description: t("groupRealtime.newNoteSharedDesc"),
          duration: 5000,
        });
      }
    },
    [currentUserId, onNewSharedNote, onEvent, showToast, t]
  );

  const handleMemberInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      // 자신의 변경은 무시
      if (payload.new?.user_id === currentUserId) {
        return;
      }

      // 승인된 멤버만 알림
      if (payload.new?.status !== "approved") {
        return;
      }

      const event: RealtimeEvent = {
        type: "INSERT",
        table: "group_members",
        payload: payload.new,
        timestamp: new Date(),
      };

      setLastEvent(event);
      onEvent?.(event);
      onMemberJoined?.(payload.new);

      // 토스트 알림
      if (showToast) {
        toast.info(t("groupRealtime.newMemberJoined"), {
          duration: 4000,
        });
      }
    },
    [currentUserId, onMemberJoined, onEvent, showToast, t]
  );

  const handleMemberDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      // 자신의 변경은 무시
      const oldData = payload.old as any;
      if (oldData?.user_id === currentUserId) {
        return;
      }

      const event: RealtimeEvent = {
        type: "DELETE",
        table: "group_members",
        payload: oldData,
        timestamp: new Date(),
      };

      setLastEvent(event);
      onEvent?.(event);
      onMemberLeft?.(oldData);

      // 토스트는 표시하지 않음 (탈퇴/강퇴는 민감할 수 있음)
    },
    [currentUserId, onMemberLeft, onEvent]
  );

  // 채널 구독
  const subscribe = useCallback(() => {
    if (!groupId) return;

    const supabase = supabaseRef.current;
    const channelName = `group-realtime-${groupId}`;

    // 기존 채널이 있으면 정리
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 새 채널 생성 및 구독
    const channel = supabase
      .channel(channelName)
      // 기록 공유 이벤트
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_notes",
          filter: `group_id=eq.${groupId}`,
        },
        handleSharedNoteInsert
      )
      // 멤버 가입 이벤트
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        handleMemberInsert
      )
      // 멤버 상태 변경 (승인됨)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // 승인 상태로 변경된 경우
          if (
            payload.new?.status === "approved" &&
            payload.old?.status === "pending"
          ) {
            handleMemberInsert(payload);
          }
        }
      )
      // 멤버 탈퇴/강퇴 이벤트
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        handleMemberDelete
      )
      .subscribe((status: string) => {
        const connected = status === "SUBSCRIBED";
        setIsConnected(connected);
        onConnectionChange?.(connected);

        if (status === "CHANNEL_ERROR") {
          console.error("[useGroupRealtime] 채널 오류:", channelName);
        }
      });

    channelRef.current = channel;
  }, [
    groupId,
    handleSharedNoteInsert,
    handleMemberInsert,
    handleMemberDelete,
    onConnectionChange,
  ]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      const supabase = supabaseRef.current;
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
      onConnectionChange?.(false);
    }
  }, [onConnectionChange]);

  // 재연결
  const reconnect = useCallback(() => {
    disconnect();
    subscribe();
  }, [disconnect, subscribe]);

  // 마운트 시 구독 시작
  useEffect(() => {
    subscribe();

    return () => {
      disconnect();
    };
  }, [subscribe, disconnect]);

  return {
    isConnected,
    lastEvent,
    reconnect,
    disconnect,
  };
}

/**
 * 그룹 활동 피드 실시간 구독 훅
 * 여러 그룹의 활동을 한 번에 구독합니다.
 */
export function useMultiGroupRealtime(
  groupIds: string[],
  options: Omit<UseGroupRealtimeOptions, "groupId">
) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const supabaseRef = useRef(createClient());

  const handleEvent = useCallback((event: RealtimeEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50)); // 최대 50개 유지
    options.onEvent?.(event);
  }, [options]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    // 모든 그룹에 대해 채널 구독
    groupIds.forEach((groupId) => {
      if (channelsRef.current.has(groupId)) return;

      const channel = supabase
        .channel(`multi-group-${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_notes",
            filter: `group_id=eq.${groupId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload.new?.shared_by !== options.currentUserId) {
              handleEvent({
                type: "INSERT",
                table: "group_notes",
                payload: { ...payload.new, group_id: groupId },
                timestamp: new Date(),
              });
            }
          }
        )
        .subscribe();

      channelsRef.current.set(groupId, channel);
    });

    // 제거된 그룹 채널 정리
    channelsRef.current.forEach((channel, groupId) => {
      if (!groupIds.includes(groupId)) {
        supabase.removeChannel(channel);
        channelsRef.current.delete(groupId);
      }
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [groupIds, options.currentUserId, handleEvent]);

  return {
    events,
    clearEvents: () => setEvents([]),
  };
}
