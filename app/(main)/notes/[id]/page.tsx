import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail, getTranscription } from "@/app/actions/notes";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { Edit, ChevronLeft, ShieldCheck, ShieldAlert, BookOpen, Sparkles } from "lucide-react";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { ShareNoteCard } from "@/components/share/share-note-card";
import { OCRStatusChecker } from "@/components/notes/ocr-status-checker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoteWithBook } from "@/types/note";
import { getUserById } from "@/app/actions/profile";
import { BookLinkRenderer } from "@/components/notes/book-link-renderer";
import { RelatedBooksManager, RelatedBooksDisplay } from "@/components/notes/related-books-manager";

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

  let note;
  try {
    // 2. 데이터 소유권 및 접근 권한 검증 (Server Action 내부에서 수행)
    note = await getNoteDetail(noteId);
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

  // 필사 데이터 상세 조회 (있을 경우)
  let transcription = null;
  if (noteWithBook.type === "transcription" && noteWithBook.image_url) {
    try {
      transcription = await getTranscription(noteWithBook.id);
    } catch (error) {
      console.error("필사 데이터 조회 오류:", error);
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

        {/* 액션 버튼들 - 모바일에서 개선된 스크롤 */}
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
      </div>

      {/* 2. 메인 리딩 카드 (통합 디자인) - 개선된 장식 */}
      <div className="relative">
        {/* 장식적 요소 - 더 부드럽고 은은한 그라데이션 */}
        <div className="absolute -top-8 -left-8 sm:-top-12 sm:-left-12 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-tl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <ShareNoteCard
          note={noteWithBook}
          user={user}
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

      {/* 4. 상세 분석 정보 (필사 데이터 등) - 개선된 디자인 */}
      {transcription && (transcription.status === "completed" || transcription.extracted_text) && (
        <Card className="border border-primary/10 bg-gradient-to-br from-primary/5 via-slate-50 to-slate-100/30 dark:from-primary/10 dark:via-slate-900/50 dark:to-slate-800/30 overflow-hidden relative">
          {/* 장식 요소 */}
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl -z-10" />

          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 텍스트 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 pt-0 px-4 sm:px-6">
            {transcription.extracted_text && (
              <div className="space-y-2.5">
                <h4 className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  추출된 원문
                </h4>
                <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-sm">
                  <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {transcription.extracted_text}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {transcription.quote_content && (
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    인상깊은 구절
                  </h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-4 rounded-xl border-l-3 border-blue-400">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 italic">
                      "<BookLinkRenderer text={transcription.quote_content} />"
                    </p>
                  </div>
                </div>
              )}
              {transcription.memo_content && (
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    내 생각
                  </h4>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 rounded-xl">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <BookLinkRenderer text={transcription.memo_content} />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
    const note = await getNoteDetail(noteId);
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

