import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils/url";
import { parseNoteContentFields } from "@/lib/utils/note";
import { isValidUUID } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
import { ShareCtaSection } from "@/components/share/share-cta-section";
import type { NoteWithBook } from "@/types/note";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getUserById } from "@/app/actions/profile";

/**
 * 공유 페이지 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 검증
  if (!noteId || typeof noteId !== 'string' || !isValidUUID(noteId)) {
    return { title: "기록을 찾을 수 없습니다" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: note } = await supabase
    .from("notes")
    .select(`*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`)
    .eq("id", noteId)
    .eq("is_public", true)
    .single();

  if (!note) {
    return { title: "기록을 찾을 수 없습니다" };
  }

  const book = note.books as unknown as { id: string; title: string; author: string | null; cover_image_url: string | null } | null;
  const bookTitle = book?.title || "제목 없음";
  // 카카오톡 제목 최적화: 부제(괄호) 제거하여 간결하게
  const cleanTitle = bookTitle.replace(/\s*\(.*?\)\s*$/, "").trim() || bookTitle;
  const { quote, memo } = parseNoteContentFields(note.content);

  // 필사(transcription) 타입일 때 OCR 보정 텍스트 사용 (JOIN으로 이미 조회됨)
  const transcription = (note as Record<string, unknown>).transcriptions as { extracted_text?: string } | null;
  const transcriptionText = (note.type === "transcription" && transcription?.extracted_text)
    ? transcription.extracted_text
    : null;

  // 사용자 이름 조회 (OG 제목에 소셜 프루프 추가)
  let userName: string | null = null;
  if (note.user_id) {
    const user = await getUserById(note.user_id);
    userName = user?.name || null;
  }

  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/notes/${note.id}`;

  // OG 설명 구성: 날짜/제목 접두어 제거 → 핵심 문장만 인용 형태로
  let rawDesc = transcriptionText || quote || memo || "";
  // 날짜 접두어 제거 (예: "25.10.15", "2025-10-15")
  rawDesc = rawDesc.replace(/^\d{2,4}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*/, "");
  // 본문 앞에 반복된 책 제목 제거
  if (book?.title) {
    const escaped = book.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rawDesc = rawDesc.replace(new RegExp(`^${escaped}\\s*`), "");
  }
  rawDesc = rawDesc.trim();

  let description: string;
  if (rawDesc) {
    const truncated = rawDesc.length > 75 ? rawDesc.substring(0, 72) + "..." : rawDesc;
    description = `"${truncated}"`;
  } else {
    description = `${cleanTitle}에 대한 독서 기록을 확인해보세요.`;
  }

  // OG 제목: 사용자명으로 소셜 프루프 + 간결한 책 제목
  const ogTitle = userName
    ? `${userName}님이 ${cleanTitle}에서 발견한 문장`
    : `${cleanTitle} - 독서 기록`;
  const pageTitle = `${cleanTitle} - 독서 기록 | ReadTree`;

  // OG 이미지: 해당 링크 페이지 화면과 동일한 레이아웃의 동적 이미지 사용
  const ogImageUrl = `${baseUrl}/share/notes/${note.id}/opengraph-image`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: ogTitle,
      description: description,
      type: "article",
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${cleanTitle} - ${book?.author || ""}`.trim() || "독서 기록",
        },
      ],
      siteName: "ReadTree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: description,
      images: [ogImageUrl],
    },
  };
}

/**
 * 공유 페이지
 * 공개 기록 조회 및 심미적인 카드 뷰 제공
 */
export default async function ShareNotePage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 및 UUID 검증
  if (!noteId || typeof noteId !== 'string' || !isValidUUID(noteId)) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();
  const { data: note, error } = await supabase
    .from("notes")
    .select(`*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`)
    .eq("id", noteId)
    .eq("is_public", true)
    .single();

  if (error || !note) {
    notFound();
  }

  // Supabase 조인 결과 정규화: transcriptions → transcription (단수)
  const { transcriptions, books, ...restNote } = note as any;
  const noteWithBook: NoteWithBook = {
    ...restNote,
    book: Array.isArray(books) ? books[0] : (books || undefined),
    transcription: transcriptions || undefined,
  };

  // 사용자 정보 가져오기
  const user = note.user_id ? await getUserById(note.user_id) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary/20">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
              <Link href="/">
                <ChevronLeft className="w-4 h-4 mr-1" />
                메인으로
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Public Shared Note
            </div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="relative group">
          {/* 장식적 배경 요소 */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000" />

          <ShareNoteCard
            note={noteWithBook}
            isPublicView={true}
            className="relative z-10"
            user={user}
            rawTranscriptionText={transcriptions?.raw_extracted_text}
          />
        </div>

        {/* 하단 푸터 / CTA */}
        <ShareCtaSection variant="note" />
      </div>
    </div>
  );
}


