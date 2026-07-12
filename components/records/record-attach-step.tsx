"use client";

/**
 * RecordSheet - Attach Step (기록 기획 12 · Phase B)
 *
 * 기존 reading_log(완료된 시간 기록)에 사진/페이지/메모를 사후 첨부한다.
 *  - 사진 있음 → attachStampToLog → 스탬프로 승격 (promoted_at 최초 1회 설정)
 *  - 사진 없음 → updateReadingLogEntry (페이지·메모만 수정)
 *
 * "별도 스탬프"가 아니라 "시간 기록 이후 사진을 더해 스탬프가 된다"는
 * 단일 흐름의 사후 진입점. 포인트는 추가 적립하지 않음(D4).
 *
 * 마운트 시 기존 로그(메모·사진·페이지)를 불러와 프리필한다 — 시간만 남긴
 * 기록에 상세를 "추가"할 때 기존 값이 빈 폼으로 덮어써지지 않도록.
 */

import { useEffect, useState, useTransition } from "react";
import { Camera, Clock, Loader2, Save, Stamp as StampIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  attachStampToLog,
  deleteProgressLog,
  getReadingLogForEdit,
  updateReadingLogEntry,
} from "@/app/actions/progress";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { useStampShareStore } from "@/hooks/use-stamp-share";
import { RecordPhotoStrip } from "./record-photo-strip";

const MEMO_MAX = 200;
const PAGE_PRESETS = [5, 10, 20, 30] as const;

/** "1시간 5분" / "32분" / "1분 미만" */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

interface Props {
  logId: string;
  selectedBook: RecordSheetBook | null;
  prefillStartPage: number | null;
  prefillEndPage: number | null;
}

