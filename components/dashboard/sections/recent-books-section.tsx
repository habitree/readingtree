import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadingStats } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { BookOpen } from "lucide-react";

/**
 * 최근 기록한 책 섹션 (Streaming SSR)
 */
export async function RecentBooksSection() {
  const user = await getCurrentUser();
  const readingStats = await getReadingStats(user);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2">최근 기록한 책</CardTitle>
            <CardDescription>가장 최근에 기록을 남긴 책들입니다.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {readingStats && readingStats.recentBooks && readingStats.recentBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {readingStats.recentBooks.map((item) => (
              <Link
                key={item.book.id}
                href={`/books/${item.book.id}`}
                className="group space-y-2"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg border shadow-sm group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                  {item.book.cover_image_url ? (
                    <img
                      src={item.book.cover_image_url}
                      alt={item.book.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                    {item.book.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {item.noteCount}개 기록
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground leading-relaxed">
              기록한 책이 없습니다. 책을 추가하고 첫 기록을 남겨보세요!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
