import { ImageResponse } from "next/og";
import { parseNoteContentFields } from "@/lib/utils/note";
import { isValidImageUrl } from "@/lib/utils/image";
import { isValidUUID } from "@/lib/utils/validation";
import {
  OG_BRAND,
  OG_COLORS,
  OG_SIZE,
  OG_TEXT_LIMITS,
  FONT_FAMILY,
} from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  prefetchImageAsDataUri,
  truncateText,
  cleanText,
  buildFontOptions,
  createOgAnonSupabaseClient,
  createOgServiceSupabaseClient,
} from "@/lib/og/utils";
import {
  OgAccentBar,
  OgDomainFooter,
  OgBrandMark,
  OgFallbackContent,
} from "@/lib/og/components";

export const alt = `${OG_BRAND.name} 독서 기록 공유`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [fontData, brandIconSrc] = await Promise.all([
    loadKoreanFont(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    ),
    loadBrandIcon(new URL("../../../icon.png", import.meta.url)),
  ]);
  const fontOptions = buildFontOptions(fontData);

  try {
    const { id: noteId } = await params;

    if (!noteId || typeof noteId !== "string" || !isValidUUID(noteId)) {
      return fallbackImageResponse(fontOptions, brandIconSrc);
    }

    const supabase = createOgAnonSupabaseClient();
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select(
        `id, content, type, page_number, user_id, created_at, books (id, title, author, cover_image_url), transcriptions (extracted_text)`
      )
      .eq("id", noteId)
      .eq("is_public", true)
      .single();

    if (!note || noteError) {
      return fallbackImageResponse(fontOptions, brandIconSrc);
    }

    // 사용자 정보 조회
    let userName: string | null = null;
    let userAvatarUrl: string | null = null;

    try {
      const serviceClient = createOgServiceSupabaseClient();
      if (serviceClient && note.user_id) {
        const { data: user } = await serviceClient
          .from("users")
          .select("name, avatar_url")
          .eq("id", note.user_id)
          .single();
        if (user) {
          userName = user.name;
          userAvatarUrl = user.avatar_url;
        }
      }
    } catch {
      // user 조회 실패 시 무시
    }

    const rawBooks = (note as Record<string, unknown>).books;
    const book = (Array.isArray(rawBooks) ? rawBooks[0] : rawBooks) as
      | { id: string; title: string; author: string | null; cover_image_url: string | null }
      | undefined;
    const bookTitle = truncateText(
      cleanText(book?.title || "제목 없음"),
      OG_TEXT_LIMITS.bookTitle
    );
    const bookAuthor = cleanText(book?.author || "저자 미상");
    const { quote, memo } = parseNoteContentFields(note.content);

    const rawTranscription = (note as Record<string, unknown>).transcriptions;
    const transcription = Array.isArray(rawTranscription) ? rawTranscription[0] : rawTranscription;
    const transcriptionText =
      note.type === "transcription" && (transcription as Record<string, unknown>)?.extracted_text
        ? (transcription as Record<string, string>).extracted_text
        : null;

    const bodyText = transcriptionText || quote || memo || "기록 내용을 확인해보세요.";
    const bodyTruncated = truncateText(cleanText(bodyText), OG_TEXT_LIMITS.bodyText);

    const isQuoteType = note.type === "quote" || (quote && !memo);

    const noteTypeLabel =
      note.type === "quote"
        ? "인용구"
        : note.type === "transcription"
          ? "필사"
          : note.type === "photo"
            ? "사진 기록"
            : "메모";

    const rawCoverUrl =
      book?.cover_image_url && isValidImageUrl(book.cover_image_url)
        ? book.cover_image_url
        : null;

    const [coverDataUri, avatarDataUri] = await Promise.all([
      rawCoverUrl ? prefetchImageAsDataUri(rawCoverUrl) : Promise.resolve(null),
      userAvatarUrl && isValidImageUrl(userAvatarUrl)
        ? prefetchImageAsDataUri(userAvatarUrl)
        : Promise.resolve(null),
    ]);

    const displayName = userName || "익명";
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONT_FAMILY,
            backgroundColor: OG_COLORS.background,
            backgroundImage:
              "radial-gradient(circle at 10% 20%, rgba(29, 107, 77, 0.06) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(29, 107, 77, 0.04) 0%, transparent 40%)",
          }}
        >
          <OgAccentBar />

          {/* 메인 콘텐츠 영역 */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 56px 16px",
            }}
          >
            {/* 카드 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 490,
                backgroundColor: OG_COLORS.cardBackground,
                borderRadius: 24,
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 책 정보 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 28px",
                  background: "linear-gradient(180deg, #f0fdf4 0%, #f8faf9 100%)",
                  width: 320,
                  gap: 16,
                }}
              >
                {coverDataUri ? (
                  <img
                    src={coverDataUri}
                    alt=""
                    width={150}
                    height={220}
                    style={{
                      objectFit: "cover",
                      borderRadius: 10,
                      boxShadow:
                        "0 16px 32px -8px rgba(0, 0, 0, 0.3), 0 4px 12px -4px rgba(0, 0, 0, 0.12)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 150,
                      height: 220,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      color: "#64748b",
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                      boxShadow: "0 8px 20px -6px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    No Cover
                  </div>
                )}

                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.35,
                    textAlign: "center",
                    fontFamily: FONT_FAMILY,
                    maxWidth: 260,
                  }}
                >
                  {bookTitle}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookAuthor}
                </div>

                {note.page_number && (
                  <div
                    style={{
                      fontSize: 12,
                      color: OG_COLORS.forest,
                      fontWeight: 700,
                      fontFamily: FONT_FAMILY,
                      padding: "3px 10px",
                      backgroundColor: "#dcfce7",
                      borderRadius: 12,
                    }}
                  >
                    {`p.${note.page_number}`}
                  </div>
                )}
              </div>

              {/* 우측: 텍스트 + 유저 정보 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "36px 40px",
                  justifyContent: "space-between",
                }}
              >
                {/* 노트 유형 뱃지 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 16,
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: OG_COLORS.forest,
                      fontFamily: FONT_FAMILY,
                      padding: "4px 14px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: 20,
                      border: `1px solid ${OG_COLORS.border}`,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {noteTypeLabel}
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  {isQuoteType && (
                    <div
                      style={{
                        fontSize: 72,
                        fontWeight: 800,
                        color: OG_COLORS.forestLight,
                        lineHeight: 0.5,
                        marginBottom: 12,
                        fontFamily: "Georgia, serif",
                        opacity: 0.5,
                      }}
                    >
                      {"\u201C"}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        borderRadius: 2,
                        backgroundColor: isQuoteType ? OG_COLORS.forestLight : "#cbd5e1",
                        marginRight: 20,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 22,
                        lineHeight: 1.75,
                        color: "#1e293b",
                        fontFamily: FONT_FAMILY,
                        fontWeight: 600,
                      }}
                    >
                      {bodyTruncated}
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: "#e5e7eb",
                    marginBottom: 16,
                  }}
                />

                {/* 하단: 유저 정보 + 브랜딩 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {avatarDataUri ? (
                      <img
                        src={avatarDataUri}
                        alt=""
                        width={36}
                        height={36}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e5e7eb",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: "#dcfce7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 800,
                          color: OG_COLORS.forest,
                          fontFamily: FONT_FAMILY,
                          border: `2px solid ${OG_COLORS.border}`,
                        }}
                      >
                        {avatarInitial}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#475569",
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      {`${displayName}님의 독서 기록`}
                    </div>
                  </div>

                  <OgBrandMark iconSrc={brandIconSrc} size="md" />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 도메인 */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: OG_COLORS.textMuted,
                fontWeight: 600,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.05em",
              }}
            >
              {OG_BRAND.domain}
            </span>
          </div>
        </div>
      ),
      { ...size, ...fontOptions }
    );
  } catch (e) {
    console.error("[OG Image] Unexpected error:", e);
    return fallbackImageResponse(fontOptions, brandIconSrc);
  }
}

function fallbackImageResponse(
  fontOptions: Record<string, unknown> = {},
  iconSrc?: string | null
) {
  return new ImageResponse(
    <OgFallbackContent
      message="이 기록을 찾을 수 없거나 비공개입니다."
      iconSrc={iconSrc}
    />,
    { ...size, ...fontOptions }
  );
}
