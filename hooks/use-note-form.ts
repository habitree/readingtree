"use client";

import { useState, useRef, useCallback } from "react";
import { createNote } from "@/app/actions/notes";
import { smartCompressImage, formatFileSize, validateImageType } from "@/lib/utils/image";
import { addStampToImage } from "@/lib/utils/stamp";
import { toast } from "sonner";

/**
 * 노트 폼 데이터 타입
 */
export interface NoteFormData {
  title?: string;
  quoteContent?: string;
  memoContent?: string;
  pageNumbers?: string;
  tags?: string;
  isPublic: boolean;
}

/**
 * useNoteForm 훅 옵션
 */
export interface UseNoteFormOptions {
  /** user_books.id */
  bookId: string;
  /** 저장 성공 콜백 */
  onSuccess?: () => void;
  /** 저장 실패 콜백 */
  onError?: (error: Error) => void;
  /** 초기 업로드 타입 */
  initialUploadType?: "photo" | "transcription" | null;
}

/**
 * useNoteForm 훅 반환 타입
 */
export interface UseNoteFormReturn {
  // 상태
  images: string[];
  uploading: boolean;
  uploadProgress: Record<number, number>;
  uploadType: "photo" | "transcription" | null;
  isSubmitting: boolean;

  // Ref (중복 방지용)
  isUploadingRef: React.MutableRefObject<boolean>;
  isSubmittingRef: React.MutableRefObject<boolean>;

  // 핸들러
  handleImageUpload: (
    files: FileList | null,
    type: "photo" | "transcription",
    applyStamp?: boolean
  ) => Promise<void>;
  removeImage: (index: number) => void;
  submitNote: (data: NoteFormData) => Promise<void>;
  setUploadType: React.Dispatch<React.SetStateAction<"photo" | "transcription" | null>>;
  resetImages: () => void;
}

/**
 * 노트 폼 공통 훅
 *
 * @description
 * note-form-new.tsx와 mobile-note-form.tsx에서 공통으로 사용하는 로직을 추출
 * - 이미지 업로드 (압축 + 스탬프)
 * - 이미지 제거
 * - 노트 생성 (다중 이미지 지원)
 * - OCR 요청 (필사 타입)
 */
