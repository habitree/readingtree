import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 소셜 로그인 프로필 이미지를 Supabase Storage에 복사
 * 카카오/구글 프로필 URL은 시간이 지나면 만료될 수 있으므로 자체 스토리지에 저장
 * 실패 시 원본 URL(HTTPS 변환)을 반환하여 로그인 흐름을 중단하지 않음
 */
export async function copySocialAvatarToStorage(
  supabase: SupabaseClient,
  userId: string,
  socialAvatarUrl: string
): Promise<string> {
  const safeUrl = socialAvatarUrl.startsWith("http://")
    ? socialAvatarUrl.replace("http://", "https://")
    : socialAvatarUrl;

  try {
    const response = await fetch(safeUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return safeUrl;

    const blob = await response.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const filePath = `avatars/${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) return safeUrl;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return publicUrl;
  } catch {
    return safeUrl;
  }
}
