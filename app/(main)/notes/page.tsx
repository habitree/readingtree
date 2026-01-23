import { Suspense } from "react";
import { Metadata } from "next";
import { NoteList } from "@/components/notes/note-list";
import { getNotes } from "@/app/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import type { NoteType } from "@/types/note";

export const metadata: Metadata = {
  title: "기록 목록 | ReadTree",
  description: "내가 작성한 모든 기록을 확인하세요",
};

interface NotesPageProps {
  searchParams: {
    type?: string;
    bookId?: string;
  };
}

/**
 * 기록 목록 페이지
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  const type = searchParams.type as NoteType | undefined;
  const bookId = searchParams.bookId;
  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();
  const isGuest = !user;

  return (
    <div className="space-y-6">
      {/* 게스트 사용자 안내 */}
      {isGuest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">샘플 데이터</Badge>
                <p className="text-sm text-muted-foreground">
                  현재 샘플 기록 목록을 보고 계십니다. 로그인하여 나만의 기록을 작성해보세요!
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isGuest ? "기록 둘러보기" : "기록 목록"}
        </h1>
        <p className="text-muted-foreground">
          {isGuest
            ? "샘플 기록 목록을 확인해보세요"
            : "내가 작성한 모든 기록을 확인하세요"}
        </p>
      </div>

      <Suspense fallback={<NoteList notes={[]} isLoading />}>
        <NotesList type={type} bookId={bookId} />
      </Suspense>
    </div>
  );
}

async function NotesList({
  type,
  bookId,
}: {
  type?: NoteType;
  bookId?: string;
}) {
  const notes = await getNotes(bookId, type);

  return <NoteList notes={notes as any} />;
}

