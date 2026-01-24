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
import { updateNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { validateImageSize, validateImageType } from "@/lib/utils/image";
import { parseNoteContentFields } from "@/lib/utils/note";
import type { NoteWithBook } from "@/types/note";
import { TagInput } from "./tag-input";
import { BookMentionTextarea } from "./book-mention-textarea";
import { RelatedBooksManager } from "./related-books-manager";
import { RelatedBooksPreview } from "./related-books-preview";

// 스키마: 모든 값은 선택이지만 완전히 빈값은 불가
const noteEditFormSchema = z.object({
  title: z.string().max(100, "제목은 100자 이하여야 합니다.").optional(),
  quoteContent: z.string().max(5000, "인상깊은 구절은 5000자 이하여야 합니다.").optional(),
  memoContent: z.string().max(10000, "내 생각은 10000자 이하여야 합니다.").optional(),
  uploadType: z.enum(["photo", "transcription"]).optional(),
  pageNumber: z.string().max(200, "페이지 정보는 200자 이하여야 합니다.").optional(),
  tags: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const tags = val.split(",").map((t) => t.trim()).filter(Boolean);
      return tags.length <= 10;
    },
    { message: "태그는 최대 10개까지 입력할 수 있습니다." }
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
export function NoteEditForm({ note }: NoteEditFormProps) {
  const router = useRouter();
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (file) => validateImageType(file) && validateImageSize(file)
    );

    if (validFiles.length === 0) {
      toast.error("유효한 이미지 파일을 선택해주세요. (최대 5MB)");
      return;
    }

    if (!uploadType) {
      toast.error("업로드 타입을 먼저 선택해주세요.");
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
          throw new Error("이미지 업로드 실패");
        }

        const data = await response.json();
        newImages.push(data.url);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      } catch (error) {
        console.error("이미지 업로드 오류:", error);
        toast.error(`이미지 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        setUploading(false);
        return;
      }
    }

    setImages(newImages);
    setUploading(false);
    setUploadProgress({});
    toast.success("이미지가 업로드되었습니다.");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (images.length === 1) {
      setValue("uploadType", undefined);
    }
  };

  const onSubmit = async (data: NoteEditFormValues) => {
    try {
      // 이미지가 있으면 첫 번째 이미지만 사용 (수정 시 단일 이미지)
      const imageUrl = images.length > 0 ? images[0] : null;

      await updateNote(note.id, {
        title: data.title,
        quote_content: data.quoteContent?.trim() || undefined,
        memo_content: data.memoContent?.trim() || undefined,
        image_url: imageUrl || undefined,
        upload_type: uploadType,
        page_number: data.pageNumber?.trim() || undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        is_public: data.isPublic,
      });

      toast.success("저장됨");
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error("기록 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 수정에 실패했습니다."
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* 제목 입력 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                제목 <span className="text-muted-foreground text-xs font-normal">(선택)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="기록에 제목을 붙여보세요."
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
              <FormLabel className="text-sm">인상깊은 구절</FormLabel>
              <FormControl>
                <BookMentionTextarea
                  placeholder="인상 깊었던 문장을 입력하세요."
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
              <FormLabel className="text-sm">내 생각</FormLabel>
              <FormControl>
                <BookMentionTextarea
                  placeholder="생각이나 감상을 입력하세요."
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
          <Label className="text-sm">업로드 타입 (선택)</Label>
          <Select
            value={uploadType || undefined}
            onValueChange={(value) =>
              setValue("uploadType", value as "photo" | "transcription")
            }
          >
            <SelectTrigger className="h-10 sm:h-11">
              <SelectValue placeholder="사진 또는 필사 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">사진</SelectItem>
              <SelectItem value="transcription">필사</SelectItem>
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
              타입 취소
            </Button>
          )}
        </div>

        {/* 이미지 업로드 */}
        {uploadType && (
          <div className="space-y-2">
            <Label className="text-sm">이미지 업로드</Label>
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
                {uploading ? "업로드 중..." : images.length > 0 ? "이미지 변경" : "이미지 선택"}
              </Button>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border">
                      <Image
                        src={getImageUrl(imageUrl)}
                        alt={`업로드된 이미지 ${index + 1}`}
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
                페이지 번호 <span className="text-muted-foreground text-xs font-normal">(선택)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 123, 10-20"
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
        />

        {/* 연결된 책 관리 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              연결된 책 <span className="text-muted-foreground text-xs font-normal">(선택)</span>
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
              공개 설정
            </Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {isPublic ? "다른 사용자도 볼 수 있습니다" : "나만 볼 수 있습니다"}
            </p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={(checked) => setValue("isPublic", checked)}
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
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
