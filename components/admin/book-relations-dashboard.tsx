"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  BookOpen,
  Users,
  TrendingUp,
  Network,
  List,
  BarChart3,
  Search,
  Plus,
  ChevronRight,
} from "lucide-react";
import { BookRelationsGraph } from "./book-relations-graph";
import { BookRelationsTable } from "./book-relations-table";
import { BookRelationsStatsDetail } from "./book-relations-stats-detail";
import { BookRelationsInspector } from "./book-relations-inspector";
import { CreateRelationModal } from "./create-relation-modal";
import { Pill, RELATIONS_TOKENS_CSS } from "./_relations-ui";
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
  GraphNode,
} from "@/app/actions/admin/book-relations";

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

type TabKey = "graph" | "table" | "stats";

const TABS: { key: TabKey; label: string; Icon: typeof Network }[] = [
  { key: "graph", label: "관계 그래프", Icon: Network },
  { key: "table", label: "연결 목록", Icon: List },
  { key: "stats", label: "통계", Icon: BarChart3 },
];

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
  const [activeTab, setActiveTab] = useState<TabKey>("graph");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialSourceId, setCreateInitialSourceId] = useState<string | undefined>();
  const tableSearchRef = useRef<HTMLInputElement>(null);

  const refetchAll = useCallback(
    async (userId: string | undefined) => {
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
      } finally {
        setIsFiltering(false);
      }
    },
    []
  );

  const handleUserFilter = (value: string) => {
    const userId = value === "all" ? undefined : value;
    setSelectedUserId(userId);
    setSelectedNodeId(null);
    refetchAll(userId);
  };

  // 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveTab("table");
        setTimeout(() => tableSearchRef.current?.focus(), 80);
      }
      if (e.key === "Escape") {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedNode: GraphNode | null = useMemo(() => {
    if (!selectedNodeId) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, graph]);

  const splitOpen = activeTab === "graph" && selectedNode !== null;

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleAddRelation = (sourceId: string) => {
    setCreateInitialSourceId(sourceId);
    setCreateOpen(true);
  };

  const handleCreated = () => {
    refetchAll(selectedUserId);
  };

  const handleDeleted = () => {
    setSelectedNodeId(null);
    refetchAll(selectedUserId);
  };

  // 모달의 사용자 옵션은 selectedUserId가 있으면 그쪽으로 우선
  const modalInitialUserId = useMemo(() => {
    if (selectedUserId) return selectedUserId;
    if (createInitialSourceId) {
      const node = graph.nodes.find((n) => n.id === createInitialSourceId);
      return node?.userId;
    }
    return users[0]?.id;
  }, [selectedUserId, createInitialSourceId, graph, users]);

  return (
    <div className="rt-relations">
      <style>{RELATIONS_TOKENS_CSS}</style>

      {/* 톱바 */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 28px",
          borderBottom: "0.5px solid var(--rt-border)",
          background: "color-mix(in oklab, var(--rt-bg) 70%, transparent)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "var(--rt-text-secondary)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          <Link
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "var(--rt-text-tertiary)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={12} /> Admin
          </Link>
          <ChevronRight size={12} style={{ color: "var(--rt-text-tertiary)" }} />
          <span>책 연결 관계</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab("table");
              setTimeout(() => tableSearchRef.current?.focus(), 80);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px 6px 10px",
              background: "var(--rt-bg-card)",
              border: "0.5px solid var(--rt-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--rt-text-tertiary)",
              cursor: "text",
              minWidth: 220,
            }}
          >
            <Search size={13} />
            <span style={{ flex: 1, textAlign: "left" }}>검색…</span>
            <kbd className="rt-kbd">⌘K</kbd>
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px 6px 10px",
              background: "var(--rt-bg-card)",
              border: "0.5px solid var(--rt-border)",
              borderRadius: 8,
              color: "var(--rt-text-secondary)",
            }}
          >
            <Users size={13} />
            <select
              value={selectedUserId ?? "all"}
              onChange={(e) => handleUserFilter(e.target.value)}
              disabled={isFiltering}
              style={{
                appearance: "none",
                border: 0,
                background: "transparent",
                fontSize: 12,
                color: "var(--rt-text-primary)",
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">전체 사용자</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email ?? "이름 없음"} ({u.relationCount})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateInitialSourceId(undefined);
              setCreateOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 8,
              border: 0,
              background: "var(--rt-text-primary)",
              color: "var(--rt-bg-card)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "var(--rt-shadow-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={13} /> 새 연결
          </button>
        </div>
      </header>

      {/* 페이지 헤더 */}
      <div style={{ padding: "28px 28px 18px" }}>
        <h1
          className="rt-serif"
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            color: "var(--rt-text-primary)",
          }}
        >
          책 연결 관계
        </h1>
        <p style={{ fontSize: 13, color: "var(--rt-text-tertiary)", margin: "6px 0 0" }}>
          사용자가 만든 책 사이의 연결을 한눈에 보고, 관계 그래프로 탐색합니다.
        </p>
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          padding: "0 28px 20px",
        }}
      >
        <KpiCard
          label="총 연결"
          value={stats.totalRelations}
          tone="accent"
          Icon={Link2}
          isLoading={isFiltering}
        />
        <KpiCard
          label="참여 책"
          value={stats.uniqueBooks}
          tone="chart1"
          Icon={BookOpen}
          isLoading={isFiltering}
        />
        <KpiCard
          label="참여 사용자"
          value={stats.usersWithRelations}
          tone="chart2"
          Icon={Users}
          isLoading={isFiltering}
        />
        <KpiCard
          label="평균 연결/책"
          value={stats.avgConnectionsPerBook}
          decimals={1}
          tone="chart3"
          Icon={TrendingUp}
          isLoading={isFiltering}
        />
      </div>

      {/* 탭 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 28px",
          borderBottom: "0.5px solid var(--rt-border)",
        }}
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          const I = t.Icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                background: "transparent",
                border: 0,
                fontSize: 13,
                color: isActive ? "var(--rt-text-primary)" : "var(--rt-text-tertiary)",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                position: "relative",
                transition: "color 120ms",
              }}
            >
              <I size={14} /> {t.label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    bottom: -0.5,
                    height: 2,
                    background: "var(--rt-text-primary)",
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              )}
            </button>
          );
        })}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 11.5,
            color: "var(--rt-text-tertiary)",
          }}
        >
          <Pill size="xs" tone="success">
            {isFiltering ? "갱신 중" : "실시간"}
          </Pill>
        </div>
      </div>

      {/* 콘텐츠 + 인스펙터 분할 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: splitOpen ? "1fr 340px" : "1fr 0",
          gap: splitOpen ? 18 : 0,
          padding: "18px 28px 28px",
          transition: "grid-template-columns 280ms ease",
        }}
      >
        <div style={{ minWidth: 0 }}>
          {activeTab === "graph" && (
            <BookRelationsGraph
              nodes={graph.nodes}
              edges={graph.edges}
              selectedId={selectedNodeId}
              hoveredId={hoveredNodeId}
              onSelect={handleSelectNode}
              onHover={setHoveredNodeId}
              isLoading={isFiltering}
            />
          )}
          {activeTab === "table" && (
            <BookRelationsTable
              initialData={relations}
              selectedUserId={selectedUserId}
              searchInputRef={tableSearchRef}
              onRefetch={() => refetchAll(selectedUserId)}
            />
          )}
          {activeTab === "stats" && (
            <BookRelationsStatsDetail topBooks={topBooks} graph={graph} stats={stats} />
          )}
        </div>

        {/* 인스펙터 (graph 탭 전용) */}
        <aside
          style={{
            background: "var(--rt-bg-card)",
            border: "0.5px solid var(--rt-border)",
            borderRadius: 12,
            overflow: "hidden",
            height: "fit-content",
            position: "sticky",
            top: 70,
            opacity: splitOpen ? 1 : 0,
            pointerEvents: splitOpen ? "auto" : "none",
            transition: "opacity 200ms",
          }}
        >
          {activeTab === "graph" && (
            <BookRelationsInspector
              node={selectedNode}
              nodes={graph.nodes}
              edges={graph.edges}
              onClose={() => setSelectedNodeId(null)}
              onSelect={(id) => setSelectedNodeId(id)}
              onAddRelation={handleAddRelation}
              onDeleted={handleDeleted}
            />
          )}
        </aside>
      </div>

      {/* 새 연결 모달 */}
      <CreateRelationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        users={users.length > 0 ? users : []}
        initialUserId={modalInitialUserId}
        initialSourceUserBookId={createInitialSourceId}
      />
    </div>
  );
}

