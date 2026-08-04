"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { searchBooks } from "@/lib/api/book-search";
import { summarizeWithGemini } from "@/lib/ai/providers/gemini";

/**
 * 책소개 가져오기
 * DB에 저장된 description_summary가 있으면 반환
 * 없으면 summary를 기반으로 description_summary 생성 (30자 이상이면 Gemini API로 요약, 30자 이내면 그대로)
 * @param bookId 책 ID
 * @param isbn ISBN (선택)
 * @param title 책 제목 (선택)
 * @returns 책소개 (description_summary)
 */
export async function getBookDescriptionSummary(
  bookId: string,
  isbn?: string | null,
  title?: string | null
): Promise<string> {
  if (!bookId) {
    return "";
  }

  const supabase = await createServerSupabaseClient();

  try {
    // 1. DB에서 기존 책소개 확인
    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("summary, description_summary")
      .eq("id", bookId)
      .maybeSingle();

    if (fetchError) {
      console.error("[getBookDescriptionSummary] DB 조회 오류:", fetchError);
    }

    // 2. description_summary가 있으면 반환
    if (book?.description_summary && book.description_summary.trim().length > 0) {
      return book.description_summary;
    }

    // 3. description_summary가 없고 summary가 있으면 description_summary 생성
    if (book?.summary && book.summary.trim().length > 0) {
      const summaryText = book.summary.trim();
      let descriptionSummary: string;

      if (summaryText.length >= 30) {
        // 30자 이상이면 Gemini API로 20자 요약
        descriptionSummary = await summarizeWithGemini(summaryText);
      } else {
        // 30자 이내면 그대로 사용
        descriptionSummary = summaryText;
      }

      // description_summary 저장 (비동기)
      if (descriptionSummary && descriptionSummary.trim().length > 0) {
        void (async () => {
          try {
            const { error: updateError } = await supabase
              .from("books")
              .update({ description_summary: descriptionSummary.trim() })
              .eq("id", bookId);

            if (updateError) {
              console.error("[getBookDescriptionSummary] description_summary 저장 오류:", updateError);
            }
          } catch (error) {
            console.error("[getBookDescriptionSummary] description_summary 저장 실패:", error);
          }
        })();
      }

      return descriptionSummary || "";
    }

    // 4. summary도 없으면 Naver API로 가져오기
    if (!isbn && !title) {
      return "";
    }

    // Naver API로 책 검색
    const query = isbn || title || "";
    const searchResponse = await searchBooks({ query, display: 1 });

    if (!searchResponse.items || searchResponse.items.length === 0) {
      return "";
    }

    const description = searchResponse.items[0].description;
    if (!description || description.trim().length === 0) {
      return "";
    }

    // summary에 전체 책소개 저장
    const fullDescription = description.trim();

    // description_summary 생성 (30자 이상이면 Gemini API로 요약, 30자 이내면 그대로)
    let descriptionSummary: string;
    if (fullDescription.length >= 30) {
      // 30자 이상이면 Gemini API로 20자 요약
      descriptionSummary = await summarizeWithGemini(fullDescription);
    } else {
      // 30자 이내면 그대로 사용
      descriptionSummary = fullDescription;
    }

    // 5. DB에 저장 (비동기, 실패해도 반환)
    void (async () => {
      try {
        const updateData: { description_summary?: string; summary?: string } = {};

        // description_summary 저장
        if (descriptionSummary && descriptionSummary.trim().length > 0) {
          updateData.description_summary = descriptionSummary.trim();
        }

        // summary에 전체 책소개 저장
        if (fullDescription && fullDescription.trim().length > 0) {
          updateData.summary = fullDescription;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("books")
            .update(updateData)
            .eq("id", bookId);

          if (updateError) {
            console.error("[getBookDescriptionSummary] DB 저장 오류:", updateError);
          }
        }
      } catch (error) {
        console.error("[getBookDescriptionSummary] DB 저장 실패:", error);
      }
    })();

    // description_summary 반환
    return descriptionSummary || "";
  } catch (error) {
    console.error("[getBookDescriptionSummary] 책소개 가져오기 실패:", error);
    return "";
  }
}
