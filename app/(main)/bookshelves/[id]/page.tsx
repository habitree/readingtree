import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookshelfWithStats } from "@/app/actions/bookshelves";
import { getSampleBookshelfWithStats } from "@/app/actions/sample";
import { getCurrentUser } from "@/app/actions/auth";
import { BookshelfPageContent } from "@/components/books/bookshelf-page-content";
import { MobileBookshelfSelector } from "@/components/books/mobile-bookshelf-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Settings, Plus, LogIn } from "lucide-react";
import type { ReadingStatus } from "@/types/book";

interface BookshelfDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    view?: string;
    status?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookshelfDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const bookshelf = await getBookshelfWithStats(resolvedParams.id);

  if (!bookshelf) {
    return {
      title: "서재를 찾을 수 없습니다 | ReadTree",
    };
  }

  return {
    title: `${bookshelf.name} | ReadTree`,
    description: bookshelf.description || `${bookshelf.name} 서재`,
  };
}

/**
 * 서재 상세 페이지
 */
export default async function BookshelfDetailPage({
  params,
  searchParams,
}: BookshelfDetailPageProps) {
  const user = await getCurrentUser();
  const isGuest = !user;

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const bookshelfId = resolvedParams.id;
  // 뷰 모드: URL 파라미터에서 가져오고, 없으면 기본값 "grid"
  const viewParam = resolvedSearchParams.view as "grid" | "table" | undefined;
  const view = viewParam === "table" ? "table" : "grid"; // 명시적으로 "table"이 아니면 "grid"
  const status = (resolvedSearchParams.status as ReadingStatus | undefined) || undefined;
  const query = resolvedSearchParams.q || undefined;

  try {
    let bookshelf;

    if (isGuest) {
      // 게스트 사용자: 샘플 서재 조회
      bookshelf = await getSampleBookshelfWithStats(bookshelfId);
    } else {
      // 로그인 사용자: 본인 서재 조회
      bookshelf = await getBookshelfWithStats(bookshelfId);
    }

    if (!bookshelf) {
      notFound();
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* 게스트 사용자 안내 */}
        {isGuest && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">샘플 데이터</Badge>
                  <p className="text-sm text-muted-foreground">
                    현재 샘플 서재를 보고 계십니다. 로그인하여 나만의 서재를 만들어보세요!
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

        {/* 헤더 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
              <Link href="/books">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                {bookshelf.name}
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {bookshelf.description || (isGuest ? "샘플 서재입니다" : "내가 읽고 있는 책들을 관리하세요")}
              </p>
            </div>
            {/* 모바일 서재 선택기 (로그인 사용자만) */}
            {!isGuest && <MobileBookshelfSelector currentBookshelfId={bookshelfId} />}
          </div>
          {!isGuest && (
            <div className="flex items-center gap-2">
              {!bookshelf.is_main && (
                <Button variant="outline" asChild className="hidden sm:inline-flex">
                  <Link href={`/bookshelves/${bookshelfId}/edit`}>
                    <Settings className="mr-2 h-4 w-4" />
                    서재 설정
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="sm:size-default">
                <Link href="/books/search">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">책 추가</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* 공통 컨텐츠 컴포넌트 */}
        <BookshelfPageContent
          status={status}
          query={query}
          view={view}
          user={user}
          bookshelfId={bookshelfId}
          isGuest={isGuest}
        />
      </div>
    );
  } catch (error) {
    console.error("서재 상세 조회 오류:", error);
    notFound();
  }
}

