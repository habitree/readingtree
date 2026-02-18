import { Suspense } from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { getCurrentUser } from "@/app/actions/auth";
import { BookshelfPageContent } from "@/components/books/bookshelf-page-content";
import { MobileBookshelfSelector } from "@/components/books/mobile-bookshelf-selector";
import type { ReadingStatus } from "@/types/book";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 서재 | ReadTree",
  description: "내가 읽고 있는 책들을 관리하세요",
};

interface BooksPageProps {
  searchParams: Promise<{
    status?: string;
    view?: string;
    q?: string;
  }> | {
    status?: string;
    view?: string;
    q?: string;
  };
}

/**
 * 내 서재 페이지
 * US-008: 책 정보 조회
 * habitree.io/search 페이지 기능 마이그레이션
 */
export default async function BooksPage({ searchParams }: BooksPageProps) {
  try {
    // Next.js 15+ 에서 searchParams는 Promise일 수 있음
    const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));

    const status = (resolvedSearchParams.status as ReadingStatus | undefined) || undefined;
    // 뷰 모드: URL 파라미터에서 가져오고, 없으면 기본값 "grid"
    const viewParam = resolvedSearchParams.view as "grid" | "table" | undefined;
    const view = viewParam === "table" ? "table" : "grid"; // 명시적으로 "table"이 아니면 "grid"
    const query = resolvedSearchParams.q || undefined;

    // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
    const user = await getCurrentUser();
    const isGuest = !user;


    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                내 서재
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                내가 읽고 있는 책들을 관리하세요
              </p>
            </div>
            <MobileBookshelfSelector />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/bookshelves">서재 관리</Link>
            </Button>
            <Button asChild size="icon" className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4">
              <Link href="/books/search">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">추가</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 공통 컨텐츠 컴포넌트 */}
        <BookshelfPageContent
          status={status}
          query={query}
          view={view}
          user={user}
          isGuest={isGuest}
        />
      </div>
    );
  } catch (error) {
    console.error("BooksPage 렌더링 오류:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 서재</h1>
          <p className="text-muted-foreground">
            페이지를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

