import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadingStats } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 가장 많이 기록한 책 섹션 (Streaming SSR)
 */
export async function TopBooksSection() {
  const user = await getCurrentUser();
  const readingStats = await getReadingStats(user);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2">가장 많이 기록한 책</CardTitle>
            <CardDescription>기록 수가 많은 책 Top 5</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {readingStats && readingStats.topBooks.length > 0 ? (
          <div className="space-y-2">
            {readingStats.topBooks.map((item, index) => (
              <Link
                key={item.book.id}
                href={`/books/${item.book.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0",
                    index === 0 && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                    index === 1 && "bg-gray-400/20 text-gray-700 dark:text-gray-400",
                    index === 2 && "bg-orange-500/20 text-orange-700 dark:text-orange-400",
                    index >= 3 && "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {item.book.title}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-4">
                  {item.noteCount}개 기록
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              기록한 책이 없습니다. 책을 추가하고 기록을 작성해보세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
