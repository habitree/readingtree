"use client";

/**
 * RecordSheet - Detail Step
 * 상세기록(quote/memo/transcription) 작성 → addNoteToSession.
 * sessionId NULL = 자유 상세 (D3).
 */

import { useState, useTransition } from "react";
import { Loader2, Save, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { smartCompressImage } from "@/lib/utils/image";
import { addNoteToSession } from "@/app/actions/sessions";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { useStampShareStore } from "@/hooks/use-stamp-share";
import type { DetailKind } from "@/types/note";
import { BookPageScanner } from "./book-page-scanner";

const QUOTE_MAX = 5000;
const MEMO_MAX = 10000;

const KINDS: { value: DetailKind; label: string; description: string }[] = [
  { value: "quote", label: "인상깊은 구절", description: "책에서 옮겨 적은 문장" },
  { value: "memo", label: "내 생각", description: "독서 후 떠오른 길게 남기는 메모" },
  { value: "review", label: "독후감·리뷰", description: "책 전체에 대한 긴 글(출력)" },
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedImageUrl, setScannedImageUrl] = useState<string | undefined>(undefined);
  const { close } = useRecordSheetStore();
  const openStampShare = useStampShareStore((s) => s.openShare);

  /**
   * 스캐너에서 받은 페이지들을 업로드 → 동기 OCR → 텍스트 결합.
   * 첫 페이지 이미지는 기록의 image_url 로 저장한다(필사 증빙).
   */
  const handleScanComplete = async (files: File[]) => {
    if (files.length === 0) return;
    setScanning(true);
    const texts: string[] = [];
    let firstUrl = scannedImageUrl;
    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        try {
          file = await smartCompressImage(files[i], {
            compressionThreshold: 1024 * 1024,
            maxWidth: 1920,
            maxHeight: 1920,
            targetSizeBytes: 1024 * 1024,
            minQuality: 0.5,
            maxQuality: 0.92,
            verbose: false,
          });
        } catch {
          file = files[i];
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "transcription");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          toast.warning(`${i + 1}페이지 업로드에 실패했어요.`);
          continue;
        }
        const { url } = (await uploadRes.json()) as { url?: string };
        if (!url) continue;
        if (!firstUrl) firstUrl = url;

        const ocrRes = await fetch("/api/ocr/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        });
        if (ocrRes.ok) {
          const { text } = (await ocrRes.json()) as { text?: string };
          if (text && text.trim()) texts.push(text.trim());
        } else {
          const err = (await ocrRes.json().catch(() => ({}))) as { error?: string };
          toast.warning(err.error || `${i + 1}페이지 글자 인식에 실패했어요.`);
        }
      }

      if (firstUrl) setScannedImageUrl(firstUrl);

      if (texts.length > 0) {
        setQuoteContent((prev) => {
          const joined = texts.join("\n\n");
          const combined = prev.trim() ? `${prev.trim()}\n\n${joined}` : joined;
          return combined.slice(0, QUOTE_MAX);
        });
        toast.success(`${texts.length}페이지 텍스트를 불러왔어요. 필요하면 수정하세요.`);
      } else {
        toast.warning("인식된 텍스트가 없어요. 직접 입력해도 돼요.");
      }
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    // memo·review는 본문(memoContent), quote·transcription은 구절(quoteContent) 필요
    const usesMemoOnly = kind === "memo" || kind === "review";
    const hasContent = usesMemoOnly
      ? memoContent.trim().length > 0
      : quoteContent.trim().length > 0;

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
          image_url: kind === "transcription" ? scannedImageUrl : undefined,
          is_public: true,
        });
        const linkedSessionId = sessionId;
        toast.success(sessionId ? "상세 기록 연결됨" : "상세 기록 저장됨", {
          duration: 5000,
          // sessionId가 있으면 (방금 종료한 스탬프와 연결) 공유 액션 노출
          action: linkedSessionId
            ? {
                label: "공유",
                onClick: () =>
                  openStampShare(linkedSessionId, {
                    bookTitle: selectedBook?.title ?? null,
                  }),
              }
            : undefined,
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

      {/* 필사: 페이지 스캔 */}
      {kind === "transcription" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">페이지 스캔</p>
              <p className="text-xs text-slate-500">
                카메라로 책 페이지를 촬영하면 자동으로 텍스트를 인식해요. (최대 3페이지)
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setScannerOpen(true)}
              disabled={isPending || scanning}
              className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {scanning ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="mr-1 h-4 w-4" />
              )}
              {scanning ? "인식 중" : "스캔"}
            </Button>
          </div>
        </div>
      )}

      {/* 본문 */}
      {kind === "quote" || kind === "transcription" ? (
        <div className="space-y-2">
          <Label htmlFor="record-detail-quote" className="text-sm font-medium">
            구절
          </Label>
          <Textarea
            id="record-detail-quote"
            placeholder={
              kind === "transcription"
                ? "스캔하면 인식된 텍스트가 여기에 채워져요. 직접 입력·수정도 가능해요."
                : "책에서 옮겨 적을 문장"
            }
            value={quoteContent}
            onChange={(e) => setQuoteContent(e.target.value.slice(0, QUOTE_MAX))}
            maxLength={QUOTE_MAX}
            className="h-32 resize-none"
            disabled={isPending || scanning}
          />
          <p className="text-right text-xs text-slate-400">
            {quoteContent.length}/{QUOTE_MAX}
          </p>
        </div>
      ) : null}

      {(kind === "quote" || kind === "memo" || kind === "review") && (
        <div className="space-y-2">
          <Label htmlFor="record-detail-memo" className="text-sm font-medium">
            {kind === "memo" ? "내 생각" : kind === "review" ? "독후감·리뷰" : "내 생각 (선택)"}
          </Label>
          <Textarea
            id="record-detail-memo"
            placeholder={
              kind === "memo"
                ? "독서 후 떠오른 생각"
                : kind === "review"
                  ? "책 전체에 대한 감상과 평을 자유롭게 남겨보세요"
                  : "구절에 대한 짧은 메모"
            }
            value={memoContent}
            onChange={(e) => setMemoContent(e.target.value.slice(0, MEMO_MAX))}
            maxLength={MEMO_MAX}
            className={cn(
              kind === "review" ? "h-48" : kind === "memo" ? "h-40" : "h-24",
              "resize-none",
            )}
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

      {/* 페이지 스캐너 (필사) */}
      <BookPageScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCapture={handleScanComplete}
        maxPages={3}
      />
    </div>
  );
}
