import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
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
  createOgAdminSupabaseClient,
} from "@/lib/og/utils";
import {
  OgBrandMark,
  OgFallbackContent,
  OgEarthAccentBar,
  OgAuroraBackground,
  OgGrainTexture,
  OgLeafDecoration,
  OgBookCoverFrame,
} from "@/lib/og/components";
import { getOgConfig } from "@/lib/og/settings";

export const alt = "ReadTree 완독 축하 카드";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}) {
  const [fontData, config] = await Promise.all([
    loadKoreanFont(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url),
    ),
    getOgConfig(),
  ]);
  const fontOptions = buildFontOptions(fontData);
  const { brand, colors } = config;

  const brandIconSrc = config.brandIconUrl
    ? await loadBrandIconFromUrl(config.brandIconUrl)
    : await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  try {
    const { userBookId } = await params;

    if (!userBookId || typeof userBookId !== "string" || !isValidUUID(userBookId)) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const supabase = createOgAdminSupabaseClient();
    const { data: userBook, error } = await supabase
      .from("user_books")
      .select("status, completed_at, completed_dates, started_at, books(title, author, cover_image_url)")
      .eq("id", userBookId)
      .eq("status", "completed")
      .single();

    if (!userBook || error) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const booksField = (userBook as unknown as { books: { title: string; author: string | null; cover_image_url: string | null } | { title: string; author: string | null; cover_image_url: string | null }[] | null }).books;
    const book = Array.isArray(booksField) ? booksField[0] ?? null : booksField;
    if (!book) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const bookTitle = truncateText(book.title || "제목 없음", OG_TEXT_LIMITS.bookTitle);
    const bookAuthor = book.author || "저자 미상";

    const completedDates = Array.isArray(userBook.completed_dates) ? userBook.completed_dates : [];
    const readCount = Math.max(completedDates.length, userBook.completed_at ? 1 : 0);
    const completedDateText = userBook.completed_at
      ? new Date(userBook.completed_at).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    let readingDaysText: string | null = null;
    if (userBook.started_at && userBook.completed_at) {
      const startMs = new Date(userBook.started_at).getTime();
      const endMs = new Date(userBook.completed_at).getTime();
      const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
      readingDaysText = `${diffDays}일`;
    }

    const coverDataUri = book.cover_image_url
      ? await prefetchImageAsDataUri(book.cover_image_url)
      : null;

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
          <OgEarthAccentBar colors={colors} />
          <OgAuroraBackground colors={colors} variant="report" />
          <OgGrainTexture />
          <OgLeafDecoration color={colors.earthLight} position="bottom-right" opacity={0.07} leafSize="md" />

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "30px 60px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 480,
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                boxShadow:
                  "0 20px 60px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 32px",
                  background: `linear-gradient(160deg, rgba(34, 197, 94, 0.08) 0%, rgba(251, 191, 36, 0.05) 50%, rgba(250, 245, 238, 0.9) 100%), linear-gradient(180deg, #faf5ee 0%, #fdf9f3 100%)`,
                  width: 320,
                  gap: 20,
                }}
              >
                <OgBookCoverFrame coverSrc={coverDataUri} width={160} height={240} accentColor={colors.earth} />
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    textAlign: "center",
                    fontFamily: FONT_FAMILY,
                    maxWidth: 260,
                  }}
                >
                  {bookTitle}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookAuthor}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "40px 44px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#059669",
                      fontFamily: FONT_FAMILY,
                      letterSpacing: "0.1em",
                    }}
                  >
                    🏆 READING COMPLETE
                  </div>

                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.1,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {readCount > 1 ? `${readCount}회독 완독!` : "완독했어요"}
                  </div>

                  {completedDateText && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        fontSize: 18,
                        color: "#44403c",
                        fontWeight: 600,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      <span>완독일 · {completedDateText}</span>
                      {readingDaysText && <span>독서 기간 · {readingDaysText}</span>}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <OgBrandMark iconSrc={brandIconSrc} size="md" brand={brand} colors={colors} />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: colors.textMuted,
                fontWeight: 500,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.08em",
              }}
            >
              {brand.domain}
            </span>
          </div>
        </div>
      ),
      { ...size, ...fontOptions },
    );
  } catch (e) {
    console.error("[OG Image · Completion] Unexpected error:", e);
    return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
  }
}

function fallbackImageResponse(
  fontOptions: Record<string, unknown> = {},
  iconSrc?: string | null,
  brand?: { name: string; tagline: string; keywords: string; domain: string; description: string },
  colors?: Record<string, string>,
) {
  return new ImageResponse(
    <OgFallbackContent
      message="완독 기록을 찾을 수 없거나 비공개입니다."
      iconSrc={iconSrc}
      brand={brand}
      colors={colors as never}
    />,
    { ...size, ...fontOptions },
  );
}
