"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { ArrowLeft, Link2, BookOpen, Users, TrendingUp, Sparkles, Network, Activity } from "lucide-react";
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
// 카운트업 애니메이션
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
// 벤토 스탯 카드
// ============================================================

interface BentoStatCardProps {
  title: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  index: number;
  isLoading?: boolean;
}

function BentoStatCard({
  title,
  value,
  decimals = 0,
  suffix,
  icon: Icon,
  gradient,
  iconBg,
  index,
  isLoading,
}: BentoStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200, delay: index * 0.07 }}
      whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.25, ease: "easeOut" } }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111019] border border-black/[0.06] dark:border-white/[0.06] shadow-sm hover:shadow-xl transition-all duration-500">
        {/* 메쉬 그라디언트 배경 */}
        <div className={`absolute inset-0 opacity-[0.04] dark:opacity-[0.06] ${gradient}`} />
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.06] dark:opacity-[0.08] blur-2xl group-hover:opacity-[0.1] transition-opacity duration-500" style={{ background: `conic-gradient(from 180deg, var(--tw-gradient-stops))` }} />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Activity className="h-3 w-3 text-muted-foreground/40" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-20 rounded-lg bg-muted/60 animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-[28px] font-semibold tracking-tight tabular-nums text-foreground leading-none mb-1">
                <AnimatedNumber value={value} decimals={decimals} />
                {suffix && <span className="text-sm font-normal text-muted-foreground/50 ml-1">{suffix}</span>}
              </p>
              <p className="text-[13px] text-muted-foreground/60 font-medium">
                {title}
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 세그먼트 컨트롤 탭
// ============================================================

const TABS = [
  { key: "graph", label: "네트워크 그래프", icon: Sparkles },
  { key: "table", label: "연결 목록", icon: Link2 },
  { key: "stats", label: "통계", icon: TrendingUp },
] as const;

function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.04]">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeSegment"
                className="absolute inset-0 bg-white dark:bg-[#1a1730] rounded-lg shadow-sm border border-black/[0.04] dark:border-white/[0.06]"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
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
      void error;
    } finally {
      setIsFiltering(false);
    }
  };

  const statCards: BentoStatCardProps[] = [
    {
      title: "총 연결",
      value: stats.totalRelations,
      icon: Link2,
      gradient: "bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent",
      iconBg: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
      index: 0,
    },
    {
      title: "참여 책",
      value: stats.uniqueBooks,
      icon: BookOpen,
      gradient: "bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent",
      iconBg: "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
      index: 1,
    },
    {
      title: "참여 사용자",
      value: stats.usersWithRelations,
      icon: Users,
      gradient: "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      index: 2,
    },
    {
      title: "평균 연결/책",
      value: stats.avgConnectionsPerBook,
      decimals: 1,
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent",
      iconBg: "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
      index: 3,
    },
  ];

  return (
    <div className="relative space-y-8 pb-12">
      {/* 배경: 미세 노이즈 + 도트 */}
      <div className="fixed inset-0 -z-10 opacity-[0.02] dark:opacity-[0.03]" style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(99,102,241,0.15) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(139,92,246,0.1) 0%, transparent 50%),
          radial-gradient(circle, currentColor 0.5px, transparent 0.5px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 24px 24px",
      }} />

      {/* ===== 히어로 헤더 ===== */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground/60 hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            관리자 대시보드
          </Link>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/15">
                <Network className="h-5 w-5 text-indigo-600 dark:text-indigo-400 relative z-10" />
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground">
                  책 연결 관계
                </h1>
                <p className="text-[13px] text-muted-foreground/50 mt-0.5">
                  사용자들의 책 연결 네트워크를 시각화하고 분석합니다
                </p>
              </div>
            </div>
          </motion.div>

          {/* 사용자 필터 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full sm:w-60"
          >
            <Select
              value={selectedUserId || "all"}
              onValueChange={handleUserFilter}
            >
              <SelectTrigger className="h-10 bg-white dark:bg-[#111019] border-black/[0.08] dark:border-white/[0.08] shadow-sm rounded-xl text-[13px]">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
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

      {/* ===== 벤토 통계 카드 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <BentoStatCard
            key={card.title}
            {...card}
            isLoading={isFiltering}
          />
        ))}
      </div>

      {/* ===== 세그먼트 컨트롤 + 콘텐츠 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-5"
      >
        <SegmentedControl activeTab={activeTab} onChange={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeTab === "graph" && (
              <BookRelationsGraph data={graph} isLoading={isFiltering} />
            )}
            {activeTab === "table" && (
              <BookRelationsTable
                initialData={relations}
                selectedUserId={selectedUserId}
              />
            )}
            {activeTab === "stats" && (
              <BookRelationsStatsDetail
                topBooks={topBooks}
                graph={graph}
                stats={stats}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
