"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  type NotificationRecord,
} from "@/app/actions/notifications";

const POLL_INTERVAL_MS = 60_000;

interface UseNotificationsRealtimeOptions {
  userId: string | null;
  /** 초기 로딩 시 가져올 개수 (기본 20) */
  limit?: number;
}

interface UseNotificationsRealtimeReturn {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

/**
 * 인앱 알림 실시간 구독 훅.
 *
 * - Realtime INSERT 이벤트 구독
 * - `visibilitychange` 복귀 시 1회 폴링
 * - Realtime 연결 실패 시 60초 폴링 fallback
 */
export function useNotificationsRealtime({
  userId,
  limit = 20,
}: UseNotificationsRealtimeOptions): UseNotificationsRealtimeReturn {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [listResult, count] = await Promise.all([
        listNotifications({ limit }),
        getUnreadNotificationCount(),
      ]);
      if (listResult.success) {
        setNotifications(listResult.data);
      }
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  const markAsRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setNotifications((prev) =>
        prev.map((n) =>
          ids.includes(n.id) && !n.read_at
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
      await markNotificationsAsRead(ids);
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(() => {
      refresh();
    }, POLL_INTERVAL_MS);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const subscribe = useCallback(() => {
    if (!userId) return;

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<NotificationRecord>) => {
          const newNotification = payload.new as NotificationRecord;
          setNotifications((prev) => [newNotification, ...prev].slice(0, limit));
          if (!newNotification.read_at) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<NotificationRecord>) => {
          const updated = payload.new as NotificationRecord;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .subscribe((status: string) => {
        const connected = status === "SUBSCRIBED";
        setIsConnected(connected);
        if (connected) {
          stopPolling();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startPolling();
        }
      });

    channelRef.current = channel;
  }, [userId, limit, startPolling, stopPolling]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refresh();
    subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopPolling();
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, refresh, subscribe, stopPolling]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
    isConnected,
  };
}
