import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { isValidUUID, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import {
  validateUploadFile,
  generateSafeFileName,
  getFileExtension,
} from "@/lib/security/file-validation";

/**
 * 이미지 업로드 API
 * Supabase Storage에 이미지를 업로드합니다.
 * 파일 크기가 5MB를 초과하면 자동으로 압축합니다.
 */
export async function POST(request: NextRequest) {
  // Rate limiting 체크 (분당 30회 제한 - 파일 업로드는 더 엄격하게)
  const rateLimitResult = await checkRateLimit(request, 30);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // user.id UUID 검증
    if (!isValidUUID(user.id)) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자 ID입니다." },
        { status: 400 }
      );
    }

    // 폼 데이터 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'photo' | 'transcription'

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 });
    }

    // type 파라미터 검증
    if (!type || !["photo", "transcription"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 파일 타입입니다. (photo 또는 transcription만 지원)" },
        { status: 400 }
      );
    }

    // 종합 파일 검증 (MIME, 시그니처, 파일명, 크기)
    const validationResult = await validateUploadFile(file, { maxSizeMB: 10 });
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error || "파일 검증에 실패했습니다." },
        { status: 400 }
      );
    }

    // 파일 크기 확인 및 압축
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    let fileToUpload = file;

    if (file.size > MAX_SIZE) {
      // 이미지 압축
      try {
        const buffer = await file.arrayBuffer();
        const compressed = await sharp(Buffer.from(buffer))
          .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        fileToUpload = new File([new Uint8Array(compressed)], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (error) {
        const safeError = sanitizeErrorForLogging(error);
        console.error("이미지 압축 오류:", safeError);
        return NextResponse.json(
          { error: "이미지 압축에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // 안전한 파일명 생성 (타임스탬프 + 랜덤 + 확장자)
    const fileExt = getFileExtension(
      fileToUpload.name,
      validationResult.detectedMimeType || fileToUpload.type
    );
    const fileName = generateSafeFileName(fileExt);

    // 업로드 경로: ${type}s/${userId}/${fileName}
    const filePath = `${type}s/${user.id}/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      const safeError = sanitizeErrorForLogging(uploadError);
      console.error("업로드 오류:", safeError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(uploadError) },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("업로드 API 오류:", safeError);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

