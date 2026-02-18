import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail } from "@/app/actions/notes";
import { getCurrentUser } from "@/app/actions/auth";
import { getSampleNoteDetail } from "@/app/actions/sample";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { Edit, ChevronLeft, ShieldCheck, ShieldAlert, BookOpen } from "lucide-react";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
import { OCRStatusChecker } from "@/components/notes/ocr-status-checker";
import { Card, CardContent } from "@/components/ui/card";
import type { NoteWithBook } from "@/types/note";
import { getUserById } from "@/app/actions/profile";
import { RelatedBooksManager, RelatedBooksDisplay } from "@/components/notes/related-books-manager";
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
  const currentUser = await getCurrentUser();
  const isGuest = !currentUser;

  let note;
  try {
    if (isGuest) {
      // 게스트: 샘플 사용자의 노트만 조회 가능
      const sampleNote = await getSampleNoteDetail(noteId);
      if (!sampleNote) {
        notFound();
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

  // 연결된 책 정보 로드 (카드 내부 표시용 - 로그인 사용자만)
  let relatedBooksForCard: RelatedBookInfo[] = [];
  if (!isGuest && noteWithBook.related_user_book_ids && noteWithBook.related_user_book_ids.length > 0) {
    try {
      const allBooks = await getUserBooks();
      const ids = noteWithBook.related_user_book_ids;
      relatedBooksForCard = (allBooks || [])
        .filter((ub: any) => ids.includes(ub.id))
        .map((ub: any) => ({
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
      {/* 1. 상단 내비게이션 및 액션 바 - 개선된 디자인 */}
      <div className="sticky top-0 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 sm:py-3 bg-background/80 backdrop-blur-lg border-b border-transparent sm:relative sm:border-none sm:bg-transparent sm:backdrop-blur-none">
        <div className="flex items-center justify-between gap-2">
          {/* 뒤로가기 버튼 */}
          <Button variant="ghost" size="sm" asChild className="group h-9 px-2 sm:px-3 -ml-2">
            <Link href={backUrl}>
              <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1 transition-transform group-hover:-translate-x-1" />
              <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
              <span className="text-sm font-medium">책으로</span>
            </Link>
          </Button>

          {/* 상태 배지 + OCR 상태 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge
              variant={noteWithBook.is_public ? "default" : "secondary"}
              className={`gap-1 py-1 px-2.5 text-xs h-7 ${
                noteWithBook.is_public
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {noteWithBook.is_public ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>공개</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>비공개</span>
                </>
              )}
            </Badge>
            <OCRStatusChecker
              noteId={noteWithBook.id}
              noteType={noteWithBook.type}
              hasImage={!!noteWithBook.image_url}
            />
          </div>
        </div>

        {/* 액션 버튼들 - 게스트는 읽기 전용 */}
        {!isGuest && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide sm:justify-end">
            <SimpleShareDialog note={noteWithBook} />
            <RelatedBooksManager
              noteId={noteWithBook.id}
              currentRelatedBookIds={noteWithBook.related_user_book_ids || null}
              mainBookId={noteWithBook.user_book_id || ""}
            />
            <Button variant="outline" size="sm" asChild className="gap-1.5 h-9 px-3 shrink-0 shadow-sm">
              <Link href={`/notes/${noteWithBook.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="text-sm">수정</span>
              </Link>
            </Button>
            <NoteDeleteButton noteId={noteWithBook.id} />
          </div>
        )}
      </div>

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
    return { title: "기록 상세 | ReadingTree" };
  }

  try {
    const user = await getCurrentUser();
    let note;
    if (!user) {
      note = await getSampleNoteDetail(noteId);
    } else {
      note = await getNoteDetail(noteId);
    }
    if (!note) {
      return { title: "기록 상세 | ReadingTree" };
    }
    return {
      title: `${note.type === 'quote' ? '인상깊은 구절' : '독서 기록'} | ReadingTree`,
      description: note.book?.title || "기록 상세 정보",
    };
  } catch {
    return { title: "기록 상세 | ReadingTree" };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

