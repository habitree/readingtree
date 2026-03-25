"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  FileText,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookMentionTextarea } from "./book-mention-textarea";
import { SourceInput } from "./source-input";
import type { NoteMode } from "@/hooks/use-mobile-note-sheet";
import { cn } from "@/lib/utils";
import { useNoteForm } from "@/hooks/use-note-form";
import { useTranslation } from "@/lib/i18n";

interface MobileNoteFormProps {
  /** user_books.id (책 없이 저장 시 undefined) */
  bookId?: string;
  /** 기록 모드 */
  mode: NoteMode;
  /** 저장 완료 후 콜백 */
  onSaved?: () => void;
  /** 취소 콜백 */
  onCancel?: () => void;
  /** 타이머 독서 시간 (초) - 타이머 완료 시 자동 전달 */
  readingDurationSeconds?: number | null;
}

/**
 * 모바일 최적화된 기록 작성 폼
 * 서재 기록 등록과 동일한 기능 + 컴팩트 UI
 */
export function MobileNoteForm({
  bookId,
  mode,
  onSaved,
  onCancel,
  readingDurationSeconds,
}: MobileNoteFormProps) {
  const { t } = useTranslation();
  // 폼 상태
  const [title, setTitle] = useState("");
  const [quoteContent, setQuoteContent] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [pageNumbers, setPageNumbers] = useState("");
  const [tags, setTags] = useState("");
  const [applyStamp, setApplyStamp] = useState(false);
  const [sourceType, setSourceType] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [isAiTagLoading, setIsAiTagLoading] = useState(false);

  // 텍스트 영역 포커스 상태
  const [quoteFocused, setQuoteFocused] = useState(false);
  const [memoFocused, setMemoFocused] = useState(false);

  // 파일 입력 ref
  const transcriptionInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 공통 노트 폼 훅 사용
  const {
    images,
    uploading,
    uploadType,
    isSubmitting,
    isUploadingRef,
    handleImageUpload: hookHandleImageUpload,
    removeImage,
    submitNote,
  } = useNoteForm({
    bookId,
    initialUploadType: mode === "transcription" ? "transcription" : null,
    onSuccess: () => {
      onSaved?.();
    },
    onError: (error) => {
      // 에러 발생 시 사용자에게 토스트로 알림
      toast.error(error.message || t("notes.noteSaveFailed"));
    },
  });

  // 이미지 업로드 핸들러 (스탬프 옵션 적용)
  const handleImageUpload = async (files: FileList | null, type: "photo" | "transcription") => {
    await hookHandleImageUpload(files, type, applyStamp);

    // input value 초기화
    if (transcriptionInputRef.current) transcriptionInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // 폼 제출
  const handleSubmit = async () => {
    // 최소 하나의 값이 있는지 확인
    const hasQuote = quoteContent.trim().length > 0;
    const hasMemo = memoContent.trim().length > 0;
    const hasImage = images.length > 0;

    if (!hasQuote && !hasMemo && !hasImage) {
      toast.error(t("notes.minOneInputRequired"));
      return;
    }

    await submitNote({
      title: title.trim() || undefined,
      quoteContent: quoteContent.trim() || undefined,
      memoContent: memoContent.trim() || undefined,
      pageNumbers: pageNumbers.trim() || undefined,
      tags: tags || undefined,
      isPublic,
      sourceType: !bookId && sourceType ? sourceType : undefined,
      sourceLabel: !bookId && sourceLabel.trim() ? sourceLabel.trim() : undefined,
      readingDurationSeconds: readingDurationSeconds ?? undefined,
    });
  };

  // 입력 완료 상태 체크
  const hasContent = quoteContent.trim().length > 0 || memoContent.trim().length > 0 || images.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 px-0.5">
        {/* 제목 입력 - 인라인 컴팩트 */}
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notes.titleMobilePlaceholder")}
            className="h-7 text-xs border-slate-200/60"
            maxLength={100}
          />
        </div>

        {/* 인상깊은 구절 - 컴팩트 */}
        <div className={cn(
          "space-y-1 p-2 rounded-lg border transition-all",
          "bg-blue-50/50 dark:bg-blue-950/20",
          quoteFocused
            ? "border-blue-400 dark:border-blue-600"
            : "border-blue-100/50 dark:border-blue-900/30"
        )}>
          <Label htmlFor="quoteContent" className="text-[11px] font-medium flex items-center gap-1 text-blue-700 dark:text-blue-300">
            <Quote className="w-3 h-3" />
            {t("notes.quoteLabel")}
            {quoteContent.length > 0 && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
          </Label>
          <BookMentionTextarea
            id="quoteContent"
            value={quoteContent}
            onValueChange={setQuoteContent}
            onFocus={() => setQuoteFocused(true)}
            onBlur={() => setQuoteFocused(false)}
            placeholder={t("notes.quoteInputPlaceholder")}
            rows={quoteFocused ? 4 : 2}
            className="resize-none text-sm bg-white/80 dark:bg-slate-900/50 border-blue-200/50 dark:border-blue-800/30 min-h-0"
          />
        </div>

        {/* 내 생각 - 컴팩트 */}
        <div className={cn(
          "space-y-1 p-2 rounded-lg border transition-all",
          "bg-amber-50/50 dark:bg-amber-950/20",
          memoFocused
            ? "border-amber-400 dark:border-amber-600"
            : "border-amber-100/50 dark:border-amber-900/30"
        )}>
          <Label htmlFor="memoContent" className="text-[11px] font-medium flex items-center gap-1 text-amber-700 dark:text-amber-300">
            <MessageSquare className="w-3 h-3" />
            {t("notes.thoughtLabel")}
            {memoContent.length > 0 && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
          </Label>
          <BookMentionTextarea
            id="memoContent"
            value={memoContent}
            onValueChange={setMemoContent}
            onFocus={() => setMemoFocused(true)}
            onBlur={() => setMemoFocused(false)}
            placeholder={t("notes.memoInputPlaceholder")}
            rows={memoFocused ? 5 : 2}
            className="resize-none text-sm bg-white/80 dark:bg-slate-900/50 border-amber-200/50 dark:border-amber-800/30 min-h-0"
          />
        </div>

        {/* 이미지 업로드 & 옵션 - 한 줄에 아이콘 형태로 */}
        <div className="flex items-center gap-1.5 py-1">
          {/* 필사 버튼 */}
          <label
            htmlFor="transcription-input-mobile"
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all",
              "bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40",
              "hover:bg-purple-100 dark:hover:bg-purple-900/40 active:scale-95",
              (uploading || isUploadingRef.current) && "opacity-50 pointer-events-none"
            )}
          >
            <PenTool className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">{t("notes.photoTranscription")}</span>
          </label>

          {/* 사진 버튼 */}
          <label
            htmlFor="photo-input-mobile"
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all",
              "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40",
              "hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95",
              (uploading || isUploadingRef.current) && "opacity-50 pointer-events-none"
            )}
          >
            <Camera className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">{t("notes.photoLabel")}</span>
          </label>

          {/* 스탬프 옵션 */}
          <div className="flex items-center gap-1 ml-auto">
            <Checkbox
              id="stamp-mobile"
              checked={applyStamp}
              onCheckedChange={(checked) => setApplyStamp(checked === true)}
              disabled={uploading}
              className="h-3 w-3"
            />
            <Label htmlFor="stamp-mobile" className="text-[10px] text-slate-500 cursor-pointer flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              {t("notes.stamp")}
            </Label>
          </div>

          {/* 이미지 카운트 */}
          {images.length > 0 && (
            <span className="text-[10px] text-emerald-600 font-medium">
              {t("notes.imageCountUnit", { count: images.length })}
            </span>
          )}

          <input
            id="transcription-input-mobile"
            ref={transcriptionInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            onChange={(e) => handleImageUpload(e.target.files, "transcription")}
            className="hidden"
          />
          <input
            id="photo-input-mobile"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple
            onChange={(e) => handleImageUpload(e.target.files, "photo")}
            className="hidden"
          />
        </div>

        {/* 업로드된 이미지 표시 - 가로 스크롤 */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
            {images.map((url, index) => {
              const imageUrl = getImageUrl(url);
              return (
                <div key={`${url}-${index}`} className="relative shrink-0">
                  <div className="relative w-14 h-[72px] overflow-hidden rounded-md bg-muted">
                    {isValidImageUrl(url) ? (
                      <Image
                        src={imageUrl}
                        alt={t("notes.imageAlt", { index: index + 1 })}
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 출처 입력 (책 없이 기록할 때) */}
        {!bookId && (
          <SourceInput
            sourceType={sourceType}
            sourceLabel={sourceLabel}
            onSourceTypeChange={setSourceType}
            onSourceLabelChange={setSourceLabel}
          />
        )}

        {/* 페이지 & 태그 & 공개 - 한 줄에 */}
        <div className="flex items-center gap-2 py-0.5">
          <Input
            value={pageNumbers}
            onChange={(e) => setPageNumbers(e.target.value)}
            placeholder={t("notes.pageMobilePlaceholder")}
            className="h-6 w-16 text-[11px] px-2"
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("notes.tagsCommaSeparated")}
            className="h-6 flex-1 text-[11px] px-2"
          />
          <button
            type="button"
            disabled={isAiTagLoading || (!quoteContent.trim() && !memoContent.trim())}
            className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-40"
            onClick={async () => {
              const content = [quoteContent, memoContent].filter(Boolean).join("\n");
              if (content.trim().length < 10) {
                toast.info(t("notes.aiTagNeedContent"));
                return;
              }
              setIsAiTagLoading(true);
              try {
                const res = await fetch("/api/ai/auto-tag", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ content }),
                });
                const data = await res.json();
                if (data.success && data.tags?.length > 0) {
                  const currentTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
                  const newTags = data.tags.filter((t: string) => !currentTags.includes(t));
                  const merged = [...currentTags, ...newTags].slice(0, 10).join(", ") + ", ";
                  setTags(merged);
                  toast.success(t("notes.aiTagSuccess", { count: newTags.length }));
                } else {
                  toast.info(t("notes.aiTagNoResult"));
                }
              } catch {
                toast.error(t("notes.aiTagFailed"));
              } finally {
                setIsAiTagLoading(false);
              }
            }}
          >
            {isAiTagLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
            AI
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all shrink-0",
              isPublic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? t("notes.public") : t("notes.private")}
          </button>
        </div>
      </div>

      {/* 하단 버튼 - 더 컴팩트 */}
      <div className="pt-2 pb-1 flex gap-2 border-t mt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting || uploading}
          className="h-9 px-4 text-sm"
        >
          {t("notes.cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || uploading || !hasContent}
          className="flex-1 h-9 font-medium"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t("notes.save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
