"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, Crown, BarChart3, Clock, ArrowRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  TopConnectedBook,
  BookRelationsGraphData,
  BookRelationsStats,
} from "@/app/actions/admin/book-relations";

// ============================================================
// 순위 메달 색상
// ============================================================

const RANK_STYLES = [
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800/40" },     // 1위 금
  { bg: "bg-slate-100 dark:bg-slate-800/40", text: "text-slate-500 dark:text-slate-400", ring: "ring-slate-200 dark:ring-slate-700/40" },       // 2위 은
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", ring: "ring-orange-200 dark:ring-orange-800/40" }, // 3위 동
];

const BAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-indigo-500/90 to-violet-500/80",
  "from-indigo-500/80 to-violet-500/70",
  "from-indigo-500/70 to-violet-500/60",
  "from-indigo-500/60 to-violet-500/50",
  "from-indigo-500/50 to-violet-500/40",
  "from-indigo-500/40 to-violet-500/30",
  "from-indigo-500/35 to-violet-500/25",
  "from-indigo-500/30 to-violet-500/20",
  "from-indigo-500/25 to-violet-500/15",
];

// ============================================================
// 메인 컴포넌트
// ============================================================

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
  const distribution = useMemo(() => {
    if (graph.nodes.length === 0) return [];
    const countMap = new Map<number, number>();
    for (const node of graph.nodes) {
      countMap.set(node.connectionCount, (countMap.get(node.connectionCount) || 0) + 1);
    }
    return Array.from(countMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([connections, books]) => ({ connections, books }));
  }, [graph.nodes]);

  // 최근 연결 5개 (graph edges에서 추출)
  const recentEdges = useMemo(() => {
    return graph.edges
      .slice(0, 5)
      .map((edge) => {
        const source = graph.nodes.find((n) => n.id === edge.source);
        const target = graph.nodes.find((n) => n.id === edge.target);
        return { ...edge, source: source || null, target: target || null };
      })
      .filter((e) => e.source && e.target);
  }, [graph]);

  const maxDistribution = Math.max(...distribution.map((d) => d.books), 1);
  const maxTopBookCount = Math.max(...topBooks.map((b) => b.connectionCount), 1);

  const cardClass = "overflow-hidden border-0 shadow-xl ring-1 ring-black/[0.03] dark:ring-white/[0.04]";
  const headerClass = "pb-3 bg-white/90 dark:bg-[#0e0c1d]/90 backdrop-blur-sm border-b border-border/20";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ===== Top 연결 책 ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className={cardClass}>
            <CardHeader className={headerClass}>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base tracking-tight">가장 많이 연결된 책</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {topBooks.length === 0 ? (
                <EmptyState icon={BookOpen} message="데이터가 없습니다" />
              ) : (
                <div className="divide-y divide-border/20">
                  {topBooks.map((book, index) => (
                    <motion.div
                      key={book.userBookId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3.5 px-5 py-3 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* 순위 */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ring-1 ${
                        index < 3
                          ? `${RANK_STYLES[index].bg} ${RANK_STYLES[index].text} ${RANK_STYLES[index].ring}`
                          : "bg-muted/50 text-muted-foreground/50 ring-border/20"
                      }`}>
                        {index + 1}
                      </div>

                      {/* 책 표지 */}
                      <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-muted/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] group-hover:shadow-md transition-shadow">
                        {book.coverImageUrl ? (
                          <Image
                            src={getImageUrl(book.coverImageUrl)}
                            alt={book.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* 정보 + 바 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium truncate text-foreground/90">{book.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {book.author && (
                                <p className="text-[11px] text-muted-foreground/60 truncate">{book.author}</p>
                              )}
                              {book.userName && (
                                <span className="text-[10px] text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded-full">{book.userName}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-bold tabular-nums tracking-tight text-foreground/80">{book.connectionCount}</span>
                            <span className="text-[10px] text-muted-foreground/40 ml-0.5">연결</span>
                          </div>
                        </div>
                        {/* 그래디언트 바 */}
                        <div className="h-1.5 rounded-full bg-muted/50 dark:bg-white/[0.04] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(book.connectionCount / maxTopBookCount) * 100}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${BAR_GRADIENTS[index] || BAR_GRADIENTS[BAR_GRADIENTS.length - 1]}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== 연결 수 분포 ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cardClass}>
            <CardHeader className={headerClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base tracking-tight">연결 수 분포</CardTitle>
                </div>
                <span className="text-[11px] text-muted-foreground/50">{graph.nodes.length}개 책</span>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-4">
              {distribution.length === 0 ? (
                <EmptyState icon={BarChart3} message="데이터가 없습니다" />
              ) : (
                <div className="space-y-6">
                  {/* 축 레이블 */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                    <span>연결 수</span>
                    <span>책 수</span>
                  </div>

                  {/* 바 차트 */}
                  <TooltipProvider delayDuration={200}>
                    <div className="space-y-2.5">
                      {distribution.map(({ connections, books }, idx) => (
                        <Tooltip key={connections}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 cursor-default group">
                              <span className="text-[12px] tabular-nums text-muted-foreground/60 w-8 text-right shrink-0 font-medium">
                                {connections}
                              </span>
                              <div className="flex-1 h-7 rounded-lg bg-muted/30 dark:bg-white/[0.03] overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max((books / maxDistribution) * 100, 6)}%` }}
                                  transition={{ delay: 0.2 + idx * 0.06, duration: 0.5, ease: "easeOut" }}
                                  className="h-full rounded-lg bg-gradient-to-r from-blue-500/70 to-cyan-500/50 dark:from-blue-500/60 dark:to-cyan-500/40 flex items-center group-hover:from-blue-500/85 group-hover:to-cyan-500/65 transition-colors"
                                >
                                  <span className="text-[11px] font-semibold text-white px-2.5 tabular-nums drop-shadow-sm">
                                    {books}
                                  </span>
                                </motion.div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {connections}개 연결을 가진 책: <span className="font-bold">{books}권</span>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>

                  {/* 요약 KPI */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
                    <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02]">
                      <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground/90">{stats.totalRelations}</p>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5">총 연결</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02]">
                      <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground/90">{stats.avgConnectionsPerBook}</p>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5">평균 연결/책</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== 최근 연결 타임라인 ===== */}
      {recentEdges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className={cardClass}>
            <CardHeader className={headerClass}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-base tracking-tight">최근 연결</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-4 px-5">
              <div className="relative">
                {/* 세로 타임라인 선 */}
                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-emerald-300 via-indigo-300 to-transparent dark:from-emerald-700 dark:via-indigo-700 opacity-30" />

                <div className="space-y-4">
                  {recentEdges.map((edge, idx) => (
                    <motion.div
                      key={`${edge.source?.id}-${edge.target?.id}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.06 }}
                      className="flex items-start gap-4 relative"
                    >
                      {/* 타임라인 마커 */}
                      <div className="relative z-10 mt-1">
                        <div className="w-[10px] h-[10px] rounded-full bg-white dark:bg-[#0e0c1d] ring-2 ring-emerald-400/60 dark:ring-emerald-600/50" />
                      </div>

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 출발 책 */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-8 rounded overflow-hidden bg-muted/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] shrink-0">
                              {edge.source?.coverImageUrl ? (
                                <Image src={getImageUrl(edge.source.coverImageUrl)} alt="" width={24} height={32} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-2.5 w-2.5 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <span className="text-[12px] font-medium truncate max-w-[120px] sm:max-w-[180px] text-foreground/80">
                              {edge.source?.title}
                            </span>
                          </div>

                          <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />

                          {/* 도착 책 */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-8 rounded overflow-hidden bg-muted/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] shrink-0">
                              {edge.target?.coverImageUrl ? (
                                <Image src={getImageUrl(edge.target.coverImageUrl)} alt="" width={24} height={32} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-2.5 w-2.5 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <span className="text-[12px] font-medium truncate max-w-[120px] sm:max-w-[180px] text-foreground/80">
                              {edge.target?.title}
                            </span>
                          </div>
                        </div>

                        {/* 시간 */}
                        <p className="text-[10px] text-muted-foreground/40 mt-1">
                          {formatDistanceToNow(new Date(edge.createdAt), { addSuffix: true, locale: ko })}
                          {edge.source?.userName && (
                            <span className="ml-2 opacity-60">by {edge.source.userName}</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// 빈 상태 컴포넌트
// ============================================================

function EmptyState({ icon: Icon, message }: { icon: typeof BookOpen; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-border/30 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 opacity-25" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
