import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNoteDetail, getTranscription } from "@/app/actions/notes";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { Edit, ChevronLeft, ShieldCheck, ShieldAlert } from "lucide-react";
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
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 pb-20">
      {/* 1. 상단 내비게이션 및 액션 바 */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-col md:flex-row md:items-center sm:justify-between sm:gap-4">
        {/* 모바일: 뒤로가기 + 상태 배지 */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild className="group h-8 px-2 sm:px-3">
            <Link href={backUrl}>
              <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm">목록</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Badge
              variant={noteWithBook.is_public ? "default" : "outline"}
              className="gap-1 py-0.5 px-2 text-[10px] sm:text-xs h-6"
            >
              {noteWithBook.is_public ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">공개</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" />
                  <span className="hidden sm:inline">비공개</span>
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

        {/* 액션 버튼들 - 모바일에서 가로 스크롤 */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide">
          <SimpleShareDialog note={noteWithBook} />
          <RelatedBooksManager
            noteId={noteWithBook.id}
            currentRelatedBookIds={noteWithBook.related_user_book_ids || null}
            mainBookId={noteWithBook.user_book_id || ""}
          />
          <Button variant="outline" size="sm" asChild className="gap-1.5 h-8 px-2.5 sm:px-3 shrink-0">
            <Link href={`/notes/${noteWithBook.id}/edit`}>
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">수정</span>
            </Link>
          </Button>
          <NoteDeleteButton noteId={noteWithBook.id} />
        </div>
      </div>

      {/* 2. 메인 리딩 카드 (통합 디자인) */}
      <div className="relative">
        {/* 장식적 요소 - 모바일에서 작게 */}
        <div className="absolute -top-6 -left-6 sm:-top-10 sm:-left-10 w-24 h-24 sm:w-40 sm:h-40 bg-primary/5 rounded-full blur-2xl sm:blur-3xl -z-10" />
        <ShareNoteCard note={noteWithBook} user={user} className="shadow-lg sm:shadow-2xl border border-slate-100 dark:border-slate-800" />
      </div>

      {/* 3. 연결된 책 표시 */}
      {noteWithBook.related_user_book_ids && noteWithBook.related_user_book_ids.length > 0 && (
        <Card className="border-none bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-4 sm:pt-6 sm:px-6">
            <RelatedBooksDisplay
              relatedBookIds={noteWithBook.related_user_book_ids}
              mainBookId={noteWithBook.user_book_id || ""}
            />
          </CardContent>
        </Card>
      )}

      {/* 4. 상세 분석 정보 (필사 데이터 등) */}
      {transcription && (transcription.status === "completed" || transcription.extracted_text) && (
        <Card className="border-none bg-slate-50 dark:bg-slate-900/50 shadow-inner">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-400">
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 pt-2 sm:pt-4 px-4 sm:px-6">
            {transcription.extracted_text && (
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-xs font-bold text-primary">추출된 원문</h4>
                <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic">
                    {transcription.extracted_text}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              {transcription.quote_content && (
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="text-[10px] sm:text-xs font-bold text-blue-500">인상깊은 구절</h4>
                  <p className="text-xs sm:text-sm bg-blue-50/50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg border-l-2 border-blue-400 text-slate-700 dark:text-slate-300">
                    "<BookLinkRenderer text={transcription.quote_content} />"
                  </p>
                </div>
              )}
              {transcription.memo_content && (
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-500">내 생각</h4>
                  <p className="text-xs sm:text-sm bg-slate-100/50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg text-slate-600 dark:text-slate-400">
                    <BookLinkRenderer text={transcription.memo_content} />
                  </p>
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

