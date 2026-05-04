"use client";

/**
 * RecordSheet - Detail Step
 * 상세기록(quote/memo/transcription) 작성 → addNoteToSession.
 * sessionId NULL = 자유 상세 (D3).
 */

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addNoteToSession } from "@/app/actions/sessions";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import type { DetailKind } from "@/types/note";

const QUOTE_MAX = 5000;
const MEMO_MAX = 10000;

const KINDS: { value: DetailKind; label: string; description: string }[] = [
  { value: "quote", label: "인상깊은 구절", description: "책에서 옮겨 적은 문장" },
  { value: "memo", label: "내 생각", description: "독서 후 떠오른 길게 남기는 메모" },
  { value: "transcription", label: "필사", description: "사진을 OCR로 텍스트화" },
];

interface Props {
  sessionId: string | null;
  selectedBook: RecordSheetBook | null;
}

export function RecordDetailStep({ sessionId, selectedBook }: Props) {
  const [kind, setKind] = useState<DetailKind>("quote");
  const [quoteContent, setQuoteContent] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [pageNumber, setPageNumber] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { close } = useRecordSheetStore();

  const handleSave = () => {
    const hasContent =
      (kind !== "memo" && quoteContent.trim().length > 0) ||
      (kind === "memo" && memoContent.trim().length > 0) ||
      (kind === "transcription" && quoteContent.trim().length > 0);

    if (!hasContent) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await addNoteToSession(sessionId, {
          detail_kind: kind,
          quote_content: quoteContent.trim() || undefined,
          memo_content: memoContent.trim() || undefined,
          page_number: pageNumber.trim() || undefined,
          is_public: true,
        });
        toast.success(sessionId ? "상세 기록 연결됨" : "상세 기록 저장됨", {
          duration: 3000,
        });
        close();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "저장에 실패했어요.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 컨텍스트 */}
      {selectedBook ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <p className="text-xs text-slate-500">연결된 책</p>
          <p className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-white">
            {selectedBook.title}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          {sessionId ? "방금 종료한 기록과 연결됩니다." : "자유 상세 기록입니다 (책과 무관)."}
        </div>
      )}

      {/* 종류 선택 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">종류</Label>
        <div className="grid grid-cols-1 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              disabled={isPending}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                kind === k.value
                  ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
              )}
              aria-pressed={kind === k.value}
            >
              <span
                className={cn(
                  "mt-0.5 inline-block h-4 w-4 flex-shrink-0 rounded-full border-2",
                  kind === k.value ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
                )}
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-slate-900 dark:text-white">
                  {k.label}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {k.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      {kind === "quote" || kind === "transcription" ? (
        <div className="space-y-2">
          <Label htmlFor="record-detail-quote" className="text-sm font-medium">
            구절
          </Label>
          <Textarea
            id="record-detail-quote"
            placeholder="책에서 옮겨 적을 문장"
            value={quoteContent}
            onChange={(e) => setQuoteContent(e.target.value.slice(0, QUOTE_MAX))}
            maxLength={QUOTE_MAX}
            className="h-32 resize-none"
            disabled={isPending}
          />
          <p className="text-right text-xs text-slate-400">
            {quoteContent.length}/{QUOTE_MAX}
          </p>
        </div>
      ) : null}

      {(kind === "quote" || kind === "memo") && (
        <div className="space-y-2">
          <Label htmlFor="record-detail-memo" className="text-sm font-medium">
            {kind === "memo" ? "내 생각" : "내 생각 (선택)"}
          </Label>
          <Textarea
            id="record-detail-memo"
            placeholder={kind === "memo" ? "독서 후 떠오른 생각" : "구절에 대한 짧은 메모"}
            value={memoContent}
            onChange={(e) => setMemoContent(e.target.value.slice(0, MEMO_MAX))}
            maxLength={MEMO_MAX}
            className={cn(kind === "memo" ? "h-40" : "h-24", "resize-none")}
            disabled={isPending}
          />
          <p className="text-right text-xs text-slate-400">
            {memoContent.length}/{MEMO_MAX}
          </p>
        </div>
      )}

      {/* 페이지 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="record-detail-page" className="text-sm">
          페이지 <span className="text-xs text-slate-400">(선택)</span>
        </Label>
        <Input
          id="record-detail-page"
          type="text"
          inputMode="numeric"
          placeholder="예: 123 또는 123-125"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          disabled={isPending}
          className="h-10"
        />
      </div>

      {/* 액션 */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close} disabled={isPending} className="flex-1">
          취소
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          저장
        </Button>
      </div>
    </div>
  );
}
