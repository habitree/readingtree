import { Suspense } from "react";
import { Metadata } from "next";
import { getNotes, getDraftNotesCount, getUserTagsWithCount } from "@/app/actions/notes";
import { getCachedCurrentUser } from "@/lib/cached";
import { NotesHubClient } from "@/components/notes/notes-hub-client";
import { NoteList } from "@/components/notes/note-list";
import type { NoteType } from "@/types/note";

export const metadata: Metadata = {
  title: "내 기록 | ReadTree",
  description: "내가 작성한 모든 기록을 확인하세요",
};

interface NotesPageProps {
  searchParams: {
    tab?: string;
    group?: string;
    sort?: string;
    /** 하위호환: /notes/free → /notes?free=true 리다이렉트 */
    free?: string;
    type?: string;
    status?: string;
  };
}

/**
 * 기록 허브 페이지
 * ?tab=all|inbox|quote|memo|photo|transcription|progress
 * ?group=book (책별 그룹 뷰)
 * ?sort=latest|oldest
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  // 탭 결정 (하위호환: free=true → tab은 유지, isFree 플래그)
  let tab = searchParams.tab ?? "all";
  const isFree = searchParams.free === "true";
  const isGrouped = searchParams.group === "book";
  const sort = searchParams.sort ?? "latest";

  // 하위호환: ?status=draft → ?tab=inbox
  if (searchParams.status === "draft") tab = "inbox";

  // 탭 → status/type 매핑
  const isInbox = tab === "inbox";
  const typeFilter = (!isInbox && tab !== "all") ? tab as NoteType : undefined;
  const statusFilter = isInbox ? "draft" as const : "all" as const;

  return (
    <Suspense fallback={<NoteList notes={[]} isLoading />}>
      <NotesHubContent
        tab={tab}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        isFree={isFree}
        isGrouped={isGrouped}
        sort={sort}
      />
    </Suspense>
  );
}

async function NotesHubContent({
  tab,
  typeFilter,
  statusFilter,
  isFree,
  isGrouped,
  sort,
}: {
  tab: string;
  typeFilter?: NoteType;
  statusFilter: "draft" | "all";
  isFree: boolean;
  isGrouped: boolean;
  sort: string;
}) {
  const user = await getCachedCurrentUser();

  const [notes, draftCount, tags] = await Promise.all([
    getNotes(undefined, typeFilter, user, true, {
      status: statusFilter,
      isFree: isFree || undefined,
    }),
    getDraftNotesCount(user),
    user ? getUserTagsWithCount(user) : Promise.resolve([]),
  ]);

  // 정렬
  const sortedNotes = sort === "oldest"
    ? [...notes].reverse()
    : notes;

  return (
    <NotesHubClient
      notes={sortedNotes}
      tags={tags}
      draftCount={draftCount}
      activeTab={tab}
      isGrouped={isGrouped}
      sort={sort}
    />
  );
}
