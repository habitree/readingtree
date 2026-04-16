"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Crown, BarChart3 } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import type {
  TopConnectedBook,
  BookRelationsGraphData,
  BookRelationsStats,
} from "@/app/actions/admin/book-relations";

interface BookRelationsStatsDetailProps {
  topBooks: TopConnectedBook[];
  graph: BookRelationsGraphData;
  stats: BookRelationsStats;
}

export function BookRelationsStatsDetail({
  topBooks,
  graph,
  stats,
}: BookRelationsStatsDetailProps) {
  // 연결 수 분포 히스토그램 계산
  const distribution = useMemo(() => {
    if (graph.nodes.length === 0) return [];

    const countMap = new Map<number, number>();
    for (const node of graph.nodes) {
      const count = node.connectionCount;
      countMap.set(count, (countMap.get(count) || 0) + 1);
    }

    return Array.from(countMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([connections, books]) => ({ connections, books }));
  }, [graph.nodes]);

  const maxDistribution = Math.max(...distribution.map((d) => d.books), 1);
  const maxTopBookCount = Math.max(...topBooks.map((b) => b.connectionCount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 가장 많이 연결된 책 Top 10 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            가장 많이 연결된 책
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">데이터가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topBooks.map((book, index) => (
                <div
                  key={book.userBookId}
                  className="flex items-center gap-3"
                >
                  {/* 순위 */}
                  <span className="text-sm font-bold text-muted-foreground w-6 text-right shrink-0">
                    {index + 1}
                  </span>

                  {/* 책 표지 */}
                  <div className="relative w-8 h-11 shrink-0 rounded overflow-hidden bg-muted">
                    {book.coverImageUrl ? (
                      <Image
                        src={getImageUrl(book.coverImageUrl)}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 책 정보 + 바 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{book.title}</p>
                        <div className="flex items-center gap-1.5">
                          {book.author && (
                            <p className="text-xs text-muted-foreground truncate">
                              {book.author}
                            </p>
                          )}
                          {book.userName && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {book.userName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className="shrink-0 text-xs"
                      >
                        {book.connectionCount}
                      </Badge>
                    </div>
                    {/* 바 */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${(book.connectionCount / maxTopBookCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연결 수 분포 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            연결 수 분포
          </CardTitle>
        </CardHeader>
        <CardContent>
          {distribution.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">데이터가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-4">
                각 연결 수별 책의 개수를 보여줍니다
              </p>
              {distribution.map(({ connections, books }) => (
                <div key={connections} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16 text-right shrink-0">
                    {connections}개 연결
                  </span>
                  <div className="flex-1 h-6 rounded bg-muted overflow-hidden relative">
                    <div
                      className="h-full rounded bg-blue-500/80 transition-all flex items-center"
                      style={{
                        width: `${Math.max((books / maxDistribution) * 100, 8)}%`,
                      }}
                    >
                      <span className="text-xs font-medium text-white px-2">
                        {books}권
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 요약 */}
              <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalRelations}</p>
                  <p className="text-xs text-muted-foreground">총 연결</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.avgConnectionsPerBook}</p>
                  <p className="text-xs text-muted-foreground">평균 연결/책</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
