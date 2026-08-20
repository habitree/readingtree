"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, Maximize2, BookOpen, Sparkles, Map as MapIcon, Grip, Focus, Move } from "lucide-react";
import type { BookRelationsGraphData, GraphNode } from "@/app/actions/admin/book-relations";

interface BookRelationsGraphProps {
  data: BookRelationsGraphData;
  isLoading?: boolean;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
}

// ============================================================
// 초기 위치 (골든 앵글)
// ============================================================

function createInitialNodes(
  data: BookRelationsGraphData,
  width: number,
  height: number
): SimNode[] {
  if (data.nodes.length === 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const sorted = [...data.nodes].sort((a, b) => b.connectionCount - a.connectionCount);
  return sorted.map((node, i) => {
    if (i === 0) return { ...node, x: cx, y: cy, vx: 0, vy: 0, fx: null, fy: null };
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle;
    const radius = Math.sqrt(i) * 48;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0, vy: 0, fx: null, fy: null,
    };
  });
}

// ============================================================
// 색상 팔레트 (2026 트렌드: 더 선명한 그라디언트)
// ============================================================

const PALETTE: [string, string][] = [
  ["#6366f1", "#a78bfa"],
  ["#8b5cf6", "#c084fc"],
  ["#3b82f6", "#22d3ee"],
  ["#a78bfa", "#f472b6"],
  ["#06b6d4", "#34d399"],
  ["#f472b6", "#fb923c"],
  ["#10b981", "#818cf8"],
  ["#ec4899", "#8b5cf6"],
];

function getColors(i: number): [string, string] {
  return PALETTE[i % PALETTE.length];
}

// ============================================================
// 베지어 커브
// ============================================================

