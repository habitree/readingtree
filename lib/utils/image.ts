/**
 * 이미지 처리 유틸리티 함수들
 */

// =============================================================================
// 클라이언트 측 이미지 압축 (비율 유지 + 용량 자동 최적화)
// =============================================================================

export interface ImageCompressionOptions {
  /** 최대 너비 (기본값: 1920) */
  maxWidth?: number;
  /** 최대 높이 (기본값: 1920) */
  maxHeight?: number;
  /** 목표 파일 크기 (바이트 단위, 기본값: 1MB) */
  targetSizeBytes?: number;
  /** 최소 품질 (0-1, 기본값: 0.5) */
  minQuality?: number;
  /** 최대 품질 (0-1, 기본값: 0.92) */
  maxQuality?: number;
  /** 출력 형식 (기본값: image/jpeg) */
  outputFormat?: "image/jpeg" | "image/webp" | "image/png";
}

export interface CompressionResult {
  /** 압축된 파일 */
  file: File;
  /** 원본 크기 (바이트) */
  originalSize: number;
  /** 압축 후 크기 (바이트) */
  compressedSize: number;
  /** 압축률 (%) */
  compressionRatio: number;
  /** 적용된 품질 (0-1) */
  appliedQuality: number;
  /** 원본 해상도 */
  originalDimensions: { width: number; height: number };
  /** 압축 후 해상도 */
  newDimensions: { width: number; height: number };
}

/**
 * 이미지를 로드하여 HTMLImageElement로 반환
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지 로드에 실패했습니다."));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 비율을 유지하면서 새로운 크기 계산
 */
function calculateNewDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // 이미 최대 크기보다 작으면 원본 크기 유지
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // 비율 계산
  const ratio = Math.min(maxWidth / width, maxHeight / height);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Canvas를 사용하여 이미지를 특정 품질로 압축
 */
function compressWithCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number,
  format: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context를 가져올 수 없습니다."));
      return;
    }

    // 고품질 이미지 스케일링 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 이미지 그리기
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Blob으로 변환
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("이미지 압축에 실패했습니다."));
        }
      },
      format,
      quality
    );
  });
}

/**
 * 클라이언트 측 이미지 압축 (비율 유지 + 용량 자동 최적화)
 *
 * @description
 * - 이미지 비율을 유지하면서 최대 해상도 제한
 * - 파일 크기에 따라 품질을 동적으로 조절
 * - 목표 파일 크기에 도달할 때까지 품질을 점진적으로 낮춤
 * - 외부 라이브러리 없이 Canvas API만 사용
 *
 * @example
 * ```typescript
 * const result = await compressImage(file, {
 *   maxWidth: 1920,
 *   maxHeight: 1920,
 *   targetSizeBytes: 1024 * 1024, // 1MB
 * });
 * console.log(`압축률: ${result.compressionRatio}%`);
 * ```
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    targetSizeBytes = 1024 * 1024, // 1MB
    minQuality = 0.5,
    maxQuality = 0.92,
    outputFormat = "image/jpeg",
  } = options;

  const originalSize = file.size;

  // 이미지 타입 검증
  if (!file.type.startsWith("image/")) {
    throw new Error("유효한 이미지 파일이 아닙니다.");
  }

  // 이미지 로드
  const img = await loadImage(file);
  const originalDimensions = { width: img.width, height: img.height };

  // 새 크기 계산 (비율 유지)
  const newDimensions = calculateNewDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // 이미 목표 크기보다 작고, 리사이즈가 필요 없으면 원본 반환
  if (
    file.size <= targetSizeBytes &&
    newDimensions.width === img.width &&
    newDimensions.height === img.height &&
    (file.type === outputFormat || file.type === "image/jpeg" || file.type === "image/png")
  ) {
    return {
      file,
      originalSize,
      compressedSize: file.size,
      compressionRatio: 0,
      appliedQuality: 1,
      originalDimensions,
      newDimensions,
    };
  }

  // 품질 조절을 통한 압축
  let quality = maxQuality;
  let blob: Blob;
  let iterations = 0;
  const maxIterations = 10; // 무한 루프 방지

  // 먼저 최대 품질로 시도
  blob = await compressWithCanvas(
    img,
    newDimensions.width,
    newDimensions.height,
    quality,
    outputFormat
  );

  // 목표 크기에 도달할 때까지 품질 낮춤
  while (blob.size > targetSizeBytes && quality > minQuality && iterations < maxIterations) {
    // 품질을 점진적으로 낮춤 (파일 크기에 비례)
    const sizeRatio = targetSizeBytes / blob.size;
    const qualityReduction = Math.max(0.05, (1 - sizeRatio) * 0.2);
    quality = Math.max(minQuality, quality - qualityReduction);

    blob = await compressWithCanvas(
      img,
      newDimensions.width,
      newDimensions.height,
      quality,
      outputFormat
    );

    iterations++;
  }

  // 확장자 결정
  const extension = outputFormat === "image/webp" ? ".webp" :
                    outputFormat === "image/png" ? ".png" : ".jpg";

  // 원본 파일명에서 확장자 제거하고 새 확장자 추가
  const originalName = file.name.replace(/\.[^.]+$/, "");
  const newFileName = `${originalName}${extension}`;

  // 새 File 객체 생성
  const compressedFile = new File([blob], newFileName, {
    type: outputFormat,
    lastModified: Date.now(),
  });

  const compressedSize = compressedFile.size;
  const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    compressionRatio: Math.max(0, compressionRatio),
    appliedQuality: quality,
    originalDimensions,
    newDimensions,
  };
}

/**
 * 이미지 압축이 필요한지 확인
 *
 * @param file 확인할 파일
 * @param thresholdBytes 압축 기준 크기 (바이트, 기본값: 1MB)
 * @returns 압축 필요 여부
 */
