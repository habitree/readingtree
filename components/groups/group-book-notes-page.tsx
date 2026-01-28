"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupNoteFeed } from "./group-note-feed";
import { ShareNoteDialog } from "./share-note-dialog";
import { ShareNoteSheet } from "./share-note-sheet";
import {
  ArrowLeft,
  BookOpen,
  Share2,
  Users,
  PenLine,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { getGroupBookNoteCounts } from "@/app/actions/groups";
import { useMediaQuery } from "@/hooks/use-media-query";

interface GroupBookNotesPageProps {
  groupId: string;
  groupName: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    cover_image_url: string | null;
  };
  currentUserId?: string;
  isGroupBook: boolean;
  hasMyNotes?: boolean;
}

export function GroupBookNotesPage({
  groupId,
  groupName,
  book,
  currentUserId,
  isGroupBook,
  hasMyNotes = false,
}: GroupBookNotesPageProps) {
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadNoteCount();
  }, [groupId, book.id, refreshKey]);

  const loadNoteCount = async () => {
    try {
      const counts = await getGroupBookNoteCounts(groupId);
      setNoteCount(counts[book.id] || 0);
    } catch (error) {
      console.error("기록 수 조회 오류:", error);
    }
  };

  const handleShareSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleWriteNote = () => {
    router.push(`/notes/new?bookId=${book.id}&groupId=${groupId}`);
  };

  return (
    <div className="space-y-6">
      {/* 브레드크럼 네비게이션 */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto pb-2">
        <Link href="/groups" className="hover:text-foreground whitespace-nowrap">
          모임
        </Link>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <Link
          href={`/groups/${groupId}`}
          className="hover:text-foreground whitespace-nowrap"
        >
          {groupName}
        </Link>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
        <span className="text-foreground font-medium truncate">{book.title}</span>
      </nav>

      {/* 뒤로가기 및 헤더 */}
      <div className="flex items-center gap-3">
        <Link href={`/groups/${groupId}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">공유 기록</h1>
          <p className="text-sm text-muted-foreground">
            모임원들이 공유한 기록을 확인하세요
          </p>
        </div>
      </div>

      {/* 책 정보 카드 */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex gap-4 md:gap-6">
            {/* 책 표지 */}
            <Link
              href={`/books/${book.id}`}
              className="relative w-20 h-28 md:w-24 md:h-36 flex-shrink-0 bg-muted rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {isValidImageUrl(book.cover_image_url) ? (
                <Image
                  src={getImageUrl(book.cover_image_url)}
                  alt={book.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </Link>

            {/* 책 정보 */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  지정도서
                </Badge>
                {noteCount !== null && noteCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {noteCount}개 기록
                  </Badge>
                )}
              </div>
              <Link href={`/books/${book.id}`} className="hover:underline">
                <h2 className="text-lg md:text-xl font-semibold line-clamp-2">
                  {book.title}
                </h2>
              </Link>
              {book.author && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {book.author}
                </p>
              )}
              {book.publisher && (
                <p className="text-xs text-muted-foreground truncate">
                  {book.publisher}
                </p>
              )}

              {/* 액션 버튼 - 모바일에서는 전체 너비 */}
              <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setIsShareOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  내 기록 공유
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWriteNote}
                  className="flex-1 sm:flex-none"
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  기록 작성
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 공유 기록 피드 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">모임원들의 기록</h3>
          {noteCount !== null && (
            <span className="text-sm text-muted-foreground">
              총 {noteCount}개
            </span>
          )}
        </div>
        <GroupNoteFeed
          key={refreshKey}
          groupId={groupId}
          bookId={book.id}
          currentUserId={currentUserId}
        />
      </section>

      {/* 공유 다이얼로그/시트 - 모바일에서는 바텀 시트 */}
      {isMobile ? (
        <ShareNoteSheet
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          groupId={groupId}
          bookId={book.id}
          bookTitle={book.title}
          onSuccess={handleShareSuccess}
        />
      ) : (
        <ShareNoteDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          groupId={groupId}
          bookId={book.id}
          bookTitle={book.title}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}
