import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookshelfWithStats } from "@/app/actions/bookshelves";
import { getSampleBookshelfWithStats } from "@/app/actions/sample";
import { getCachedCurrentUser } from "@/lib/cached";
import { BookshelfPageContent } from "@/components/books/bookshelf-page-content";
import { MobileBookshelfSelector } from "@/components/books/mobile-bookshelf-selector";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookshelfShareButton } from "@/components/bookshelves/bookshelf-share-button";
import { BookshelfDefaultDesc, BookshelfSettingsLabel, BookshelfAddLabel } from "@/components/bookshelves/bookshelf-page-strings";
import { ArrowLeft, Settings, Plus, Users, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  try {
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
  } catch {
    // 게스트 사용자일 때 getBookshelfWithStats가 실패할 수 있음
    try {
      const sampleBookshelf = await getSampleBookshelfWithStats(resolvedParams.id);
      if (sampleBookshelf) {
        return {
          title: `${sampleBookshelf.name} | ReadTree`,
          description: sampleBookshelf.description || `${sampleBookshelf.name} 서재`,
        };
      }
    } catch {
      // fallback
    }
    return {
      title: "서재 | ReadTree",
    };
  }
}

/**
 * 서재 상세 페이지
 */
export default async function BookshelfDetailPage({
  params,
  searchParams,
}: BookshelfDetailPageProps) {
  const user = await getCachedCurrentUser();
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
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex shrink-0 h-9 w-9">
              <Link href="/books">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {bookshelf.group_id && (
                  <Users className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate">
                  {bookshelf.name}
                </h1>
                {bookshelf.group_id && (
                  <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                    <RefreshCcw className="h-3 w-3 mr-1" />
                    자동 동기화
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">
                {bookshelf.description || <BookshelfDefaultDesc />}
              </p>
            </div>
            {/* 모바일 서재 선택기 */}
            <MobileBookshelfSelector currentBookshelfId={bookshelfId} isGuest={isGuest} />
          </div>
          {!isGuest && (
            <div className="flex items-center gap-1 shrink-0">
              <BookshelfShareButton
                bookshelfId={bookshelfId}
                bookshelfName={bookshelf.name}
                isPublic={bookshelf.is_public}
              />
              {!bookshelf.is_main && (
                <Button variant="outline" size="icon" asChild className="hidden sm:inline-flex h-9 w-9 sm:w-auto sm:px-3">
                  <Link href={`/bookshelves/${bookshelfId}/edit`}>
                    <Settings className="h-4 w-4 sm:mr-1" />
                    <BookshelfSettingsLabel />
                  </Link>
                </Button>
              )}
              <Button asChild size="icon" className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4">
                <Link href="/books/search">
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <BookshelfAddLabel />
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

