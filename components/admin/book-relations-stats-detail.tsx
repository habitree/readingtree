"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, Crown, BarChart3, Clock, ArrowRight, TrendingUp, Link2 } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  TopConnectedBook,
  BookRelationsGraphData,
  BookRelationsStats,
} from "@/app/actions/admin/book-relations";

// ============================================================
// 순위 메달
// ============================================================

const RANK_COLORS = [
  { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" },
  { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", border: "border-slate-200 dark:border-slate-500/20" },
  { bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/20" },
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

  const cardClass = "overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111019]";

  return (
    <div className="space-y-4">
      {/* KPI 요약 벤토 */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${cardClass} p-5 text-center`}
        >
          <div className="inline-flex p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 mb-3">
            <Link2 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{stats.totalRelations}</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">총 연결</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardClass} p-5 text-center`}
        >
          <div className="inline-flex p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 mb-3">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{stats.uniqueBooks}</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">참여 책</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${cardClass} p-5 text-center`}
        >
          <div className="inline-flex p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{stats.avgConnectionsPerBook}</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">평균 연결/책</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===== Top 연결 책 ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={cardClass}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold tracking-tight">가장 많이 연결된 책</span>
              </div>
              <span className="text-[11px] text-muted-foreground/40">{topBooks.length}개</span>
            </div>
            {topBooks.length === 0 ? (
              <EmptyState icon={BookOpen} message="데이터가 없습니다" />
            ) : (
              <div>
                {topBooks.map((book, index) => (
                  <motion.div
                    key={book.userBookId}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.04 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 dark:hover:bg-white/[0.02] transition-colors group border-b border-black/[0.03] dark:border-white/[0.03] last:border-0"
                  >
                    {/* 순위 */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                      index < 3
                        ? `${RANK_COLORS[index].bg} ${RANK_COLORS[index].text} ${RANK_COLORS[index].border}`
                        : "bg-muted/30 text-muted-foreground/40 border-transparent"
                    }`}>
                      {index + 1}
                    </div>

                    {/* 책 표지 */}
                    <div className="relative w-9 h-[52px] shrink-0 rounded-lg overflow-hidden bg-muted/30 border border-black/[0.04] dark:border-white/[0.04] group-hover:shadow-md transition-shadow">
                      {book.coverImageUrl ? (
                        <Image
                          src={getImageUrl(book.coverImageUrl)}
                          alt={book.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground/25" />
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
                              <p className="text-[11px] text-muted-foreground/50 truncate">{book.author}</p>
                            )}
                            {book.userName && (
                              <span className="text-[10px] text-muted-foreground/35 bg-muted/40 px-1.5 py-0.5 rounded-md">{book.userName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground/80">{book.connectionCount}</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-black/[0.03] dark:bg-white/[0.03] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(book.connectionCount / maxTopBookCount) * 100}%` }}
                          transition={{ delay: 0.3 + index * 0.04, duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                          style={{ opacity: 1 - index * 0.07 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ===== 연결 수 분포 ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={cardClass}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold tracking-tight">연결 수 분포</span>
              </div>
              <span className="text-[11px] text-muted-foreground/40">{graph.nodes.length}개 책</span>
            </div>
            {distribution.length === 0 ? (
              <EmptyState icon={BarChart3} message="데이터가 없습니다" />
            ) : (
              <div className="p-5 space-y-5">
                {/* 축 레이블 */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/35 uppercase tracking-wider font-medium">
                  <span>연결 수</span>
                  <span>책 수</span>
                </div>

                {/* 바 차트 */}
                <TooltipProvider delayDuration={200}>
                  <div className="space-y-2">
                    {distribution.map(({ connections, books }, idx) => (
                      <Tooltip key={connections}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 cursor-default group">
                            <span className="text-[12px] tabular-nums text-muted-foreground/50 w-7 text-right shrink-0 font-medium">
                              {connections}
                            </span>
                            <div className="flex-1 h-7 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max((books / maxDistribution) * 100, 8)}%` }}
                                transition={{ delay: 0.2 + idx * 0.05, duration: 0.5, ease: "easeOut" }}
                                className="h-full rounded-lg bg-gradient-to-r from-blue-500/60 to-cyan-400/40 dark:from-blue-500/50 dark:to-cyan-400/30 flex items-center group-hover:from-blue-500/80 group-hover:to-cyan-400/60 transition-colors duration-300"
                              >
                                <span className="text-[11px] font-semibold text-white/90 px-2.5 tabular-nums">
                                  {books}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs rounded-lg">
                          {connections}개 연결을 가진 책: <span className="font-bold">{books}권</span>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== 최근 연결 타임라인 ===== */}
      {recentEdges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className={cardClass}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold tracking-tight">최근 연결</span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 rounded-md border-emerald-200/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                {recentEdges.length}개
              </Badge>
            </div>
            <div className="py-4 px-5">
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-400/40 via-indigo-400/30 to-transparent dark:from-emerald-500/30 dark:via-indigo-500/20" />

                <div className="space-y-4">
                  {recentEdges.map((edge, idx) => (
                    <motion.div
                      key={`${edge.source?.id}-${edge.target?.id}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                      className="flex items-start gap-4 relative"
                    >
                      {/* 타임라인 마커 */}
                      <div className="relative z-10 mt-1.5">
                        <div className="w-[9px] h-[9px] rounded-full bg-white dark:bg-[#111019] ring-[1.5px] ring-emerald-400/60 dark:ring-emerald-500/50" />
                      </div>

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookMini coverUrl={edge.source?.coverImageUrl} title={edge.source?.title || ""} />
                          <ArrowRight className="h-3 w-3 text-muted-foreground/25 shrink-0" />
                          <BookMini coverUrl={edge.target?.coverImageUrl} title={edge.target?.title || ""} />
                        </div>
                        <p className="text-[10px] text-muted-foreground/35 mt-1.5">
                          {formatDistanceToNow(new Date(edge.createdAt), { addSuffix: true, locale: ko })}
                          {edge.source?.userName && (
                            <span className="ml-2 opacity-70">by {edge.source.userName}</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// 미니 책 컴포넌트
// ============================================================

function BookMini({ coverUrl, title }: { coverUrl?: string | null; title: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-7 rounded overflow-hidden bg-muted/30 border border-black/[0.04] dark:border-white/[0.04] shrink-0">
        {coverUrl ? (
          <Image src={getImageUrl(coverUrl)} alt="" width={20} height={28} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-2 w-2 text-muted-foreground/25" />
          </div>
        )}
      </div>
      <span className="text-[12px] font-medium truncate max-w-[120px] sm:max-w-[180px] text-foreground/75">
        {title}
      </span>
    </div>
  );
}

// ============================================================
// 빈 상태
// ============================================================

function EmptyState({ icon: Icon, message }: { icon: typeof BookOpen; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="w-12 h-12 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 opacity-20" />
      </div>
      <p className="text-sm text-muted-foreground/50">{message}</p>
    </div>
  );
}
