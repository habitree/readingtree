import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/utils/validation";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";

export const alt = "ReadTree 서재 공유";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    );
    if (res.ok) return res.arrayBuffer();
  } catch {}
  try {
    const res = await fetch(
      "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-SemiBold.otf"
    );
    if (!res.ok) throw new Error("Failed to fetch font");
    return res.arrayBuffer();
  } catch (e) {
    console.error("[OG Image] Font fetch failed:", e);
    return null;
  }
}

const FONT_FAMILY = '"NotoSansKR", sans-serif';

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let fontOptions: Record<string, any> = {};

  try {
    const fontData = await loadKoreanFont();
    fontOptions = fontData
      ? {
          fonts: [
            {
              name: "NotoSansKR",
              data: fontData,
              style: "normal" as const,
              weight: 600 as const,
            },
          ],
        }
      : {};
  } catch {}

  try {
    const { id: bookshelfId } = await params;

    if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
      return fallbackImageResponse(fontOptions);
    }

    const serviceClient = createServiceSupabaseClient();
    if (!serviceClient) {
      return fallbackImageResponse(fontOptions);
    }

    // 공개 서재 조회
    const { data: bookshelf, error: bsError } = await serviceClient
      .from("bookshelves")
      .select("id, name, description, user_id, is_public")
      .eq("id", bookshelfId)
      .eq("is_public", true)
      .maybeSingle();

    if (bsError || !bookshelf) {
      return fallbackImageResponse(fontOptions);
    }

    // 소유자 정보
    let ownerName = "ReadTree 사용자";
    try {
      const { data: owner } = await serviceClient
        .from("users")
        .select("name")
        .eq("id", bookshelf.user_id)
        .single();
      if (owner?.name) ownerName = owner.name;
    } catch {}

    // 서재에 속한 책 조회 (최대 8권 표지용)
    const { data: items } = await serviceClient
      .from("bookshelf_items")
      .select("user_books (books (title, author, cover_image_url))")
      .eq("bookshelf_id", bookshelfId)
      .order("created_at", { ascending: false })
      .limit(8);

    const books = (items || [])
      .map((item: any) => {
        const book = item.user_books?.books;
        return book
          ? {
              title: book.title || "제목 없음",
              author: book.author || "",
              coverUrl:
                book.cover_image_url && isValidImageUrl(book.cover_image_url)
                  ? getImageUrl(book.cover_image_url)
                  : null,
            }
          : null;
      })
      .filter(Boolean) as Array<{ title: string; author: string; coverUrl: string | null }>;

    const bookshelfName =
      bookshelf.name.length > 30
        ? bookshelf.name.slice(0, 27) + "..."
        : bookshelf.name;

    const displayBooks = books.slice(0, 6);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONT_FAMILY,
            backgroundColor: "#f8faf9",
            backgroundImage:
              "radial-gradient(circle at 0% 0%, rgba(22, 163, 74, 0.06) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.04) 0%, transparent 50%)",
          }}
        >
          {/* 상단 그린 악센트 바 */}
          <div
            style={{
              width: "100%",
              height: 4,
              background: "linear-gradient(90deg, #16a34a, #22c55e, #16a34a)",
            }}
          />

          {/* 도트 패턴 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "radial-gradient(#16a34a 0.8px, transparent 0.8px)",
              backgroundSize: "24px 24px",
              opacity: 0.04,
            }}
          />

          {/* 메인 콘텐츠 */}
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
                backgroundColor: "white",
                borderRadius: 20,
                boxShadow:
                  "0 20px 60px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 서재 정보 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "40px 36px",
                  backgroundColor: "#f8faf9",
                  width: 380,
                  gap: 16,
                }}
              >
                {/* 서재 아이콘 */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
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

                {/* 서재 이름 */}
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookshelfName}
                </div>

                {/* 소유자 */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {ownerName}님의 서재
                </div>

                {/* 책 수 */}
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
                      padding: "4px 12px",
                      backgroundColor: "#dcfce7",
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#16a34a",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {books.length}권
                  </div>
                </div>

                {/* ReadTree 브랜딩 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: "auto",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#374151",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    ReadTree
                  </span>
                </div>
              </div>

              {/* 우측: 책 표지 그리드 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  alignContent: "center",
                  justifyContent: "center",
                  padding: "24px 32px",
                  gap: 16,
                }}
              >
                {displayBooks.map((book, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 120,
                    }}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt=""
                        width={100}
                        height={140}
                        style={{
                          objectFit: "cover",
                          borderRadius: 6,
                          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.2)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 100,
                          height: 140,
                          backgroundColor: "#e2e8f0",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: "#64748b",
                          fontWeight: 600,
                          fontFamily: FONT_FAMILY,
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        {book.title.length > 12
                          ? book.title.slice(0, 10) + "..."
                          : book.title}
                      </div>
                    )}
                  </div>
                ))}
                {displayBooks.length === 0 && (
                  <div
                    style={{
                      fontSize: 18,
                      color: "#94a3b8",
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
              paddingBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#94a3b8",
                fontWeight: 500,
                fontFamily: FONT_FAMILY,
              }}
            >
              readingtree.app
            </span>
          </div>
        </div>
      ),
      { ...size, ...fontOptions }
    );
  } catch (e) {
    console.error("[OG Image - Bookshelf] Unexpected error:", e);
    return fallbackImageResponse(fontOptions);
  }
}

function fallbackImageResponse(fontOptions: Record<string, any> = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8faf9",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div
          style={{
            padding: 48,
            backgroundColor: "white",
            borderRadius: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", fontFamily: FONT_FAMILY }}>
            ReadTree
          </div>
          <div style={{ fontSize: 16, color: "#64748b", marginTop: 8, fontFamily: FONT_FAMILY }}>
            이 서재를 찾을 수 없거나 비공개입니다.
          </div>
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
