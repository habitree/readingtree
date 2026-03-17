import { createServiceClient } from "../utils/supabase";
import { BookData } from "../../src/types/common";

/**
 * 북리뷰 대상 책 선별
 * - 완독 수 기반 인기 책 선별
 * - 최근 사용된 책 제외
 */
export async function selectBookForReview(
  excludeBookIds: string[] = []
): Promise<{ book: BookData; completedCount: number } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .rpc("get_popular_books_for_shorts", {
      exclude_ids: excludeBookIds,
      result_limit: 10,
    });

  if (error) {
    // Fallback: 직접 쿼리
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("books")
      .select("id, title, author, cover_image_url, publisher, total_pages")
      .not("id", "in", excludeBookIds.length > 0 ? `(${excludeBookIds.join(",")})` : "()")
      .limit(10);

    if (fallbackError || !fallbackData?.length) return null;

    const book = fallbackData[0];
    return {
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        coverImageUrl: book.cover_image_url,
        publisher: book.publisher,
        totalPages: book.total_pages,
      },
      completedCount: 0,
    };
  }

  if (!data?.length) return null;

  const top = data[0];
  return {
    book: {
      id: top.id,
      title: top.title,
      author: top.author,
      coverImageUrl: top.cover_image_url,
      publisher: top.publisher,
      totalPages: top.total_pages,
    },
    completedCount: top.completed_count ?? 0,
  };
}
