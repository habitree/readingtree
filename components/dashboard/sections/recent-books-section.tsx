import { getCachedCurrentUser, getCachedReadingStats } from "@/lib/cached";
import { RecentBooksUI } from "./recent-books-ui";

/**
 * 최근 기록한 책 섹션 (Streaming SSR)
 */
export async function RecentBooksSection() {
  const user = await getCachedCurrentUser();
  const readingStats = await getCachedReadingStats(user);

  return (
    <RecentBooksUI recentBooks={readingStats?.recentBooks ?? []} />
  );
}
