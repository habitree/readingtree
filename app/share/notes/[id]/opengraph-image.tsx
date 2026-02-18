import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { parseNoteContentFields } from "@/lib/utils/note";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { isValidUUID } from "@/lib/utils/validation";

export const alt = "ReadTree 독서 기록 공유";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 공개 데이터 조회용 익명 Supabase 클라이언트 (cookies 불필요) */
function createAnonSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** 한글 폰트 로드 (Noto Sans KR) */
async function loadKoreanFont(): Promise<ArrayBuffer | null> {
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

/**
 * 공유 페이지(/share/notes/[id])와 동일한 화면 구성의 OG 이미지 생성
 * 카드 레이아웃: 책 표지 + 제목/저자 + 인상 구절 또는 메모 + ReadTree 브랜딩
 */
export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: noteId } = await params;

  // 폰트를 먼저 로드
  const fontData = await loadKoreanFont();
  const fontOptions = fontData
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

  if (!noteId || typeof noteId !== "string" || !isValidUUID(noteId)) {
    return fallbackImageResponse(fontOptions);
  }

  const supabase = createAnonSupabaseClient();
  const { data: note } = await supabase
    .from("notes")
    .select(
      `id, content, type, page_number, created_at, books (id, title, author, cover_image_url), transcriptions (extracted_text)`
    )
    .eq("id", noteId)
    .eq("is_public", true)
    .single();

  if (!note) {
    return fallbackImageResponse(fontOptions);
  }

  const rawBooks = (note as any).books;
  const book = (Array.isArray(rawBooks) ? rawBooks[0] : rawBooks) as
    | { id: string; title: string; author: string | null; cover_image_url: string | null }
    | undefined;
  const bookTitle =
    (book?.title || "제목 없음").length > 50
      ? (book?.title || "제목 없음").slice(0, 47) + "..."
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
  const bodyTruncated = bodyText.length > 180 ? bodyText.slice(0, 177) + "..." : bodyText;

  const coverUrl =
    book?.cover_image_url && isValidImageUrl(book.cover_image_url)
      ? getImageUrl(book.cover_image_url)
      : null;
  const useCoverImage =
    typeof coverUrl === "string" && coverUrl.startsWith("http");

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
          backgroundColor: "#f8fafc",
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* 공유 페이지와 동일: 상단 뱃지 느낌 */}
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: "white",
            borderRadius: 9999,
            border: "1px solid #e2e8f0",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontFamily: FONT_FAMILY,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
            }}
          />
          Public Shared Note
        </div>

        {/* 메인 카드 - ShareNoteCard와 유사 레이아웃 */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: 1040,
            height: 480,
            backgroundColor: "white",
            borderRadius: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {/* 좌측: 책 표지 + 제목/저자 (공유 카드 좌측 섹션) */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              padding: 40,
              gap: 24,
              backgroundColor: "#f8fafc",
              borderRight: "1px solid #e2e8f0",
              width: 420,
            }}
          >
            {/* 책 표지 */}
            {useCoverImage && coverUrl ? (
              <img
                src={coverUrl}
                alt=""
                width={140}
                height={210}
                style={{
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 210,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#64748b",
                  fontWeight: 600,
                  fontFamily: FONT_FAMILY,
                }}
              >
                표지 없음
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.3,
                  marginBottom: 8,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: FONT_FAMILY,
                }}
              >
                {bookTitle}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#15803d",
                  fontFamily: FONT_FAMILY,
                }}
              >
                {bookAuthor}
              </div>
              {note.page_number && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 12,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {note.page_number}P Record
                </div>
              )}
            </div>
          </div>

          {/* 우측: 인상 구절 / 메모 (공유 카드 우측 텍스트 영역) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: 40,
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.6,
                color: "#334155",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: FONT_FAMILY,
              }}
            >
              {bodyTruncated}
            </div>

            {/* 푸터: ReadTree 로고 (ShareNoteCard 푸터와 동일) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 24,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0f172a",
                    fontStyle: "italic",
                    letterSpacing: "-0.02em",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  ReadTree
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Your Intelligence Forest
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 도메인 */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            fontSize: 16,
            color: "#94a3b8",
            fontWeight: 500,
            fontFamily: FONT_FAMILY,
          }}
        >
          readingtree-tan.vercel.app
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
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
          backgroundColor: "#f8fafc",
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
