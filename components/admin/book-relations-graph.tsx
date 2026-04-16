"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, Maximize2, BookOpen, Sparkles, Map as MapIcon } from "lucide-react";
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
    if (i === 0) return { ...node, x: cx, y: cy, vx: 0, vy: 0 };
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle;
    const radius = Math.sqrt(i) * 48;
    return { ...node, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 };
  });
}

function runForceSimulation(
  nodes: LayoutNode[],
  edges: BookRelationsGraphData["edges"],
  width: number,
  height: number,
  iterations: number = 150
): LayoutNode[] {
  const result = nodes.map((n) => ({ ...n }));
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;
    const repulsion = 3500 * cooling;
    const attraction = 0.007;
    const center = 0.003 * cooling;

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[i].x - result[j].x;
        const dy = result[i].y - result[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = repulsion / (dist * dist);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        result[i].vx += fx; result[i].vy += fy;
        result[j].vx -= fx; result[j].vy -= fy;
      }
    }

    const nm = new Map(result.map((n) => [n.id, n]));
    for (const edge of edges) {
      const s = nm.get(edge.source), t = nm.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = (dist - 130) * attraction;
      const fx = (dx / dist) * f, fy = (dy / dist) * f;
      s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy;
    }

    const pad = 50;
    for (const node of result) {
      node.vx += (cx - node.x) * center;
      node.vy += (cy - node.y) * center;
      node.vx *= 0.82; node.vy *= 0.82;
      node.x += node.vx; node.y += node.vy;
      node.x = Math.max(pad, Math.min(width - pad, node.x));
      node.y = Math.max(pad, Math.min(height - pad, node.y));
    }
  }
  return result;
}

// ============================================================
// 색상 팔레트
// ============================================================

const PALETTE: [string, string][] = [
  ["#6366f1", "#a78bfa"], // indigo → violet
  ["#8b5cf6", "#c084fc"], // violet → purple
  ["#6366f1", "#22d3ee"], // indigo → cyan
  ["#a78bfa", "#f472b6"], // violet → pink
  ["#06b6d4", "#34d399"], // cyan → emerald
  ["#f472b6", "#fb923c"], // pink → orange
  ["#34d399", "#818cf8"], // emerald → indigo
  ["#ec4899", "#8b5cf6"], // pink → violet
];

function getColors(i: number): [string, string] {
  return PALETTE[i % PALETTE.length];
}

// ============================================================
// 베지어 커브 경로 계산
// ============================================================

