"use client";

import { useState, useRef } from "react";
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
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Loader2, Upload, X, PenTool, Camera } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { validateImageSize, validateImageType } from "@/lib/utils/image";
import { TagInput } from "./tag-input";
import { TextPreviewDialog } from "./text-preview-dialog";
import { addStampToImage } from "@/lib/utils/stamp";
import { Checkbox } from "@/components/ui/checkbox";
import { BookMentionTextarea } from "./book-mention-textarea";

// 스키마: 모든 값은 선택이지만 완전히 빈값은 불가
const noteFormSchema = z.object({
  title: z.string().max(100, "제목은 100자 이하여야 합니다.").optional(),
  quoteContent: z.string().max(5000, "인상깊은 구절은 5000자 이하여야 합니다.").optional(),
  memoContent: z.string().max(10000, "내 생각은 10000자 이하여야 합니다.").optional(),
  uploadType: z.enum(["photo", "transcription"]).optional(),
  pageNumbers: z.string().max(1500).optional(),
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

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormNewProps {
  bookId: string;
}

/**
 * 새로운 기록 작성 폼 컴포넌트
 * - 인상깊은 구절 + 내 생각 (텍스트 입력)
 * - 업로드 타입 선택 (사진/필사)
 * - 페이지번호, 태그, 공개여부
 */
export function NoteFormNew({ bookId }: NoteFormNewProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [currentUploadType, setCurrentUploadType] = useState<"photo" | "transcription" | null>(null);
  const [applyStamp, setApplyStamp] = useState(false);
  const transcriptionInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef<boolean>(false); // 중복 제출 방지 플래그
  const isUploadingRef = useRef<boolean>(false); // 이미지 업로드 중복 방지 플래그

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      isPublic: true, // 기본값: 공개
      uploadType: undefined,
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
  const quoteContent = watch("quoteContent") || "";
  const memoContent = watch("memoContent") || "";

  const handleImageUpload = async (files: FileList | null, type: "photo" | "transcription") => {
    if (!files || files.length === 0) return;

    // 중복 업로드 방지: ref로 즉시 체크 (React 상태 업데이트 지연 방지)
    if (isUploadingRef.current) {
      console.warn("[이미지 업로드] 중복 호출 방지: 이미 업로드 중입니다.");
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
      // input value 초기화
      if (transcriptionInputRef.current) transcriptionInputRef.current.value = "";
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setCurrentUploadType(type);
    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        // 스탬프 적용 여부에 따라 이미지 처리
        let fileToUpload = file;
        if (applyStamp) {
          try {
            const stampedBlob = await addStampToImage(file);
            fileToUpload = new File([stampedBlob], file.name, {
              type: file.type || "image/jpeg",
            });
          } catch (stampError) {
            console.error("스탬프 적용 오류:", stampError);
            toast.warning("스탬프 적용에 실패했습니다. 원본 이미지를 업로드합니다.");
            // 스탬프 적용 실패 시 원본 파일 사용
          }
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("type", type);

        setUploadProgress((prev) => ({ ...prev, [i]: 50 }));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("업로드 실패");
        }

        const data = await response.json();
        
        // 디버깅: 업로드 응답 확인
        console.log("[이미지 업로드] 응답 데이터:", {
          url: data.url,
          hasUrl: !!data.url,
          urlType: typeof data.url,
          urlLength: data.url?.length,
        });
        
        if (!data.url) {
          console.error("[이미지 업로드] URL이 응답에 없습니다:", data);
          toast.error(`${file.name} 업로드는 성공했지만 URL을 받지 못했습니다.`);
          continue;
        }
        
        newImages.push(data.url);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
        console.log("[이미지 업로드] 성공:", {
          fileName: file.name,
          url: data.url.substring(0, 100) + "...",
          index: i,
        });
      } catch (error) {
        console.error("이미지 업로드 오류:", error);
        toast.error(`${file.name} 업로드에 실패했습니다.`);
      }
    }

    // 디버깅: 업로드 완료 후 상태 확인
    console.log("[이미지 업로드] 완료:", {
      newImagesCount: newImages.length,
      newImages: newImages.map(url => url.substring(0, 50) + "..."),
      currentImagesCount: images.length,
    });

    if (newImages.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        console.log("[이미지 업로드] 상태 업데이트:", {
          prevCount: prev.length,
          newCount: newImages.length,
          updatedCount: updated.length,
        });
        return updated;
      });
      toast.success(`${newImages.length}개의 이미지가 업로드되었습니다.`);
    } else {
      console.warn("[이미지 업로드] 업로드된 이미지가 없습니다.");
    }
    
    setUploading(false);
    setUploadProgress({});
    setValue("uploadType", type);

    // 업로드 완료 후 플래그 초기화
    isUploadingRef.current = false;

    // input value 초기화 (동일 파일 재선택 가능하도록 + 중복 이벤트 방지)
    if (transcriptionInputRef.current) {
      transcriptionInputRef.current.value = "";
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleTranscriptionClick = () => {
    console.log("필사등록 버튼 클릭됨", {
      ref: transcriptionInputRef.current,
      refExists: !!transcriptionInputRef.current,
    });

    if (!transcriptionInputRef.current) {
      console.error("transcriptionInputRef가 null입니다.");
      toast.error("파일 입력 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    // 브라우저 보안 정책으로 인해 setTimeout을 사용하여 다음 이벤트 루프에서 실행
    setTimeout(() => {
      try {
        if (transcriptionInputRef.current) {
          // input 요소가 실제로 DOM에 있는지 확인
          if (transcriptionInputRef.current.isConnected) {
            transcriptionInputRef.current.click();
            console.log("파일 선택 다이얼로그 열기 시도 완료");
          } else {
            console.error("input 요소가 DOM에 연결되지 않았습니다.");
            toast.error("파일 입력 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
          }
        }
      } catch (error) {
        console.error("파일 선택 다이얼로그 열기 실패:", error);
        toast.error("파일 선택에 실패했습니다.");
      }
    }, 0);
  };

  const handlePhotoClick = () => {
    // 브라우저 보안 정책으로 인해 setTimeout을 사용하여 다음 이벤트 루프에서 실행
    setTimeout(() => {
      if (photoInputRef.current && photoInputRef.current.isConnected) {
        photoInputRef.current.click();
      }
    }, 0);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length === 0) {
        setCurrentUploadType(null);
        setValue("uploadType", undefined);
      }
      return newImages;
    });
  };

  const onSubmit = async (data: NoteFormValues) => {
    // 중복 제출 방지: 이미 제출 중이면 즉시 리턴
    if (isSubmittingRef.current) {
      console.warn("기록 저장 중복 제출 방지: 이미 제출 중입니다.");
      return;
    }

    // 제출 시작 플래그 설정
    isSubmittingRef.current = true;

    try {
      // bookId 검증
      if (!bookId || typeof bookId !== "string" || bookId.trim() === "") {
        toast.error("책 정보를 찾을 수 없습니다. 다시 시도해주세요.");
        router.push("/books");
        return;
      }

      // 최소 하나의 값이 있는지 확인 (빈값 검증)
      const hasQuote = data.quoteContent && data.quoteContent.trim().length > 0;
      const hasMemo = data.memoContent && data.memoContent.trim().length > 0;
      const hasImage = images.length > 0;

      if (!hasQuote && !hasMemo && !hasImage) {
        toast.error("인상깊은 구절, 내 생각, 또는 업로드 중 최소 하나는 입력해주세요.");
        return;
      }

      // type 결정: 업로드가 있으면 업로드 타입, 없으면 memo
      const uploadType = currentUploadType || (images.length > 0 ? "photo" : undefined);
      const noteType = images.length > 0
        ? (uploadType === "photo" ? "photo" : "transcription")
        : "memo";

      // 페이지 번호 (텍스트로 저장)
      const pageNumber = data.pageNumbers?.trim() || undefined;

      let createdCount = 0;

      // 다중 이미지 업로드 시 각 이미지별로 기록 생성
      if (images.length > 0) {
        for (const imageUrl of images) {
          const result = await createNote({
            book_id: bookId,
            title: data.title,
            type: noteType,
            quote_content: data.quoteContent?.trim() || undefined,
            memo_content: data.memoContent?.trim() || undefined,
            image_url: imageUrl,
            upload_type: uploadType || undefined,
            page_number: pageNumber,
            tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
            is_public: data.isPublic,
          });

          createdCount++;

          // transcription 타입이면 OCR 처리 요청
          if (noteType === "transcription" && result.noteId) {
            try {
              console.log("[OCR Client] OCR 요청 시작:", {
                noteId: result.noteId,
                imageUrl: imageUrl?.substring(0, 100) + "...",
                noteType,
              });

              // OCR 처리 시작 알림
              toast.info("필사 이미지에서 텍스트를 추출하는 중입니다...", {
                description: "OCR 처리가 완료되면 필사 테이블에 자동으로 저장됩니다.",
                duration: 5000,
              });

              const ocrResponse = await fetch("/api/ocr", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  noteId: result.noteId,
                  imageUrl,
                }),
              });

              console.log("[OCR Client] OCR 응답 수신:", {
                status: ocrResponse.status,
                statusText: ocrResponse.statusText,
                ok: ocrResponse.ok,
              });

              if (ocrResponse.ok) {
                const responseData = await ocrResponse.json().catch(() => ({}));
                console.log("[OCR Client] OCR 요청 성공:", responseData);

                // OCR 요청 성공 (비동기 처리 시작)
                toast.success("OCR 처리가 시작되었습니다.", {
                  description: "처리가 완료되면 자동으로 업데이트됩니다.",
                  duration: 3000,
                });
              } else {
                const errorData = await ocrResponse.json().catch(() => ({}));
                console.error("[OCR Client] OCR 요청 실패:", {
                  status: ocrResponse.status,
                  statusText: ocrResponse.statusText,
                  error: errorData,
                });

                toast.warning("OCR 처리 요청에 실패했습니다.", {
                  description: errorData.error || "나중에 다시 시도해주세요.",
                });
              }
            } catch (error) {
              console.error("[OCR Client] OCR 요청 오류:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                noteId: result.noteId,
              });
              toast.error("OCR 처리 요청 중 오류가 발생했습니다.", {
                description: error instanceof Error ? error.message : "알 수 없는 오류",
              });
            }
          } else {
            console.log("[OCR Client] OCR 요청 건너뜀:", {
              noteType,
              hasNoteId: !!result.noteId,
              reason: noteType !== "transcription" ? "타입이 transcription이 아님" : "noteId가 없음",
            });
          }
        }
      } else {
        // 이미지가 없는 경우: 텍스트 기록만 생성
        await createNote({
          book_id: bookId,
          title: data.title,
          type: noteType,
          quote_content: data.quoteContent?.trim() || undefined,
          memo_content: data.memoContent?.trim() || undefined,
          upload_type: uploadType || undefined,
          page_number: pageNumber,
          tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          is_public: data.isPublic,
        });
        createdCount++;
      }

      // 생성된 기록 수에 따라 메시지 표시
      if (createdCount > 1) {
        toast.success(`${createdCount}개의 기록이 저장되었습니다.`);
      } else {
        toast.success("저장됨");
      }

      router.push(`/books/${bookId}`);
    } catch (error) {
      console.error("기록 저장 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 저장에 실패했습니다."
      );
    } finally {
      // 제출 완료 후 플래그 리셋 (에러 발생 시에도 리셋)
      isSubmittingRef.current = false;
    }
  };

  // 폼 제출 핸들러 (중복 제출 방지)
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // 이미 제출 중이면 기본 동작 방지
    if (isSubmittingRef.current || isSubmitting || uploading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // handleSubmit 호출
    handleSubmit(onSubmit)(e);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* 제목 입력 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목 <span className="text-muted-foreground text-xs font-normal">(선택)</span></FormLabel>
              <FormControl>
                <Input
                  placeholder="제목"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 인상깊은 구절 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quoteContent">인상깊은 구절</Label>
            <TextPreviewDialog
              title="인상깊은 구절"
              content={quoteContent}
              label="전체 보기"
              onSave={(value) => setValue("quoteContent", value)}
              maxLength={5000}
            />
          </div>
          <BookMentionTextarea
            id="quoteContent"
            value={quoteContent}
            onValueChange={(value) => setValue("quoteContent", value)}
            placeholder="인용구"
            rows={4}
            className="resize-none max-w-2xl"
          />
          {errors.quoteContent && (
            <p className="text-sm text-destructive">{errors.quoteContent.message}</p>
          )}
        </div>

        {/* 내 생각 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="memoContent">내 생각</Label>
            <TextPreviewDialog
              title="내 생각"
              content={memoContent}
              label="전체 보기"
              onSave={(value) => setValue("memoContent", value)}
              maxLength={10000}
            />
          </div>
          <BookMentionTextarea
            id="memoContent"
            value={memoContent}
            onValueChange={(value) => setValue("memoContent", value)}
            placeholder="메모"
            rows={6}
            className="resize-none max-w-2xl"
          />
          {errors.memoContent && (
            <p className="text-sm text-destructive">{errors.memoContent.message}</p>
          )}
        </div>

        {/* 이미지 업로드 버튼 */}
        <div className="space-y-2">
          <Label>이미지 등록 (선택)</Label>
          <div className="flex gap-2">
            <label
              htmlFor="transcription-input"
              className="flex-1 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <div
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full ${uploading || isUploadingRef.current ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  }`}
              >
                <PenTool className="mr-2 h-4 w-4" />
                필사등록
              </div>
            </label>
            <label
              htmlFor="photo-input"
              className="flex-1 cursor-pointer"
              style={{ touchAction: "manipulation" }}
            >
              <div
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full ${uploading || isUploadingRef.current ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  }`}
              >
                <Camera className="mr-2 h-4 w-4" />
                이미지등록
              </div>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-stamp"
              checked={applyStamp}
              onCheckedChange={(checked) => setApplyStamp(checked === true)}
              disabled={uploading}
            />
            <Label
              htmlFor="apply-stamp"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Stamp
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            필사등록 시 이미지에서 텍스트를 자동으로 추출하여 필사 테이블에 저장됩니다.
          </p>
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

        {/* 업로드된 이미지 표시 */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label>업로드된 이미지 ({images.length}개)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((url, index) => {
                const imageUrl = getImageUrl(url);
                console.log("[이미지 표시] 렌더링:", {
                  index,
                  originalUrl: url?.substring(0, 50) + "...",
                  processedUrl: imageUrl?.substring(0, 50) + "...",
                  isValid: isValidImageUrl(url),
                });
                
                return (
                  <div key={`${url}-${index}`} className="relative group">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
                      {isValidImageUrl(url) ? (
                        <Image
                          src={imageUrl}
                          alt={`업로드된 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          unoptimized={true}
                          onError={(e) => {
                            console.error("[이미지 표시] 로드 실패:", {
                              url: imageUrl.substring(0, 100),
                              index,
                            });
                            toast.error(`이미지 ${index + 1} 로드에 실패했습니다.`);
                          }}
                          onLoad={() => {
                            console.log("[이미지 표시] 로드 성공:", {
                              url: imageUrl.substring(0, 50) + "...",
                              index,
                            });
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                          이미지 로드 실패
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1.5 right-1.5 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:shadow-lg z-10"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                    {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                        {uploadProgress[index]}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {currentUploadType && (
              <p className="text-xs text-muted-foreground">
                타입: {currentUploadType === "photo" ? "이미지" : "필사"}
              </p>
            )}
          </div>
        )}

        {/* 페이지 번호 (여러 줄 입력 가능) */}
        <div className="space-y-2">
          <Label htmlFor="pageNumbers">페이지 번호</Label>
          <Textarea
            id="pageNumbers"
            {...register("pageNumbers")}
            placeholder={`예시)
42
100
150`}
            rows={4}
            className="resize-none max-w-2xl"
          />
          <p className="text-xs text-muted-foreground">
            여러 페이지를 한번에 등록하려면 줄바꿈으로 구분하여 입력하세요.
          </p>
          {errors.pageNumbers && (
            <p className="text-sm text-destructive">{errors.pageNumbers.message}</p>
          )}
        </div>

        {/* 태그 */}
        <TagInput
          value={watch("tags") || ""}
          onChange={(value) => setValue("tags", value)}
        />

        {/* 공개 설정 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="isPublic"
              checked={!isPublic} // 반대로: 체크하면 비공개
              onCheckedChange={(checked) => setValue("isPublic", !checked)}
            />
            <Label htmlFor="isPublic" className="cursor-pointer text-sm font-medium">
              {isPublic ? "공개" : "비공개"}
            </Label>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
            {isPublic 
              ? "다른 사용자도 이 기록을 볼 수 있습니다." 
              : "이 기록은 나만 볼 수 있습니다."}
          </p>
        </div>

        {/* 제출 버튼 */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || uploading}
            fullWidth
            size="lg"
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
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || uploading}
            fullWidth
          >
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}

