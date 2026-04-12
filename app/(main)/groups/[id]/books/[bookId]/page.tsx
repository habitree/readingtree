import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroupDetail, getGroupBookNotes } from "@/app/actions/groups";
import { getBook } from "@/app/actions/books";
import { getCachedCurrentUser } from "@/lib/cached";
import { isValidUUID, sanitizeErrorForLogging } from "@/lib/utils/validation";
import { GroupBookNotesPage } from "@/components/groups/group-book-notes-page";

interface GroupBookDetailPageProps {
  params: Promise<{
    id: string;
    bookId: string;
  }>;
}

export default async function GroupBookDetailPage({
  params,
}: GroupBookDetailPageProps) {
  const resolvedParams = await params;

  if (
    !resolvedParams?.id ||
    !resolvedParams?.bookId ||
    typeof resolvedParams.id !== "string" ||
    typeof resolvedParams.bookId !== "string"
  ) {
    notFound();
  }

  if (!isValidUUID(resolvedParams.id) || !isValidUUID(resolvedParams.bookId)) {
    notFound();
  }

  let groupData;
  let book;
  let currentUser;

  try {
    [groupData, book, currentUser] = await Promise.all([
      getGroupDetail(resolvedParams.id),
      getBook(resolvedParams.bookId),
      getCachedCurrentUser(),
    ]);
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("페이지 데이터 조회 오류:", safeError);
    notFound();
  }

  if (!book) {
    notFound();
  }

  const groupBookEntry = groupData.groupBooks?.find(
    (gb: any) => gb.book_id === resolvedParams.bookId
  );

  if (!groupBookEntry) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <GroupBookNotesPage
        groupId={resolvedParams.id}
        groupName={groupData.group.name}
        book={book}
        currentUserId={currentUser?.id}
        isGroupBook={!!groupBookEntry}
        leaderDescription={groupBookEntry.description || null}
        leaderLinks={Array.isArray(groupBookEntry.links) ? groupBookEntry.links : []}
      />
    </Suspense>
  );
}
