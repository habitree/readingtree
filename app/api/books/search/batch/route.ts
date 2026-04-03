import { NextResponse } from "next/server";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BulkBookRow } from "@/app/actions/books/_shared";
import type { AddBookInput } from "@/app/actions/books/_shared";

const MAX_QUERIES = 50;
const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 일괄 책 검색 API
 * POST /api/books/search/batch
 * 여러 책을 순차적으로 네이버 API로 검색
 */
export async function POST(request: Request) {
  try {
    // 인증 확인
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const queries: BulkBookRow[] = body.queries;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: "검색할 책 목록이 비어있습니다." }, { status: 400 });
    }

    if (queries.length > MAX_QUERIES) {
      return NextResponse.json(
        { error: `최대 ${MAX_QUERIES}건까지 검색 가능합니다.` },
        { status: 400 }
      );
    }

    const results: Array<{
      rowIndex: number;
      matches: AddBookInput[];
      error?: string;
    }> = [];

    for (let i = 0; i < queries.length; i++) {
      const row = queries[i];

      if (!row.title?.trim()) {
        results.push({ rowIndex: row.rowIndex, matches: [], error: "제목이 비어있습니다." });
        continue;
      }

      try {
        // 검색 쿼리 구성: ISBN > title+author > title
        let searchQuery: string;
        if (row.isbn?.trim()) {
          searchQuery = row.isbn.trim();
        } else if (row.author?.trim()) {
          searchQuery = `${row.title.trim()} ${row.author.trim()}`;
        } else {
          searchQuery = row.title.trim();
        }

        const response = await searchBooks({ query: searchQuery, display: 5 });
        const matches = (response.items || []).map(transformNaverBookItem);

        results.push({ rowIndex: row.rowIndex, matches });
      } catch (error) {
        results.push({
          rowIndex: row.rowIndex,
          matches: [],
          error: error instanceof Error ? error.message : "검색 실패",
        });
      }

      // 네이버 API rate limit 방지를 위한 딜레이
      if (i < queries.length - 1) {
        await sleep(DELAY_MS);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[batch search] 오류:", error);
    return NextResponse.json(
      { error: "일괄 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
