/**
 * 파일 업로드 보안 검증 유틸리티
 * - 파일 시그니처(매직 바이트) 검증
 * - MIME 타입 검증
 * - 파일명 정규화
 * - 확장자 검증
 */

// 이미지 파일 시그니처 (매직 바이트)
const IMAGE_SIGNATURES: Record<string, { signature: number[]; offset: number; mimeType: string }[]> = {
  // JPEG: FF D8 FF
  jpeg: [
    { signature: [0xff, 0xd8, 0xff, 0xe0], offset: 0, mimeType: 'image/jpeg' },
    { signature: [0xff, 0xd8, 0xff, 0xe1], offset: 0, mimeType: 'image/jpeg' },
    { signature: [0xff, 0xd8, 0xff, 0xe2], offset: 0, mimeType: 'image/jpeg' },
    { signature: [0xff, 0xd8, 0xff, 0xe8], offset: 0, mimeType: 'image/jpeg' },
    { signature: [0xff, 0xd8, 0xff, 0xdb], offset: 0, mimeType: 'image/jpeg' },
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: [
    { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, mimeType: 'image/png' },
  ],
  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  webp: [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'image/webp' },
  ],
  // HEIC: 66 74 79 70 68 65 69 63 (ftypheic) or 66 74 79 70 6D 69 66 31 (ftypmif1)
  heic: [
    { signature: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], offset: 4, mimeType: 'image/heic' },
    { signature: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31], offset: 4, mimeType: 'image/heic' },
    { signature: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x78], offset: 4, mimeType: 'image/heic' },
  ],
};

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];

// 허용된 확장자
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 위험한 파일명 패턴
const DANGEROUS_PATTERNS = [
  /\.\./,           // Path traversal
  /^\.+$/,          // Hidden files
  /[<>:"|?*]/,      // Windows 금지 문자
  /[\x00-\x1f]/,    // Control characters
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Windows 예약어
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedMimeType?: string;
  sanitizedFileName?: string;
}

/**
 * 파일 시그니처(매직 바이트)로 실제 파일 타입 검증
 */
export async function validateFileSignature(file: File): Promise<{ isValid: boolean; detectedType?: string }> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (const [, signatures] of Object.entries(IMAGE_SIGNATURES)) {
      for (const sig of signatures) {
        const { signature, offset, mimeType } = sig;

        // WebP 특별 처리: RIFF 헤더 확인 후 WEBP 확인
        if (mimeType === 'image/webp') {
          if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            // WEBP 확인 (offset 8-11)
            const webpBuffer = await file.slice(8, 12).arrayBuffer();
            const webpBytes = new Uint8Array(webpBuffer);
            if (webpBytes[0] === 0x57 && webpBytes[1] === 0x45 &&
                webpBytes[2] === 0x42 && webpBytes[3] === 0x50) {
              return { isValid: true, detectedType: mimeType };
            }
          }
          continue;
        }

        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[offset + i] !== signature[i]) {
            matches = false;
            break;
          }
        }

        if (matches) {
          return { isValid: true, detectedType: mimeType };
        }
      }
    }

    return { isValid: false };
  } catch (error) {
    console.error('[FileValidation] 시그니처 검증 오류:', error);
    return { isValid: false };
  }
}

/**
 * 파일명 정규화 및 검증
 * - Path traversal 방지
 * - 위험한 문자 제거
 * - 확장자 검증
 */
export function sanitizeFileName(fileName: string): { isValid: boolean; sanitized?: string; error?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: '파일명이 제공되지 않았습니다.' };
  }

  // 위험한 패턴 검사
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(fileName)) {
      return { isValid: false, error: '유효하지 않은 파일명입니다.' };
    }
  }

  // 파일명에서 경로 구분자 제거 (path traversal 방지)
  let sanitized = fileName.replace(/[/\\]/g, '');

  // 앞뒤 공백 및 점 제거
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // 연속된 점 제거
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // 빈 파일명 체크
  if (!sanitized || sanitized === '.') {
    return { isValid: false, error: '유효하지 않은 파일명입니다.' };
  }

  // 확장자 추출 및 검증
  const lastDotIndex = sanitized.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === sanitized.length - 1) {
    return { isValid: false, error: '파일 확장자가 없습니다.' };
  }

  const extension = sanitized.slice(lastDotIndex + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { isValid: false, error: `지원하지 않는 확장자입니다: .${extension}` };
  }

  // 파일명 길이 제한 (255자)
  if (sanitized.length > 255) {
    const baseName = sanitized.slice(0, lastDotIndex);
    sanitized = baseName.slice(0, 255 - extension.length - 1) + '.' + extension;
  }

  return { isValid: true, sanitized };
}

