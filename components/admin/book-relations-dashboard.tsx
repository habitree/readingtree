"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { ArrowLeft, Link2, BookOpen, Users, TrendingUp, Sparkles, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookRelationsGraph } from "./book-relations-graph";
import { BookRelationsTable } from "./book-relations-table";
import { BookRelationsStatsDetail } from "./book-relations-stats-detail";
import {
  getBookRelationsStats,
  getBookRelationsGraph,
  getBookRelationsList,
  getTopConnectedBooks,
} from "@/app/actions/admin";
import type {
  BookRelationsStats,
  BookRelationsGraphData,
  RelationEntry,
  TopConnectedBook,
  UserWithRelations,
} from "@/app/actions/admin/book-relations";
import type { LucideIcon } from "lucide-react";

// ============================================================
// 카운트업 애니메이션 컴포넌트
// ============================================================

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>{decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}</span>;
}

// ============================================================
// 프리미엄 통계 카드
// ============================================================

interface PremiumStatCardProps {
  title: string;
  value: number;
  decimals?: number;
  description?: string;
  icon: LucideIcon;
  accentColor: string;     // e.g. "#6366f1"
  accentColorTw: string;   // e.g. "indigo"
  index: number;
  isLoading?: boolean;
}

function PremiumStatCard({
  title,
  value,
  decimals = 0,
  description,
  icon: Icon,
  accentColor,
  accentColorTw,
  index,
  isLoading,
}: PremiumStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300, delay: index * 0.08 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-xl border-0 shadow-lg ring-1 ring-black/[0.04] dark:ring-white/[0.04] bg-white dark:bg-[#0e0c1d] transition-shadow duration-300 group-hover:shadow-xl">
        {/* 상단 그라디언트 보더 */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, transparent)`,
          }}
        />

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5">
              <p className="text-[13px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                {title}
              </p>

              {/* 숫자 */}
              <div className="relative">
                {isLoading ? (
                  <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
                ) : (
                  <p className="text-3xl sm:text-[32px] font-bold tracking-tight tabular-nums text-foreground">
                    <AnimatedNumber value={value} decimals={decimals} />
                  </p>
                )}
              </div>

              {description && (
                <p className="text-[11px] text-muted-foreground/60">{description}</p>
              )}
            </div>

            {/* 아이콘 + 글로우 */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: accentColor }}
              />
              <div
                className={`relative p-2.5 rounded-xl bg-${accentColorTw}-50 dark:bg-${accentColorTw}-950/40 text-${accentColorTw}-600 dark:text-${accentColorTw}-400`}
                style={{
                  backgroundColor: `${accentColor}0D`,
                  color: accentColor,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 메인 대시보드
// ============================================================

interface BookRelationsDashboardProps {
  initialStats: BookRelationsStats;
  initialGraph: BookRelationsGraphData;
  initialRelations: { relations: RelationEntry[]; total: number };
  initialTopBooks: TopConnectedBook[];
  users: UserWithRelations[];
}

export function BookRelationsDashboard({
  initialStats,
  initialGraph,
  initialRelations,
  initialTopBooks,
  users,
}: BookRelationsDashboardProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState(initialStats);
  const [graph, setGraph] = useState(initialGraph);
  const [relations, setRelations] = useState(initialRelations);
  const [topBooks, setTopBooks] = useState(initialTopBooks);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeTab, setActiveTab] = useState("graph");

  const handleUserFilter = async (value: string) => {
    const userId = value === "all" ? undefined : value;
    setSelectedUserId(userId);
    setIsFiltering(true);

    try {
      const [newStats, newGraph, newRelations, newTopBooks] = await Promise.all([
        getBookRelationsStats(userId),
        getBookRelationsGraph(userId),
        getBookRelationsList(1, 20, userId),
        getTopConnectedBooks(10, userId),
      ]);
      setStats(newStats);
      setGraph(newGraph);
      setRelations(newRelations);
      setTopBooks(newTopBooks);
    } catch (error) {
      console.error("필터링 오류:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  const statCards = [
    { title: "총 연결", value: stats.totalRelations, icon: Link2, color: "#6366f1", tw: "indigo" },
    { title: "참여 책", value: stats.uniqueBooks, icon: BookOpen, color: "#3b82f6", tw: "blue" },
    { title: "참여 사용자", value: stats.usersWithRelations, icon: Users, color: "#10b981", tw: "emerald" },
    { title: "평균 연결", value: stats.avgConnectionsPerBook, icon: TrendingUp, color: "#f59e0b", tw: "amber", decimals: 1, description: "책당 평균" },
  ];

  return (
    <div className="relative space-y-8 pb-12">
      {/* 배경 패턴 */}
      <div className="fixed inset-0 -z-10 opacity-[0.015] dark:opacity-[0.025]" style={{
        backgroundImage: "radial-gradient(circle, currentColor 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }} />

      {/* ===== 헤더 ===== */}
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            관리자 대시보드
          </Link>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className="relative">
                <Network className="h-6 w-6 text-indigo-500" />
                <div className="absolute inset-0 bg-indigo-500/25 blur-lg" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                책 연결 관계
              </h1>
            </div>
            <p className="text-sm text-muted-foreground/70 ml-9">
              사용자들의 책 연결 관계를 시각화하고 관리합니다
            </p>
          </motion.div>

          {/* 사용자 필터 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-64"
          >
            <Select
              value={selectedUserId || "all"}
              onValueChange={handleUserFilter}
            >
              <SelectTrigger className="h-10 bg-white dark:bg-[#0e0c1d] border-border/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <SelectValue placeholder="사용자 필터" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 사용자</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email || "이름 없음"} ({user.relationCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </div>

      {/* ===== 통계 카드 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, i) => (
          <PremiumStatCard
            key={card.title}
            title={card.title}
            value={card.value}
            decimals={card.decimals}
            description={card.description}
            icon={card.icon}
            accentColor={card.color}
            accentColorTw={card.tw}
            index={i}
            isLoading={isFiltering}
          />
        ))}
      </div>

      {/* ===== 탭 영역 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="inline-flex h-10 bg-muted/50 dark:bg-[#0e0c1d] p-1 rounded-lg border border-border/30 shadow-sm">
            <TabsTrigger
              value="graph"
              className="rounded-md px-4 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1730] data-[state=active]:shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 opacity-60" />
              네트워크 그래프
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="rounded-md px-4 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1730] data-[state=active]:shadow-sm transition-all"
            >
              연결 목록
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-md px-4 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1730] data-[state=active]:shadow-sm transition-all"
            >
              통계
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <TabsContent value="graph" className="mt-0">
                <BookRelationsGraph data={graph} isLoading={isFiltering} />
              </TabsContent>

              <TabsContent value="table" className="mt-0">
                <BookRelationsTable
                  initialData={relations}
                  selectedUserId={selectedUserId}
                />
              </TabsContent>

              <TabsContent value="stats" className="mt-0">
                <BookRelationsStatsDetail
                  topBooks={topBooks}
                  graph={graph}
                  stats={stats}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
