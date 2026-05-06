"use client";

/**
 * RecordSheet - End Step
 * 진행 중 세션 종료 — 끝 페이지·메모·북마크·사진들 입력 → endReadingSession.
 */

import { useState, useTransition } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelActiveSession, endReadingSession } from "@/app/actions/sessions";
import { broadcastSessionCancelled, broadcastSessionEnded, useReadingSession } from "@/hooks/use-reading-session";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { RecordBookmarkToggle } from "./record-bookmark-toggle";
import { RecordPhotoStrip } from "./record-photo-strip";

const MEMO_MAX = 200;

interface Props {
  sessionId: string;
  selectedBook: RecordSheetBook | null;
  prefillEndPage: number | null;
  /** 종료 후 상세 추가 단계로 이동할지 결정 */
  onSavedRequestDetail: (sessionId: string) => void;
}

export function RecordEndStep({ sessionId, selectedBook, prefillEndPage, onSavedRequestDetail }: Props) {
  const { session, elapsedSeconds, broadcastEnd } = useReadingSession();
  // derived state: 사용자 override가 있으면 그 값, 없으면 prefill/세션에서 자동 계산
  const [endPageOverride, setEndPageOverride] = useState<number | null>(null);
  const [memo, setMemo] = useState("");
  const [bookmarkEnabled, setBookmarkEnabled] = useState(false);
  const [bookmarkText, setBookmarkText] = useState("");
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancel] = useTransition();
  const { close } = useRecordSheetStore();

  const startPage = session?.start_page ?? 0;
  const defaultEndPage =
    prefillEndPage ?? session?.end_page ?? session?.start_page ?? 0;
  const endPage = endPageOverride ?? defaultEndPage;

  const handleSave = (afterSave: "close" | "detail") => {
    if (endPage < startPage) {
      toast.error("끝 페이지는 시작 페이지 이상이어야 합니다.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await endReadingSession({
          session_id: sessionId,
          end_page: endPage,
          memo: memo.trim() || undefined,
          bookmark_text: bookmarkEnabled ? bookmarkText.trim() || undefined : undefined,
          bookmark_page: bookmarkEnabled ? bookmarkPage ?? undefined : undefined,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          is_public: true,
        });
        broadcastEnd(result.sessionId);
        broadcastSessionEnded(result.sessionId);

        if (result.discarded) {
          // 3분 미만 + 메모·사진·북마크 모두 없음 → 자동 폐기 (행 삭제됨)
          toast.info("3분 미만의 단순 시간 기록은 저장하지 않았어요.", {
            description: "메모·사진·북마크가 있으면 짧아도 그대로 저장돼요.",
            duration: 4000,
          });
          close();
          return;
        }

        const minutes = Math.round(result.durationSeconds / 60);
        const pagesRead = Math.max(0, endPage - startPage);
        const pointsLabel = result.pointsEarned ? ` +${result.pointsEarned}p` : "";
        toast.success(
          result.promotedToStamp
            ? `스탬프 +1 · ${minutes}분 · ${pagesRead}p${pointsLabel}`
            : `기록 저장 · ${minutes}분 · ${pagesRead}p${pointsLabel}`,
          { duration: 4000 },
        );

        if (afterSave === "detail") {
          onSavedRequestDetail(result.sessionId);
        } else {
          close();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "저장에 실패했어요.");
      }
    });
  };

  const handleCancel = () => {
    startCancel(async () => {
      try {
        const result = await cancelActiveSession(sessionId);
        broadcastSessionCancelled(sessionId);
        if (result.deleted) {
          toast.success("기록을 취소했어요");
        } else if (result.abandoned) {
          toast.success("기록을 취소했어요 (시간은 보존됨)");
        }
        close();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "취소에 실패했어요.");
      }
    });
  };

  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;

  return (
    <div className="space-y-5">
      {/* 책·경과 시간 표시 */}
      {selectedBook && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selectedBook.title}
            </p>
            {selectedBook.author && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {selectedBook.author}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">경과</p>
            <p className="text-lg font-semibold text-emerald-600 tabular-nums">
              {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
            </p>
          </div>
        </div>
      )}

      {/* 끝 페이지 */}
      <div className="space-y-2">
        <Label htmlFor="record-end-page" className="text-sm font-medium">
          끝 페이지 <span className="text-xs text-slate-400">(시작: {startPage}p)</span>
        </Label>
        <Input
          id="record-end-page"
          type="number"
          inputMode="numeric"
          min={startPage}
          max={selectedBook?.totalPages ?? undefined}
          value={endPage}
          onChange={(e) => {
            const v = Number(e.target.value);
            setEndPageOverride(Number.isFinite(v) ? v : startPage);
          }}
          disabled={isPending || isCancelling}
          className="text-lg font-semibold"
        />
        <p className="text-xs text-slate-400">읽은 페이지: {Math.max(0, endPage - startPage)}p</p>
      </div>

      {/* 간단 메모 */}
      <div className="space-y-2">
        <Label htmlFor="record-end-memo" className="text-sm">
          간단 메모 <span className="text-xs text-slate-400">(선택)</span>
        </Label>
        <Textarea
          id="record-end-memo"
          placeholder="오늘 읽은 부분의 짧은 인상"
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
          maxLength={MEMO_MAX}
          className="h-20 resize-none"
          disabled={isPending || isCancelling}
        />
        <p className="text-right text-xs text-slate-400">
          {memo.length}/{MEMO_MAX}
        </p>
      </div>

      {/* 북마크 */}
      <RecordBookmarkToggle
        enabled={bookmarkEnabled}
        onEnabledChange={setBookmarkEnabled}
        text={bookmarkText}
        onTextChange={setBookmarkText}
        page={bookmarkPage}
        onPageChange={setBookmarkPage}
        defaultPage={endPage}
        disabled={isPending || isCancelling}
        maxPages={selectedBook?.totalPages ?? null}
      />

      {/* 사진들 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">사진 <span className="text-xs text-slate-400">(최대 5장)</span></Label>
        <RecordPhotoStrip urls={imageUrls} onChange={setImageUrls} disabled={isPending || isCancelling} />
      </div>

      {/* 액션 */}
      <div className="space-y-2 pt-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave("close")}
            disabled={isPending || isCancelling}
            className="flex-1"
          >
            {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            저장
          </Button>
          <Button
            type="button"
            onClick={() => handleSave("detail")}
            disabled={isPending || isCancelling}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            저장 + 상세 기록
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isPending || isCancelling}
          className="w-full text-xs text-slate-500 hover:text-red-600"
        >
          {isCancelling ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
          기록 취소
        </Button>
      </div>
    </div>
  );
}
