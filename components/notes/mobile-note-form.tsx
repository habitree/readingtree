"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import {
  Loader2,
  Camera,
  PenTool,
  X,
  ImageIcon,
  Quote,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Tag,
  Globe,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { validateImageSize, validateImageType } from "@/lib/utils/image";
import type { NoteMode } from "@/hooks/use-mobile-note-sheet";
import { cn } from "@/lib/utils";

interface MobileNoteFormProps {
  /** user_books.id */
  bookId: string;
  /** 기록 모드 */
  mode: NoteMode;
  /** 저장 완료 후 콜백 */
  onSaved?: () => void;
  /** 취소 콜백 */
  onCancel?: () => void;
}

/**
 * 모바일 최적화된 기록 작성 폼
 * UX/UI 개선: 모든 옵션 한눈에, 텍스트 영역 포커스 시 확대
 */
export function MobileNoteForm({
  bookId,
  mode,
  onSaved,
  onCancel,
}: MobileNoteFormProps) {
  const router = useRouter();

  // 폼 상태
  const [quoteContent, setQuoteContent] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [pageNumbers, setPageNumbers] = useState("");
  const [tags, setTags] = useState("");

  // 텍스트 영역 포커스 상태
  const [quoteFocused, setQuoteFocused] = useState(false);
  const [memoFocused, setMemoFocused] = useState(false);

  // 이미지 업로드 상태
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"photo" | "transcription" | null>(
    mode === "transcription" ? "transcription" : null
  );

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const isUploadingRef = useRef(false);

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    files: FileList | null,
    type: "photo" | "transcription"
  ) => {
    if (!files || files.length === 0) return;

    if (isUploadingRef.current) {
      console.warn("이미 업로드 중입니다.");
      return;
    }
    isUploadingRef.current = true;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (file) => validateImageType(file) && validateImageSize(file)
    );

    if (validFiles.length === 0) {
      toast.error("유효한 이미지 파일을 선택해주세요. (최대 5MB)");
      isUploadingRef.current = false;
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadType(type);
    setUploading(true);
    const newImages: string[] = [];

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("업로드 실패");
        }

        const data = await response.json();

        if (!data.url) {
          toast.error(`${file.name} 업로드는 성공했지만 URL을 받지 못했습니다.`);
          continue;
        }

        newImages.push(data.url);
      } catch (error) {
        console.error("이미지 업로드 오류:", error);
        toast.error(`${file.name} 업로드에 실패했습니다.`);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length}개의 이미지가 업로드되었습니다.`);
    }

    setUploading(false);
    isUploadingRef.current = false;

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 이미지 제거
  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length === 0) {
        setUploadType(mode === "transcription" ? "transcription" : null);
      }
      return newImages;
    });
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting || uploading) {
      return;
    }

    // 최소 하나의 값이 있는지 확인
    const hasQuote = quoteContent.trim().length > 0;
    const hasMemo = memoContent.trim().length > 0;
    const hasImage = images.length > 0;

    if (!hasQuote && !hasMemo && !hasImage) {
      toast.error(
        "인상깊은 구절, 내 생각, 또는 이미지 중 최소 하나는 입력해주세요."
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // type 결정
      const noteType = images.length > 0
        ? uploadType === "photo"
          ? "photo"
          : "transcription"
        : "memo";

      // 페이지 번호 (텍스트로 저장)
      const pageNumber = pageNumbers.trim() || undefined;

      // 태그 파싱
      const parsedTags = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

      let createdCount = 0;

      // 다중 이미지 업로드 시 각 이미지별로 기록 생성
      if (images.length > 0) {
        for (const imageUrl of images) {
          const result = await createNote({
            book_id: bookId,
            type: noteType,
            quote_content: quoteContent.trim() || undefined,
            memo_content: memoContent.trim() || undefined,
            image_url: imageUrl,
            upload_type: uploadType || undefined,
            page_number: pageNumber,
            tags: parsedTags,
            is_public: isPublic,
          });

          createdCount++;

          // transcription 타입이면 OCR 처리 요청
          if (noteType === "transcription" && result.noteId) {
            try {
              toast.info("필사 이미지에서 텍스트를 추출하는 중입니다...", {
                description: "OCR 처리가 완료되면 자동으로 저장됩니다.",
                duration: 5000,
              });

              const ocrResponse = await fetch("/api/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  noteId: result.noteId,
                  imageUrl,
                }),
              });

              if (ocrResponse.ok) {
                toast.success("OCR 처리가 시작되었습니다.", {
                  description: "처리가 완료되면 자동으로 업데이트됩니다.",
                  duration: 3000,
                });
              } else {
                toast.warning("OCR 처리 요청에 실패했습니다.", {
                  description: "나중에 다시 시도해주세요.",
                });
              }
            } catch (error) {
              console.error("OCR 요청 오류:", error);
            }
          }
        }
      } else {
        // 이미지가 없는 경우
        await createNote({
          book_id: bookId,
          type: noteType,
          quote_content: quoteContent.trim() || undefined,
          memo_content: memoContent.trim() || undefined,
          upload_type: uploadType || undefined,
          page_number: pageNumber,
          tags: parsedTags,
          is_public: isPublic,
        });
        createdCount++;
      }

      // 성공 메시지
      if (createdCount > 1) {
        toast.success(`${createdCount}개의 기록이 저장되었습니다.`);
      } else {
        toast.success("저장됨");
      }

      // 콜백 호출
      onSaved?.();
    } catch (error) {
      console.error("기록 저장 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 저장에 실패했습니다."
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // 입력 완료 상태 체크
  const hasContent = quoteContent.trim().length > 0 || memoContent.trim().length > 0 || images.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {/* 인상깊은 구절 - 포커스 시 확대 */}
        <div className={cn(
          "space-y-2 p-3 rounded-xl border transition-all duration-300",
          "bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20",
          quoteFocused
            ? "border-blue-400 dark:border-blue-600 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
            : "border-blue-100/50 dark:border-blue-900/30"
        )}>
          <div className="flex items-center justify-between">
            <Label htmlFor="quoteContent" className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Quote className="w-4 h-4" />
              인상깊은 구절
              {quoteContent.length > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Label>
            <span className="text-xs text-muted-foreground">{quoteContent.length}/5000</span>
          </div>
          <Textarea
            id="quoteContent"
            value={quoteContent}
            onChange={(e) => setQuoteContent(e.target.value)}
            onFocus={() => setQuoteFocused(true)}
            onBlur={() => setQuoteFocused(false)}
            placeholder="책에서 인상깊었던 문장을 기록하세요"
            rows={quoteFocused ? 6 : 3}
            className={cn(
              "resize-none text-base bg-white/80 dark:bg-slate-900/50 border-blue-200/50 dark:border-blue-800/30",
              "transition-all duration-300"
            )}
            maxLength={5000}
          />
        </div>

        {/* 내 생각 - 포커스 시 확대 */}
        <div className={cn(
          "space-y-2 p-3 rounded-xl border transition-all duration-300",
          "bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20",
          memoFocused
            ? "border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
            : "border-amber-100/50 dark:border-amber-900/30"
        )}>
          <div className="flex items-center justify-between">
            <Label htmlFor="memoContent" className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <MessageSquare className="w-4 h-4" />
              내 생각
              {memoContent.length > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Label>
            <span className="text-xs text-muted-foreground">{memoContent.length}/10000</span>
          </div>
          <Textarea
            id="memoContent"
            value={memoContent}
            onChange={(e) => setMemoContent(e.target.value)}
            onFocus={() => setMemoFocused(true)}
            onBlur={() => setMemoFocused(false)}
            placeholder="이 구절에 대한 생각, 느낌, 깨달음을 적어보세요"
            rows={memoFocused ? 8 : 4}
            className={cn(
              "resize-none text-base bg-white/80 dark:bg-slate-900/50 border-amber-200/50 dark:border-amber-800/30",
              "transition-all duration-300"
            )}
            maxLength={10000}
          />
        </div>

        {/* 페이지 번호 & 태그 - 항상 표시, 컴팩트 레이아웃 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 페이지 번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="pageNumbers" className="text-xs font-medium flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              페이지
            </Label>
            <Input
              id="pageNumbers"
              value={pageNumbers}
              onChange={(e) => setPageNumbers(e.target.value)}
              placeholder="42, 100-105"
              className="h-9 text-sm"
            />
          </div>

          {/* 태그 */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs font-medium flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              태그
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="명언, 인생"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* 이미지 업로드 버튼 */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-500" />
            이미지 등록
            {images.length > 0 && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setUploadType("transcription");
                fileInputRef.current?.click();
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed transition-all active:scale-[0.98]",
                "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20",
                "active:border-purple-400 active:bg-purple-100/50",
                uploading && "opacity-50 pointer-events-none"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <PenTool className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">필사등록</span>
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setUploadType("photo");
                fileInputRef.current?.click();
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed transition-all active:scale-[0.98]",
                "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
                "active:border-emerald-400 active:bg-emerald-100/50",
                uploading && "opacity-50 pointer-events-none"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">이미지등록</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            필사 이미지는 자동으로 텍스트를 추출해요
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple={uploadType === "photo"}
            onChange={(e) => {
              if (uploadType) {
                handleImageUpload(e.target.files, uploadType);
              }
            }}
            className="hidden"
          />
        </div>

        {/* 업로드된 이미지 표시 */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              업로드된 이미지 ({images.length}개)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, index) => {
                const imageUrl = getImageUrl(url);
                return (
                  <div key={`${url}-${index}`} className="relative group">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                      {isValidImageUrl(url) ? (
                        <Image
                          src={imageUrl}
                          alt={`업로드된 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 20vw"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-80 hover:opacity-100"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {uploadType && (
              <p className="text-xs text-muted-foreground">
                타입: {uploadType === "photo" ? "이미지" : "필사"}
              </p>
            )}
          </div>
        )}

        {/* 공개 설정 - 더 간결하게 */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              isPublic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                공개
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                비공개
              </>
            )}
          </button>
          <span className="text-xs text-muted-foreground">
            {isPublic ? "다른 사용자가 볼 수 있어요" : "나만 볼 수 있어요"}
          </span>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="pt-4 pb-2 space-y-2.5 border-t mt-4 bg-gradient-to-t from-background to-transparent">
        {!hasContent && (
          <p className="text-center text-xs text-muted-foreground pb-1">
            구절, 생각, 이미지 중 하나 이상 입력해주세요
          </p>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || uploading || !hasContent}
          className="w-full h-12 text-base font-semibold shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              저장하기
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting || uploading}
          className="w-full h-10"
        >
          취소
        </Button>
      </div>
    </div>
  );
}
