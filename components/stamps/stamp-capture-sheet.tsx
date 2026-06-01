"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Globe,
  Share2,
  Stamp as StampIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStampCapture } from "@/hooks/use-stamp-capture";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { copyImageToClipboard } from "@/lib/utils/clipboard";
import { downloadImage, isMobile } from "@/lib/utils/device";
import {
  attachStampToLog,
  createReadingStamp,
  getLastEndPage,
  updateReadingLogEntry,
} from "@/app/actions/progress";
import { StampPreviewCard } from "./stamp-preview-card";
import { RecordPhotoStrip } from "@/components/records/record-photo-strip";

const DURATION_PRESETS = [10, 15, 25, 30, 45, 60, 90] as const;

/**
 * Stamp Composer (통합 시트)
 * - mode "create": 신규 reading_log 생성 (사진은 옵션, 토글로 펼침)
 * - mode "attach": 기존 reading_log 에 사진 첨부 → 스탬프로 승격
 *
 * 모바일: Bottom Sheet 풀스크린, 데스크톱: Sheet (max-w-2xl)
 */
export function StampCaptureSheet() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const store = useStampCapture();
  const [isPending, startTransition] = useTransition();

  const isAttachMode = store.mode === "attach";

  // 입력 상태
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [startPage, setStartPage] = useState<number>(0);
  const [endPage, setEndPage] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showStartPageEdit, setShowStartPageEdit] = useState(false);

  const shareCaptureRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [justShared, setJustShared] = useState(false);

  // 시트가 열릴 때마다 페이지 prefill
  useEffect(() => {
    if (!store.isOpen) return;

    // attach 모드: prefill 값 직접 사용
    if (isAttachMode) {
      setStartPage(store.prefillStartPage ?? 0);
      setEndPage(
        store.prefillEndPage ?? store.prefillStartPage ?? 0,
      );
      // attach 모드는 사진이 핵심이므로 사진 영역 자동 펼침
      setPhotoExpanded(true);
      return;
    }

    // create 모드: 책이 있으면 직전 end_page 자동 로드
    if (!store.selectedBook) {
      setStartPage(0);
      setEndPage(store.prefillEndPage ?? 0);
      return;
    }

    let cancelled = false;
    getLastEndPage(store.selectedBook.id)
      .then((page) => {
        if (cancelled) return;
        setStartPage(page);
        if (typeof store.prefillEndPage === "number") {
          setEndPage(store.prefillEndPage);
        } else {
          setEndPage(page + 10);
        }
      })
      .catch(() => {
        // 실패 시 0 유지
      });

    return () => {
      cancelled = true;
    };
  }, [
    store.isOpen,
    store.selectedBook,
    store.prefillEndPage,
    store.prefillStartPage,
    isAttachMode,
  ]);

  // prefillDuration 반영
  useEffect(() => {
    if (store.isOpen && typeof store.prefillDurationSeconds === "number") {
      const mins = Math.max(1, Math.round(store.prefillDurationSeconds / 60));
      setDurationMinutes(mins);
    }
  }, [store.isOpen, store.prefillDurationSeconds]);

  // 시트 닫힐 때 상태 초기화
  useEffect(() => {
    if (store.isOpen) return;
    setImageUrls([]);
    setPhotoExpanded(false);
    setMemo("");
    setIsPublic(true);
    setShowStartPageEdit(false);
  }, [store.isOpen]);

  const durationSeconds = durationMinutes * 60;

  const previewDate = useMemo(() => new Date(), [store.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustEndPage = (delta: number) => {
    setEndPage((prev) => Math.max(startPage, prev + delta));
  };

  const hasImage = imageUrls.length > 0;
  const coverUrl = imageUrls[0] ?? null;
  // attach 모드 — 사진 선택사항. 메모·페이지만 수정해도 저장 가능.
  const canSave = isAttachMode
    ? !isPending
    : !isPending && durationSeconds >= 30;

  const handleSave = () => {
    if (!user) {
      toast.error("로그인이 필요해요.");
      return;
    }

    // attach 모드 — 사진 있으면 스탬프 승격, 없으면 메모·페이지만 수정 저장
    if (isAttachMode) {
      if (!store.targetLogId) {
        toast.error("대상 기록을 찾을 수 없어요.");
        return;
      }

      startTransition(async () => {
        try {
          if (imageUrls.length > 0) {
            // 사진 첨부 — 스탬프 승격 (메모·페이지 함께 갱신)
            await attachStampToLog(store.targetLogId!, {
              image_urls: imageUrls,
              start_page: startPage,
              end_page: endPage,
              memo: memo.trim() || undefined,
            });
            toast.success(t("stamp.attachSaved"));
          } else {
            // 사진 없이 — 메모·페이지만 수정 저장
            await updateReadingLogEntry(store.targetLogId!, {
              memo: memo.trim() || null,
              start_page: startPage,
              end_page: endPage,
            });
            toast.success("기록을 수정했어요.");
          }
          store.reset();
        } catch (err) {
          const message = err instanceof Error ? err.message : t("stamp.attachFailed");
          toast.error(message);
        }
      });
      return;
    }

    // create 모드 — 신규 reading_log 생성
    if (durationSeconds < 30) {
      toast.error(t("stamp.minSecondsError"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReadingStamp({
          user_book_id: store.selectedBook?.id,
          end_page: endPage,
          start_page: startPage,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          memo: memo.trim() || undefined,
          is_public: isPublic,
          reading_duration_seconds: durationSeconds,
        });

        toast.success(hasImage ? t("stamp.savedWithPhoto") : t("stamp.saved"), {
          description: result.pointsEarned
            ? t("stamp.pointsEarned").replace("{{points}}", String(result.pointsEarned))
            : undefined,
          duration: 4000,
        });
        store.reset();
      } catch (err) {
        const message = err instanceof Error ? err.message : t("stamp.attachFailed");
        toast.error(message);
      }
    });
  };

  const previewImageUrl = coverUrl ?? undefined;

  /**
   * 미리보기 스탬프 카드를 1080×1080 PNG 로 캡처해서 공유.
   * Web Share API(files) 우선 — 모바일 시스템 시트로 카카오·인스타·메시지 즉시.
   * 폴백: 클립보드 복사 → 다운로드.
   */
  const handleShareCard = async () => {
    if (!shareCaptureRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const html2canvasModule = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = html2canvasModule.default as any;
      const target = shareCaptureRef.current;

      // 이미지 로딩 대기
      const images = target.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const t = setTimeout(() => resolve(), 5000);
            img.onload = () => {
              clearTimeout(t);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(t);
              resolve();
            };
          });
        }),
      );

      const isMobileDevice = isMobile();
      await new Promise((r) => setTimeout(r, isMobileDevice ? 1200 : 800));

      const CARD_SIZE = 540;
      const TARGET_SIZE = 1080;
      const scale = TARGET_SIZE / CARD_SIZE;
      const canvas = await html2canvas(target, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: isMobileDevice ? 20000 : 15000,
        windowWidth: CARD_SIZE,
        windowHeight: CARD_SIZE,
        width: CARD_SIZE,
        height: CARD_SIZE,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b: Blob | null) =>
            b && b.size > 0 ? resolve(b) : reject(new Error("이미지 변환 실패")),
          "image/png",
        );
      });

      const filename = `readtree-stamp-${Date.now()}.png`;

      // 1) Web Share API (파일 공유) — 모바일 우선
      const file = new File([blob], filename, { type: "image/png" });
      const navWithShare = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (
        navWithShare.share &&
        navWithShare.canShare &&
        navWithShare.canShare({ files: [file] })
      ) {
        try {
          await navWithShare.share({
            files: [file],
            title: store.selectedBook?.title
              ? `${store.selectedBook.title} 스탬프`
              : "ReadTree 스탬프",
            text: "ReadTree에서 만든 독서 스탬프 카드",
          });
          setJustShared(true);
          setTimeout(() => setJustShared(false), 2500);
          return;
        } catch (err) {
          // 사용자 취소(AbortError) → 추가 폴백 없이 종료
          if (err instanceof Error && err.name === "AbortError") return;
          // 다른 에러는 폴백으로 진행
        }
      }

      // 2) 클립보드 복사 폴백
      const clipboardOk = await copyImageToClipboard(blob, {
        onSuccess: () => {
          setJustShared(true);
          toast.success("스탬프 카드를 복사했어요. 인스타·카카오에 붙여넣기 해보세요.");
          setTimeout(() => setJustShared(false), 2500);
        },
      });
      if (clipboardOk) return;

      // 3) 다운로드 폴백
      downloadImage(blob, filename);
      setJustShared(true);
      toast.success("스탬프 이미지를 다운로드했어요.");
      setTimeout(() => setJustShared(false), 2500);
    } catch (err) {
      console.error("스탬프 카드 공유 실패:", err);
      toast.error("공유에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSharing(false);
    }
  };

  const sheetTitle = isAttachMode
    ? t("stamp.attachTitle")
    : hasImage
      ? t("stamp.titleWithPhoto")
      : t("stamp.title");
  const sheetDescription = isAttachMode
    ? t("stamp.attachDescription")
    : t("stamp.description");
  const saveLabel = isAttachMode
    ? t("stamp.attachSave")
    : hasImage
      ? t("stamp.saveWithPhoto")
      : t("stamp.save");

  return (
    <Sheet open={store.isOpen} onOpenChange={(open) => (open ? store.open() : store.close())}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[95dvh] overflow-y-auto p-0 sm:max-w-2xl sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <StampIcon className="h-5 w-5 text-emerald-600" />
              {sheetTitle}
            </SheetTitle>
            <SheetDescription>{sheetDescription}</SheetDescription>
          </SheetHeader>

          {/* 책 표시 */}
          {store.selectedBook ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {store.selectedBook.title}
                </p>
                {store.selectedBook.author && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {store.selectedBook.author}
                  </p>
                )}
              </div>
            </div>
          ) : !isAttachMode ? (
            <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              {t("stamp.selectBookFirst")}
            </div>
          ) : null}

          {/* 라이브 미리보기 (사진 있거나 attach 모드일 때만) */}
          {(hasImage || photoExpanded || isAttachMode) && (
            <div className="mx-auto mb-5 max-w-sm">
              <StampPreviewCard
                imageUrl={previewImageUrl}
                bookTitle={store.selectedBook?.title}
                bookAuthor={store.selectedBook?.author ?? null}
                coverImageUrl={store.selectedBook?.coverImageUrl ?? null}
                startPage={startPage}
                endPage={endPage}
                durationSeconds={durationSeconds}
                date={previewDate}
              />
              {/* 카드 이미지 공유 버튼 — Web Share API(파일) 우선, 폴백 클립보드/다운로드 */}
              <div className="mt-2 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShareCard}
                  disabled={isSharing}
                  className="h-8 px-3 text-xs"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      준비 중...
                    </>
                  ) : justShared ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      공유됨
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-1 h-3.5 w-3.5" />
                      이 카드 공유
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* hidden 캡처 카드 (1080×1080 출력 위해 540×540 렌더 후 2× 스케일) */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
          >
            <div style={{ width: 540, height: 540 }}>
              <StampPreviewCard
                captureRef={shareCaptureRef}
                imageUrl={previewImageUrl}
                bookTitle={store.selectedBook?.title ?? null}
                bookAuthor={store.selectedBook?.author ?? null}
                coverImageUrl={store.selectedBook?.coverImageUrl ?? null}
                startPage={startPage}
                endPage={endPage}
                durationSeconds={durationSeconds}
                date={previewDate}
              />
            </div>
          </div>

          {/* 사진 토글 (create 모드) */}
          {!isAttachMode && !photoExpanded && (
            <button
              type="button"
              onClick={() => setPhotoExpanded(true)}
              className="mb-5 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
              aria-expanded={photoExpanded}
            >
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {t("stamp.addPhoto")}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
          )}

          {/* 사진 선택 (펼침 또는 attach 모드) — 최대 5장, 첫 장이 대표 */}
          {(photoExpanded || isAttachMode) && (
            <div className="mb-5 space-y-2">
              {!isAttachMode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Camera className="mr-1 inline h-3 w-3" />
                    {t("stamp.addPhotoExpanded")}
                    <span className="ml-1 text-xs text-slate-400">(최대 5장 · 첫 장이 대표)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoExpanded(false);
                      setImageUrls([]);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    <ChevronUp className="inline h-3 w-3" /> {t("stamp.closeEdit")}
                  </button>
                </div>
              )}

              <RecordPhotoStrip
                urls={imageUrls}
                onChange={setImageUrls}
                disabled={isPending}
              />
            </div>
          )}

          {/* 페이지 입력 */}
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("stamp.pages")}</Label>
              <button
                type="button"
                className="text-xs text-emerald-600 hover:underline"
                onClick={() => setShowStartPageEdit((v) => !v)}
              >
                {showStartPageEdit ? t("stamp.closeEdit") : t("stamp.editStartPage")}
              </button>
            </div>
            <div className="flex items-end gap-2">
              {showStartPageEdit && (
                <>
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500">{t("stamp.fromPage")}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={startPage}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setStartPage(Number.isFinite(v) && v >= 0 ? v : 0);
                      }}
                    />
                  </div>
                  <span className="pb-2 text-slate-400">→</span>
                </>
              )}
              <div className="flex-1">
                <Label className="text-xs text-slate-500">
                  {showStartPageEdit ? t("stamp.toPage") : `${t("stamp.fromPage")} ${startPage}p →`}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={startPage}
                  max={store.selectedBook?.totalPages ?? undefined}
                  value={endPage}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEndPage(Number.isFinite(v) ? v : startPage);
                  }}
                  className="text-lg font-semibold"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20, 30].map((delta) => (
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
              <div className="ml-auto self-center text-sm text-slate-500 tabular-nums">
                {Math.max(0, endPage - startPage)} {t("stamp.pages")}
              </div>
            </div>
          </div>

          {/* 시간 입력 (attach 모드는 비활성/숨김 — 기존 시간 유지) */}
          {!isAttachMode && (
            <div className="mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t("stamp.time")}</Label>
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                  {durationMinutes}{t("stamp.timeMinutes")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((min) => (
                  <Button
                    key={min}
                    type="button"
                    variant={durationMinutes === min ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      durationMinutes === min &&
                        "bg-emerald-600 text-white hover:bg-emerald-700",
                    )}
                    onClick={() => setDurationMinutes(min)}
                    disabled={isPending}
                  >
                    {min}{t("stamp.timeMinutes")}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={600}
                value={durationMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDurationMinutes(Number.isFinite(v) && v >= 1 ? v : 1);
                }}
                className="h-10"
              />
            </div>
          )}

          {/* 메모 (선택) */}
          <div className="mb-4 space-y-2">
            <Label htmlFor="stamp-memo" className="text-sm">
              {t("stamp.memo")} <span className="text-xs text-slate-400">{t("stamp.memoOptional")}</span>
            </Label>
            <Textarea
              id="stamp-memo"
              placeholder={t("stamp.memoPlaceholder")}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-20 resize-none"
              maxLength={500}
            />
            <p className="text-right text-xs text-slate-400">{memo.length}/500</p>
          </div>

          {/* 공개 여부 (create 모드만) */}
          {!isAttachMode && (
            <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-400" />
                )}
                <Label htmlFor="stamp-public" className="cursor-pointer text-sm font-medium">
                  {isPublic ? t("stamp.public") : t("stamp.private")}
                </Label>
              </div>
              <Switch id="stamp-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          )}

          {/* 액션 */}
          <div className="flex gap-2 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => store.close()}
              className="flex-1"
              disabled={isPending}
            >
              <X className="mr-1 h-4 w-4" />
              {t("stamp.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  {t("stamp.saving")}
                </>
              ) : (
                <>
                  <StampIcon className="mr-1 h-4 w-4" />
                  {saveLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
