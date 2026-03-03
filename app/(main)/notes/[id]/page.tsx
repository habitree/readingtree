import { notFound, redirect } from "next/navigation";
import { Metadata, Viewport } from "next";
import { getNoteDetail } from "@/app/actions/notes";
import { getCachedCurrentUser } from "@/lib/cached";
import { getSampleNoteDetail, getSampleUserBooksByIds } from "@/app/actions/sample";
import { NoteDetailNavBar } from "@/components/notes/note-detail-nav-bar";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
import { Card, CardContent } from "@/components/ui/card";
import type { NoteWithBook } from "@/types/note";
import { getUserById } from "@/app/actions/profile";
import { RelatedBooksDisplay } from "@/components/notes/related-books-manager";
import { OcrTextViewer } from "@/components/notes/ocr-text-viewer";
import { getUserBooks } from "@/app/actions/books";
import type { RelatedBookInfo } from "@/components/share/share-note-card";

interface NoteDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 상세 페이지
 * 보안성 검토 및 심미적인 통합 레이아웃 제공
 */
export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // 1. 입력 보안 검증
  if (!noteId || typeof noteId !== 'string' || !isValidUUID(noteId)) {
    console.error("NoteDetailPage Security: 유효하지 않은 요청 ID", { noteId });
    notFound();
  }

  // 2. 사용자 확인 (게스트 여부)
  const currentUser = await getCachedCurrentUser();
  const isGuest = !currentUser;

  let note;
  try {
    if (isGuest) {
      // 게스트: 샘플 노트 조회 시도, 없으면 공유 페이지로 리다이렉트
      const sampleNote = await getSampleNoteDetail(noteId);
      if (!sampleNote) {
        redirect(`/share/notes/${noteId}`);
      }
      note = sampleNote;
    } else {
      // 로그인 사용자: 자신의 노트 조회
      note = await getNoteDetail(noteId);
    }
  } catch (error: any) {
    // 404 또는 권한 없음 에러인 경우 조용히 처리
    if (error?.message === "기록을 찾을 수 없거나 권한이 없습니다." || error?.message?.includes("참조 무결성")) {
      console.warn(`[NoteDetailPage] Record not found or access denied: ${noteId}`);
    } else {
      // 그 외 실제 런타임 에러는 상세 로깅
      const safeError = sanitizeErrorForLogging(error);
      console.error(`[NoteDetailPage] Unexpected error for ${noteId}:`, safeError);
    }
    notFound();
  }

  const noteWithBook = note as NoteWithBook & { user_book_id?: string | null };

  // 사용자 정보 가져오기
  const user = noteWithBook.user_id ? await getUserById(noteWithBook.user_id) : null;

  // 책 정보 페이지로 돌아갈 URL 결정
  const backUrl = noteWithBook.user_book_id
    ? `/books/${noteWithBook.user_book_id}#book-info`
    : "/notes";

  // 필사 데이터는 getNoteDetail()의 transcriptions JOIN으로 이미 포함됨
  const transcription = noteWithBook.transcription || null;

  // 연결된 책 정보 로드 (카드 내부 표시용)
  let relatedBooksForCard: RelatedBookInfo[] = [];
  let relatedBooksRaw: any[] = [];
  if (noteWithBook.related_user_book_ids && noteWithBook.related_user_book_ids.length > 0) {
    try {
      const ids = noteWithBook.related_user_book_ids;
      if (isGuest) {
        relatedBooksRaw = await getSampleUserBooksByIds(ids);
      } else {
        const allBooks = await getUserBooks();
        relatedBooksRaw = (allBooks || []).filter((ub: any) => ids.includes(ub.id));
      }
      relatedBooksForCard = relatedBooksRaw.map((ub: any) => ({
        id: ub.id,
        title: ub.books?.title || "알 수 없는 책",
        author: ub.books?.author || null,
        coverImageUrl: ub.books?.cover_image_url || null,
      }));
    } catch {
      // 연결된 책 로드 실패 시 무시
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-20">
      {/* 1. 상단 내비게이션 및 액션 바 */}
      <NoteDetailNavBar
        note={noteWithBook}
        backUrl={backUrl}
        isGuest={isGuest}
      />

      {/* 2. 메인 리딩 카드 (통합 디자인) - 개선된 장식 */}
      <div className="relative">
        {/* 장식적 요소 - 더 부드럽고 은은한 그라데이션 */}
        <div className="absolute -top-8 -left-8 sm:-top-12 sm:-left-12 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-tl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <ShareNoteCard
          note={noteWithBook}
          user={user}
          relatedBooks={relatedBooksForCard}
          className="shadow-xl sm:shadow-2xl border border-slate-100/80 dark:border-slate-800/80 backdrop-blur-sm"
        />
      </div>

      {/* 3. 연결된 책 표시 - 개선된 디자인 */}
      {noteWithBook.related_user_book_ids && noteWithBook.related_user_book_ids.length > 0 && (
        <Card className="border border-slate-100/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50 to-slate-100/30 dark:from-slate-900/50 dark:to-slate-800/30 overflow-hidden">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <RelatedBooksDisplay
              relatedBookIds={noteWithBook.related_user_book_ids}
              mainBookId={noteWithBook.user_book_id || ""}
              initialBooks={isGuest ? relatedBooksRaw : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* 4. 상세 분석 정보 (필사 데이터 - AI 보정/원문 토글) */}
      {transcription && (transcription.status === "completed" || transcription.extracted_text) && transcription.extracted_text && (
        <OcrTextViewer
          correctedText={transcription.extracted_text}
          rawText={transcription.raw_extracted_text}
        />
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: NoteDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  if (!noteId || !isValidUUID(noteId)) {
    return { title: "기록 상세 | ReadTree" };
  }

  try {
    const user = await getCachedCurrentUser();
    let note;
    if (!user) {
      note = await getSampleNoteDetail(noteId);
    } else {
      note = await getNoteDetail(noteId);
    }
    if (!note) {
      return { title: "기록 상세 | ReadTree" };
    }
    return {
      title: `${note.type === 'quote' ? '인상적인 구절' : '독서 기록'} | ReadTree`,
      description: note.book?.title || "기록 상세",
    };
  } catch {
    return { title: "기록 상세 | ReadTree" };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