function computeCurvePath(
  sx: number, sy: number,
  tx: number, ty: number,
  curvature: number = 0.25
): string {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  // 수직 방향으로 오프셋
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 580 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  // 등장 애니메이션 종료
  useEffect(() => {
    if (data.nodes.length > 0) {
      const timer = setTimeout(() => setIsAnimating(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [data.nodes.length]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(480, Math.min(680, width * 0.72)),
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 레이아웃 계산
  const layoutNodes = useMemo(() => {
    const initial = initializePositions(data, dimensions.width, dimensions.height);
    if (initial.length <= 1) return initial;
    return runForceSimulation(initial, data.edges, dimensions.width, dimensions.height);
  }, [data, dimensions]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, LayoutNode>();
    for (const node of layoutNodes) map.set(node.id, node);
    return map;
  }, [layoutNodes]);

  // 연결된 노드 집합
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>([selectedNode]);
    for (const edge of data.edges) {
      if (edge.source === selectedNode) connected.add(edge.target);
      if (edge.target === selectedNode) connected.add(edge.source);
    }
    return connected;
  }, [selectedNode, data.edges]);

  // 연결 강도 맵 (공유 연결 수 기반)
  const edgeStrength = useMemo(() => {
    const adjacency = new Map<string, Set<string>>();
    for (const edge of data.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }
    const strengths = new Map<string, number>();
    for (const edge of data.edges) {
      const sNeighbors = adjacency.get(edge.source);
      const tNeighbors = adjacency.get(edge.target);
      const shared = sNeighbors && tNeighbors
        ? [...sNeighbors].filter((n) => tNeighbors.has(n)).length
        : 0;
      strengths.set(`${edge.source}:${edge.target}`, shared + 1);
    }
    return strengths;
  }, [data.edges]);

  const maxStrength = Math.max(...edgeStrength.values(), 1);

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.3));
  const handleReset = () => { setScale(1); setTranslate({ x: 0, y: 0 }); setSelectedNode(null); };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  }, [translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, Math.min(3, s * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const maxConn = Math.max(...(data.nodes.map((n) => n.connectionCount) || [1]), 1);
  const getNodeRadius = (count: number) => 18 + (count / maxConn) * 22;

  // ============================================================
  // 로딩 상태
  // ============================================================
  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-[#08060f] dark:to-[#0d0b1e]">
        <CardContent className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="h-10 w-10 text-indigo-400 relative" />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">그래프 로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // 빈 상태
  // ============================================================
  if (data.nodes.length === 0) {
    return (
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-[#08060f] dark:to-[#0d0b1e]">
        <CardContent className="flex flex-col items-center justify-center py-28 text-muted-foreground">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative"
          >
            <div className="absolute inset-0 -m-4 rounded-full bg-indigo-500/10 blur-2xl" />
            <BookOpen className="h-16 w-16 mb-5 opacity-25 relative" />
          </motion.div>
          <p className="text-sm font-medium">연결된 책이 없습니다</p>
          <p className="text-xs mt-1.5 opacity-50">사용자가 책을 연결하면 여기에 그래프가 표시됩니다</p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // 미니맵 데이터
  // ============================================================
  const minimapScale = 0.12;
  const minimapW = dimensions.width * minimapScale;
  const minimapH = dimensions.height * minimapScale;

  return (
    <Card className="overflow-hidden border-0 shadow-2xl ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
      {/* 헤더 */}
      <CardHeader className="pb-3 bg-white/90 dark:bg-[#0a0816]/90 backdrop-blur-md border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <div className="absolute inset-0 bg-indigo-500/30 blur-md" />
            </div>
            <CardTitle className="text-base tracking-tight">네트워크 그래프</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] h-6 bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-200/60 dark:border-indigo-700/40 text-indigo-600 dark:text-indigo-300 font-medium">
              {data.nodes.length}개 책
            </Badge>
            <Badge variant="outline" className="text-[11px] h-6 bg-violet-500/5 dark:bg-violet-500/10 border-violet-200/60 dark:border-violet-700/40 text-violet-600 dark:text-violet-300 font-medium">
              {data.edges.length}개 연결
            </Badge>
            <div className="w-px h-5 bg-border/50 mx-1.5" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowMinimap(!showMinimap)} title="미니맵">
              <MapIcon className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleReset}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden bg-[#fafbfe] dark:bg-[#08060f]"
          style={{ height: dimensions.height }}
        >
          {/* === 배경 레이어 === */}
          {/* 도트 그리드 */}
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{
            backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
            backgroundSize: "20px 20px",
          }} />
          {/* 앰비언트 글로우 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[20%] left-[25%] w-[300px] h-[300px] bg-indigo-400/[0.06] dark:bg-indigo-500/[0.05] rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[250px] h-[250px] bg-violet-400/[0.05] dark:bg-violet-500/[0.04] rounded-full blur-[100px]" />
            <div className="absolute top-[60%] left-[60%] w-[200px] h-[200px] bg-cyan-400/[0.04] dark:bg-cyan-500/[0.03] rounded-full blur-[80px]" />
          </div>

          {/* === SVG 캔버스 === */}
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
            <defs>
              {/* 글로우 필터 */}
              <filter id="glow-node" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="6" result="b1" />
                <feGaussianBlur stdDeviation="2" result="b2" />
                <feMerge><feMergeNode in="b1" /><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-edge" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-ripple" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="12" />
              </filter>

              {/* Aurora 그라디언트 */}
              {data.edges.map((edge, i) => {
                const [c1, c2] = getColors(i);
                const s = nodeMap.get(edge.source), t = nodeMap.get(edge.target);
                if (!s || !t) return null;
                return (
                  <linearGradient key={`g-${i}`} id={`eg-${i}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                  </linearGradient>
                );
              })}

              {/* 노드 클리핑 */}
              {layoutNodes.map((node) => (
                <clipPath key={`c-${node.id}`} id={`c-${node.id}`}>
                  <circle r={getNodeRadius(node.connectionCount) - 2.5} />
                </clipPath>
              ))}

              {/* 흐르는 대시 패턴 */}
              <style>{`
                @keyframes dash-flow { to { stroke-dashoffset: -20; } }
                @keyframes ripple-expand {
                  0% { r: 0; opacity: 0.4; }
                  100% { r: 60; opacity: 0; }
                }
              `}</style>
            </defs>

            <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

            <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>

              {/* === 엣지 레이어 === */}
              {data.edges.map((edge, i) => {
                const s = nodeMap.get(edge.source), t = nodeMap.get(edge.target);
                if (!s || !t) return null;

                const isHighlighted = selectedNode && (edge.source === selectedNode || edge.target === selectedNode);
                const isDimmed = selectedNode && !isHighlighted;
                const strength = edgeStrength.get(`${edge.source}:${edge.target}`) || 1;
                const normalizedStrength = strength / maxStrength;
                const curvature = 0.15 + (i % 3) * 0.08; // 엣지별 약간 다른 곡률
                const path = computeCurvePath(s.x, s.y, t.x, t.y, i % 2 === 0 ? curvature : -curvature);
                const baseWidth = 1 + normalizedStrength * 2;

                return (
                  <g key={`e-${i}`} style={{ transition: "opacity 400ms" }} opacity={isDimmed ? 0.04 : 1}>
                    {/* 글로우 레이어 (하이라이트) */}
                    {isHighlighted && (
                      <path
                        d={path}
                        stroke={`url(#eg-${i})`}
                        strokeWidth={baseWidth + 6}
                        opacity={0.25}
                        fill="none"
                        filter="url(#glow-edge)"
                        strokeLinecap="round"
                      />
                    )}
                    {/* 메인 곡선 */}
                    <path
                      d={path}
                      stroke={`url(#eg-${i})`}
                      strokeWidth={isHighlighted ? baseWidth + 1.5 : baseWidth}
                      opacity={isHighlighted ? 0.85 : 0.18 + normalizedStrength * 0.15}
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* 흐르는 대시 (기본 상태에서도) */}
                    {!isDimmed && (
                      <path
                        d={path}
                        stroke={`url(#eg-${i})`}
                        strokeWidth={isHighlighted ? 2 : 1}
                        opacity={isHighlighted ? 0.6 : 0.08}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="4 16"
                        style={{ animation: "dash-flow 2s linear infinite" }}
                      />
                    )}
                    {/* 파티클 (하이라이트) */}
                    {isHighlighted && (
                      <>
                        <circle r={3} fill="white" opacity={0.9} filter="url(#glow-edge)">
                          <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                        </circle>
                        <circle r={2} fill="white" opacity={0.5}>
                          <animateMotion dur="1.8s" repeatCount="indefinite" path={path} begin="0.9s" />
                        </circle>
                      </>
                    )}
                  </g>
                );
              })}

              {/* === 노드 레이어 === */}
              {layoutNodes.map((node, idx) => {
                const radius = getNodeRadius(node.connectionCount);
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isDimmed = selectedNode !== null && !isConnected;
                const colors = PALETTE[idx % PALETTE.length];

                // staggered 등장 딜레이
                const enterDelay = isAnimating ? idx * 0.04 : 0;
                const enterDuration = isAnimating ? 0.5 : 0;

                return (
                  <motion.g
                    key={node.id}
                    initial={isAnimating ? { opacity: 0, scale: 0 } : false}
                    animate={{ opacity: isDimmed ? 0.1 : 1, scale: 1 }}
                    transition={{
                      opacity: { duration: 0.4 },
                      scale: { type: "spring", damping: 20, stiffness: 300, delay: enterDelay, duration: enterDuration },
                    }}
                    style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
                  >
                    <g
                      transform={`translate(${node.x},${node.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(selectedNode === node.id ? null : node.id);
                      }}
                    >
                      {/* Ripple 확산 (선택 시) */}
                      {isSelected && (
                        <>
                          <circle r={0} fill="none" stroke={colors[0]} strokeWidth={1.5} opacity={0}>
                            <animate attributeName="r" values={`${radius};${radius + 50}`} dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.35;0" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <circle r={0} fill="none" stroke={colors[1]} strokeWidth={1} opacity={0}>
                            <animate attributeName="r" values={`${radius};${radius + 50}`} dur="2s" repeatCount="indefinite" begin="0.7s" />
                            <animate attributeName="opacity" values="0.25;0" dur="2s" repeatCount="indefinite" begin="0.7s" />
                          </circle>
                        </>
                      )}

                      {/* 외부 글로우 오라 (호버/선택) */}
                      {(isHovered || isSelected) && (
                        <>
                          <circle r={radius + 14} fill="none" stroke={colors[0]} strokeWidth={0.5} opacity={0.12} />
                          <circle r={radius + 7} fill={colors[0]} opacity={0.06} filter="url(#glow-node)">
                            <animate attributeName="r" values={`${radius + 6};${radius + 10};${radius + 6}`} dur="3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.06;0.12;0.06" dur="3s" repeatCount="indefinite" />
                          </circle>
                        </>
                      )}

                      {/* 노드 본체 - Liquid Glass */}
                      {/* 외부 링 */}
                      <circle
                        r={radius + 1}
                        fill="none"
                        stroke={isSelected ? colors[0] : isHovered ? colors[0] : "rgba(148,163,184,0.15)"}
                        strokeWidth={isSelected || isHovered ? 2 : 0.8}
                        opacity={isSelected ? 0.8 : isHovered ? 0.6 : 0.4}
                        style={{ transition: "all 300ms ease-out" }}
                      />
                      {/* 내부 fill */}
                      <circle
                        r={radius}
                        fill={isSelected ? colors[0] : "rgba(255,255,255,0.82)"}
                        className={isSelected ? "" : "dark:fill-[rgba(12,10,26,0.88)]"}
                        style={{ transition: "fill 300ms ease-out" }}
                      />
                      {/* 내부 빛 반사 (Liquid Glass 하이라이트) */}
                      {!isSelected && (
                        <ellipse
                          cx={-radius * 0.2}
                          cy={-radius * 0.25}
                          rx={radius * 0.55}
                          ry={radius * 0.35}
                          fill="white"
                          opacity={0.12}
                          className="dark:opacity-[0.06]"
                        />
                      )}

                      {/* 책 표지 이미지 */}
                      {node.coverImageUrl && (
                        <image
                          href={node.coverImageUrl}
                          x={-(radius - 2.5)}
                          y={-(radius - 2.5)}
                          width={(radius - 2.5) * 2}
                          height={(radius - 2.5) * 2}
                          clipPath={`url(#c-${node.id})`}
                          preserveAspectRatio="xMidYMid slice"
                          opacity={isSelected ? 0.5 : 1}
                          style={{ transition: "opacity 300ms" }}
                        />
                      )}

                      {/* 이니셜 */}
                      {!node.coverImageUrl && (
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={radius * 0.6}
                          fontWeight="700"
                          fill={isSelected ? "white" : colors[0]}
                          className="pointer-events-none select-none"
                          letterSpacing="-0.02em"
                        >
                          {node.title.charAt(0)}
                        </text>
                      )}

                      {/* 연결 수 배지 */}
                      <g transform={`translate(${radius * 0.62},${-radius * 0.62})`}>
                        <circle r={9} fill={colors[0]} />
                        <circle r={9} fill="white" opacity={0.12} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={8} fill="white" fontWeight="700" className="pointer-events-none select-none">
                          {node.connectionCount}
                        </text>
                      </g>

                      {/* 제목 */}
                      <text
                        y={radius + 17}
                        textAnchor="middle"
                        fontSize={10.5}
                        fontWeight="500"
                        fill="currentColor"
                        className="pointer-events-none select-none text-slate-600 dark:text-slate-300"
                        opacity={isDimmed ? 0.15 : 0.9}
                        letterSpacing="-0.01em"
                      >
                        {node.title.length > 12 ? node.title.slice(0, 12) + "…" : node.title}
                      </text>
                      {/* 저자 (호버/선택) */}
                      {node.author && (isHovered || isSelected) && (
                        <text
                          y={radius + 29}
                          textAnchor="middle"
                          fontSize={8.5}
                          fill="currentColor"
                          className="pointer-events-none select-none text-slate-400 dark:text-slate-500"
                          opacity={0.65}
                        >
                          {node.author.length > 14 ? node.author.slice(0, 14) + "…" : node.author}
                        </text>
                      )}
                    </g>
                  </motion.g>
                );
              })}
            </g>
          </svg>

          {/* === Glassmorphism 툴팁 === */}
          <AnimatePresence>
            {hoveredNode && (() => {
              const node = nodeMap.get(hoveredNode);
              if (!node) return null;
              const ci = layoutNodes.findIndex((n) => n.id === hoveredNode);
              const colors = PALETTE[ci >= 0 ? ci % PALETTE.length : 0];
              return (
                <motion.div
                  key={hoveredNode}
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  className="absolute z-10 px-4 py-3 rounded-2xl shadow-2xl text-xs max-w-[240px] pointer-events-none backdrop-blur-2xl bg-white/85 dark:bg-[#14112a]/92 border border-white/30 dark:border-white/[0.08] ring-1 ring-black/[0.03] dark:ring-white/[0.03]"
                  style={{
                    left: Math.min(node.x * scale + translate.x + 28, dimensions.width - 250),
                    top: Math.max(node.y * scale + translate.y - 45, 10),
                  }}
                >
                  {/* 그라디언트 액센트 바 */}
                  <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{
                    background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                  }} />
                  <p className="font-semibold text-[13px] text-slate-900 dark:text-slate-50 truncate mt-0.5 tracking-tight">
                    {node.title}
                  </p>
                  {node.author && (
                    <p className="text-slate-500 dark:text-slate-400 truncate text-[11px] mt-0.5">{node.author}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full ring-2 ring-white/50 dark:ring-white/10" style={{ background: colors[0] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{node.connectionCount}개 연결</span>
                    </div>
                    {node.userName && (
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] truncate">{node.userName}</span>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* === 미니맵 === */}
          <AnimatePresence>
            {showMinimap && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute bottom-3 right-3 rounded-xl overflow-hidden border border-white/30 dark:border-white/[0.06] shadow-lg backdrop-blur-lg bg-white/60 dark:bg-[#14112a]/70 p-1.5"
              >
                <svg width={minimapW + 8} height={minimapH + 8} viewBox={`-4 -4 ${dimensions.width + 8} ${dimensions.height + 8}`}>
                  {/* 미니맵 엣지 */}
                  {data.edges.map((edge, i) => {
                    const s = nodeMap.get(edge.source), t = nodeMap.get(edge.target);
                    if (!s || !t) return null;
                    return <line key={`me-${i}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="currentColor" strokeWidth={3} opacity={0.1} className="text-indigo-500" />;
                  })}
                  {/* 미니맵 노드 */}
                  {layoutNodes.map((node, i) => (
                    <circle key={`mn-${node.id}`} cx={node.x} cy={node.y} r={6 + (node.connectionCount / maxConn) * 6} fill={PALETTE[i % PALETTE.length][0]} opacity={0.6} />
                  ))}
                  {/* 뷰포트 인디케이터 */}
                  <rect
                    x={-translate.x / scale}
                    y={-translate.y / scale}
                    width={dimensions.width / scale}
                    height={dimensions.height / scale}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={6}
                    opacity={0.3}
                    rx={8}
                    className="text-indigo-500"
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === 하단 범례 === */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2.5 text-[10px] text-slate-400/70 dark:text-slate-500/60">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-current/20 text-[9px] font-mono">drag</kbd>
              이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-current/20 text-[9px] font-mono">scroll</kbd>
              확대
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-current/20 text-[9px] font-mono">click</kbd>
              탐색
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
