"use server";

/**
 * AI 독서 리포트 생성 서버 액션
 */

import { getCurrentUser } from "../auth";
import { getBookDetail } from "../books";
import { getNotes } from "../notes";
import { getReportSettingsForGeneration } from "./report-settings";
import { generateReportPrompt } from "@/lib/ai/prompts/report-prompts";
import { generateText } from "@/lib/ai/providers";
import type { ReadingReportResult } from "@/types/ai";

const MIN_NOTES_FOR_REPORT = 3;

/**
 * AI 독서 리포트 생성
 * @param userBookId user_books.id
 */
export async function generateReadingReport(
  userBookId: string
): Promise<ReadingReportResult> {
  try {
    // 1. 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 2. 책 정보 조회
    const bookDetail = await getBookDetail(userBookId, user);
    if (!bookDetail) {
      return { success: false, error: "책 정보를 찾을 수 없습니다." };
    }

    const book = bookDetail.books as Record<string, unknown>;

    // 3. 노트 조회
    const notes = await getNotes(userBookId, undefined, user, false);
    if (notes.length < MIN_NOTES_FOR_REPORT) {
      return {
        success: false,
        error: `리포트를 생성하려면 최소 ${MIN_NOTES_FOR_REPORT}개의 기록이 필요합니다. (현재 ${notes.length}개)`,
      };
    }

    // 4. AI 설정 조회
    const settings = await getReportSettingsForGeneration();

    // 5. 프롬프트 생성
    const prompt = generateReportPrompt(
      {
        title: book.title as string,
        author: (book.author as string | null) ?? null,
        status: bookDetail.status as string,
        startedAt: bookDetail.started_at,
        completedAt: bookDetail.completed_at ?? null,
        readingReason: bookDetail.reading_reason,
        currentPage: (bookDetail as Record<string, unknown>).current_page as number | null,
        totalPages: (book.total_pages as number | null) ?? null,
      },
      notes,
      settings.systemPrompt || undefined
    );

    // 6. AI 호출
    const reportMarkdown = await generateText(settings.provider, prompt, {
      model: settings.modelId,
      temperature: settings.temperature,
      maxTokens: settings.maxOutputTokens,
    });

    return {
      success: true,
      report: reportMarkdown,
      noteCount: notes.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("리포트 생성 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.",
    };
  }
}