/**
 * MIME 타입 검증
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, maxSizeMB?: number): { isValid: boolean; error?: string } {
  const maxSize = maxSizeMB ? maxSizeMB * 1024 * 1024 : MAX_FILE_SIZE;

  if (file.size === 0) {
    return { isValid: false, error: '빈 파일은 업로드할 수 없습니다.' };
  }

  if (file.size > maxSize) {
    const maxSizeFormatted = Math.round(maxSize / (1024 * 1024));
    return { isValid: false, error: `파일 크기가 ${maxSizeFormatted}MB를 초과합니다.` };
  }

  return { isValid: true };
}

/**
 * 종합 파일 검증
 * - MIME 타입 검증
 * - 파일 시그니처 검증
 * - 파일명 정규화
 * - 파일 크기 검증
 */
export async function validateUploadFile(
  file: File,
  options?: { maxSizeMB?: number }
): Promise<FileValidationResult> {
  // 1. 파일 크기 검증
  const sizeResult = validateFileSize(file, options?.maxSizeMB);
  if (!sizeResult.isValid) {
    return { isValid: false, error: sizeResult.error };
  }

  // 2. MIME 타입 검증
  if (!validateMimeType(file.type)) {
    return {
      isValid: false,
      error: '지원하지 않는 파일 형식입니다. (jpg, png, webp, heic만 지원)'
    };
  }

  // 3. 파일 시그니처 검증 (실제 파일 내용 확인)
  const signatureResult = await validateFileSignature(file);
  if (!signatureResult.isValid) {
    return {
      isValid: false,
      error: '파일 내용이 확장자와 일치하지 않습니다. 유효한 이미지 파일을 업로드해주세요.'
    };
  }

  // 4. 파일명 정규화
  const fileNameResult = sanitizeFileName(file.name);
  if (!fileNameResult.isValid) {
    return { isValid: false, error: fileNameResult.error };
  }

  // 5. MIME 타입과 시그니처 일치 확인
  const declaredType = file.type.toLowerCase();
  const detectedType = signatureResult.detectedType?.toLowerCase();

  // JPEG 타입 정규화
  const normalizedDeclared = declaredType === 'image/jpg' ? 'image/jpeg' : declaredType;
  const normalizedDetected = detectedType === 'image/jpg' ? 'image/jpeg' : detectedType;

  if (normalizedDeclared !== normalizedDetected) {
    console.warn(
      `[FileValidation] MIME 타입 불일치: 선언=${declaredType}, 감지=${detectedType}`
    );
    // 경고만 기록하고 계속 진행 (감지된 타입이 허용된 타입인 경우)
  }

  return {
    isValid: true,
    detectedMimeType: signatureResult.detectedType,
    sanitizedFileName: fileNameResult.sanitized,
  };
}

/**
 * 안전한 파일명 생성
 * - 타임스탬프 + 랜덤 문자열 + 확장자
 */
export function generateSafeFileName(extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${timestamp}-${random}.${safeExtension || 'jpg'}`;
}

/**
 * 확장자 추출 (안전한 방식)
 */
export function getFileExtension(fileName: string, mimeType?: string): string {
  // MIME 타입에서 확장자 추출 시도
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
  };

  if (mimeType && mimeToExt[mimeType.toLowerCase()]) {
    return mimeToExt[mimeType.toLowerCase()];
  }

  // 파일명에서 확장자 추출
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex !== -1 && lastDotIndex < fileName.length - 1) {
    const ext = fileName.slice(lastDotIndex + 1).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      return ext;
    }
  }

  return 'jpg'; // 기본값
}
