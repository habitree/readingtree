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
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Lock,
  Globe,
  Stamp as StampIcon,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStampCapture } from "@/hooks/use-stamp-capture";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { smartCompressImage } from "@/lib/utils/image";
import {
  attachStampToLog,
  createReadingStamp,
  getLastEndPage,
} from "@/app/actions/progress";
import { StampPreviewCard } from "./stamp-preview-card";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploadedUrl, setImageUploadedUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [startPage, setStartPage] = useState<number>(0);
  const [endPage, setEndPage] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showStartPageEdit, setShowStartPageEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
    setImageFile(null);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageUploadedUrl(null);
    setIsUploadingImage(false);
    setPhotoExpanded(false);
    setMemo("");
    setIsPublic(true);
    setShowStartPageEdit(false);
  }, [store.isOpen]);

  const durationSeconds = durationMinutes * 60;

  const previewDate = useMemo(() => new Date(), [store.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    // 미리보기 즉시 표시
    const localUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localUrl;
    });

    // 백그라운드 업로드
    setIsUploadingImage(true);
    setImageUploadedUrl(null);
    try {
      const compressed = await smartCompressImage(file, { verbose: false });
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", "photo");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || t("stamp.uploadFailed"));
      }
      const { url } = (await res.json()) as { url: string };
      setImageUploadedUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("stamp.uploadFailed"));
      setImageFile(null);
      setImageUploadedUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUploadedUrl(null);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const adjustEndPage = (delta: number) => {
    setEndPage((prev) => Math.max(startPage, prev + delta));
  };

  const hasImage = !!imageUploadedUrl;
  // attach 모드는 사진 필수
  const canSave = isAttachMode
    ? !isPending && !isUploadingImage && hasImage
    : !isPending && !isUploadingImage && durationSeconds >= 30;

  const handleSave = () => {
    if (!user) {
      toast.error("로그인이 필요해요.");
      return;
    }

    // attach 모드 — 기존 로그에 사진 첨부
    if (isAttachMode) {
      if (!store.targetLogId) {
        toast.error("대상 기록을 찾을 수 없어요.");
        return;
      }
      if (!imageUploadedUrl) {
        toast.error("사진을 추가해주세요.");
        return;
      }

      startTransition(async () => {
        try {
          await attachStampToLog(store.targetLogId!, {
            image_url: imageUploadedUrl,
            start_page: startPage,
            end_page: endPage,
            memo: memo.trim() || undefined,
          });
          toast.success(t("stamp.attachSaved"));
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
          image_url: imageUploadedUrl || undefined,
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

  const previewImageUrl = imageUploadedUrl ?? imagePreviewUrl ?? undefined;

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
              {isUploadingImage && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("stamp.uploading")}
                </div>
              )}
            </div>
          )}

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

          {/* 사진 선택 (펼침 또는 attach 모드) */}
          {(photoExpanded || isAttachMode) && (
            <div className="mb-5 space-y-2">
              {!isAttachMode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Camera className="mr-1 inline h-3 w-3" />
                    {t("stamp.addPhotoExpanded")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoExpanded(false);
                      handleRemoveImage();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    <ChevronUp className="inline h-3 w-3" /> {t("stamp.closeEdit")}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isPending}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {t("stamp.takePhoto")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingImage || isPending}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {t("stamp.fromGallery")}
                </Button>
                {imageFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="col-span-2 h-9 text-xs text-slate-500 hover:text-red-600"
                    onClick={handleRemoveImage}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {t("stamp.removePhoto")}
                  </Button>
                )}
              </div>
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
