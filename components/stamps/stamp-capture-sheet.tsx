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
import { smartCompressImage } from "@/lib/utils/image";
import { createReadingStamp, getLastEndPage } from "@/app/actions/progress";
import { StampPreviewCard } from "./stamp-preview-card";

const DURATION_PRESETS = [10, 15, 25, 30, 45, 60, 90] as const;

/**
 * Stamp Composer — 사진 + 페이지 구간 + 시간을 한 번에 기록.
 * - 모바일: 풀스크린 Bottom Sheet
 * - 데스크톱: Bottom Sheet (max-w-2xl)
 * - 사진은 선택, 카메라 또는 갤러리에서 추가
 * - start_page 는 직전 reading_log 에서 자동 승계
 */
export function StampCaptureSheet() {
  const { user } = useAuth();
  const store = useStampCapture();
  const [isPending, startTransition] = useTransition();

  // 입력 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploadedUrl, setImageUploadedUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [startPage, setStartPage] = useState<number>(0);
  const [endPage, setEndPage] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showStartPageEdit, setShowStartPageEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 시트가 열릴 때마다 직전 end_page 로드
  useEffect(() => {
    if (!store.isOpen || !store.selectedBook) return;

    let cancelled = false;
    getLastEndPage(store.selectedBook.id)
      .then((page) => {
        if (cancelled) return;
        setStartPage(page);
        // prefillEndPage 가 있으면 그 값을, 아니면 startPage + 10 을 기본값으로
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
  }, [store.isOpen, store.selectedBook, store.prefillEndPage]);

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
        throw new Error(errBody.error || "이미지 업로드에 실패했어요.");
      }
      const { url } = (await res.json()) as { url: string };
      setImageUploadedUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이미지 업로드 실패");
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

  const canSave = !isPending && !isUploadingImage && durationSeconds >= 30;

  const handleSave = () => {
    if (!user) {
      toast.error("로그인이 필요해요.");
      return;
    }
    if (durationSeconds < 30) {
      toast.error("최소 30초 이상의 독서 시간을 입력해주세요.");
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

        toast.success("스탬프를 남겼어요!", {
          description: result.pointsEarned ? `+${result.pointsEarned}P 적립` : undefined,
          duration: 4000,
        });
        store.reset();
      } catch (err) {
        const message = err instanceof Error ? err.message : "스탬프 저장에 실패했어요.";
        toast.error(message);
      }
    });
  };

  const previewImageUrl = imageUploadedUrl ?? imagePreviewUrl ?? undefined;

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
              스탬프 찍기
            </SheetTitle>
            <SheetDescription>
              사진 + 읽은 페이지 + 시간을 한 번에 기록해요.
            </SheetDescription>
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
          ) : (
            <div className="mb-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              책 미선택 — 자유 기록으로 저장돼요.
            </div>
          )}

          {/* 라이브 미리보기 */}
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
                사진 업로드 중...
              </div>
            )}
          </div>

          {/* 사진 선택 / 제거 */}
          <div className="mb-5 grid grid-cols-2 gap-2">
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
              카메라
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploadingImage || isPending}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              앨범에서
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
                사진 지우기
              </Button>
            )}
          </div>

          {/* 페이지 입력 */}
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">읽은 페이지</Label>
              <button
                type="button"
                className="text-xs text-emerald-600 hover:underline"
                onClick={() => setShowStartPageEdit((v) => !v)}
              >
                {showStartPageEdit ? "닫기" : "시작 페이지 수정"}
              </button>
            </div>
            <div className="flex items-end gap-2">
              {showStartPageEdit && (
                <>
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
                    />
                  </div>
                  <span className="pb-2 text-slate-400">→</span>
                </>
              )}
              <div className="flex-1">
                <Label className="text-xs text-slate-500">
                  {showStartPageEdit ? "종료" : `시작 ${startPage}p →`}
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
                {Math.max(0, endPage - startPage)} pages
              </div>
            </div>
          </div>

          {/* 시간 입력 */}
          <div className="mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">읽은 시간</Label>
              <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                {durationMinutes}분
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
                  {min}분
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

          {/* 메모 (선택) */}
          <div className="mb-4 space-y-2">
            <Label htmlFor="stamp-memo" className="text-sm">
              메모 <span className="text-xs text-slate-400">(선택)</span>
            </Label>
            <Textarea
              id="stamp-memo"
              placeholder="이 구간에서 인상 깊은 한 줄..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-20 resize-none"
              maxLength={500}
            />
            <p className="text-right text-xs text-slate-400">{memo.length}/500</p>
          </div>

          {/* 공개 여부 */}
          <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-emerald-500" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
              <Label htmlFor="stamp-public" className="cursor-pointer text-sm font-medium">
                {isPublic ? "공개" : "비공개"}
              </Label>
            </div>
            <Switch id="stamp-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

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
              취소
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
                  저장 중...
                </>
              ) : (
                <>
                  <StampIcon className="mr-1 h-4 w-4" />
                  스탬프 찍기
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
