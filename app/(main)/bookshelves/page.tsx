import { Metadata } from "next";
import { getBookshelves, getMainBookshelf } from "@/app/actions/bookshelves";
import { getSampleBookshelves } from "@/app/actions/sample";
import { BookshelfList } from "@/components/bookshelves/bookshelf-list";
import { CreateBookshelfDialog } from "@/components/bookshelves/create-bookshelf-dialog";
import { getCurrentUser } from "@/app/actions/auth";
import type { BookshelfWithStats } from "@/types/bookshelf";

export const metadata: Metadata = {
  title: "서재 관리 | ReadTree",
  description: "내 서재를 관리하세요",
};

/**
 * 서재 목록 페이지
 */
export default async function BookshelvesPage() {
  const user = await getCurrentUser();
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              서재 관리
            </h1>
            <p className="text-muted-foreground">
              책을 분류하여 관리할 수 있는 서재를 만들어보세요
            </p>
          </div>
          <CreateBookshelfDialog />
        </div>

        <BookshelfList bookshelves={sortedBookshelves} isGuest={isGuest} />
      </div>
    );
  } catch (error) {
    console.error("서재 목록 조회 오류:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">서재 관리</h1>
          <p className="text-muted-foreground">
            서재 목록을 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      </div>
    );
  }
}