export function needsCompression(file: File, thresholdBytes: number = 1024 * 1024): boolean {
  return file.size > thresholdBytes && file.type.startsWith("image/");
}

/**
 * 스마트 이미지 압축 - 필요한 경우에만 압축 수행
 *
 * @description
 * - 파일 크기가 임계값보다 작으면 원본 반환
 * - 임계값 초과 시 자동 압축
 * - 압축 결과 로깅 (개발 모드)
 */
export async function smartCompressImage(
  file: File,
  options: ImageCompressionOptions & {
    /** 압축 시작 임계값 (바이트, 기본값: 1MB) */
    compressionThreshold?: number;
    /** 콘솔 로그 출력 여부 (기본값: false) */
    verbose?: boolean;
  } = {}
): Promise<File> {
  const {
    compressionThreshold = 1024 * 1024, // 1MB
    verbose = false,
    ...compressionOptions
  } = options;

  // 이미지 타입이 아니면 원본 반환
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // 압축이 필요 없으면 원본 반환
  if (file.size <= compressionThreshold) {
    if (verbose) {
      console.log(`[이미지 압축] 원본 유지: ${formatFileSize(file.size)}`);
    }
    return file;
  }

  try {
    const result = await compressImage(file, {
      targetSizeBytes: compressionThreshold,
      ...compressionOptions,
    });

    if (verbose) {
      console.log(
        `[이미지 압축] ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${result.compressionRatio}% 감소, 품질: ${Math.round(result.appliedQuality * 100)}%)`
      );
      console.log(
        `[이미지 압축] 해상도: ${result.originalDimensions.width}x${result.originalDimensions.height} → ${result.newDimensions.width}x${result.newDimensions.height}`
      );
    }

    return result.file;
  } catch (error) {
    console.error("[이미지 압축] 압축 실패, 원본 사용:", error);
    return file;
  }
}

// =============================================================================
// 기존 유틸리티 함수들
// =============================================================================

/**
 * 이미지 URL이 유효한지 확인
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * HTTP URL을 HTTPS로 변환
 * Mixed Content 경고 방지를 위해 HTTP 이미지 URL을 HTTPS로 변환
 */
export function convertToHttps(url: string): string {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    // HTTP인 경우 HTTPS로 변환
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
      return urlObj.toString();
    }
    return url;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url;
  }
}

/**
 * 이미지 URL에 기본 이미지 적용 (URL이 없거나 유효하지 않을 때)
 * 기본 이미지가 없을 경우 투명한 1x1 픽셀 데이터 URI 사용
 * HTTP URL은 자동으로 HTTPS로 변환
 */
export function getImageUrl(
  url: string | null | undefined,
  fallback?: string
): string {
  // 빈 값 처리
  if (!url) {
    if (fallback && (isValidImageUrl(fallback) || fallback.startsWith("/"))) {
      return fallback.startsWith("/") ? fallback : convertToHttps(fallback);
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  }

  // 절대 경로 URL인 경우 HTTPS 변환
  if (isValidImageUrl(url)) {
    return convertToHttps(url);
  }

  // 상대 경로(/로 시작)인 경우 그대로 반환
  if (url.startsWith("/")) {
    return url;
  }

  // 기본 fallback
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
}

/**
 * Supabase Storage URL 생성
 */
export function getSupabaseImageUrl(
  bucket: string,
  path: string,
  supabaseUrl?: string
): string {
  const baseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * 이미지 파일 크기 검증 (최대 5MB)
 */
export function validateImageSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일 형식 검증
 */
export function validateImageType(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환 (예: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * 이미지 URL을 Next.js 이미지 최적화 API를 통해 프록시 처리된 URL로 변환
 * CORS 문제를 우회하기 위해 사용 (Next.js 서버가 대신 이미지를 가져옴)
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  const originalUrl = getImageUrl(url);

  // 데이터 URI나 로컬 경로는 그대로 반환
  if (originalUrl.startsWith("data:") || originalUrl.startsWith("/")) {
    return originalUrl;
  }

  // Next.js Image Optimization API URL 구성
  // w=640, q=75는 적절한 기본값
  return `/_next/image?url=${encodeURIComponent(originalUrl)}&w=640&q=75`;
}
