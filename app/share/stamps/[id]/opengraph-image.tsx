import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { isValidImageUrl } from "@/lib/utils/image";
import {
  OG_SIZE,
  FONT_FAMILY,
  OG_COLORS,
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
  OgAuroraBackground,
  OgGrainTexture,
  OgBookCoverFrame,
  OgBrandMark,
  OgFallbackContent,
} from "@/lib/og/components";

/**
 * 스탬프 공유용 OG 이미지 (1200×630).
 * - 좌측: 책 표지 + 제목 + 저자
 * - 우측: 통계(독서 시간 / 페이지) + 메모 인용 + 사용자
 *
 * 노트 OG 패턴(`app/share/notes/[id]/opengraph-image.tsx`)과 톤 일치.
 */

export const alt = "ReadTree 독서 스탬프 공유";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

interface StampRow {
  id: string;
  user_id: string;
  is_public: boolean;
  image_url: string | null;
  image_urls: string[] | null;
  start_page: number | null;
  end_page: number | null;
  reading_duration_seconds: number;
  pace_seconds_per_page: number | null;
  memo: string | null;
  created_at: string;
  user_books?: {
    books?: {
      title: string;
      author: string | null;
      cover_image_url: string | null;
    } | null;
  } | null;
}

function formatDuration(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fontData = await loadKoreanFont(
    new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url),
  );
  const fontOptions = buildFontOptions(fontData);
  const colors = OG_COLORS;

  const brandIconSrc = await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || !isValidUUID(id)) {
      return fallback(fontOptions, brandIconSrc);
    }

    const supabase = createOgAnonSupabaseClient();
    const { data: stamp, error } = await supabase
      .from("reading_logs")
      .select(
        `
        id,
        user_id,
        is_public,
        image_url,
        image_urls,
        start_page,
        end_page,
        reading_duration_seconds,
        pace_seconds_per_page,
        memo,
        created_at,
        user_books!inner (
          books (
            title,
            author,
            cover_image_url
          )
        )
      `,
      )
      .eq("id", id)
      .eq("is_public", true)
      .single();

    if (error || !stamp) return fallback(fontOptions, brandIconSrc);

    const row = stamp as unknown as StampRow;
    const book = row.user_books?.books ?? null;

    // 사용자 정보
    let userName: string | null = null;
    try {
      const service = createOgServiceSupabaseClient();
      if (service && row.user_id) {
        const { data: u } = await service
          .from("users")
          .select("name")
          .eq("id", row.user_id)
          .single();
        if (u) userName = u.name;
      }
    } catch {
      // ignore
    }

    const bookTitle = truncateText(cleanText(book?.title || "제목 없음"), 30);
    const bookAuthor = cleanText(book?.author || "저자 미상");

    const startPage = row.start_page ?? 0;
    const endPage = row.end_page ?? startPage;
    const pages = Math.max(0, endPage - startPage);
    const duration = formatDuration(row.reading_duration_seconds);
    const memoPreview = row.memo ? truncateText(cleanText(row.memo), 90) : null;

    const rawCoverUrl =
      book?.cover_image_url && isValidImageUrl(book.cover_image_url)
        ? book.cover_image_url
        : null;
    const stampPhoto = (Array.isArray(row.image_urls) && row.image_urls[0]) || row.image_url || null;
    const stampPhotoValid = stampPhoto && isValidImageUrl(stampPhoto) ? stampPhoto : null;

    const [coverDataUri, photoDataUri] = await Promise.all([
      rawCoverUrl ? prefetchImageAsDataUri(rawCoverUrl) : Promise.resolve(null),
      stampPhotoValid ? prefetchImageAsDataUri(stampPhotoValid) : Promise.resolve(null),
    ]);

    const displayName = userName || "ReadTree 사용자";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONT_FAMILY,
            backgroundColor: colors.background,
          }}
        >
          <OgAuroraBackground colors={colors} variant="note" />
          <OgGrainTexture />

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 56px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 490,
                backgroundColor: colors.cardBackground,
                borderRadius: 24,
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 책 정보 또는 스탬프 사진 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 28px",
                  background: `linear-gradient(160deg, rgba(26, 117, 85, 0.06) 0%, rgba(61, 184, 127, 0.04) 50%, rgba(247, 245, 240, 0.8) 100%), linear-gradient(180deg, #f0fdf4 0%, #f8faf9 100%)`,
                  width: 360,
                  gap: 12,
                }}
              >
                {photoDataUri ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoDataUri}
                    alt=""
                    width={280}
                    height={280}
                    style={{
                      borderRadius: 16,
                      objectFit: "cover",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                    }}
                  />
                ) : (
                  <OgBookCoverFrame
                    coverSrc={coverDataUri}
                    width={170}
                    height={245}
                    accentColor={colors.forest}
                  />
                )}

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.35,
                    textAlign: "center",
                    fontFamily: FONT_FAMILY,
                    maxWidth: 300,
                  }}
                >
                  {bookTitle}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookAuthor}
                </div>
              </div>

              {/* 우측: 통계 + 메모 + 사용자 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "40px 44px",
                  justifyContent: "space-between",
                }}
              >
                {/* 상단 뱃지 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.forest,
                      fontFamily: FONT_FAMILY,
                      padding: "5px 16px",
                      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                      borderRadius: 20,
                      border: `1px solid ${colors.border}`,
                      letterSpacing: "0.02em",
                    }}
                  >
                    독서 스탬프
                  </div>
                </div>

                {/* 통계 */}
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    marginTop: 20,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontFamily: FONT_FAMILY,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      독서 시간
                    </span>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontFamily: FONT_FAMILY,
                        marginTop: 4,
                      }}
                    >
                      {duration}
                    </span>
                  </div>
                  <div
                    style={{
                      width: 1,
                      backgroundColor: "#e5e7eb",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        fontFamily: FONT_FAMILY,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      페이지
                    </span>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#0f172a",
                        fontFamily: FONT_FAMILY,
                        marginTop: 4,
                      }}
                    >
                      {pages > 0 ? `${pages}p` : `${endPage}p`}
                    </span>
                    {pages > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        {startPage} → {endPage}
                      </span>
                    )}
                  </div>
                </div>

                {/* 메모 인용 */}
                {memoPreview ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      marginTop: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        borderRadius: 2,
                        backgroundColor: colors.forestLight,
                        marginRight: 16,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 19,
                        lineHeight: 1.6,
                        color: "#334155",
                        fontFamily: FONT_FAMILY,
                        fontWeight: 500,
                        fontStyle: "italic",
                      }}
                    >
                      {memoPreview}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }} />
                )}

                {/* 구분선 */}
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: "#e5e7eb",
                    marginTop: 16,
                  }}
                />

                {/* 사용자 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#64748b",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {displayName}
                  </div>
                  <OgBrandMark
                    iconSrc={brandIconSrc}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        ...fontOptions,
      },
    );
  } catch {
    return fallback(fontOptions, brandIconSrc);
  }
}

function fallback(fontOptions: Record<string, unknown>, brandIconSrc: string | null) {
  const colors = OG_COLORS;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT_FAMILY,
          backgroundColor: colors.background,
        }}
      >
        <OgAuroraBackground colors={colors} variant="note" />
        <OgGrainTexture />
        <OgFallbackContent
          iconSrc={brandIconSrc}
          message="공유되지 않은 스탬프이거나 존재하지 않습니다"
          colors={colors}
        />
      </div>
    ),
    {
      ...size,
      ...fontOptions,
    },
  );
}
