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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ReadingReportResult, SavedReport, BookInfoForReport, PublicNoteSummary } from "@/types/ai";

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

/**
 * 리포트 저장 (upsert)
 * 같은 user_book_id에 이미 저장된 리포트가 있으면 갱신, share_id는 유지
 */
export async function saveReadingReport(
  userBookId: string,
  reportMarkdown: string,
  bookInfo: BookInfoForReport,
  noteCount: number,
  noteIds: string[]
): Promise<{ success: boolean; shareId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const supabase = await createServerSupabaseClient();

    // 기존 리포트 확인 (share_id 유지 위해)
    const { data: existing } = await supabase
      .from("ai_generated_reports")
      .select("id, share_id")
      .eq("user_id", user.id)
      .eq("user_book_id", userBookId)
      .single();

    if (existing) {
      // UPDATE: share_id 유지하면서 내용 갱신
      const { error } = await supabase
        .from("ai_generated_reports")
        .update({
          report_markdown: reportMarkdown,
          note_count: noteCount,
          note_ids: noteIds,
          book_title: bookInfo.title,
          book_author: bookInfo.author,
          cover_image_url: bookInfo.coverImageUrl,
          started_at: bookInfo.startedAt,
          completed_at: bookInfo.completedAt,
          current_page: bookInfo.currentPage,
          total_pages: bookInfo.totalPages,
        })
        .eq("id", existing.id);

      if (error) throw error;
      return { success: true, shareId: existing.share_id };
    } else {
      // INSERT
      const { data, error } = await supabase
        .from("ai_generated_reports")
        .insert({
          user_id: user.id,
          user_book_id: userBookId,
          report_markdown: reportMarkdown,
          note_count: noteCount,
          note_ids: noteIds,
          book_title: bookInfo.title,
          book_author: bookInfo.author,
          cover_image_url: bookInfo.coverImageUrl,
          started_at: bookInfo.startedAt,
          completed_at: bookInfo.completedAt,
          current_page: bookInfo.currentPage,
          total_pages: bookInfo.totalPages,
        })
        .select("share_id")
        .single();

      if (error) throw error;
      return { success: true, shareId: data.share_id };
    }
  } catch (error) {
    console.error("리포트 저장 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "리포트 저장 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 리포트 공개/비공개 토글
 * includeNotes=true이면 관련 노트도 함께 공개/비공개 처리
 */
export async function toggleReportPublic(
  shareId: string,
  isPublic: boolean,
  includeNotes: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const supabase = await createServerSupabaseClient();

    // 리포트 업데이트 (include_notes 상태도 저장)
    const { data: report, error: reportError } = await supabase
      .from("ai_generated_reports")
      .update({ is_public: isPublic, include_notes: includeNotes })
      .eq("share_id", shareId)
      .eq("user_id", user.id)
      .select("note_ids")
      .single();

    if (reportError) throw reportError;

    // 기록도 함께 공개/비공개 처리
    if (includeNotes && report?.note_ids && report.note_ids.length > 0) {
      const { error: notesError } = await supabase
        .from("notes")
        .update({ is_public: isPublic })
        .in("id", report.note_ids)
        .eq("user_id", user.id);

      if (notesError) {
        console.error("노트 공개 설정 실패 (리포트는 성공):", notesError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("리포트 공개 설정 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "설정 변경 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 공유 리포트 조회 (공개된 리포트만)
 */
export async function getPublicReport(
  shareId: string
): Promise<SavedReport | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ai_generated_reports")
      .select("*")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      shareId: data.share_id,
      userBookId: data.user_book_id,
      reportMarkdown: data.report_markdown,
      noteCount: data.note_count,
      isPublic: data.is_public,
      bookTitle: data.book_title,
      bookAuthor: data.book_author,
      coverImageUrl: data.cover_image_url,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      noteIds: data.note_ids || [],
      includeNotes: data.include_notes ?? true,
      viewCount: data.view_count ?? 0,
      currentPage: data.current_page ?? null,
      totalPages: data.total_pages ?? null,
    };
  } catch (error) {
    console.error("공유 리포트 조회 실패:", error);
    return null;
  }
}

/**
 * 공유 리포트에 연결된 공개 노트 목록 조회
 */
export async function getPublicReportNotes(
  noteIds: string[]
): Promise<PublicNoteSummary[]> {
  if (!noteIds || noteIds.length === 0) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("notes")
      .select("id, type, title, page_number, content, created_at")
      .in("id", noteIds)
      .eq("is_public", true)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map((note) => ({
      id: note.id,
      type: note.type,
      title: note.title,
      pageNumber: note.page_number,
      content: note.content,
      createdAt: note.created_at,
    }));
  } catch (error) {
    console.error("공개 노트 조회 실패:", error);
    return [];
  }
}

/**
 * 공유 리포트 조회수 증가 (공개 리포트만)
 * SECURITY DEFINER RPC 함수를 사용하여 비로그인 사용자도 호출 가능
 */
export async function incrementReportViewCount(
  shareId: string
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.rpc("increment_report_view_count", {
      p_share_id: shareId,
    });
  } catch {
    // 조회수 증가 실패는 무시 (사용자 경험에 영향 없음)
  }
}
