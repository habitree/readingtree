"use client";

import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BookCheck,
  FileText,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
  Bell,
  CircleCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { NotificationKind, NotificationRecord } from "@/app/actions/notifications";

const KIND_META: Record<
  NotificationKind,
  { icon: typeof Bell; bg: string; fg: string }
> = {
  group_invite: {
    icon: Users,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    fg: "text-blue-600 dark:text-blue-400",
  },
  note_comment: {
    icon: MessageCircle,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    fg: "text-emerald-600 dark:text-emerald-400",
  },
  points_milestone: {
    icon: Sparkles,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    fg: "text-amber-600 dark:text-amber-400",
  },
  level_up: {
    icon: Trophy,
    bg: "bg-purple-100 dark:bg-purple-900/30",
    fg: "text-purple-600 dark:text-purple-400",
  },
  completion_celebration: {
    icon: BookCheck,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    fg: "text-emerald-600 dark:text-emerald-400",
  },
  report_ready: {
    icon: FileText,
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    fg: "text-indigo-600 dark:text-indigo-400",
  },
  mission_reminder: {
    icon: CircleCheck,
    bg: "bg-rose-100 dark:bg-rose-900/30",
    fg: "text-rose-600 dark:text-rose-400",
  },
  system: {
    icon: Bell,
    bg: "bg-slate-100 dark:bg-slate-800",
    fg: "text-slate-600 dark:text-slate-300",
  },
};

export interface NotificationItemProps {
  notification: NotificationRecord;
  onActivate: (notification: NotificationRecord) => void;
}

export function NotificationItem({ notification, onActivate }: NotificationItemProps) {
  const meta = KIND_META[notification.kind] ?? KIND_META.system;
  const Icon = meta.icon;
  const isUnread = !notification.read_at;

  const relativeTime = (() => {
    try {
      return formatDistanceToNowStrict(new Date(notification.created_at), {
        locale: ko,
        addSuffix: true,
      });
    } catch {
      return "";
    }
  })();

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        isUnread
          ? "bg-primary/5 hover:bg-primary/10"
          : "hover:bg-muted/40",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          meta.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", meta.fg)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime}</p>
      </div>
      {isUnread && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
          aria-label="읽지 않음"
        />
      )}
    </div>
  );

  if (notification.action_url) {
    return (
      <Link
        href={notification.action_url}
        onClick={() => onActivate(notification)}
        className="block focus:bg-muted/60 focus:outline-none"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className="block w-full text-left focus:bg-muted/60 focus:outline-none"
    >
      {content}
    </button>
  );
}