export function useNoteForm(options: UseNoteFormOptions): UseNoteFormReturn {
  const { bookId, onSuccess, onError, initialUploadType = null } = options;

  // 이미지 상태
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploadType, setUploadType] = useState<"photo" | "transcription" | null>(initialUploadType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 중복 방지 Ref
  const isUploadingRef = useRef(false);
  const isSubmittingRef = useRef(false);

  /**
   * 이미지 업로드 핸들러
   * - 이미지 타입 검증
   * - 스마트 압축 (1MB 초과 시)
   * - 스탬프 적용 (옵션)
   * - 서버 업로드
   */
  const handleImageUpload = useCallback(async (
    files: FileList | null,
    type: "photo" | "transcription",
    applyStamp: boolean = false
  ) => {
    if (!files || files.length === 0) return;

    // 중복 업로드 방지
    if (isUploadingRef.current) {
      console.warn("[useNoteForm] 중복 업로드 방지: 이미 업로드 중입니다.");
      return;
    }
    isUploadingRef.current = true;

    const fileArray = Array.from(files);
    // 이미지 타입만 검증 (크기는 압축으로 자동 조절)
    const validFiles = fileArray.filter((file) => validateImageType(file));

    if (validFiles.length === 0) {
      toast.error("유효한 이미지 파일을 선택해주세요. (JPEG, PNG, WebP, HEIC 지원)");
      isUploadingRef.current = false;
      return;
    }

    setUploadType(type);
    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        // 1. 이미지 압축 (비율 유지 + 용량 자동 최적화)
        let fileToUpload: File;
        try {
          const originalSize = file.size;
          fileToUpload = await smartCompressImage(file, {
            compressionThreshold: 1024 * 1024, // 1MB 이상이면 압축
            maxWidth: 1920,
            maxHeight: 1920,
            targetSizeBytes: 1024 * 1024, // 목표: 1MB
            minQuality: 0.5,
            maxQuality: 0.92,
            verbose: true,
          });

          if (fileToUpload.size < originalSize) {
            const savedPercent = Math.round((1 - fileToUpload.size / originalSize) * 100);
            console.log(`[useNoteForm] 이미지 압축: ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(fileToUpload.size)} (${savedPercent}% 감소)`);
          }
        } catch (compressError) {
          console.error("[useNoteForm] 이미지 압축 오류:", compressError);
          fileToUpload = file;
        }

        setUploadProgress((prev) => ({ ...prev, [i]: 25 }));

        // 2. 스탬프 적용 여부에 따라 이미지 처리
        if (applyStamp) {
          try {
            const stampedBlob = await addStampToImage(fileToUpload);
            fileToUpload = new File([stampedBlob], fileToUpload.name, {
              type: fileToUpload.type || "image/jpeg",
            });
          } catch (stampError) {
            console.error("[useNoteForm] 스탬프 적용 오류:", stampError);
            toast.warning("스탬프 적용에 실패했습니다. 원본 이미지를 업로드합니다.");
          }
        }

        setUploadProgress((prev) => ({ ...prev, [i]: 40 }));

        // 3. 서버 업로드
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("type", type);

        setUploadProgress((prev) => ({ ...prev, [i]: 60 }));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("업로드 실패");
        }

        const data = await response.json();

        console.log("[useNoteForm] 업로드 응답:", {
          url: data.url?.substring(0, 50) + "...",
          hasUrl: !!data.url,
        });

        if (!data.url) {
          console.error("[useNoteForm] URL이 응답에 없습니다:", data);
          toast.error(`${file.name} 업로드는 성공했지만 URL을 받지 못했습니다.`);
          continue;
        }

        newImages.push(data.url);
        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
        console.log("[useNoteForm] 업로드 성공:", { fileName: file.name, index: i });
      } catch (error) {
        console.error("[useNoteForm] 이미지 업로드 오류:", error);
        toast.error(`${file.name} 업로드에 실패했습니다.`);
      }
    }

    console.log("[useNoteForm] 업로드 완료:", {
      newImagesCount: newImages.length,
      currentImagesCount: images.length,
    });

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length}개의 이미지가 업로드되었습니다.`);
    }

    setUploading(false);
    setUploadProgress({});
    isUploadingRef.current = false;
  }, [images.length]);

  /**
   * 이미지 제거 핸들러
   */
  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length === 0) {
        setUploadType(initialUploadType);
      }
      return newImages;
    });
  }, [initialUploadType]);

  /**
   * 이미지 초기화
   */
  const resetImages = useCallback(() => {
    setImages([]);
    setUploadType(initialUploadType);
    setUploadProgress({});
  }, [initialUploadType]);

  /**
   * 노트 제출 핸들러
   * - 다중 이미지 지원 (각 이미지별로 노트 생성)
   * - OCR 요청 (필사 타입)
   */
  const submitNote = useCallback(async (data: NoteFormData) => {
    // 중복 제출 방지
    if (isSubmittingRef.current) {
      console.warn("[useNoteForm] 중복 제출 방지: 이미 제출 중입니다.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // bookId 검증
      if (!bookId || typeof bookId !== "string" || bookId.trim() === "") {
        throw new Error("책 정보를 찾을 수 없습니다. 다시 시도해주세요.");
      }

      // 최소 하나의 값이 있는지 확인
      const hasQuote = data.quoteContent && data.quoteContent.trim().length > 0;
      const hasMemo = data.memoContent && data.memoContent.trim().length > 0;
      const hasImage = images.length > 0;

      if (!hasQuote && !hasMemo && !hasImage) {
        throw new Error("인상깊은 구절, 내 생각, 또는 이미지 중 최소 하나는 입력해주세요.");
      }

      // type 결정: 업로드가 있으면 업로드 타입, 없으면 memo
      const currentUploadType = uploadType || (images.length > 0 ? "photo" : undefined);
      const noteType = images.length > 0
        ? (currentUploadType === "photo" ? "photo" : "transcription")
        : "memo";

      // 페이지 번호 (텍스트로 저장)
      const pageNumber = data.pageNumbers?.trim() || undefined;

      // 태그 파싱
      const parsedTags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined;

      let createdCount = 0;

      // 다중 이미지 업로드 시 각 이미지별로 기록 생성
      if (images.length > 0) {
        for (const imageUrl of images) {
          const result = await createNote({
            book_id: bookId,
            title: data.title?.trim() || undefined,
            type: noteType,
            quote_content: data.quoteContent?.trim() || undefined,
            memo_content: data.memoContent?.trim() || undefined,
            image_url: imageUrl,
            upload_type: currentUploadType || undefined,
            page_number: pageNumber,
            tags: parsedTags,
            is_public: data.isPublic,
          });

          createdCount++;

          // transcription 타입이면 OCR 처리 요청
          if (noteType === "transcription" && result.noteId) {
            await requestOCR(result.noteId, imageUrl);
          }
        }
      } else {
        // 이미지가 없는 경우: 텍스트 기록만 생성
        await createNote({
          book_id: bookId,
          title: data.title?.trim() || undefined,
          type: noteType,
          quote_content: data.quoteContent?.trim() || undefined,
          memo_content: data.memoContent?.trim() || undefined,
          upload_type: currentUploadType || undefined,
          page_number: pageNumber,
          tags: parsedTags,
          is_public: data.isPublic,
        });
        createdCount++;
      }

      // 성공 메시지
      if (createdCount > 1) {
        toast.success(`${createdCount}개의 기록이 저장되었습니다.`);
      } else {
        toast.success("저장됨");
      }

      // 성공 콜백 호출
      onSuccess?.();
    } catch (error) {
      console.error("[useNoteForm] 기록 저장 오류:", error);
      const errorMessage = error instanceof Error ? error.message : "기록 저장에 실패했습니다.";
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [bookId, images, uploadType, onSuccess, onError]);

  return {
    // 상태
    images,
    uploading,
    uploadProgress,
    uploadType,
    isSubmitting,

    // Ref
    isUploadingRef,
    isSubmittingRef,

    // 핸들러
    handleImageUpload,
    removeImage,
    submitNote,
    setUploadType,
    resetImages,
  };
}

/**
 * OCR 처리 요청 헬퍼 함수
 */
async function requestOCR(noteId: string, imageUrl: string): Promise<void> {
  try {
    console.log("[useNoteForm] OCR 요청 시작:", { noteId, imageUrl: imageUrl.substring(0, 50) + "..." });

    toast.info("필사 이미지에서 텍스트를 추출하는 중입니다...", {
      description: "OCR 처리가 완료되면 자동으로 저장됩니다.",
      duration: 5000,
    });

    const ocrResponse = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, imageUrl }),
    });

    console.log("[useNoteForm] OCR 응답:", {
      status: ocrResponse.status,
      ok: ocrResponse.ok,
    });

    if (ocrResponse.ok) {
      toast.success("OCR 처리가 시작되었습니다.", {
        description: "처리가 완료되면 자동으로 업데이트됩니다.",
        duration: 3000,
      });
    } else {
      const errorData = await ocrResponse.json().catch(() => ({}));
      console.error("[useNoteForm] OCR 요청 실패:", errorData);
      toast.warning("OCR 처리 요청에 실패했습니다.", {
        description: errorData.error || "나중에 다시 시도해주세요.",
      });
    }
  } catch (error) {
    console.error("[useNoteForm] OCR 요청 오류:", error);
    toast.error("OCR 처리 요청 중 오류가 발생했습니다.");
  }
}
