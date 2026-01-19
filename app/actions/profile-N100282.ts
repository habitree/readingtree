"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { isValidUUID, sanitizeErrorForLogging, sanitizeErrorMessage } from "@/lib/utils/validation";

/**
 * 프로필 조회
 * 프로필이 없으면 자동 생성
 */
export async function getProfile() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 프로필 조회
  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // 프로필이 없으면 자동 생성
  if (error && error.code === "PGRST116") {
    // 프로필이 없는 경우 자동 생성
    const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: defaultName,
        reading_goal: 12, // 기본값
      })
      .select()
      .single();

    if (insertError || !newProfile) {
      throw new Error(`프로필 생성 실패: ${insertError?.message || "프로필을 생성할 수 없습니다."}`);
    }

    return newProfile;
  }

  if (error || !data) {
    throw new Error(`프로필 조회 실패: ${error?.message || "프로필을 찾을 수 없습니다."}`);
  }

  return data;
}

/**
 * 프로필 수정
 * @param data 수정할 프로필 데이터
 */
export async function updateProfile(data: {
  name?: string;
  reading_goal?: number;
}) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 독서 목표 유효성 검사
  if (data.reading_goal !== undefined) {
    if (data.reading_goal < 1 || data.reading_goal > 100) {
      throw new Error("독서 목표는 1-100 사이의 숫자여야 합니다.");
    }
  }

  // 이름 유효성 검사
  if (data.name !== undefined) {
    if (!data.name.trim() || data.name.length > 100) {
      throw new Error("이름은 1-100자 사이여야 합니다.");
    }
  }

  // 프로필 업데이트
  const updateData: {
    name?: string;
    reading_goal?: number;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.reading_goal !== undefined) {
    updateData.reading_goal = data.reading_goal;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // 프로필 수정 후 관련 페이지 캐시 무효화
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout"); // 레이아웃 캐시도 무효화
  return { success: true };
}

/**
 * 프로필 이미지 업로드
 * @param imageFile 이미지 파일 (최대 2MB, jpg/png/webp)
 */
export async function updateProfileImage(imageFile: File) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 파일 형식 검증
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error("지원하지 않는 파일 형식입니다. (jpg, png, webp만 지원)");
  }

  // 파일 크기 검증 (최대 2MB)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > MAX_SIZE) {
    throw new Error("파일 크기는 2MB 이하여야 합니다.");
  }

  // 이미지 압축 (필요시)
  let fileToUpload = imageFile;
  if (imageFile.size > MAX_SIZE * 0.8) {
    // 1.6MB 이상이면 압축
    try {
      const buffer = await imageFile.arrayBuffer();
      const compressed = await sharp(Buffer.from(buffer))
        .resize(400, 400, { fit: "cover", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      fileToUpload = new File(
        [new Uint8Array(compressed)],
        `avatar-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );
    } catch (error) {
      const safeError = sanitizeErrorForLogging(error);
      console.error("이미지 압축 오류:", safeError);
      // 압축 실패해도 원본 파일로 업로드 시도
    }
  }

  // 파일 확장자 추출
  const fileExt = fileToUpload.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `avatar-${timestamp}-${random}.${fileExt}`;

  // 업로드 경로: avatars/{userId}/{fileName}
  const filePath = `avatars/${user.id}/${fileName}`;

  // 기존 프로필 이미지 삭제 (있으면)
  const { data: currentProfile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (currentProfile?.avatar_url) {
    // Supabase Storage URL에서 경로 추출
    // URL 형식: https://{project}.supabase.co/storage/v1/object/public/images/avatars/{userId}/{fileName}
    const urlParts = currentProfile.avatar_url.split("/avatars/");
    if (urlParts.length > 1) {
      const oldPath = `avatars/${urlParts[1]}`;
      // Storage에서 기존 이미지 삭제 (에러는 무시 - 파일이 없을 수 있음)
      await supabase.storage.from("images").remove([oldPath]);
    }
  }

  // Supabase Storage에 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, fileToUpload, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    const safeError = sanitizeErrorForLogging(uploadError);
    console.error("업로드 오류:", safeError);
    throw new Error("업로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  // 공개 URL 생성
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(filePath);

  // 프로필에 이미지 URL 저장
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    // 업로드는 성공했지만 DB 업데이트 실패 시 파일 삭제
    await supabase.storage.from("images").remove([filePath]);
    throw new Error(`프로필 업데이트 실패: ${updateError.message}`);
  }

  // 프로필 이미지 업로드 후 관련 페이지 캐시 무효화
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout"); // 레이아웃 캐시도 무효화
  return { success: true, avatarUrl: publicUrl };
}

/**
 * 현재 사용자의 프로필 정보 조회 (헤더용)
 * 클라이언트 컴포넌트에서 사용 가능
 * 프로필이 없으면 자동 생성
 * @returns 사용자 프로필 정보 (id, name, avatar_url) 또는 null
 */
export async function getCurrentUserProfile() {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 프로필 조회
  let { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .single();

  // 프로필이 없으면 자동 생성
  if (error && error.code === "PGRST116") {
    const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자";
    const { data: newProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: defaultName,
        reading_goal: 12, // 기본값
      })
      .select("id, name, avatar_url")
      .single();

    if (insertError || !newProfile) {
      // 프로필 생성 실패해도 null 반환 (에러 로그만 출력)
      console.error("프로필 자동 생성 실패:", insertError);
      return null;
    }

    return newProfile;
  }

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * 사용자 ID로 사용자 정보 조회
 * @param userId 사용자 ID
 * @returns 사용자 정보 또는 null
 */
export async function getUserById(userId: string) {
  const supabase = await createServerSupabaseClient();

  if (!userId || !isValidUUID(userId)) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

