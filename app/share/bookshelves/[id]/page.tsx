import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBookshelfWithBooks } from "@/app/actions/bookshelves";
import { isValidUUID } from "@/lib/utils/validation";
import { ShareBookshelfView } from "@/components/share/share-bookshelf-view";
import { buildShareMetadata, buildShareNotFoundMetadata } from "@/lib/og/meta";

/**
 * 공유 서재 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const bookshelfId = resolvedParams.id;

  if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
    return buildShareNotFoundMetadata("bookshelf");
  }

  const result = await getPublicBookshelfWithBooks(bookshelfId);

  if (!result) {
    return buildShareNotFoundMetadata("bookshelf");
  }

  const { bookshelf, books, owner } = result;
  const ownerName = owner?.name || "ReadTree 사용자";
  const ogTitle = `${ownerName}님의 ${bookshelf.name}`;
  const ogDescription = bookshelf.description
    || `${ownerName}님이 모은 ${books.length}권의 책을 둘러보세요.`;

  return buildShareMetadata({
    kind: "bookshelf",
    id: bookshelf.id,
    path: `/share/bookshelves/${bookshelf.id}`,
    ogTitle,
    ogDescription,
    pageTitle: `${bookshelf.name} - ${ownerName}님의 서재 | ReadTree`,
    alt: `${bookshelf.name} - ${ownerName}님의 서재`,
  });
}

/**
 * 공유 서재 페이지
 */
export default async function ShareBookshelfPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = await params;
  const bookshelfId = resolvedParams.id;

  if (!bookshelfId || typeof bookshelfId !== "string" || !isValidUUID(bookshelfId)) {
    notFound();
  }

  const result = await getPublicBookshelfWithBooks(bookshelfId);

  if (!result) {
    notFound();
  }

  const { bookshelf, books, owner } = result;
  const ownerName = owner?.name || "Habitree";

  return (
    <ShareBookshelfView
      bookshelf={bookshelf}
      books={books}
      ownerName={ownerName}
    />
  );
}
