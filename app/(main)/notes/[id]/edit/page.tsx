import { notFound, redirect } from "next/navigation";
import { Metadata, Viewport } from "next";
import { getNoteDetail, updateNote } from "@/app/actions/notes";
import { NoteEditForm } from "@/components/notes/note-edit-form";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";

export const metadata: Metadata = {
  title: "기록 수정 | ReadTree",
  description: "기록을 수정하세요",
};

interface NoteEditPageProps {
  params: {
    id: string;
  };
}

/**
 * 기록 수정 페이지
 * US-018: 기록 수정 및 삭제
 */
export default async function NoteEditPage({ params }: NoteEditPageProps) {
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const noteId = resolvedParams.id;

  // params.id 검증
  if (!noteId || typeof noteId !== 'string') {
    console.error("NoteEditPage: noteId가 유효하지 않습니다.", { noteId, params: resolvedParams });
    notFound();
  }

  // UUID 검증
  if (!isValidUUID(noteId)) {
    console.error("NoteEditPage: noteId가 유효한 UUID가 아닙니다.", { noteId });
    notFound();
  }

  let note;
  try {
    console.log("NoteEditPage: 기록 상세 조회 시도", { noteId });
    note = await getNoteDetail(noteId);
    console.log("NoteEditPage: 기록 상세 조회 성공", { noteId, hasNote: !!note });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("기록 상세 조회 오류:", {
      noteId,
      error: safeError,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">기록 수정</h1>
        <p className="text-muted-foreground">
          기록 내용을 수정하세요
        </p>
      </div>

      <NoteEditForm note={note} />
    </div>
  );
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

