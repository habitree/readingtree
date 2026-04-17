"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useNotificationsRealtime } from "@/hooks/use-notifications-realtime";
import { NotificationList } from "./notification-list";
import type { NotificationRecord } from "@/app/actions/notifications";

/**
 * 헤더에 마운트되는 알림 벨.
 * 로그인 상태일 때만 렌더된다.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsRealtime({ userId: user?.id ?? null });

  if (!user) return null;

  const handleActivate = (notification: NotificationRecord) => {
    if (!notification.read_at) {
      void markAsRead([notification.id]);
    }
    setOpen(false);
  };

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-10 sm:w-10"
          aria-label={`알림${unreadCount > 0 ? ` (${unreadCount}개)` : ""}`}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white shadow-sm",
                unreadCount > 9 ? "text-[9px]" : undefined,
              )}
              aria-hidden
            >
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto overflow-hidden p-0"
      >
        <NotificationList
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onActivate={handleActivate}
          onMarkAllAsRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  );
}
