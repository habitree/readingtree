import { getReadingStats } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import { RecentBooksUI } from "./recent-books-ui";

/**
 * 최근 기록한 책 섹션 (Streaming SSR)
 */
export async function RecentBooksSection() {
  const user = await getCurrentUser();
  const readingStats = await getReadingStats(user);

  return (
    <RecentBooksUI recentBooks={readingStats?.recentBooks ?? []} />
  );
}