function curvePath(sx: number, sy: number, tx: number, ty: number, curvature: number): string {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  return `M${sx},${sy} Q${mx - dy * curvature},${my + dx * curvature} ${tx},${ty}`;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function BookRelationsGraph({ data, isLoading }: BookRelationsGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);

  const [, forceRender] = useState(0);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 580 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [simRunning, setSimRunning] = useState(true);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  const tickRef = useRef(0);
  const DRAG_THRESHOLD = 5; // px — 이 거리 이상 움직여야 드래그로 인식

  // 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(480, Math.min(700, width * 0.72)),
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 노드 초기화
  useEffect(() => {
    nodesRef.current = createInitialNodes(data, dimensions.width, dimensions.height);
    tickRef.current = 0;
    setSimRunning(true);
    forceRender((c) => c + 1);
  }, [data, dimensions]);

  // 라이브 Force 시뮬레이션
  useEffect(() => {
    if (!simRunning || data.nodes.length === 0) return;

    const edges = data.edges;
    const width = dimensions.width;
    const height = dimensions.height;
    const cx = width / 2;
    const cy = height / 2;
    const pad = 50;
    const maxTicks = 300;

    const tick = () => {
      const nodes = nodesRef.current;
      if (nodes.length === 0) return;

      tickRef.current++;
      const t = tickRef.current;

      if (t > maxTicks && !draggingNodeId) {
        setSimRunning(false);
        return;
      }

      const cooling = Math.max(0.01, 1 - t / maxTicks);
      const repulsion = 3500 * (draggingNodeId ? 1 : cooling);
      const attraction = 0.007;
      const center = 0.003 * (draggingNodeId ? 0.3 : cooling);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = repulsion / (dist * dist);
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          if (a.fx === null) { a.vx += fx; a.vy += fy; }
          if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
        }
      }

      const nodeById = new globalThis.Map(nodes.map((n) => [n.id, n]));
      for (const edge of edges) {
        const s = nodeById.get(edge.source);
        const t2 = nodeById.get(edge.target);
        if (!s || !t2) continue;
        const dx = t2.x - s.x;
        const dy = t2.y - s.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = (dist - 130) * attraction;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        if (s.fx === null) { s.vx += fx; s.vy += fy; }
        if (t2.fx === null) { t2.vx -= fx; t2.vy -= fy; }
      }

      const damping = draggingNodeId ? 0.6 : 0.82;
      for (const node of nodes) {
        if (node.fx !== null) {
          node.x = node.fx;
          node.y = node.fy!;
          node.vx = 0;
          node.vy = 0;
          continue;
        }
        node.vx += (cx - node.x) * center;
        node.vy += (cy - node.y) * center;
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(pad, Math.min(width - pad, node.x));
        node.y = Math.max(pad, Math.min(height - pad, node.y));
      }

      forceRender((c) => c + 1);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [simRunning, data.edges, data.nodes.length, dimensions, draggingNodeId]);

  const nodes = nodesRef.current;
  const nodeMap = useMemo(() => {
    const map = new globalThis.Map<string, SimNode>();
    for (const node of nodes) map.set(node.id, node);
    return map;
  }, [nodes]);

  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>([selectedNode]);
    for (const edge of data.edges) {
      if (edge.source === selectedNode) connected.add(edge.target);
      if (edge.target === selectedNode) connected.add(edge.source);
    }
    return connected;
  }, [selectedNode, data.edges]);

  const edgeStrength = useMemo(() => {
    const adj = new globalThis.Map<string, Set<string>>();
    for (const edge of data.edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, new Set());
      if (!adj.has(edge.target)) adj.set(edge.target, new Set());
      adj.get(edge.source)!.add(edge.target);
      adj.get(edge.target)!.add(edge.source);
    }
    const strengths = new globalThis.Map<string, number>();
    for (const edge of data.edges) {
      const sN = adj.get(edge.source);
      const tN = adj.get(edge.target);
      const shared = sN && tN ? [...sN].filter((n) => tN.has(n)).length : 0;
      strengths.set(`${edge.source}:${edge.target}`, shared + 1);
    }
    return strengths;
  }, [data.edges]);

  const maxStrength = Math.max(...edgeStrength.values(), 1);
  const maxConn = Math.max(...(data.nodes.map((n) => n.connectionCount) || [1]), 1);
  const getNodeRadius = (count: number) => 18 + (count / maxConn) * 22;

  // ============================================================
  // 이벤트 핸들러 (터치 + 마우스 통합)
  // ============================================================

  const handleZoomIn = () => setScale((s) => Math.min(s * 1.3, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.3, 0.3));
  const handleReset = () => { setScale(1); setTranslate({ x: 0, y: 0 }); setSelectedNode(null); };

  // 전체 보기: 모든 노드를 화면에 맞추기
  const handleFitView = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const pad = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of ns) {
      const r = getNodeRadius(n.connectionCount);
      minX = Math.min(minX, n.x - r);
      minY = Math.min(minY, n.y - r);
      maxX = Math.max(maxX, n.x + r);
      maxY = Math.max(maxY, n.y + r);
    }
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const newScale = Math.min(
      dimensions.width / contentW,
      dimensions.height / contentH,
      2
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setScale(newScale);
    setTranslate({
      x: dimensions.width / 2 - cx * newScale,
      y: dimensions.height / 2 - cy * newScale,
    });
    setSelectedNode(null);
  }, [dimensions]);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const svgX = (clientX - rect.left) * (dimensions.width / rect.width);
    const svgY = (clientY - rect.top) * (dimensions.height / rect.height);
    return {
      x: (svgX - translate.x) / scale,
      y: (svgY - translate.y) / scale,
    };
  }, [scale, translate, dimensions]);

  // --- 마우스 핸들러 ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  }, [translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      // 드래그 임계값 체크
      if (dragStartPos && !hasDragged) {
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        setHasDragged(true);
      }
      const svgPos = screenToSvg(e.clientX, e.clientY);
      const node = nodesRef.current.find((n) => n.id === draggingNodeId);
      if (node) {
        node.fx = svgPos.x;
        node.fy = svgPos.y;
        node.x = svgPos.x;
        node.y = svgPos.y;
      }
      return;
    }
    if (isPanning) {
      setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [draggingNodeId, isPanning, panStart, screenToSvg, dragStartPos, hasDragged]);

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      const node = nodesRef.current.find((n) => n.id === draggingNodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
        node.vx = 0;
        node.vy = 0;
      }
      setDraggingNodeId(null);
      setDragStartPos(null);
      // 드래그하지 않았으면 클릭 처리 (선택)
      if (!hasDragged) {
        setSelectedNode((prev) => prev === draggingNodeId ? null : draggingNodeId);
      }
      setHasDragged(false);
      tickRef.current = Math.max(0, tickRef.current - 80);
      setSimRunning(true);
    }
    setIsPanning(false);
  }, [draggingNodeId, hasDragged]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    const svgPos = screenToSvg(e.clientX, e.clientY);
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.fx = svgPos.x;
      node.fy = svgPos.y;
    }
    setDraggingNodeId(nodeId);
    setSimRunning(true);
  }, [screenToSvg]);

  // 커서 위치 기준 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (dimensions.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (dimensions.height / rect.height);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, scale * factor));
    // 마우스 커서 위치를 기준으로 줌
    setTranslate((prev) => ({
      x: mouseX - (mouseX - prev.x) * (newScale / scale),
      y: mouseY - (mouseY - prev.y) * (newScale / scale),
    }));
    setScale(newScale);
  }, [scale, dimensions]);

  // --- 터치 핸들러 (모바일 지원) ---
  const lastTouchRef = useRef<{ x: number; y: number; dist?: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      // 노드 위에서 시작했는지는 SVG onMouseDown에서 처리
      setIsPanning(true);
      setPanStart({ x: t.clientX - translate.x, y: t.clientY - translate.y });
    } else if (e.touches.length === 2) {
      // 핀치줌 시작
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
      setIsPanning(false);
    }
  }, [translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning && !draggingNodeId) {
      const t = e.touches[0];
      setTranslate({ x: t.clientX - panStart.x, y: t.clientY - panStart.y });
    } else if (e.touches.length === 2 && lastTouchRef.current?.dist) {
      // 핀치줌
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const factor = newDist / lastTouchRef.current.dist;
      const newScale = Math.max(0.3, Math.min(3, scale * factor));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const svgMidX = (midX - rect.left) * (dimensions.width / rect.width);
        const svgMidY = (midY - rect.top) * (dimensions.height / rect.height);
        setTranslate((prev) => ({
          x: svgMidX - (svgMidX - prev.x) * (newScale / scale),
          y: svgMidY - (svgMidY - prev.y) * (newScale / scale),
        }));
      }
      setScale(newScale);
      lastTouchRef.current = { x: midX, y: midY, dist: newDist };
    }
  }, [isPanning, panStart, scale, dimensions, draggingNodeId]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastTouchRef.current = null;
  }, []);

  // --- 미니맵 클릭 이동 ---
  const handleMinimapClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width * dimensions.width;
    const clickY = (e.clientY - rect.top) / rect.height * dimensions.height;
    setTranslate({
      x: dimensions.width / 2 - clickX * scale,
      y: dimensions.height / 2 - clickY * scale,
    });
  }, [dimensions, scale]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111019]">
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="h-8 w-8 text-indigo-400 relative" />
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground/50 animate-pulse">그래프 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (data.nodes.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111019]">
        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} className="relative">
            <div className="absolute inset-0 -m-4 rounded-full bg-indigo-500/10 blur-2xl" />
            <BookOpen className="h-14 w-14 mb-5 opacity-20 relative" />
          </motion.div>
          <p className="text-sm font-medium">연결된 책이 없습니다</p>
          <p className="text-xs mt-1.5 opacity-40">사용자가 책을 연결하면 여기에 그래프가 표시됩니다</p>
        </div>
      </div>
    );
  }

  const minimapScale = 0.12;
  const minimapW = dimensions.width * minimapScale;
  const minimapH = dimensions.height * minimapScale;
  const cursor = draggingNodeId ? "cursor-grabbing" : isPanning ? "cursor-grabbing" : "cursor-grab";

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#111019] shadow-sm">
      {/* 헤더 바 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#111019]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold tracking-tight">네트워크 그래프</span>
          {simRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium">
            {data.nodes.length}개 책
          </Badge>
          <Badge variant="outline" className="text-[11px] h-6 rounded-lg bg-violet-50 dark:bg-violet-500/10 border-violet-200/50 dark:border-violet-500/20 text-violet-600 dark:text-violet-300 font-medium">
            {data.edges.length}개 연결
          </Badge>
          <div className="w-px h-4 bg-border/40 mx-1" />
          {/* 플로팅 컨트롤 */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50" onClick={() => setShowMinimap(!showMinimap)} title="미니맵">
              <MapIcon className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50" onClick={handleFitView} title="전체 보기">
              <Focus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50" onClick={handleReset} title="초기화">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 캔버스 */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-[#fafbfd] dark:bg-[#0c0a17]"
        style={{ height: dimensions.height }}
      >
        {/* 배경 그리드 + 앰비언트 글로우 */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[20%] w-[350px] h-[350px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] rounded-full blur-[140px]" />
          <div className="absolute bottom-[15%] right-[15%] w-[300px] h-[300px] bg-violet-500/[0.03] dark:bg-violet-500/[0.05] rounded-full blur-[120px]" />
          <div className="absolute top-[55%] left-[55%] w-[220px] h-[220px] bg-cyan-500/[0.025] dark:bg-cyan-500/[0.04] rounded-full blur-[100px]" />
        </div>

        {/* SVG */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className={cursor}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <filter id="glow-node" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="b1" />
              <feGaussianBlur stdDeviation="2" result="b2" />
              <feMerge><feMergeNode in="b1" /><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-edge" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
            </filter>

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

            {nodes.map((node) => (
              <clipPath key={`c-${node.id}`} id={`c-${node.id}`}>
                <circle r={getNodeRadius(node.connectionCount) - 2.5} />
              </clipPath>
            ))}

            <style>{`
              @keyframes dash-flow { to { stroke-dashoffset: -20; } }
            `}</style>
          </defs>

          <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

          <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
            {/* 엣지 */}
            {data.edges.map((edge, i) => {
              const s = nodeMap.get(edge.source), t = nodeMap.get(edge.target);
              if (!s || !t) return null;
              const isHighlighted = selectedNode && (edge.source === selectedNode || edge.target === selectedNode);
              const isDimmed = selectedNode && !isHighlighted;
              const strength = edgeStrength.get(`${edge.source}:${edge.target}`) || 1;
              const ns = strength / maxStrength;
              const curv = 0.15 + (i % 3) * 0.08;
              const path = curvePath(s.x, s.y, t.x, t.y, i % 2 === 0 ? curv : -curv);
              const bw = 1.2 + ns * 2;

              return (
                <g key={`e-${i}`} opacity={isDimmed ? 0.03 : 1} style={{ transition: "opacity 400ms ease" }}>
                  {isHighlighted && (
                    <path d={path} stroke={`url(#eg-${i})`} strokeWidth={bw + 8} opacity={0.15} fill="none" filter="url(#glow-edge)" strokeLinecap="round" />
                  )}
                  <path
                    d={path}
                    stroke={`url(#eg-${i})`}
                    strokeWidth={isHighlighted ? bw + 1.5 : bw}
                    opacity={isHighlighted ? 0.8 : 0.12 + ns * 0.18}
                    fill="none"
                    strokeLinecap="round"
                  />
                  {!isDimmed && (
                    <path d={path} stroke={`url(#eg-${i})`} strokeWidth={isHighlighted ? 2 : 1} opacity={isHighlighted ? 0.5 : 0.06} fill="none" strokeLinecap="round" strokeDasharray="4 16" style={{ animation: "dash-flow 2s linear infinite" }} />
                  )}
                  {isHighlighted && (
                    <>
                      <circle r={3.5} fill="white" opacity={0.85} filter="url(#glow-edge)">
                        <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                      </circle>
                      <circle r={2} fill="white" opacity={0.4}>
                        <animateMotion dur="1.8s" repeatCount="indefinite" path={path} begin="0.9s" />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {/* 노드 */}
            {nodes.map((node, idx) => {
              const radius = getNodeRadius(node.connectionCount);
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const isDimmed = selectedNode !== null && !isConnected;
              const isDragging = draggingNodeId === node.id;
              const colors = PALETTE[idx % PALETTE.length];

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  className={isDragging ? "cursor-grabbing" : "cursor-grab"}
                  opacity={isDimmed ? 0.08 : 1}
                  style={{ transition: isDragging ? "none" : "opacity 400ms ease" }}
                  onMouseEnter={() => { if (!draggingNodeId) setHoveredNode(node.id); }}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* 드래그 글로우 */}
                  {isDragging && (
                    <circle r={radius + 24} fill={colors[0]} opacity={0.06} filter="url(#glow-node)" />
                  )}

                  {/* Ripple */}
                  {isSelected && !isDragging && (
                    <>
                      <circle r={0} fill="none" stroke={colors[0]} strokeWidth={1.2} opacity={0}>
                        <animate attributeName="r" values={`${radius};${radius + 55}`} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                      <circle r={0} fill="none" stroke={colors[1]} strokeWidth={0.8} opacity={0}>
                        <animate attributeName="r" values={`${radius};${radius + 55}`} dur="2.2s" repeatCount="indefinite" begin="0.8s" />
                        <animate attributeName="opacity" values="0.2;0" dur="2.2s" repeatCount="indefinite" begin="0.8s" />
                      </circle>
                    </>
                  )}

                  {/* 호버/선택 글로우 */}
                  {(isHovered || isSelected || isDragging) && (
                    <>
                      <circle r={radius + 16} fill="none" stroke={colors[0]} strokeWidth={0.4} opacity={0.1} />
                      <circle r={radius + 8} fill={colors[0]} opacity={0.05} filter="url(#glow-node)">
                        <animate attributeName="r" values={`${radius + 7};${radius + 12};${radius + 7}`} dur="3.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.05;0.1;0.05" dur="3.5s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* 노드 본체 */}
                  <circle
                    r={radius + 1.5}
                    fill="none"
                    stroke={isSelected || isHovered || isDragging ? colors[0] : "rgba(148,163,184,0.1)"}
                    strokeWidth={(isSelected || isHovered || isDragging) ? 2 : 0.6}
                    opacity={isSelected ? 0.7 : isHovered || isDragging ? 0.5 : 0.3}
                  />
                  <circle
                    r={radius}
                    fill={isSelected ? colors[0] : "rgba(255,255,255,0.92)"}
                    className={isSelected ? "" : "dark:fill-[rgba(16,14,28,0.92)]"}
                    filter={isHovered || isSelected ? "url(#soft-shadow)" : undefined}
                  />

                  {/* 이미지 / 이니셜 */}
                  {node.coverImageUrl ? (
                    <image
                      href={node.coverImageUrl}
                      x={-(radius - 2.5)} y={-(radius - 2.5)}
                      width={(radius - 2.5) * 2} height={(radius - 2.5) * 2}
                      clipPath={`url(#c-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      opacity={isSelected ? 0.45 : 1}
                    />
                  ) : (
                    <text textAnchor="middle" dominantBaseline="central" fontSize={radius * 0.55} fontWeight="700" fill={isSelected ? "white" : colors[0]} className="pointer-events-none select-none" letterSpacing="-0.03em">
                      {node.title.charAt(0)}
                    </text>
                  )}

                  {/* 카운트 배지 */}
                  <g transform={`translate(${radius * 0.65},${-radius * 0.65})`}>
                    <circle r={9.5} fill={colors[0]} />
                    <circle r={9.5} fill="white" opacity={0.15} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={8} fill="white" fontWeight="700" className="pointer-events-none select-none">{node.connectionCount}</text>
                  </g>

                  {/* 레이블 */}
                  <text y={radius + 18} textAnchor="middle" fontSize={10.5} fontWeight="600" fill="currentColor" className="pointer-events-none select-none text-slate-700 dark:text-slate-200" opacity={isDimmed ? 0.12 : 0.85} letterSpacing="-0.02em">
                    {node.title.length > 12 ? node.title.slice(0, 12) + "…" : node.title}
                  </text>
                  {node.author && (isHovered || isSelected) && (
                    <text y={radius + 30} textAnchor="middle" fontSize={8.5} fill="currentColor" className="pointer-events-none select-none text-slate-400 dark:text-slate-500" opacity={0.6}>
                      {node.author.length > 14 ? node.author.slice(0, 14) + "…" : node.author}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 툴팁 */}
        <AnimatePresence>
          {hoveredNode && !draggingNodeId && (() => {
            const node = nodeMap.get(hoveredNode);
            if (!node) return null;
            const ci = nodes.findIndex((n) => n.id === hoveredNode);
            const colors = PALETTE[ci >= 0 ? ci % PALETTE.length : 0];
            return (
              <motion.div
                key={hoveredNode}
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="absolute z-10 px-4 py-3 rounded-2xl shadow-2xl text-xs max-w-[240px] pointer-events-none backdrop-blur-2xl bg-white/90 dark:bg-[#18152e]/92 border border-black/[0.06] dark:border-white/[0.06]"
                style={{
                  left: Math.min(node.x * scale + translate.x + 28, dimensions.width - 250),
                  top: Math.max(node.y * scale + translate.y - 45, 10),
                }}
              >
                <div className="absolute top-0 left-3 right-3 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} />
                <p className="font-semibold text-[13px] text-foreground truncate mt-0.5 tracking-tight">{node.title}</p>
                {node.author && <p className="text-muted-foreground/60 truncate text-[11px] mt-0.5">{node.author}</p>}
                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors[0] }} />
                    <span className="font-semibold text-foreground/80">{node.connectionCount}개 연결</span>
                  </div>
                  {node.userName && <span className="text-muted-foreground/40 text-[10px] truncate">{node.userName}</span>}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* 미니맵 */}
        <AnimatePresence>
          {showMinimap && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute bottom-3 right-3 rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] shadow-lg backdrop-blur-xl bg-white/70 dark:bg-[#18152e]/70 p-1.5"
            >
              <svg width={minimapW + 8} height={minimapH + 8} viewBox={`-4 -4 ${dimensions.width + 8} ${dimensions.height + 8}`} className="cursor-pointer" onClick={handleMinimapClick}>
                {data.edges.map((edge, i) => {
                  const s = nodeMap.get(edge.source), t = nodeMap.get(edge.target);
                  if (!s || !t) return null;
                  return <line key={`me-${i}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="currentColor" strokeWidth={3} opacity={0.08} className="text-indigo-500" />;
                })}
                {nodes.map((node, i) => (
                  <circle key={`mn-${node.id}`} cx={node.x} cy={node.y} r={6 + (node.connectionCount / maxConn) * 6} fill={PALETTE[i % PALETTE.length][0]} opacity={0.5} />
                ))}
                <rect
                  x={-translate.x / scale} y={-translate.y / scale}
                  width={dimensions.width / scale} height={dimensions.height / scale}
                  fill="none" stroke="currentColor" strokeWidth={6} opacity={0.25} rx={8} className="text-indigo-500"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 범례 */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-muted-foreground/50">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-[#18152e]/70 backdrop-blur-lg border border-black/[0.04] dark:border-white/[0.04]">
            <Move className="h-3 w-3" />
            <span>노드 드래그 이동</span>
            <span className="opacity-30">|</span>
            <span>배경 드래그 패닝</span>
            <span className="opacity-30">|</span>
            <span>스크롤/핀치 확대</span>
          </div>
        </div>
      </div>
    </div>
  );
}
