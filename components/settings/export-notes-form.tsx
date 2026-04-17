"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { exportNotesAsMarkdown } from "@/app/actions/export";

type Scope = "all" | "month";

function currentYearMonth(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
}

export function ExportNotesForm() {
  const [scope, setScope] = useState<Scope>("all");
  const [month, setMonth] = useState(currentYearMonth());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options = scope === "month" ? { month } : undefined;
      const result = await exportNotesAsMarkdown(options);
      if (!result.success) {
        notify.error(result.message || "내보내기에 실패했어요");
        return;
      }

      if (result.data.noteCount === 0) {
        notify.info("내보낼 기록이 없어요", {
          description: "기간에 해당하는 기록이 존재하지 않아요.",
        });
        return;
      }

      const blob = new Blob([result.data.markdown], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.data.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      notify.success(`${result.data.noteCount}개의 기록을 내보냈어요`, {
        description: result.data.filename,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium">범위</Label>
        <div className="mt-2 grid gap-2">
          {(
            [
              {
                value: "all" as const,
                title: "전체 기록",
                description: "서재에 있는 모든 기록을 하나의 파일로 받아요. (최대 5000건)",
              },
              {
                value: "month" as const,
                title: "특정 월",
                description: "YYYY-MM 형식으로 지정해요.",
              },
            ]
          ).map((item) => {
            const checked = scope === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setScope(item.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
                role="radio"
                aria-checked={checked}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    checked
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40",
                  )}
                >
                  {checked && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                </span>
                <div className="w-full">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  {item.value === "month" && scope === "month" && (
                    <Input
                      type="month"
                      value={month}
                      onChange={(e) => {
                        e.stopPropagation();
                        setMonth(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full max-w-[220px]"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="gap-2"
        size="lg"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Markdown으로 내보내기
      </Button>
    </div>
  );
}
