"use server";

/**
 * AI 서재 정리 — 사용자의 책 목록을 분석하여 서재 분류를 제안하고 일괄 적용
 */

import { getCurrentUser } from "@/app/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/providers";
import { getBookshelves, createBookshelf, moveBookToBookshelf } from "@/app/actions/bookshelves";
import { revalidatePath } from "next/cache";

// =============================================================================
// 타입
// =============================================================================

export interface BookForOrganize {
  userBookId: string;
  title: string;
  author: string;
  status: string;
  bookshelfName: string;
}

export interface ShelfSuggestion {
  shelfName: string;
  description: string;
  books: { userBookId: string; title: string; author: string }[];
}

export interface OrganizeSuggestion {
  criteria: string;
  shelves: ShelfSuggestion[];
  summary: string;
}

// =============================================================================
// 1단계: AI에게 서재 분류 제안 받기
// =============================================================================

export async function getOrganizeSuggestion(
  userCriteria: string
): Promise<OrganizeSuggestion> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();

  // 사용자의 모든 책 + 현재 서재 정보 조회
  const { data: userBooks, error } = await supabase
    .from("user_books")
    .select(`
      id,
      status,
      bookshelf_id,
      books (
        id,
        title,
        author
      ),
      bookshelves (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`책 목록 조회 실패: ${error.message}`);
  if (!userBooks || userBooks.length === 0) {
    throw new Error("서재에 등록된 책이 없습니다. 먼저 책을 추가해주세요.");
  }

  // 책 목록 정규화
  const books: BookForOrganize[] = userBooks.map((ub: Record<string, unknown>) => {
    const book = ub.books as Record<string, unknown> | null;
    const shelf = ub.bookshelves as Record<string, unknown> | null;
    return {
      userBookId: String(ub.id),
      title: String(book?.title ?? "제목 없음"),
      author: String(book?.author ?? ""),
      status: String(ub.status ?? "not_started"),
      bookshelfName: String(shelf?.name ?? "내 서재"),
    };
  });

  // 프롬프트 생성
  const bookList = books
    .map((b, i) => `${i + 1}. "${b.title}" — ${b.author || "저자 미상"} [상태: ${statusLabel(b.status)}, 현재 서재: ${b.bookshelfName}]`)
    .join("\n");

  const prompt = `당신은 독서 전문 라이브러리안입니다. 사용자의 책 목록을 분석하여 서재 분류를 제안해주세요.

## 사용자 정리 기준
${userCriteria}

## 현재 보유 책 목록 (${books.length}권)
${bookList}

## 출력 규칙
1. 사용자가 원하는 기준에 맞춰 서재를 분류하세요
2. 서재 이름은 짧고 직관적으로 (한글, 15자 이내)
3. 각 서재에 설명을 한 줄로 추가하세요
4. 모든 책이 하나의 서재에 배정되어야 합니다 (빠지는 책 없이)
5. 서재는 2~8개 사이로 제안하세요
6. 마지막에 분류 요약을 한 문장으로 작성하세요

## 출력 형식 (반드시 이 JSON만 출력, 다른 텍스트 없이)
{
  "criteria": "적용한 분류 기준 설명",
  "shelves": [
    {
      "shelfName": "서재 이름",
      "description": "서재 설명",
      "bookNumbers": [1, 3, 5]
    }
  ],
  "summary": "분류 요약 한 문장"
}

bookNumbers는 위 책 목록의 번호(1부터 시작)입니다. 반드시 모든 번호가 포함되어야 합니다.`;

  const result = await generateText("openai", prompt, {
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 2000,
  });

  // JSON 파싱
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.");

  const parsed = JSON.parse(jsonMatch[0]) as {
    criteria: string;
    shelves: { shelfName: string; description: string; bookNumbers: number[] }[];
    summary: string;
  };

  // bookNumbers → 실제 책 정보로 변환
  const shelves: ShelfSuggestion[] = parsed.shelves.map((s) => ({
    shelfName: s.shelfName,
    description: s.description,
    books: s.bookNumbers
      .filter((n) => n >= 1 && n <= books.length)
      .map((n) => {
        const b = books[n - 1];
        return { userBookId: b.userBookId, title: b.title, author: b.author };
      }),
  }));

  return {
    criteria: parsed.criteria,
    shelves,
    summary: parsed.summary,
  };
}

// =============================================================================
// 2단계: 제안된 분류를 실제로 적용
// =============================================================================

export async function applyOrganizeSuggestion(
  shelves: ShelfSuggestion[]
): Promise<{ created: number; moved: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 기존 서재 목록 가져오기
  const existingBookshelves = await getBookshelves();
  const existingMap = new Map(existingBookshelves.map((bs) => [bs.name, bs.id]));

  let created = 0;
  let moved = 0;

  for (const shelf of shelves) {
    let bookshelfId = existingMap.get(shelf.shelfName);

    // 서재가 없으면 생성
    if (!bookshelfId) {
      try {
        const newShelf = await createBookshelf({
          name: shelf.shelfName,
          description: shelf.description,
        });
        bookshelfId = newShelf.id;
        created++;
      } catch (e) {
        // 한도 초과 등의 에러 시 스킵
        console.error(`서재 생성 실패 (${shelf.shelfName}):`, e);
        continue;
      }
    }

    // 책들을 해당 서재로 이동
    for (const book of shelf.books) {
      try {
        await moveBookToBookshelf(book.userBookId, bookshelfId);
        moved++;
      } catch (e) {
        console.error(`책 이동 실패 (${book.title}):`, e);
      }
    }
  }

  revalidatePath("/bookshelves");
  revalidatePath("/books");

  return { created, moved };
}

// =============================================================================
// 유틸
// =============================================================================

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    reading: "읽는 중",
    completed: "완독",
    paused: "중단",
    not_started: "읽기 전",
    rereading: "재독",
  };
  return labels[status] || status;
}
