"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, Maximize2, BookOpen, Sparkles } from "lucide-react";
import type { BookRelationsGraphData, GraphNode } from "@/app/actions/admin/book-relations";

interface BookRelationsGraphProps {
  data: BookRelationsGraphData;
  isLoading?: boolean;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ============================================================
// Force-directed 물리 시뮬레이션
// ============================================================

function initializePositions(
  data: BookRelationsGraphData,
  width: number,
  height: number
): LayoutNode[] {
  if (data.nodes.length === 0) return [];

  const cx = width / 2;
  const cy = height / 2;
  const sorted = [...data.nodes].sort((a, b) => b.connectionCount - a.connectionCount);

  return sorted.map((node, i) => {
    if (i === 0) {
      return { ...node, x: cx, y: cy, vx: 0, vy: 0 };
    }
    // 골든 앵글로 초기 위치 분산 (겹침 최소화)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle;
    const radius = Math.sqrt(i) * 45;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });
}

function runForceSimulation(
  nodes: LayoutNode[],
  edges: BookRelationsGraphData["edges"],
  width: number,
  height: number,
  iterations: number = 120
): LayoutNode[] {
  const result = nodes.map((n) => ({ ...n }));
  const cx = width / 2;
  const cy = height / 2;

  // 인접 맵 생성
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations; // 점진적 냉각
    const repulsionStrength = 3000 * cooling;
    const attractionStrength = 0.008;
    const centerPull = 0.002 * cooling;

    // 반발력 (모든 노드 쌍)
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[i].x - result[j].x;
        const dy = result[i].y - result[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsionStrength / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        result[i].vx += fx;
        result[i].vy += fy;
        result[j].vx -= fx;
        result[j].vy -= fy;
      }
    }

    // 인력 (연결된 노드 쌍)
    const nodeMap = new Map(result.map((n) => [n.id, n]));
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const idealDist = 120;
      const force = (dist - idealDist) * attractionStrength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // 중심 인력
    for (const node of result) {
      node.vx += (cx - node.x) * centerPull;
      node.vy += (cy - node.y) * centerPull;
    }

    // 위치 업데이트 + 감쇠 + 경계
    const damping = 0.85;
    const padding = 40;
    for (const node of result) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return result;
}

// ============================================================
// 색상 팔레트 (Aurora 그라디언트용)
// ============================================================

const AURORA_COLORS: [string, string][] = [
  ["#6366f1", "#8b5cf6"], // indigo → violet
  ["#8b5cf6", "#a78bfa"], // violet → violet-light
  ["#6366f1", "#06b6d4"], // indigo → cyan
  ["#a78bfa", "#f472b6"], // violet → pink
  ["#06b6d4", "#34d399"], // cyan → emerald
  ["#f472b6", "#fb923c"], // pink → orange
  ["#34d399", "#a78bfa"], // emerald → violet
];