export function RecordAttachStep({ logId, selectedBook, prefillStartPage, prefillEndPage }: Props) {
  const { close, reset } = useRecordSheetStore();
  const openStampShare = useStampShareStore((s) => s.openShare);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [startPage, setStartPage] = useState<number>(prefillStartPage ?? 0);
  const [endPage, setEndPage] = useState<number>(prefillEndPage ?? prefillStartPage ?? 0);
  const [memo, setMemo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** 기존 로그 요약 (독서 시간·날짜 표시용) */
  const [existingInfo, setExistingInfo] = useState<{
    durationSeconds: number;
    createdAt: string;
  } | null>(null);

  // prefill은 마운트 시 초기값으로만 사용. 대상 로그가 바뀌면 RecordSheet가
  // key={targetLogId}로 본 컴포넌트를 재마운트하므로 effect 동기화 불필요.

  // 기존 로그 로드 — 메모·사진·페이지 프리필. 사용자가 이미 입력한 값은 보존.
  useEffect(() => {
    let cancelled = false;
    getReadingLogForEdit(logId)
      .then((log) => {
        if (cancelled || !log) return;
        setExistingInfo({
          durationSeconds: log.reading_duration_seconds ?? 0,
          createdAt: log.created_at,
        });
        if (log.memo) {
          setMemo((prev) => (prev === "" ? log.memo!.slice(0, MEMO_MAX) : prev));
        }
        const existingImages = Array.isArray(log.image_urls) && log.image_urls.length > 0
          ? log.image_urls
          : log.image_url
            ? [log.image_url]
            : [];
        if (existingImages.length > 0) {
          setImageUrls((prev) => (prev.length === 0 ? existingImages : prev));
        }
        if (prefillStartPage == null && typeof log.start_page === "number") {
          setStartPage((prev) => (prev === 0 ? (log.start_page ?? 0) : prev));
        }
        if (prefillEndPage == null) {
          const existingEnd = log.end_page ?? log.page_number ?? null;
          const initialEnd = prefillStartPage ?? 0;
          if (typeof existingEnd === "number" && existingEnd > 0) {
            setEndPage((prev) => (prev === initialEnd ? existingEnd : prev));
          }
        }
      })
      .catch(() => {
        // 로드 실패 시 빈 폼으로 진행 (저장은 여전히 가능)
      });
    return () => {
      cancelled = true;
    };
  }, [logId, prefillStartPage, prefillEndPage]);

  const hasImage = imageUrls.length > 0;
  const pagesRead = Math.max(0, endPage - startPage);

  const adjustEndPage = (delta: number) => {
    setEndPage((prev) => Math.max(startPage, prev + delta));
  };

  const handleSave = () => {
    if (endPage < startPage) {
      toast.error("끝 페이지는 시작 페이지 이상이어야 합니다.");
      return;
    }
    startTransition(async () => {
      try {
        if (hasImage) {
          // 사진 첨부 — 스탬프 승격 (페이지·메모 함께 갱신)
          const result = await attachStampToLog(logId, {
            image_urls: imageUrls,
            start_page: startPage,
            end_page: endPage,
            memo: memo.trim() || undefined,
          });
          toast.success("스탬프를 남겼어요!", {
            duration: 5000,
            action: {
              label: "공유",
              onClick: () =>
                openStampShare(result.logId, { bookTitle: selectedBook?.title ?? null }),
            },
          });
        } else {
          // 사진 없이 — 페이지·메모만 수정
          await updateReadingLogEntry(logId, {
            memo: memo.trim() || null,
            start_page: startPage,
            end_page: endPage,
          });
          toast.success("기록을 수정했어요.");
        }
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "저장에 실패했어요.");
      }
    });
  };

  // 편집 화면에서 바로 삭제 — 확인 후 reading_log 삭제, 시트 닫힘 → 피드 갱신
  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProgressLog(logId);
        toast.success("기록을 삭제했어요.");
        setConfirmDelete(false);
        reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했어요.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 책 표시 */}
      {selectedBook && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
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
        </div>
      )}

      {/* 편집 대상 기록 요약 — 어떤 기록에 상세를 더하는지 표시 */}
      {existingInfo && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {existingInfo.durationSeconds > 0
              ? `독서 시간 ${formatDuration(existingInfo.durationSeconds)}`
              : "시간 기록 없음"}
            {existingInfo.createdAt && ` · ${formatDateLabel(existingInfo.createdAt)}`}
          </span>
        </div>
      )}

      {/* 사진 (attach의 핵심 — 항상 펼침) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Camera className="h-4 w-4" />
          사진 <span className="text-xs text-slate-400">(최대 5장 · 첫 장이 대표 · 추가하면 스탬프가 돼요)</span>
        </Label>
        <RecordPhotoStrip urls={imageUrls} onChange={setImageUrls} disabled={isPending} />
      </div>

      {/* 페이지 구간 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          페이지 <span className="text-xs text-slate-400">(읽은 분량: {pagesRead}p)</span>
        </Label>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs text-slate-500">시작</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={startPage}
              onChange={(e) => {
                const v = Number(e.target.value);
                setStartPage(Number.isFinite(v) && v >= 0 ? v : 0);
              }}
              disabled={isPending}
            />
          </div>
          <span className="pb-2 text-slate-400">→</span>
          <div className="flex-1">
            <Label className="text-xs text-slate-500">끝</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={startPage}
              max={selectedBook?.totalPages ?? undefined}
              value={endPage}
              onChange={(e) => {
                const v = Number(e.target.value);
                setEndPage(Number.isFinite(v) ? v : startPage);
              }}
              disabled={isPending}
              className="text-lg font-semibold"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PAGE_PRESETS.map((delta) => (
            <Button
              key={delta}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustEndPage(delta)}
              disabled={isPending}
            >
              +{delta}p
            </Button>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="record-attach-memo" className="text-sm">
          간단 메모 <span className="text-xs text-slate-400">(선택)</span>
        </Label>
        <Textarea
          id="record-attach-memo"
          placeholder="이 기록에 남길 짧은 메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, MEMO_MAX))}
          maxLength={MEMO_MAX}
          className="h-20 resize-none"
          disabled={isPending}
        />
        <p className="text-right text-xs text-slate-400">
          {memo.length}/{MEMO_MAX}
        </p>
      </div>

      {/* 액션 */}
      <div className="flex gap-2 pb-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => close()}
          disabled={isPending}
          className="flex-1"
        >
          <X className="mr-1 h-4 w-4" />
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
          ) : hasImage ? (
            <StampIcon className="mr-1 h-4 w-4" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          {hasImage ? "스탬프 남기기" : "저장"}
        </Button>
      </div>

      {/* 삭제 — 편집 화면에서 바로 이 기록을 지울 수 있음 */}
      <div className="flex justify-center pb-2">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          이 기록 삭제
        </button>
      </div>

      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 기록을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasImage
                ? "사진이 첨부된 기록도 함께 삭제됩니다. 되돌릴 수 없어요."
                : "삭제한 기록은 되돌릴 수 없어요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
