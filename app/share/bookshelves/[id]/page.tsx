import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBookshelfWithBooks } from "@/app/actions/bookshelves";
import { getAppUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import { ShareBookshelfView } from "@/components/share/share-bookshelf-view";

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
    return { title: "서재를 찾을 수 없습니다" };
  }

  const result = await getPublicBookshelfWithBooks(bookshelfId);

  if (!result) {
    return { title: "서재를 찾을 수 없습니다" };
  }

  const { bookshelf, books, owner } = result;
  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/bookshelves/${bookshelf.id}`;
  const ogImageUrl = `${baseUrl}/share/bookshelves/${bookshelf.id}/opengraph-image`;

  const ownerName = owner?.name || "ReadTree 사용자";
  const description = bookshelf.description
    || `${ownerName}님의 서재 - ${books.length}권의 책`;

  return {
    title: `${bookshelf.name} - ${ownerName}님의 서재`,
    description,
    openGraph: {
      title: `${bookshelf.name} - ${ownerName}님의 서재`,
      description,
      type: "website",
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${bookshelf.name} - ${ownerName}님의 서재`,
        },
      ],
      siteName: "ReadTree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: `${bookshelf.name} - ${ownerName}님의 서재`,
      description,
      images: [ogImageUrl],
    },
  };
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
  const ownerName = owner?.name || "ReadTree";

  return (
    <ShareBookshelfView
      bookshelf={bookshelf}
      books={books}
      ownerName={ownerName}
    />
  );
}
