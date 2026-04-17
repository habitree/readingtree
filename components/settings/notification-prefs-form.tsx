"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/toast";
import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/app/actions/notifications";

const TOGGLES: {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}[] = [
  {
    key: "group_invite",
    label: "모임 초대 수신",
    description: "새 모임 초대를 받았을 때",
  },
  {
    key: "note_comment",
    label: "내 기록 댓글",
    description: "내가 공유한 기록에 댓글이 달렸을 때",
  },
  {
    key: "points_milestone",
    label: "포인트 마일스톤",
    description: "1000P 배수를 달성했을 때",
  },
  {
    key: "level_up",
    label: "레벨업",
    description: "새로운 레벨에 도달했을 때",
  },
  {
    key: "completion_celebration",
    label: "완독 축하",
    description: "책을 완독했을 때 축하 알림",
  },
  {
    key: "report_ready",
    label: "AI 리포트 완료",
    description: "AI 독서 리포트 생성이 끝났을 때",
  },
  {
    key: "mission_reminder",
    label: "일일 미션 리마인더",
    description: "오늘 미션이 아직 남아있을 때 (저녁 9시)",
  },
  {
    key: "group_all_comments",
    label: "모임 전체 댓글",
    description: "내 기록이 아니어도 모임 내 모든 댓글",
  },
];

export interface NotificationPrefsFormProps {
  initial: NotificationPrefs;
}

export function NotificationPrefsForm({ initial }: NotificationPrefsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, startTransition] = useTransition();

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);

    startTransition(async () => {
      const result = await updateNotificationPrefs({ [key]: value });
      if (!result.success) {
        setPrefs(previous);
        notify.error(result.message || "저장에 실패했어요");
      }
    });
  };

  return (
    <div className="divide-y">
      {TOGGLES.map(({ key, label, description }) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <Label
              htmlFor={`pref-${key}`}
              className="text-sm font-medium cursor-pointer"
            >
              {label}
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch
            id={`pref-${key}`}
            checked={prefs[key]}
            disabled={pending}
            onCheckedChange={(value) => handleToggle(key, value)}
          />
        </div>
      ))}
    </div>
  );
}
