import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getImageUrl } from "@/lib/utils/image";
import { getAppUrl } from "@/lib/utils/url";
import { parseNoteContentFields } from "@/lib/utils/note";
import { isValidUUID } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
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

  const supabase = await createServerSupabaseClient();
  const { data: note } = await supabase
    .from("notes")
    .select(`*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`)
    .eq("id", noteId)
    .eq("is_public", true)
    .single();

  if (!note) {
    return { title: "기록을 찾을 수 없습니다" };
  }

  const book = note.books as any;
  const bookTitle = book?.title || "제목 없음";
  const { quote, memo } = parseNoteContentFields(note.content);

  // 필사(transcription) 타입일 때 OCR 보정 텍스트 사용 (JOIN으로 이미 조회됨)
  const transcription = (note as any).transcriptions;
  const transcriptionText = (note.type === "transcription" && transcription?.extracted_text)
    ? transcription.extracted_text
    : null;

  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/notes/${note.id}`;

  // OG 설명 구성 (필사 타입이면 OCR 텍스트, 그 외에는 인상깊은 구절 우선, 없으면 생각)
  let description = transcriptionText || quote || memo || "기록 내용을 확인해보세요.";
  if (description.length > 100) description = description.substring(0, 97) + "...";

  return {
    title: `${bookTitle} - 독서 기록`,
    description: description,
    openGraph: {
      title: `${bookTitle} - 독서 기록`,
      description: description,
      type: "article",
      url: shareUrl,
      images: book?.cover_image_url
        ? [
          {
            url: book.cover_image_url,
            width: 1200,
            height: 630,
            alt: `${bookTitle} - ${book.author || ""}`,
          },
        ]
        : [],
      siteName: "ReadTree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: `${bookTitle} - 독서 기록`,
      description: description,
      images: book?.cover_image_url ? [book.cover_image_url] : [],
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

  const supabase = await createServerSupabaseClient();
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
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/">
              <ChevronLeft className="w-4 h-4 mr-1" />
              메인으로
            </Link>
          </Button>
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
          />
        </div>

        {/* 하단 푸터 / CTA */}
        <div className="mt-16 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 italic tracking-tight">
              ReadTree
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              당신의 독서 여정을 한 그루의 나무처럼 심고 가꾸어 보세요.<br />
              기록은 생각의 깊이를 더해줍니다.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 h-12 text-sm font-bold shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/login">
              나도 기록 시작하기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


