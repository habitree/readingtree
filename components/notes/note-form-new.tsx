"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, X, PenTool, Camera, Quote, MessageSquare, Sparkles, CheckCircle2, ChevronDown, Settings2, Lightbulb } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { TagInput } from "./tag-input";
import { TextPreviewDialog } from "./text-preview-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BookMentionTextarea } from "./book-mention-textarea";
import { SourceInput } from "./source-input";
import { cn } from "@/lib/utils";
import { useNoteForm } from "@/hooks/use-note-form";
import { useTranslation } from "@/lib/i18n";

// 스키마: 모든 값은 선택이지만 완전히 빈값은 불가
const noteFormSchema = z.object({
  title: z.string().max(100, "Title must be 100 characters or less.").optional(),
  quoteContent: z.string().max(5000, "Quote must be 5000 characters or less.").optional(),
  memoContent: z.string().max(10000, "Thought must be 10000 characters or less.").optional(),
  uploadType: z.enum(["photo", "transcription"]).optional(),
  pageNumbers: z.string().max(1500).optional(),
  tags: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const tags = val.split(",").map((t) => t.trim()).filter(Boolean);
      return tags.length <= 10;
    },
    { message: "You can add up to 10 tags." }
  ),
  isPublic: z.boolean(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormNewProps {
  bookId?: string;
}

/**
 * 새로운 기록 작성 폼 컴포넌트
 * - 인상깊은 구절 + 내 생각 (텍스트 입력)
 * - 업로드 타입 선택 (사진/필사)
 * - 페이지번호, 태그, 공개여부
 */
export function NoteFormNew({ bookId }: NoteFormNewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [applyStamp, setApplyStamp] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [sourceType, setSourceType] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const transcriptionInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 공통 노트 폼 훅 사용
  const {
    images,
    uploading,
    uploadProgress,
    uploadType,
    isSubmitting: hookIsSubmitting,
    isUploadingRef,
    isSubmittingRef,
    handleImageUpload: hookHandleImageUpload,
    removeImage,
    submitNote,
    setUploadType,
  } = useNoteForm({
    bookId,
    onSuccess: () => {
      router.push(bookId ? `/books/${bookId}` : "/notes");
    },
  });

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      isPublic: true,
      uploadType: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    watch,
  } = form;

  const isPublic = watch("isPublic");
  const quoteContent = watch("quoteContent") || "";
  const memoContent = watch("memoContent") || "";

  // 이미지 업로드 핸들러 (스탬프 옵션 적용)
  const handleImageUpload = async (files: FileList | null, type: "photo" | "transcription") => {
    await hookHandleImageUpload(files, type, applyStamp);
    setValue("uploadType", type);

    // input value 초기화
    if (transcriptionInputRef.current) transcriptionInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // 폼 제출 핸들러
  const onSubmit = async (data: NoteFormValues) => {
    await submitNote({
      title: data.title,
      quoteContent: data.quoteContent,
      memoContent: data.memoContent,
      pageNumbers: data.pageNumbers,
      tags: data.tags,
      isPublic: data.isPublic,
      sourceType: !bookId && sourceType ? sourceType : undefined,
      sourceLabel: !bookId && sourceLabel.trim() ? sourceLabel.trim() : undefined,
    });
  };

  // 폼 제출 이벤트 핸들러 (중복 제출 방지)
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isSubmittingRef.current || formIsSubmitting || uploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleSubmit(onSubmit)(e);
  };

  // 입력 완료 상태 체크
  const hasContent = quoteContent.trim().length > 0 || memoContent.trim().length > 0 || images.length > 0;
  const isSubmitting = formIsSubmitting || hookIsSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* 책 없이 기록 - 안내 배너 */}
        {!bookId && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/60 dark:border-violet-900/30">
            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-violet-800 dark:text-violet-300">{t("notes.freeNoteGuide")}</p>
              <p className="text-xs text-violet-600/70 dark:text-violet-400/60 mt-0.5 leading-relaxed">{t("notes.freeNoteGuideDesc")}</p>
            </div>
          </div>
        )}

        {/* ── 제목 + 페이지 (바로 입력, 1줄 인라인) ── */}
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <FormControl>
                  <Input
                    placeholder={t("notes.titlePlaceholder")}
                    {...field}
                    value={field.value || ""}
                    className="text-sm h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-28 shrink-0">
            <Input
              id="pageNumbers"
              {...register("pageNumbers")}
              placeholder={t("notes.pageMobilePlaceholder")}
              className="text-sm h-9"
            />
          </div>
        </div>

        {/* ── 인상깊은 구절 (넓은 입력 영역) ── */}
        <div className="space-y-1.5 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <Label htmlFor="quoteContent" className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-300">
              <Quote className="w-3.5 h-3.5" />
              {t("notes.quoteLabel")}
              {quoteContent.length > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Label>
            <TextPreviewDialog
              title={t("notes.impressiveQuoteLabel")}
              content={quoteContent}
              label={t("notes.expand")}
              onSave={(value) => setValue("quoteContent", value)}
              maxLength={5000}
            />
          </div>
          <BookMentionTextarea
            id="quoteContent"
            value={quoteContent}
            onValueChange={(value) => setValue("quoteContent", value)}
            placeholder={t("notes.quoteInputPlaceholder")}
            rows={5}
            className="resize-y min-h-[120px] bg-white/70 dark:bg-slate-900/50 border-blue-200/50 dark:border-blue-800/30 text-sm leading-relaxed"
          />
          {errors.quoteContent && (
            <p className="text-xs text-destructive">{errors.quoteContent.message}</p>
          )}
        </div>

        {/* ── 내 생각 (넓은 입력 영역) ── */}
        <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30">
          <div className="flex items-center justify-between">
            <Label htmlFor="memoContent" className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
              <MessageSquare className="w-3.5 h-3.5" />
              {t("notes.thoughtLabel")}
              {memoContent.length > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </Label>
            <TextPreviewDialog
              title={t("notes.myThoughtLabel")}
              content={memoContent}
              label={t("notes.expand")}
              onSave={(value) => setValue("memoContent", value)}
              maxLength={10000}
            />
          </div>
          <BookMentionTextarea
            id="memoContent"
            value={memoContent}
            onValueChange={(value) => setValue("memoContent", value)}
            placeholder={t("notes.memoInputPlaceholder")}
            rows={6}
            className="resize-y min-h-[150px] bg-white/70 dark:bg-slate-900/50 border-amber-200/50 dark:border-amber-800/30 text-sm leading-relaxed"
          />
          {errors.memoContent && (
            <p className="text-xs text-destructive">{errors.memoContent.message}</p>
          )}
        </div>

        {/* ── 이미지 업로드 (간결한 인라인 버튼) ── */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="transcription-input"
            className="cursor-pointer"
            style={{ touchAction: "manipulation" }}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2 transition-all hover:border-purple-400 hover:bg-purple-100/50",
                (uploading || isUploadingRef.current) && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <PenTool className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-xs text-purple-700 dark:text-purple-300">{t("notes.photoTranscription")}</span>
            </div>
          </label>
          <label
            htmlFor="photo-input"
            className="cursor-pointer"
            style={{ touchAction: "manipulation" }}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 transition-all hover:border-emerald-400 hover:bg-emerald-100/50",
                (uploading || isUploadingRef.current) && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <Camera className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium text-xs text-emerald-700 dark:text-emerald-300">{t("notes.photoLabel")}</span>
            </div>
          </label>

          {/* 스탬프 옵션 */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Checkbox
              id="apply-stamp"
              checked={applyStamp}
              onCheckedChange={(checked) => setApplyStamp(checked === true)}
              disabled={uploading}
              className="h-3.5 w-3.5"
            />
            <Label
              htmlFor="apply-stamp"
              className="text-xs cursor-pointer flex items-center gap-1 text-muted-foreground"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t("notes.stamp")}
            </Label>
          </div>

          <input
            id="transcription-input"
            ref={transcriptionInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            onChange={(e) => handleImageUpload(e.target.files, "transcription")}
            className="hidden"
          />
          <input
            id="photo-input"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
            multiple
            onChange={(e) => handleImageUpload(e.target.files, "photo")}
            className="hidden"
          />
        </div>

        {/* 업로드된 이미지 (가로 스크롤 컴팩트 미리보기) */}
        {images.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t("notes.uploadedImages", { count: images.length })}</Label>
              {uploadType && (
                <span className="text-[10px] text-muted-foreground/70">
                  ({uploadType === "photo" ? t("notes.typeImageLabel") : t("notes.photoTranscription")})
                </span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, index) => {
                const imageUrl = getImageUrl(url);
                return (
                  <div key={`${url}-${index}`} className="relative group shrink-0">
                    <div className="relative w-16 h-20 overflow-hidden rounded-lg bg-muted">
                      {isValidImageUrl(url) ? (
                        <Image
                          src={imageUrl}
                          alt={t("notes.uploadedImageAlt", { index: index + 1 })}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized={true}
                          onError={() => {
                            toast.error(t("notes.imageLoadError", { index: index + 1 }));
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-[9px]">
                          {t("notes.imageLoadFailed")}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity shadow-sm z-10"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] py-0.5 text-center rounded-b-lg">
                        {uploadProgress[index]}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 출처 입력 (책 없이 기록할 때) */}
        {!bookId && (
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
            <Label className="text-sm font-medium mb-1 block">{t("notes.sourceType")}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("notes.sourceHint")}</p>
            <SourceInput
              sourceType={sourceType}
              sourceLabel={sourceLabel}
              onSourceTypeChange={setSourceType}
              onSourceLabelChange={setSourceLabel}
            />
          </div>
        )}

        {/* ── 추가 옵션 (태그 + 공개설정) ── */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-3.5 w-3.5" />
              <span>{t("notes.additionalOptions")}</span>
            </div>
            <motion.div
              animate={{ rotate: showOptionalFields ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showOptionalFields && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {/* 태그 */}
                  <TagInput
                    value={watch("tags") || ""}
                    onChange={(value) => setValue("tags", value)}
                    noteContent={[quoteContent, memoContent].filter(Boolean).join("\n")}
                  />

                  {/* 공개 설정 */}
                  <div className="flex items-center gap-3">
                    <Switch
                      id="isPublic"
                      checked={!isPublic}
                      onCheckedChange={(checked) => setValue("isPublic", !checked)}
                    />
                    <Label htmlFor="isPublic" className="cursor-pointer text-sm">
                      {isPublic ? t("notes.public") : t("notes.private")}
                    </Label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 제출 버튼 */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || uploading || !hasContent}
            fullWidth
            className="h-11 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("notes.saving")}
              </>
            ) : uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("notes.uploading")}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("notes.save")}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting || uploading}
            fullWidth
            size="sm"
          >
            {t("notes.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
