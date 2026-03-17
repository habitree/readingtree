import { createServiceClient } from "../utils/supabase";
import { QuoteData } from "../../src/types/common";

/**
 * 쇼츠에 사용할 인기/최신 문장을 선별
 * - notes 테이블에서 type='quote', is_public=true 조건
 * - 콘텐츠 점수: 길이 적절성 + 책 인기도 + 최신성 + 표지 유무
 * - 최근 사용된 문장/책 제외 (중복 방지)
 */
export async function selectQuote(
  excludeBookIds: string[] = []
): Promise<QuoteData | null> {
  const supabase = createServiceClient();

  let query = supabase
    .from("notes")
    .select(`
      id,
      content,
      page_number,
      tags,
      book:books!inner(id, title, author, cover_image_url, publisher, total_pages)
    `)
    .eq("type", "quote")
    .eq("is_public", true)
    .not("content", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (excludeBookIds.length > 0) {
    query = query.not("book_id", "in", `(${excludeBookIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Quote selection failed: ${error.message}`);
  if (!data || data.length === 0) return null;

  // 콘텐츠 점수 산정
  const scored = data.map((note) => {
    const content = note.content ?? "";
    const book = note.book as unknown as Record<string, unknown>;

    // 길이 점수: 20~100자가 최적
    const lenScore =
      content.length >= 20 && content.length <= 100
        ? 10
        : content.length > 100 && content.length <= 200
          ? 5
          : 1;

    // 표지 유무 점수
    const coverScore = book?.cover_image_url ? 5 : 0;

    return {
      note,
      score: lenScore + coverScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored[0].note;
  const book = selected.book as unknown as Record<string, unknown>;

  return {
    id: selected.id,
    content: selected.content ?? "",
    pageNumber: selected.page_number,
    book: {
      id: book.id as string,
      title: book.title as string,
      author: (book.author as string) ?? null,
      coverImageUrl: (book.cover_image_url as string) ?? null,
      publisher: (book.publisher as string) ?? null,
      totalPages: (book.total_pages as number) ?? null,
    },
    tags: selected.tags,
  };
}
