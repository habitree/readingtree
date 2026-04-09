import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { isValidImageUrl } from "@/lib/utils/image";
import {
  OG_SIZE,
  OG_TEXT_LIMITS,
  FONT_FAMILY,
} from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  loadBrandIconFromUrl,
  prefetchImageAsDataUri,
  truncateText,
  buildFontOptions,
  createOgServiceSupabaseClient,
} from "@/lib/og/utils";
import {
  OgAccentBar,
  OgBrandMark,
  OgFallbackContent,
  OgAuroraBackground,
  OgGrainTexture,
  OgBookDecoration,
} from "@/lib/og/components";
import { getOgConfig } from "@/lib/og/settings";

export const alt = "Habitree 서재 공유";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [fontData, config] = await Promise.all([
    loadKoreanFont(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    ),
    getOgConfig(),
  ]);
  const fontOptions = buildFontOptions(fontData);
  const { brand, colors } = config;

  const brandIconSrc = config.brandIconUrl
    ? await loadBrandIconFromUrl(config.brandIconUrl)
    : await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  try {
    const { id: bookshelfId } = await params;

    if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const serviceClient = createOgServiceSupabaseClient();
    if (!serviceClient) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const { data: bookshelf, error: bsError } = await serviceClient
      .from("bookshelves")
      .select("id, name, description, user_id, is_public")
      .eq("id", bookshelfId)
      .eq("is_public", true)
      .maybeSingle();

    if (bsError || !bookshelf) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    let ownerName = `${brand.name} 사용자`;
    try {
      const { data: owner } = await serviceClient
        .from("users")
        .select("name")
        .eq("id", bookshelf.user_id)
        .single();
      if (owner?.name) ownerName = owner.name;
    } catch {}

    const { data: items } = await serviceClient
      .from("bookshelf_items")
      .select("user_books (books (title, author, cover_image_url))")
      .eq("bookshelf_id", bookshelfId)
      .order("created_at", { ascending: false })
      .limit(8);

    const books = (items || [])
      .map((item: Record<string, unknown>) => {
        const userBooks = item.user_books as Record<string, unknown> | null;
        const book = userBooks?.books as Record<string, string> | null;
        return book
          ? {
              title: book.title || "제목 없음",
              author: book.author || "",
              coverUrl:
                book.cover_image_url && isValidImageUrl(book.cover_image_url)
                  ? book.cover_image_url
                  : null,
            }
          : null;
      })
      .filter(Boolean) as Array<{ title: string; author: string; coverUrl: string | null }>;

    const bookshelfName = truncateText(bookshelf.name, OG_TEXT_LIMITS.bookshelfName);

    const displayBooks = books.slice(0, 6);

    const prefetchedBooks = await Promise.all(
      displayBooks.map(async (book) => ({
        ...book,
        coverDataUri: book.coverUrl ? await prefetchImageAsDataUri(book.coverUrl) : null,
      }))
    );

    // 교차 색상 box-shadow
    const bookShadowColors = [
      "rgba(26, 117, 85, 0.20)",
      "rgba(196, 147, 90, 0.18)",
      "rgba(61, 184, 127, 0.16)",
      "rgba(224, 180, 122, 0.15)",
      "rgba(26, 117, 85, 0.18)",
      "rgba(196, 147, 90, 0.16)",
    ];

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
          <OgAccentBar colors={colors} />
          <OgAuroraBackground colors={colors} variant="bookshelf" />
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
                boxShadow:
                  "0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 서재 정보 (오로라 그래디언트) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "36px 32px",
                  background: `linear-gradient(160deg, rgba(26, 117, 85, 0.07) 0%, rgba(61, 184, 127, 0.04) 50%, rgba(248, 250, 249, 0.9) 100%), linear-gradient(180deg, #f0fdf4 0%, #f8faf9 100%)`,
                  width: 380,
                  gap: 14,
                  position: "relative",
                }}
              >
                {/* 장식 책 */}
                <OgBookDecoration color={colors.forest} position="bottom-left" opacity={0.05} />

                {/* 서재 아이콘 (64x64 + 글로우) */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${colors.forest}, ${colors.forestLight})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 24px -4px rgba(26, 117, 85, 0.25)`,
                  }}
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.forest,
                    fontFamily: FONT_FAMILY,
                    padding: "3px 12px",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    borderRadius: 20,
                    border: `1px solid ${colors.border}`,
                    letterSpacing: "0.05em",
                    alignSelf: "flex-start",
                  }}
                >
                  BOOKSHELF
                </div>

                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookshelfName}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {`${ownerName}님의 서재`}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      padding: "5px 14px",
                      background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 700,
                      color: colors.forest,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {books.length}권
                  </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <OgBrandMark iconSrc={brandIconSrc} brand={brand} colors={colors} />
                </div>
              </div>

              {/* 우측: 책 표지 그리드 (color-tinted shadows) */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  alignContent: "center",
                  justifyContent: "center",
                  padding: "20px 28px",
                  gap: 14,
                }}
              >
                {prefetchedBooks.map((book, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 115,
                    }}
                  >
                    {book.coverDataUri ? (
                      <img
                        src={book.coverDataUri}
                        alt=""
                        width={96}
                        height={136}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          boxShadow: `0 6px 16px -4px ${bookShadowColors[i % bookShadowColors.length]}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 96,
                          height: 136,
                          backgroundColor: "#f1f5f9",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: "#64748b",
                          fontWeight: 600,
                          fontFamily: FONT_FAMILY,
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {book.title.length > 12
                          ? book.title.slice(0, 10) + "..."
                          : book.title}
                      </div>
                    )}
                  </div>
                ))}
                {prefetchedBooks.length === 0 && (
                  <div
                    style={{
                      fontSize: 18,
                      color: colors.textMuted,
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    아직 책이 없습니다
                  </div>
                )}
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
                color: colors.textMuted,
                fontWeight: 600,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.08em",
              }}
            >
              {brand.domain}
            </span>
          </div>
        </div>
      ),
      { ...size, ...fontOptions }
    );
  } catch (e) {
    console.error("[OG Image - Bookshelf] Unexpected error:", e);
    return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
  }
}

function fallbackImageResponse(
  fontOptions: Record<string, unknown> = {},
  iconSrc?: string | null,
  brand?: { name: string; tagline: string; keywords: string; domain: string; description: string },
  colors?: Record<string, string>
) {
  return new ImageResponse(
    <OgFallbackContent
      message="이 서재를 찾을 수 없거나 비공개입니다."
      iconSrc={iconSrc}
      brand={brand}
      colors={colors as never}
    />,
    { ...size, ...fontOptions }
  );
}
