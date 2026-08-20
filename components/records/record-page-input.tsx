"use client";

/**
 * 진행 지점 입력 — 페이지(p) / 퍼센트(%) 전환 (REQ-0008)
 *
 * 이북 뷰어는 종이책 페이지 대신 %만 보여주는 경우가 많다. 그래서 입력만 %로 받고,
 * 저장 단위는 기존과 동일하게 **페이지 하나뿐**이다. % 는 percentToPage() 로 환산해
 * onChange 로 넘어가므로 DB·페이스·통계·공유는 전혀 바뀌지 않는다.
 *
 * 총 페이지가 없으면 환산 자체가 불가능하므로 % 입력 대신 TotalPagesEditor 로
 * 총 페이지 입력을 먼저 유도한다.
 */

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { computeProgressPercent, percentToPage } from "@/lib/reading/progress";
import { TotalPagesEditor } from "@/components/books/total-pages-editor";

type InputMode = "page" | "percent";

interface Props {
  id: string;
  label: ReactNode;
  /** 저장 단위 = 페이지 */
  value: number;
  onChange: (page: number) => void;
  totalPages: number | null;
  /** 페이지 입력이 비었거나 잘못됐을 때의 대체값 (시작 페이지 등) */
  fallback?: number;
  /** 페이지 입력의 HTML min 힌트. 저장 검증은 호출부가 그대로 담당한다 */
  min?: number;
  disabled?: boolean;
  /** 총 페이지 미등록 시 입력 유도 대상 (books.id). 없으면 유도 UI 미노출 */
  bookId?: string | null;
  onTotalPagesChange?: (totalPages: number | null) => void;
  /** 입력 하단 보조 문구 */
  hint?: ReactNode;
}

export function RecordPageInput({
  id,
  label,
  value,
  onChange,
  totalPages,
  fallback = 0,
  min = 0,
  disabled,
  bookId,
  onTotalPagesChange,
  hint,
}: Props) {
  const [mode, setMode] = useState<InputMode>("page");
  // 사용자가 타이핑 중인 % 원문. null이면 현재 페이지에서 역산해 표시한다.
  const [percentDraft, setPercentDraft] = useState<string | null>(null);

  const derivedPercent = computeProgressPercent(value, totalPages);
  const percentValue =
    percentDraft ?? (derivedPercent !== null ? String(derivedPercent) : "");

  const handleModeChange = (next: InputMode) => {
    setPercentDraft(null);
    setMode(next);
  };

  const handlePercentChange = (raw: string) => {
    setPercentDraft(raw);
    const v = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(v)) return;
    const page = percentToPage(v, totalPages);
    if (page !== null) onChange(page);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <div
          className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
          role="group"
          aria-label="입력 단위"
        >
          {(["page", "percent"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              disabled={disabled}
              aria-pressed={mode === m}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                mode === m
                  ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              {m === "page" ? "p" : "%"}
            </button>
          ))}
        </div>
      </div>

      {mode === "page" ? (
        <>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={totalPages ?? undefined}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange(Number.isFinite(v) && v >= 0 ? v : fallback);
            }}
            disabled={disabled}
            className="text-lg font-semibold"
          />
          {hint}
        </>
      ) : totalPages ? (
        <>
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={percentValue}
              onChange={(e) => handlePercentChange(e.target.value)}
              disabled={disabled}
              className="text-lg font-semibold"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
          <p className="text-xs text-slate-400">
            전체 {totalPages}p 기준 <span className="font-medium text-slate-500">{value}p</span> 로 저장돼요.
          </p>
          {hint}
        </>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            총 페이지를 알아야 %를 페이지로 바꿀 수 있어요.
          </p>
          {bookId && (
            <TotalPagesEditor
              bookId={bookId}
              totalPages={totalPages}
              onUpdate={(next) => onTotalPagesChange?.(next)}
            />
          )}
        </div>
      )}
    </div>
  );
}
