"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import type { ActionResult } from "@/types/action-result";
import { fail, ok, failFromException } from "@/lib/errors";

export interface ExportNotesOptions {
  /** YYYY-MM 형식으로 특정 달만 내보내기 (미지정 시 전체) */
  month?: string;
  /** 특정 book_id만 필터 (미지정 시 전체) */
  bookId?: string;
}

interface ExportNoteRow {
  id: string;
  title: string | null;
  content: string | null;
  type: string;
  tags: string[] | null;
  page_number: string | null;
  created_at: string;
  books: { title: string | null; author: string | null } | null;
  transcriptions?: { extracted_text: string | null }[] | null;
}

interface NoteContentFields {
  quote?: string;
  memo?: string;
}

function parseNoteFields(content: string | null): NoteContentFields {
  if (!content) return {};
  try {
    const parsed = JSON.parse(content) as NoteContentFields;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // plain text
  }
  return { memo: content };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const TYPE_LABEL: Record<string, string> = {
  quote: "인상깊은 구절",
  memo: "메모",
  photo: "사진 기록",
  transcription: "필사",
  progress: "진행 기록",
};

function renderNoteMarkdown(note: ExportNoteRow): string {
  const fields = parseNoteFields(note.content);
  const parts: string[] = [];

  const title = note.title?.trim();
  const bookTitle = note.books?.title;
  const bookAuthor = note.books?.author;
  const typeLabel = TYPE_LABEL[note.type] ?? note.type;

  parts.push(`## ${title || typeLabel}`);
  parts.push("");

  const meta: string[] = [formatDate(note.created_at), typeLabel];
  if (note.page_number) meta.push(`p.${note.page_number}`);
  if (bookTitle) {
    meta.push(bookAuthor ? `${bookTitle} · ${bookAuthor}` : bookTitle);
  }
  parts.push(`> ${meta.join(" · ")}`);
  parts.push("");

  if (fields.quote) {
    parts.push("### 구절");
    parts.push("");
    parts.push(fields.quote);
    parts.push("");
  }

  if (fields.memo) {
    parts.push("### 메모");
    parts.push("");
    parts.push(fields.memo);
    parts.push("");
  }

  const ocrText = note.transcriptions?.[0]?.extracted_text;
  if (ocrText) {
    parts.push("### 필사");
    parts.push("");
    parts.push(ocrText);
    parts.push("");
  }

  if (note.tags && note.tags.length > 0) {
    parts.push(
      "태그: " + note.tags.map((t) => `\`${t}\``).join(" "),
    );
    parts.push("");
  }

  return parts.join("\n");
}

export interface ExportResult {
  markdown: string;
  filename: string;
  noteCount: number;
}

/**
 * 사용자 기록을 하나의 Markdown 문자열로 직렬화해 반환.
 * 클라이언트에서 Blob으로 다운로드하도록 호출한다.
 */
export async function exportNotesAsMarkdown(
  options?: ExportNotesOptions,
): Promise<ActionResult<ExportResult>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("notes")
      .select(
        "id, title, content, type, tags, page_number, created_at, books(title, author), transcriptions(extracted_text)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (options?.bookId) {
      query = query.eq("book_id", options.bookId);
    }

    if (options?.month) {
      // YYYY-MM → 해당 월 시작/다음 달 시작
      const [yearStr, monthStr] = options.month.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        month >= 1 &&
        month <= 12
      ) {
        const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const end = new Date(Date.UTC(year, month, 1)).toISOString();
        query = query.gte("created_at", start).lt("created_at", end);
      }
    }

    const { data, error } = await query;
    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }

    const rows = (data ?? []) as unknown as ExportNoteRow[];

    const header: string[] = [];
    header.push(`# ReadTree 기록 내보내기`);
    header.push("");
    header.push(`- 사용자: ${user.email ?? user.id}`);
    header.push(`- 기록 수: ${rows.length}`);
    header.push(`- 내보낸 시각: ${new Date().toISOString()}`);
    if (options?.month) header.push(`- 대상 월: ${options.month}`);
    header.push("");
    header.push("---");
    header.push("");

    const body = rows.map((row) => renderNoteMarkdown(row)).join("\n---\n\n");

    const markdown = header.join("\n") + body;

    const nowPart = new Date().toISOString().slice(0, 10);
    const filenameParts = ["readtree-notes"];
    if (options?.month) filenameParts.push(options.month);
    filenameParts.push(nowPart);
    const filename = `${filenameParts.join("-")}.md`;

    return ok({
      markdown,
      filename,
      noteCount: rows.length,
    });
  } catch (error) {
    return failFromException(error);
  }
}