// ============================================================
// KPI 카드
// ============================================================

type KpiTone = "accent" | "chart1" | "chart2" | "chart3";

interface KpiCardProps {
  label: string;
  value: number;
  decimals?: number;
  tone: KpiTone;
  Icon: typeof Link2;
  isLoading?: boolean;
}

// 프로젝트 차트 변수(--chart-1..5)에 매핑 — 라이트/다크/forest 테마 자동 대응
const TONE_STYLES: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: "var(--rt-accent-bg)", fg: "var(--rt-accent)" },
  chart1: { bg: "hsl(var(--chart-1) / 0.14)", fg: "hsl(var(--chart-1))" },
  chart2: { bg: "hsl(var(--chart-2) / 0.14)", fg: "hsl(var(--chart-2))" },
  chart3: { bg: "hsl(var(--chart-3) / 0.14)", fg: "hsl(var(--chart-3))" },
};

function KpiCard({ label, value, decimals = 0, tone, Icon, isLoading }: KpiCardProps) {
  const { bg, fg } = TONE_STYLES[tone];
  const display = decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
  return (
    <div
      style={{
        background: "var(--rt-bg-card)",
        border: "0.5px solid var(--rt-border)",
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "var(--rt-shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: bg,
            color: fg,
          }}
        >
          <Icon size={14} />
        </div>
        <span
          style={{
            fontSize: 11.5,
            color: "var(--rt-text-tertiary)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      {isLoading ? (
        <div
          style={{
            height: 28,
            width: 80,
            borderRadius: 6,
            background: "var(--rt-bg-subtle)",
          }}
        />
      ) : (
        <div
          className="rt-serif"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: "var(--rt-text-primary)",
          }}
        >
          {display}
        </div>
      )}
    </div>
  );
}
