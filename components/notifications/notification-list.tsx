"use client";

import { BellOff, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./notification-item";
import type { NotificationRecord } from "@/app/actions/notifications";

export interface NotificationListProps {
  notifications: NotificationRecord[];
  loading: boolean;
  unreadCount: number;
  onActivate: (notification: NotificationRecord) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationList({
  notifications,
  loading,
  unreadCount,
  onActivate,
  onMarkAllAsRead,
}: NotificationListProps) {
  return (
    <div className="flex w-80 flex-col overflow-hidden sm:w-96">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">알림</p>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              읽지 않은 알림 {unreadCount}개
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            모두 읽음
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BellOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">알림이 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">
            모임·댓글·완독 소식이 생기면 여기에 표시돼요.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[60vh]">
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onActivate={onActivate}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
