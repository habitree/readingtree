import { Metadata } from "next";
import { getBookshelves, getMainBookshelf } from "@/app/actions/bookshelves";
import { getSampleBookshelves } from "@/app/actions/sample";
import { BookshelfList } from "@/components/bookshelves/bookshelf-list";
import { CreateBookshelfDialog } from "@/components/bookshelves/create-bookshelf-dialog";
import { AIOrganizeDialog } from "@/components/bookshelves/ai-organize-dialog";
import { getCachedCurrentUser } from "@/lib/cached";
import type { BookshelfWithStats } from "@/types/bookshelf";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "서재 관리 | ReadTree",
  description: "나만의 서재로 책을 정리하세요",
};

/**
 * 서재 목록 페이지
 */
export default async function BookshelvesPage() {
  const user = await getCachedCurrentUser();
  const isGuest = !user;

  try {
    let sortedBookshelves: BookshelfWithStats[];

    if (isGuest) {
      // 게스트 사용자: 샘플 서재 목록 조회
      sortedBookshelves = await getSampleBookshelves();
    } else {
      // 로그인 사용자: 본인 서재 목록 조회
      const bookshelves = await getBookshelves();

      // 통계 포함하여 변환
      const bookshelvesWithStats: BookshelfWithStats[] = await Promise.all(
        bookshelves.map(async (bookshelf) => {
          const { getBookshelfWithStats } = await import("@/app/actions/bookshelves");
          const stats = await getBookshelfWithStats(bookshelf.id);
          return stats || {
            ...bookshelf,
            book_count: 0,
            reading_count: 0,
            completed_count: 0,
            paused_count: 0,
            not_started_count: 0,
            rereading_count: 0,
          };
        })
      );

      // 메인 서재를 맨 앞으로 정렬
      sortedBookshelves = bookshelvesWithStats.sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return a.order - b.order;
      });
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader titleKey="bookshelves.pageTitle" descriptionKey="bookshelves.pageDesc" />
          {!isGuest && (
            <div className="flex items-center gap-2">
              <AIOrganizeDialog />
              <CreateBookshelfDialog />
            </div>
          )}
        </div>

        <BookshelfList bookshelves={sortedBookshelves} isGuest={isGuest} />
      </div>
    );
  } catch (error) {
    console.error("Bookshelves load error:", error);
    return (
      <div className="space-y-6">
        <PageHeader titleKey="bookshelves.pageTitle" descriptionKey="bookshelves.loadError" />
      </div>
    );
  }
}
