"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateNote, promoteNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { validateImageSize, validateImageType } from "@/lib/utils/image";
import { parseNoteContentFields } from "@/lib/utils/note";
import type { NoteWithBook } from "@/types/note";
import { TagInput } from "./tag-input";
import { NoteDeleteButton } from "./note-delete-button";
import { BookMentionTextarea } from "./book-mention-textarea";
import { RelatedBooksManager } from "./related-books-manager";
import { RelatedBooksPreview } from "./related-books-preview";
import { useTranslation } from "@/lib/i18n";
import { useAutoDraft } from "@/hooks/use-auto-draft";
import { DraftRestoreBanner } from "@/components/ui/draft-restore-banner";
import { useAuth } from "@/hooks/use-auth";

// 스키마: 모든 값은 선택이지만 완전히 빈값은 불가
const noteEditFormSchema = z.object({
  title: z.string().max(100, "Title must be 100 characters or less.").optional(),
  quoteContent: z.string().max(5000, "Quote must be 5000 characters or less.").optional(),
  memoContent: z.string().max(10000, "Thought must be 10000 characters or less.").optional(),
  uploadType: z.enum(["photo", "transcription"]).optional(),
  pageNumber: z.string().max(200, "Page info must be 200 characters or less.").optional(),
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

type NoteEditFormValues = z.infer<typeof noteEditFormSchema>;

interface NoteEditFormProps {
  note: NoteWithBook;
}

/**
 * 기록 수정 폼 컴포넌트
 * - 인상깊은 구절 + 내 생각 (텍스트 입력)
 * - 업로드 타입 선택 (사진/필사)
 * - 페이지번호, 태그, 공개여부
 */
interface NoteEditDraftData {
  title?: string;
  quoteContent?: string;
  memoContent?: string;
  pageNumber?: string;
  tags?: string;
  isPublic: boolean;
}

export function NoteEditForm({ note }: NoteEditFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>(note.image_url ? [note.image_url] : []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [relatedBookIds, setRelatedBookIds] = useState<string[] | null>(
    note.related_user_book_ids || null
  );

  // 기존 content를 파싱하여 초기값 설정
  const { quote, memo } = parseNoteContentFields(note.content);

  // 업로드 타입 결정: 이미지가 있고 type이 photo면 "photo", transcription이면 "transcription"
  const initialUploadType = note.image_url
    ? (note.type === "photo" ? "photo" : note.type === "transcription" ? "transcription" : undefined)
    : undefined;

  const form = useForm<NoteEditFormValues>({
    resolver: zodResolver(noteEditFormSchema),
    defaultValues: {
      title: note.title || "",
      quoteContent: quote || "",
      memoContent: memo || "",
      pageNumber: note.page_number ? String(note.page_number) : "",
      tags: note.tags?.join(", ") || "",
      isPublic: note.is_public ?? true,
      uploadType: initialUploadType,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  const isPublic = watch("isPublic");
  const uploadType = watch("uploadType");
  const watchTitle = watch("title") || "";
  const watchQuote = watch("quoteContent") || "";
  const watchMemo = watch("memoContent") || "";
  const watchPage = watch("pageNumber") || "";
  const watchTags = watch("tags") || "";

  // 임시저장
  const draftKey = `note-edit:${user?.id ?? "anon"}:${note.id}`;
  const { hasDraft, savedAt, restoreDraft, discardDraft, clearOnSubmit } = useAutoDraft<NoteEditDraftData>({
    key: draftKey,
    data: {
      title: watchTitle,
      quoteContent: watchQuote,
      memoContent: watchMemo,
      pageNumber: watchPage,
      tags: watchTags,
      isPublic,
    },
    isEmpty: (d) => !d.title?.trim() && !d.quoteContent?.trim() && !d.memoContent?.trim(),
  });

  const handleRestoreDraft = () => {
    const data = restoreDraft();
    if (!data) return;
    if (data.title !== undefined) setValue("title", data.title);
    if (data.quoteContent !== undefined) setValue("quoteContent", data.quoteContent);
    if (data.memoContent !== undefined) setValue("memoContent", data.memoContent);
    if (data.pageNumber !== undefined) setValue("pageNumber", data.pageNumber);
    if (data.tags !== undefined) setValue("tags", data.tags);
    if (data.isPublic !== undefined) setValue("isPublic", data.isPublic);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (file) => validateImageType(file) && validateImageSize(file)
    );

    if (validFiles.length === 0) {
      toast.error(t("notes.validImageError"));
      return;
    }

    if (!uploadType) {
      toast.error(t("notes.selectUploadTypeFirst"));
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(t("notes.imageUploadFailed"));
        }

        const data = await response.json();
        newImages.push(data.url);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      } catch (error) {
        console.error("이미지 업로드 오류:", error);
        toast.error(error instanceof Error ? error.message : t("notes.editFailed"));
        setUploading(false);
        return;
      }
    }

    setImages(newImages);
    setUploading(false);
    setUploadProgress({});
    toast.success(t("notes.imageUploaded"));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (images.length === 1) {
      setValue("uploadType", undefined);
    }
  };

  const onSubmit = async (data: NoteEditFormValues) => {
    try {
      clearOnSubmit();
      // 이미지가 있으면 첫 번째 이미지만 사용 (수정 시 단일 이미지)
      const imageUrl = images.length > 0 ? images[0] : null;

      const updateData = {
        title: data.title,
        quote_content: data.quoteContent?.trim() || undefined,
        memo_content: data.memoContent?.trim() || undefined,
        image_url: imageUrl || undefined,
        upload_type: uploadType,
        page_number: data.pageNumber?.trim() || undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        is_public: data.isPublic,
      };

      // draft 상태 기록은 저장 시 자동으로 published로 전환
      if (note.status === "draft") {
        await promoteNote(note.id, updateData);
      } else {
        await updateNote(note.id, updateData);
      }

      toast.success(t("notes.saved"));
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error("기록 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("notes.editFailed")
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* 임시저장 복원 배너 */}
        {hasDraft && (
          <DraftRestoreBanner
            savedAt={savedAt}
            onRestore={handleRestoreDraft}
            onDiscard={discardDraft}
          />
        )}

        {/* 제목 입력 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                {t("notes.titleLabel")} <span className="text-muted-foreground text-xs font-normal">{t("notes.titleOptionalSuffix")}</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("notes.titleEditPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  className="h-10 sm:h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 인상깊은 구절 */}
        <FormField
          control={form.control}
          name="quoteContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{t("notes.impressiveQuoteLabel")}</FormLabel>
              <FormControl>
                <BookMentionTextarea
                  placeholder={t("notes.quotePlaceholder")}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  rows={3}
                  className="resize-none text-sm sm:text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 내 생각 */}
        <FormField
          control={form.control}
          name="memoContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{t("notes.myThoughtLabel")}</FormLabel>
              <FormControl>
                <BookMentionTextarea
                  placeholder={t("notes.memoPlaceholder")}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  rows={4}
                  className="resize-none text-sm sm:text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 업로드 타입 선택 */}
        <div className="space-y-2">
          <Label className="text-sm">{t("notes.uploadTypeLabel")}</Label>
          <Select
            value={uploadType || undefined}
            onValueChange={(value) =>
              setValue("uploadType", value as "photo" | "transcription")
            }
          >
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder={t("notes.uploadTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">{t("notes.photoLabel")}</SelectItem>
              <SelectItem value="transcription">{t("notes.photoTranscription")}</SelectItem>
            </SelectContent>
          </Select>
          {uploadType && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue("uploadType", undefined);
                setImages([]);
              }}
              className="text-xs h-7"
            >
              {t("notes.cancelType")}
            </Button>
          )}
        </div>

        {/* 이미지 업로드 */}
        {uploadType && (
          <div className="space-y-2">
            <Label className="text-sm">{t("notes.imageUploadLabel")}</Label>
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-10 sm:h-11"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? t("notes.uploading") : images.length > 0 ? t("notes.imageChange") : t("notes.imageSelect")}
              </Button>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border">
                      <Image
                        src={getImageUrl(imageUrl)}
                        alt={t("notes.uploadedImageAlt", { index: index + 1 })}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        unoptimized={true}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1.5 right-1.5 h-6 w-6 p-0 shadow-md"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 페이지 번호 */}
        <FormField
          control={form.control}
          name="pageNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                {t("notes.pageNumberOptional")} <span className="text-muted-foreground text-xs font-normal">{t("notes.titleOptionalSuffix")}</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("notes.pageEditPlaceholder")}
                  {...field}
                  value={field.value || ""}
                  className="h-10 sm:h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 태그 */}
        <TagInput
          value={watch("tags") || ""}
          onChange={(value) => setValue("tags", value)}
          noteContent={[watch("quoteContent"), watch("memoContent")].filter(Boolean).join("\n")}
        />

        {/* 연결된 책 관리 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              {t("notes.linkedBookOptional")} <span className="text-muted-foreground text-xs font-normal">{t("notes.titleOptionalSuffix")}</span>
            </Label>
            <RelatedBooksManager
              noteId={note.id}
              currentRelatedBookIds={relatedBookIds}
              mainBookId={(note as any).user_book_id || ""}
              onUpdate={(updatedIds) => setRelatedBookIds(updatedIds)}
            />
          </div>

          {/* 연결된 책 표지 이미지 미리보기 */}
          {relatedBookIds && relatedBookIds.length > 0 && (
            <RelatedBooksPreview relatedBookIds={relatedBookIds} />
          )}
        </div>

        {/* 공개 설정 */}
        <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
              {t("notes.publicSetting")}
            </Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {isPublic ? t("notes.publicDesc") : t("notes.privateDesc")}
            </p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={(checked) => setValue("isPublic", checked)}
          />
        </div>

        {/* 이 기록 삭제 — 편집 화면에서 바로 삭제 */}
        <div className="pt-2">
          <NoteDeleteButton
            noteId={note.id}
            label={t("notes.deleteNote")}
            triggerVariant="outline"
            triggerClassName="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          />
        </div>

        {/* 제출 버튼 - 하단 고정 스타일 */}
        <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-4 -mx-1 px-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1 h-11"
          >
            {t("notes.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("notes.saving")}
              </>
            ) : (
              t("notes.save")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
