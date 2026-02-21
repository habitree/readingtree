import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBookshelfWithStats, updateBookshelf, deleteBookshelf } from "@/app/actions/bookshelves";
import { getCachedCurrentUser } from "@/lib/cached";
import { BookshelfEditForm } from "@/components/bookshelves/bookshelf-edit-form";
import { BookshelfEditTitle } from "@/components/bookshelves/bookshelf-page-strings";

interface BookshelfEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookshelfEditPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const bookshelf = await getBookshelfWithStats(resolvedParams.id);

  if (!bookshelf) {
    return {
      title: "서재를 찾을 수 없습니다 | ReadTree",
    };
  }

  return {
    title: `${bookshelf.name} 설정 | ReadTree`,
    description: `서재 "${bookshelf.name}" 설정`,
  };
}

/**
 * 서재 설정 페이지
 */
export default async function BookshelfEditPage({
  params,
}: BookshelfEditPageProps) {
  const user = await getCachedCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const bookshelfId = resolvedParams.id;

  try {
    const bookshelf = await getBookshelfWithStats(bookshelfId);

    if (!bookshelf) {
      notFound();
    }

    // 메인 서재는 수정 불가
    if (bookshelf.is_main) {
      redirect(`/bookshelves/${bookshelfId}`);
    }

    return (
      <div className="space-y-6">
        <div>
          <BookshelfEditTitle />
        </div>

        <BookshelfEditForm bookshelf={bookshelf} />
      </div>
    );
  } catch (error) {
    console.error("서재 설정 조회 오류:", error);
    notFound();
  }
}
