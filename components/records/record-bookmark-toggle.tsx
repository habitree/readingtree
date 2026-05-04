"use client";

import { Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  text: string;
  onTextChange: (v: string) => void;
  page: number | null;
  onPageChange: (v: number | null) => void;
  defaultPage?: number;
  disabled?: boolean;
  maxPages?: number | null;
}

const TEXT_MAX = 200;

export function RecordBookmarkToggle({
  enabled,
  onEnabledChange,
  text,
  onTextChange,
  page,
  onPageChange,
  defaultPage,
  disabled,
  maxPages,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-amber-500" />
          <Label htmlFor="record-bookmark-toggle" className="cursor-pointer text-sm font-medium">
            북마크 추가
          </Label>
        </div>
        <Switch
          id="record-bookmark-toggle"
          checked={enabled}
          onCheckedChange={(v) => {
            onEnabledChange(v);
            if (v && page === null && typeof defaultPage === "number") {
              onPageChange(defaultPage);
            }
          }}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/30 dark:bg-amber-950/10">
          <div className="space-y-1">
            <Label htmlFor="record-bookmark-text" className="text-xs text-slate-600 dark:text-slate-400">
              한 줄 메모 (선택)
            </Label>
            <Input
              id="record-bookmark-text"
              placeholder="다음에 이어볼 곳"
              value={text}
              onChange={(e) => onTextChange(e.target.value.slice(0, TEXT_MAX))}
              maxLength={TEXT_MAX}
              disabled={disabled}
              className="h-9"
            />
            <p className="text-right text-[10px] text-slate-400">
              {text.length}/{TEXT_MAX}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="record-bookmark-page" className="text-xs text-slate-600 dark:text-slate-400">
              페이지
            </Label>
            <Input
              id="record-bookmark-page"
              type="number"
              inputMode="numeric"
              min={0}
              max={maxPages ?? undefined}
              value={page ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  onPageChange(null);
                  return;
                }
                const num = Number(v);
                onPageChange(Number.isFinite(num) && num >= 0 ? num : null);
              }}
              disabled={disabled}
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}
