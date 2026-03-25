import { Suspense } from "react";
import { Metadata } from "next";
import { searchNotes } from "@/app/actions/search";
import { getDraftNotesCount, getUserTagsWithCount } from "@/app/actions/notes";
import { getCachedCurrentUser } from "@/lib/cached";
import { NotesHubClient } from "@/components/notes/notes-hub-client";
import { NoteList } from "@/components/notes/note-list";
import type { NoteType } from "@/types/note";
import type { SearchSortBy } from "@/app/actions/search";

export const metadata: Metadata = {
  title: "내 기록 | ReadTree",
  description: "내가 작성한 모든 기록을 확인하세요",
};

interface NotesPageProps {
  searchParams: Promise<{
    tab?: string;
    group?: string;
    view?: string;
    sort?: string;
    q?: string;
    bookId?: string;
    startDate?: string;
    endDate?: string;
    tags?: string;
    page?: string;
    /** 하위호환 */
    free?: string;
    type?: string;
    status?: string;
  }>;
}

/**
 * 통합 기록 허브 페이지
 * 내기록 + 검색 + 타임라인을 하나로 통합
 *
 * ?tab=all|inbox|quote|memo|photo|transcription|progress
 * ?view=list|timeline|book
 * ?sort=latest|oldest|book
 * ?q=검색어
 * ?bookId=xxx&startDate=...&endDate=...&tags=...
 * ?page=1
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  const sp = await searchParams;

  // 탭 결정
  let tab = sp.tab ?? "all";
  if (sp.status === "draft") tab = "inbox";

  // 뷰 모드 (하위호환: group=book → view=book)
  const view = sp.view ?? (sp.group === "book" ? "book" : "list");
  const sort = (sp.sort ?? "latest") as SearchSortBy;
  const page = Number(sp.page) || 1;

  // 탭 → types/status 매핑
  const isInbox = tab === "inbox";
  const types =
    !isInbox && tab !== "all" ? [tab as NoteType] : undefined;
  const status = isInbox ? ("draft" as const) : undefined;

  // 태그 파싱
  const tags = sp.tags ? sp.tags.split(",").filter(Boolean) : undefined;

  return (
    <Suspense fallback={<NoteList notes={[]} isLoading />}>
      <NotesHubContent
        tab={tab}
        view={view}
        sort={sort}
        page={page}
        query={sp.q}
        bookId={sp.bookId}
        startDate={sp.startDate}
        endDate={sp.endDate}
        tags={tags}
        types={types}
        status={status}
      />
    </Suspense>
  );
}

async function NotesHubContent({
  tab,
  view,
  sort,
  page,
  query,
  bookId,
  startDate,
  endDate,
  tags,
  types,
  status,
}: {
  tab: string;
  view: string;
  sort: SearchSortBy;
  page: number;
  query?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  types?: string[];
  status?: "draft" | "published";
}) {
  const user = await getCachedCurrentUser();

  const [searchResult, draftCount, userTags] = await Promise.all([
    searchNotes(
      {
        query,
        bookId,
        startDate,
        endDate,
        tags,
        types,
        page,
        sort,
        status,
      },
      user
    ),
    getDraftNotesCount(user),
    user ? getUserTagsWithCount(user) : Promise.resolve([]),
  ]);

  // searchNotes 결과를 NoteWithBook 형태로 정규화
  const notes = searchResult.results.map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : note.books;
    return { ...note, book };
  });

  return (
    <NotesHubClient
      notes={notes}
      tags={userTags}
      draftCount={draftCount}
      activeTab={tab}
      activeView={view as "list" | "timeline" | "book"}
      sort={sort}
      searchQuery={query}
      total={searchResult.total}
      totalPages={searchResult.totalPages}
      currentPage={searchResult.page}
      activeBookId={bookId}
      activeStartDate={startDate}
      activeEndDate={endDate}
      activeTags={tags}
    />
  );
}
