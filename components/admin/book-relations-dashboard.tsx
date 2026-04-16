"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, BookOpen, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminStatsCard } from "./admin-stats-card";
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

  return (
    <div className="space-y-6 pb-10">
      {/* 헤더 */}
      <div className="space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              책 연결 관계 관리
            </h1>
            <p className="text-muted-foreground mt-1">
              사용자들의 책 연결 관계를 시각화하고 관리합니다
            </p>
          </div>

          {/* 사용자 필터 */}
          <div className="w-full sm:w-64">
            <Select
              value={selectedUserId || "all"}
              onValueChange={handleUserFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="사용자 필터" />
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
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${isFiltering ? "opacity-50" : ""}`}>
        <AdminStatsCard
          title="총 연결 수"
          value={stats.totalRelations}
          icon={Link2}
          colorClassName="border-l-indigo-500"
          iconColorClassName="text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/40"
        />
        <AdminStatsCard
          title="참여 책"
          value={stats.uniqueBooks}
          icon={BookOpen}
          colorClassName="border-l-blue-500"
          iconColorClassName="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40"
        />
        <AdminStatsCard
          title="참여 사용자"
          value={stats.usersWithRelations}
          icon={Users}
          colorClassName="border-l-green-500"
          iconColorClassName="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/40"
        />
        <AdminStatsCard
          title="평균 연결 수"
          value={stats.avgConnectionsPerBook}
          icon={TrendingUp}
          colorClassName="border-l-amber-500"
          iconColorClassName="text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40"
          description="책당 평균"
        />
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="graph" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="graph">네트워크 그래프</TabsTrigger>
          <TabsTrigger value="table">연결 목록</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-4">
          <BookRelationsGraph data={graph} isLoading={isFiltering} />
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <BookRelationsTable
            initialData={relations}
            selectedUserId={selectedUserId}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <BookRelationsStatsDetail
            topBooks={topBooks}
            graph={graph}
            stats={stats}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