function getEdgeColors(index: number): [string, string] {
  return AURORA_COLORS[index % AURORA_COLORS.length];
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function BookRelationsGraph({ data, isLoading }: BookRelationsGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });

  // 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(450, Math.min(650, width * 0.7)),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Force-directed 레이아웃 계산
  const layoutNodes = useMemo(() => {
    const initial = initializePositions(data, dimensions.width, dimensions.height);
    if (initial.length <= 1) return initial;
    return runForceSimulation(initial, data.edges, dimensions.width, dimensions.height);
  }, [data, dimensions]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    for (const node of layoutNodes) {
      map.set(node.id, node);
    }
    return map;
  }, [layoutNodes]);

  // 선택된 노드와 연결된 노드 ID 집합
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(selectedNode);
    for (const edge of data.edges) {
      if (edge.source === selectedNode) connected.add(edge.target);
      if (edge.target === selectedNode) connected.add(edge.source);
    }
    return connected;
  }, [selectedNode, data.edges]);

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.3));
  const handleReset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === svgRef.current || (e.target as SVGElement).tagName === "rect") {
        setIsPanning(true);
        setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      }
    },
    [translate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setTranslate({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(3, s * delta)));
  }, []);

  // 노드 크기 계산 (연결 수에 비례)
  const maxConnections = Math.max(...(data.nodes.map((n) => n.connectionCount) || [1]), 1);
  const getNodeRadius = (count: number) => 16 + (count / maxConnections) * 20;

  // ============================================================
  // 로딩 상태
  // ============================================================
  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0c0a1a] dark:to-[#111027]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 text-indigo-400" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // 빈 상태
  // ============================================================
  if (data.nodes.length === 0) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0c0a1a] dark:to-[#111027]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <BookOpen className="h-14 w-14 mb-4 opacity-30" />
          </motion.div>
          <p className="text-sm font-medium">연결된 책이 없습니다</p>
          <p className="text-xs mt-1 opacity-60">사용자가 책을 연결하면 여기에 그래프가 표시됩니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
      {/* 헤더 */}
      <CardHeader className="pb-3 bg-white/80 dark:bg-[#0c0a1a]/80 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <CardTitle className="text-base">네트워크 그래프</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              {data.nodes.length}개 책
            </Badge>
            <Badge variant="outline" className="text-xs bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300">
              {data.edges.length}개 연결
            </Badge>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-[#0c0a1a] dark:via-[#0f0d24] dark:to-[#110e2a]"
          style={{ height: dimensions.height }}
        >
          {/* 배경 미세 그리드 패턴 */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          {/* 배경 글로우 앰비언트 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/8 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-violet-400/10 dark:bg-violet-500/8 rounded-full blur-[80px]" />
          </div>

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className={isPanning ? "cursor-grabbing" : "cursor-grab"}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* SVG 필터 정의 */}
            <defs>
              {/* 노드 글로우 */}
              <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* 엣지 글로우 */}
              <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Aurora 그라디언트들 */}
              {data.edges.map((edge, i) => {
                const [c1, c2] = getEdgeColors(i);
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;
                return (
                  <linearGradient
                    key={`grad-${i}`}
                    id={`edge-gradient-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                  </linearGradient>
                );
              })}

              {/* 노드 이미지 클리핑 */}
              {layoutNodes.map((node) => {
                const radius = getNodeRadius(node.connectionCount);
                return (
                  <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                    <circle r={radius - 2} />
                  </clipPath>
                );
              })}
            </defs>

            {/* 투명 배경 (패닝용) */}
            <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>

              {/* === 엣지 레이어 === */}
              {data.edges.map((edge, i) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const isHighlighted =
                  selectedNode &&
                  (edge.source === selectedNode || edge.target === selectedNode);
                const isDimmed = selectedNode && !isHighlighted;

                return (
                  <g key={`edge-group-${i}`}>
                    {/* 글로우 레이어 (하이라이트 시) */}
                    {isHighlighted && (
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={`url(#edge-gradient-${i})`}
                        strokeWidth={6}
                        opacity={0.3}
                        filter="url(#edge-glow)"
                        strokeLinecap="round"
                      />
                    )}
                    {/* 메인 엣지 */}
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={`url(#edge-gradient-${i})`}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      opacity={isDimmed ? 0.06 : isHighlighted ? 0.9 : 0.25}
                      strokeLinecap="round"
                      className="transition-opacity duration-300"
                    />
                    {/* 파티클 애니메이션 (하이라이트 시) */}
                    {isHighlighted && (
                      <circle r={2.5} fill="white" opacity={0.8}>
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M${source.x},${source.y} L${target.x},${target.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* === 노드 레이어 === */}
              {layoutNodes.map((node, nodeIndex) => {
                const radius = getNodeRadius(node.connectionCount);
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isDimmed = selectedNode !== null && !isConnected;
                const colorPair = AURORA_COLORS[nodeIndex % AURORA_COLORS.length];

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(selectedNode === node.id ? null : node.id);
                    }}
                    opacity={isDimmed ? 0.12 : 1}
                    style={{ transition: "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)" }}
                  >
                    {/* 외부 글로우 링 (호버/선택 시) */}
                    {(isHovered || isSelected) && (
                      <>
                        <circle
                          r={radius + 12}
                          fill="none"
                          stroke={colorPair[0]}
                          strokeWidth={1}
                          opacity={0.15}
                        />
                        <circle
                          r={radius + 6}
                          fill={colorPair[0]}
                          opacity={0.08}
                          filter="url(#glow-strong)"
                        >
                          <animate
                            attributeName="r"
                            values={`${radius + 5};${radius + 9};${radius + 5}`}
                            dur="3s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.08;0.15;0.08"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </>
                    )}

                    {/* Glassmorphism 배경 */}
                    <circle
                      r={radius}
                      fill={
                        isSelected
                          ? colorPair[0]
                          : "rgba(255,255,255,0.7)"
                      }
                      stroke={
                        isSelected || isHovered
                          ? colorPair[0]
                          : "rgba(148,163,184,0.3)"
                      }
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      filter={isHovered ? "url(#glow-soft)" : undefined}
                      className="dark:fill-[rgba(15,13,36,0.85)] dark:stroke-[rgba(148,163,184,0.15)]"
                      style={{
                        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                        ...(isSelected ? { fill: colorPair[0] } : {}),
                      }}
                    />

                    {/* 책 표지 이미지 */}
                    {node.coverImageUrl && (
                      <image
                        href={node.coverImageUrl}
                        x={-(radius - 2)}
                        y={-(radius - 2)}
                        width={(radius - 2) * 2}
                        height={(radius - 2) * 2}
                        clipPath={`url(#clip-${node.id})`}
                        preserveAspectRatio="xMidYMid slice"
                        opacity={isSelected ? 0.6 : 1}
                        style={{ transition: "opacity 300ms" }}
                      />
                    )}

                    {/* 이미지 없을 때 이니셜 */}
                    {!node.coverImageUrl && (
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={radius * 0.65}
                        fontWeight="600"
                        fill={isSelected ? "white" : colorPair[0]}
                        className="pointer-events-none select-none"
                        style={{ transition: "fill 300ms" }}
                      >
                        {node.title.charAt(0)}
                      </text>
                    )}

                    {/* 연결 수 배지 */}
                    <g transform={`translate(${radius * 0.65}, ${-radius * 0.65})`}>
                      <circle r={8} fill={colorPair[0]} />
                      <circle r={8} fill="white" opacity={0.15} />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={8}
                        fill="white"
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {node.connectionCount}
                      </text>
                    </g>

                    {/* 제목 레이블 */}
                    <text
                      y={radius + 16}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight="500"
                      fill="currentColor"
                      className="pointer-events-none select-none text-slate-700 dark:text-slate-300"
                      opacity={isDimmed ? 0.3 : 0.85}
                    >
                      {node.title.length > 12
                        ? node.title.slice(0, 12) + "…"
                        : node.title}
                    </text>
                    {/* 저자 서브레이블 */}
                    {node.author && (isHovered || isSelected) && (
                      <text
                        y={radius + 28}
                        textAnchor="middle"
                        fontSize={8}
                        fill="currentColor"
                        className="pointer-events-none select-none text-slate-400 dark:text-slate-500"
                        opacity={0.7}
                      >
                        {node.author.length > 14
                          ? node.author.slice(0, 14) + "…"
                          : node.author}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Glassmorphism 툴팁 */}
          <AnimatePresence>
            {hoveredNode && (() => {
              const node = nodeMap.get(hoveredNode);
              if (!node) return null;
              const colorPair = AURORA_COLORS[layoutNodes.findIndex((n) => n.id === hoveredNode) % AURORA_COLORS.length];
              return (
                <motion.div
                  key={hoveredNode}
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute z-10 px-3.5 py-2.5 rounded-xl shadow-xl border border-white/20 dark:border-white/10 text-xs max-w-[220px] pointer-events-none backdrop-blur-xl bg-white/80 dark:bg-[#1a1730]/90"
                  style={{
                    left: Math.min(node.x * scale + translate.x + 24, dimensions.width - 230),
                    top: Math.max(node.y * scale + translate.y - 40, 10),
                  }}
                >
                  {/* 상단 색상 액센트 바 */}
                  <div
                    className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colorPair[0]}, ${colorPair[1]})`,
                    }}
                  />
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {node.title}
                  </p>
                  {node.author && (
                    <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                      {node.author}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: colorPair[0] }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {node.connectionCount}개 연결
                      </span>
                    </div>
                    {node.userName && (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                        {node.userName}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* 하단 범례 */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span>드래그로 이동</span>
            <span className="opacity-40">|</span>
            <span>스크롤로 확대/축소</span>
            <span className="opacity-40">|</span>
            <span>클릭으로 연결 탐색</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
