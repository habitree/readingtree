import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { parseNoteContentFields } from "@/lib/utils/note";
import { isValidImageUrl } from "@/lib/utils/image";
import { isValidUUID } from "@/lib/utils/validation";

export const alt = "ReadTree 독서 기록 공유";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 공개 데이터 조회용 익명 Supabase 클라이언트 */
function createAnonSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** RLS 우회 Supabase 클라이언트 (user 정보 조회용) */
function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** 한글 폰트 로드 (로컬 파일 우선, 실패 시 외부 fetch) */
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

/**
 * 외부 이미지를 사전 fetch하여 base64 data URI로 변환
 * Satori 스트림 렌더링 중 외부 fetch 실패로 인한 500 에러 방지
 */
async function prefetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadTree/1.0)" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    // 10MB 초과 시 건너뛰기
    if (buffer.byteLength > 10 * 1024 * 1024) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
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
  } catch {
    // 폰트 로드 실패 시 기본 폰트 사용
  }

  try {
    const { id: noteId } = await params;

    if (!noteId || typeof noteId !== "string" || !isValidUUID(noteId)) {
      return fallbackImageResponse(fontOptions);
    }

    // 노트 조회 (anon client - is_public=true 노트는 RLS 허용)
    const supabase = createAnonSupabaseClient();
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select(
        `id, content, type, page_number, user_id, created_at, books (id, title, author, cover_image_url), transcriptions (extracted_text)`
      )
      .eq("id", noteId)
      .eq("is_public", true)
      .single();

    if (!note || noteError) {
      return fallbackImageResponse(fontOptions);
    }

    // 사용자 정보 조회 (service role client - users RLS 우회)
    let userName: string | null = null;
    let userAvatarUrl: string | null = null;

    try {
      const serviceClient = createServiceSupabaseClient();
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
      // user 조회 실패 시 무시 (익명으로 표시)
    }

    const rawBooks = (note as any).books;
    const book = (Array.isArray(rawBooks) ? rawBooks[0] : rawBooks) as
      | { id: string; title: string; author: string | null; cover_image_url: string | null }
      | undefined;
    const bookTitle =
      (book?.title || "제목 없음").length > 40
        ? (book?.title || "제목 없음").slice(0, 37) + "..."
        : book?.title || "제목 없음";
    const bookAuthor = book?.author || "저자 미상";
    const { quote, memo } = parseNoteContentFields(note.content);

    const rawTranscription = (note as any).transcriptions;
    const transcription = Array.isArray(rawTranscription) ? rawTranscription[0] : rawTranscription;
    const transcriptionText =
      note.type === "transcription" && transcription?.extracted_text
        ? transcription.extracted_text
        : null;

    const bodyText = transcriptionText || quote || memo || "기록 내용을 확인해보세요.";
    const bodyTruncated = bodyText.length > 150 ? bodyText.slice(0, 147) + "..." : bodyText;

    const isQuoteType = note.type === "quote" || (quote && !memo);

    // 외부 이미지를 사전 fetch → base64 data URI 변환
    // Satori 스트림 렌더링 중 외부 fetch 실패 방지 (500 에러 근본 원인)
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

          {/* 미묘한 도트 패턴 */}
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

          {/* 메인 콘텐츠 영역 */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "30px 60px 20px",
            }}
          >
            {/* 카드 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 480,
                backgroundColor: "white",
                borderRadius: 20,
                boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
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
                  padding: "36px 32px",
                  backgroundColor: "#f8faf9",
                  width: 320,
                  gap: 20,
                }}
              >
                {/* 책 표지 (base64 data URI로 안전하게 렌더링) */}
                {coverDataUri ? (
                  <img
                    src={coverDataUri}
                    alt=""
                    width={160}
                    height={240}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      boxShadow:
                        "0 12px 28px -8px rgba(0, 0, 0, 0.25), 0 4px 8px -2px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 160,
                      height: 240,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 8,
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
                    표지 없음
                  </div>
                )}

                {/* 책 제목 */}
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

                {/* 저자 */}
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

                {/* 페이지 */}
                {note.page_number && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    p.{note.page_number}
                  </div>
                )}
              </div>

              {/* 우측: 텍스트 + 유저 정보 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "40px 44px",
                  justifyContent: "space-between",
                }}
              >
                {/* 텍스트 영역 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  {/* 인용구 장식 따옴표 (quote 타입일 때) */}
                  {isQuoteType && (
                    <div
                      style={{
                        fontSize: 64,
                        fontWeight: 800,
                        color: "#22c55e",
                        lineHeight: 0.6,
                        marginBottom: 8,
                        fontFamily: "Georgia, serif",
                        opacity: 0.6,
                      }}
                    >
                      {"\u201C"}
                    </div>
                  )}

                  {/* 본문 텍스트 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    {/* 좌측 악센트 보더 */}
                    <div
                      style={{
                        width: 4,
                        borderRadius: 2,
                        backgroundColor: isQuoteType ? "#22c55e" : "#e2e8f0",
                        marginRight: 20,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 24,
                        lineHeight: 1.7,
                        color: "#334155",
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
                    marginBottom: 20,
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
                  {/* 유저 정보 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* 아바타 (base64 data URI로 안전하게 렌더링) */}
                    {avatarDataUri ? (
                      <img
                        src={avatarDataUri}
                        alt=""
                        width={40}
                        height={40}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid #e5e7eb",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "#dcfce7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#16a34a",
                          fontFamily: FONT_FAMILY,
                          border: "2px solid #bbf7d0",
                        }}
                      >
                        {avatarInitial}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#475569",
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      {displayName}님의 독서기록
                    </div>
                  </div>

                  {/* ReadTree 브랜딩 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
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
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#374151",
                        letterSpacing: "-0.02em",
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      ReadTree
                    </span>
                  </div>
                </div>
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
    console.error("[OG Image] Unexpected error:", e);
    return fallbackImageResponse(fontOptions);
  }
}

/** 기록을 찾을 수 없거나 비공개일 때 기본 OG 이미지 */
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
              <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", fontFamily: FONT_FAMILY }}>
            ReadTree
          </div>
          <div style={{ fontSize: 16, color: "#64748b", marginTop: 8, fontFamily: FONT_FAMILY }}>
            이 기록을 찾을 수 없거나 비공개입니다.
          </div>
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
