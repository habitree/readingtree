"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, BookOpen } from "lucide-react";
import type { GraphNode, GraphEdge } from "@/app/actions/admin/book-relations";

// ============================================================
// 타입
// ============================================================

interface BookRelationsGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
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
// 초기 위치 (골든 앵글) — 연결 많은 책이 중심
// ============================================================

function createInitialNodes(nodes: GraphNode[], width: number, height: number): SimNode[] {
  if (nodes.length === 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const sorted = [...nodes].sort((a, b) => b.connectionCount - a.connectionCount);
  return sorted.map((node, i) => {
    if (i === 0) {
      return { ...node, x: cx, y: cy, vx: 0, vy: 0, fx: null, fy: null };
    }
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle;
    const radius = Math.sqrt(i) * 56;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
    };
  });
}

// ============================================================
// 베지어 커브
// ============================================================

function curvePath(sx: number, sy: number, tx: number, ty: number, c: number): string {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  return `M${sx},${sy} Q${mx - dy * c},${my + dx * c} ${tx},${ty}`;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

const NODE_W = 70;
const NODE_H = 98;
const DRAG_THRESHOLD = 5;

export function BookRelationsGraph({
  nodes: nodesData,
  edges,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  isLoading,
}: BookRelationsGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);
  const tickRef = useRef<number>(0);
  const [, force] = useState(0);
  const [dim, setDim] = useState({ w: 900, h: 580 });
  const [running, setRunning] = useState(true);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);

  // 컨테이너 사이즈 추적
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width } = e.contentRect;
        setDim({ w: Math.max(400, width), h: Math.max(440, Math.min(680, width * 0.6)) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 노드 초기화
  useEffect(() => {
    nodesRef.current = createInitialNodes(nodesData, dim.w, dim.h);
    tickRef.current = 0;
    setRunning(true);
    force((c) => c + 1);
  }, [nodesData, dim.w, dim.h]);

  // Force 시뮬레이션
  useEffect(() => {
    if (!running || nodesData.length === 0) return;
    const cx = dim.w / 2;
    const cy = dim.h / 2;
    const pad = 50;
    const maxTicks = 250;

    const tick = () => {
      const ns = nodesRef.current;
      tickRef.current++;
      const t = tickRef.current;
      if (t > maxTicks && !draggingId) {
        setRunning(false);
        return;
      }
      const cooling = Math.max(0.02, 1 - t / maxTicks);
      const repulsion = 5500 * (draggingId ? 1 : cooling);
      const attraction = 0.008;
      const center = 0.003 * (draggingId ? 0.3 : cooling);

      // 반발
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i];
          const b = ns[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = repulsion / (d * d);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          if (a.fx === null) {
            a.vx += fx;
            a.vy += fy;
          }
          if (b.fx === null) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      }
      // 인력
      const map = new Map(ns.map((n) => [n.id, n]));
      for (const e of edges) {
        const s = map.get(e.source);
        const tt = map.get(e.target);
        if (!s || !tt) continue;
        const dx = tt.x - s.x;
        const dy = tt.y - s.y;
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = (d - 160) * attraction;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        if (s.fx === null) {
          s.vx += fx;
          s.vy += fy;
        }
        if (tt.fx === null) {
          tt.vx -= fx;
          tt.vy -= fy;
        }
      }
      const damping = draggingId ? 0.6 : 0.84;
      for (const n of ns) {
        if (n.fx !== null && n.fy !== null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (cx - n.x) * center;
        n.vy += (cy - n.y) * center;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(pad, Math.min(dim.w - pad, n.x));
        n.y = Math.max(pad, Math.min(dim.h - pad, n.y));
      }
      force((c) => c + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, nodesData, edges, dim, draggingId]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, SimNode>();
    for (const n of nodesRef.current) m.set(n.id, n);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesRef.current.length]);

  const connectedIds = useMemo(() => {
    const target = selectedId ?? hoveredId;
    if (!target) return new Set<string>();
    const s = new Set<string>([target]);
    for (const e of edges) {
      if (e.source === target) s.add(e.target);
      if (e.target === target) s.add(e.source);
    }
    return s;
  }, [selectedId, hoveredId, edges]);

  // 좌표 변환
  const screenToSvg = useCallback(
    (cx: number, cy: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const r = svg.getBoundingClientRect();
      const sx = (cx - r.left) * (dim.w / r.width);
      const sy = (cy - r.top) * (dim.h / r.height);
      return { x: (sx - translate.x) / scale, y: (sy - translate.y) / scale };
    },
    [dim, scale, translate]
  );

  // 마우스 핸들러
  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (target === svgRef.current || target.tagName === "rect") {
      setPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingId) {
      if (dragStartPos && !hasDragged) {
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        setHasDragged(true);
      }
      const p = screenToSvg(e.clientX, e.clientY);
      const n = nodesRef.current.find((x) => x.id === draggingId);
      if (n) {
        n.fx = p.x;
        n.fy = p.y;
        n.x = p.x;
        n.y = p.y;
      }
      return;
    }
    if (panning) {
      setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const onMouseUp = () => {
    if (draggingId) {
      const n = nodesRef.current.find((x) => x.id === draggingId);
      if (n) {
        n.fx = null;
        n.fy = null;
        n.vx = 0;
        n.vy = 0;
      }
      if (!hasDragged) {
        onSelect(selectedId === draggingId ? null : draggingId);
      }
      setDraggingId(null);
      setDragStartPos(null);
      setHasDragged(false);
      tickRef.current = Math.max(0, tickRef.current - 60);
      setRunning(true);
    }
    setPanning(false);
  };

  const onNodeMouseDown = (e: React.MouseEvent<SVGGElement>, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    const p = screenToSvg(e.clientX, e.clientY);
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      n.fx = p.x;
      n.fy = p.y;
    }
    setDraggingId(id);
    setRunning(true);
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (dim.w / r.width);
    const my = (e.clientY - r.top) * (dim.h / r.height);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const ns = Math.max(0.4, Math.min(2.5, scale * factor));
    setTranslate((p) => ({
      x: mx - (mx - p.x) * (ns / scale),
      y: my - (my - p.y) * (ns / scale),
    }));
    setScale(ns);
  };

  const handleFit = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const pad = 80;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of ns) {
      const r = NODE_W / 2;
      minX = Math.min(minX, n.x - r);
      minY = Math.min(minY, n.y - r);
      maxX = Math.max(maxX, n.x + r);
      maxY = Math.max(maxY, n.y + r);
    }
    const cw = maxX - minX + pad * 2;
    const ch = maxY - minY + pad * 2;
    const ns2 = Math.min(dim.w / cw, dim.h / ch, 1.6);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setScale(ns2);
    setTranslate({ x: dim.w / 2 - cx * ns2, y: dim.h / 2 - cy * ns2 });
  }, [dim]);

  const handleReset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    onSelect(null);
  };

  const ns = nodesRef.current;
  const cursor = draggingId ? "grabbing" : panning ? "grabbing" : "grab";

  // 빈 상태 / 로딩
  if (isLoading) {
    return (
      <div
        ref={containerRef}
        style={{
          height: dim.h,
          borderRadius: 12,
          background: "var(--rt-graph-bg)",
          border: "0.5px solid var(--rt-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--rt-text-tertiary)",
          fontSize: 13,
        }}
      >
        그래프를 불러오는 중…
      </div>
    );
  }
  if (nodesData.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          height: dim.h,
          borderRadius: 12,
          background: "var(--rt-graph-bg)",
          border: "0.5px solid var(--rt-border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--rt-text-tertiary)",
          fontSize: 13,
          gap: 12,
        }}
      >
        <BookOpen size={32} strokeWidth={1.4} />
        <div>아직 책 연결이 없습니다.</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: dim.h,
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--rt-graph-bg)",
        border: "0.5px solid var(--rt-border)",
      }}
    >
      {/* 도트 그리드 배경 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.7,
          pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, var(--rt-grid-dot) 1.2px, transparent 1.4px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        style={{ cursor, display: "block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {/* 노드별 표지 클립 */}
          {nodesData.map((n) => (
            <clipPath key={`clip-${n.id}`} id={`clip-${n.id}`}>
              <rect
                x={-NODE_W / 2}
                y={-NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={6}
              />
            </clipPath>
          ))}
          <filter id="rt-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width={dim.w} height={dim.h} fill="transparent" />

        <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
          {/* 엣지 — 명확한 가시성을 위해 stroke 굵기·불투명도 강화 */}
          {edges.map((e, i) => {
            const s = nodeMap.get(e.source);
            const t = nodeMap.get(e.target);
            if (!s || !t) return null;
            const focusedId = selectedId ?? hoveredId;
            const isHigh =
              focusedId !== null && (e.source === focusedId || e.target === focusedId);
            const isDim = focusedId !== null && !isHigh;
            const c = 0.12 + (i % 3) * 0.05;
            const path = curvePath(s.x, s.y, t.x, t.y, i % 2 ? c : -c);

            return (
              <g
                key={`e-${i}`}
                opacity={isDim ? 0.18 : 1}
                style={{ transition: "opacity 300ms" }}
              >
                {/* 호버 영역 확대 (인터랙션 ease) */}
                <path d={path} stroke="transparent" strokeWidth={10} fill="none" />
                <path
                  d={path}
                  stroke={isHigh ? "var(--rt-accent)" : "var(--rt-edge)"}
                  strokeWidth={isHigh ? 2.5 : 1.8}
                  opacity={isHigh ? 1 : 0.78}
                  fill="none"
                  strokeLinecap="round"
                />
                {isHigh && (
                  <path
                    d={path}
                    stroke="var(--rt-accent)"
                    strokeWidth={2.5}
                    opacity={0.6}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="3 12"
                    style={{ animation: "rt-flow 2s linear infinite" }}
                  />
                )}
              </g>
            );
          })}

          {/* 노드 — 사각 카드 + 책 표지 이미지 */}
          {ns.map((n) => {
            const isSelected = selectedId === n.id;
            const isHovered = hoveredId === n.id;
            const focusedId = selectedId ?? hoveredId;
            const isDimmed = focusedId !== null && !connectedIds.has(n.id);
            const isDragging = draggingId === n.id;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  opacity: isDimmed ? 0.18 : 1,
                  transition: isDragging ? "none" : "opacity 300ms",
                }}
                onMouseDown={(ev) => onNodeMouseDown(ev, n.id)}
                onMouseEnter={() => !draggingId && onHover(n.id)}
                onMouseLeave={() => onHover(null)}
              >
                {/* 선택/호버 글로우 */}
                {(isSelected || isHovered) && (
                  <rect
                    x={-NODE_W / 2 - 6}
                    y={-NODE_H / 2 - 6}
                    width={NODE_W + 12}
                    height={NODE_H + 12}
                    rx={10}
                    fill="none"
                    stroke="var(--rt-accent)"
                    strokeWidth={1.5}
                    opacity={isSelected ? 0.7 : 0.4}
                  />
                )}

                {/* 책 표지 카드 */}
                <g clipPath={`url(#clip-${n.id})`}>
                  {/* 폴백 배경 (이미지 로드 전/실패 시) */}
                  <rect
                    x={-NODE_W / 2}
                    y={-NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    fill="var(--rt-bg-subtle)"
                    filter="url(#rt-soft-shadow)"
                  />
                  {n.coverImageUrl ? (
                    <image
                      href={n.coverImageUrl}
                      x={-NODE_W / 2}
                      y={-NODE_H / 2}
                      width={NODE_W}
                      height={NODE_H}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    // 표지 없음: 이니셜 폴백
                    <>
                      <rect
                        x={-NODE_W / 2}
                        y={-NODE_H / 2}
                        width={NODE_W}
                        height={NODE_H}
                        fill="var(--rt-accent-bg)"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={NODE_W * 0.42}
                        fontWeight={700}
                        fill="var(--rt-accent)"
                        fontFamily="var(--rt-serif)"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {(n.title || "?").charAt(0)}
                      </text>
                    </>
                  )}
                </g>

                {/* 책등 그림자 */}
                <rect
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={4}
                  height={NODE_H}
                  fill="rgba(0,0,0,0.25)"
                  rx={1}
                />

                {/* 외곽선 */}
                <rect
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill="none"
                  stroke="var(--rt-border-strong)"
                  strokeWidth={0.8}
                />

                {/* 연결 카운트 배지 */}
                {n.connectionCount > 0 && (
                  <g transform={`translate(${NODE_W / 2 - 4},${-NODE_H / 2 + 4})`}>
                    <circle r={11} fill="var(--rt-bg-card)" />
                    <circle r={11} fill="var(--rt-accent)" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight={700}
                      fill="var(--rt-accent-fg)"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {n.connectionCount}
                    </text>
                  </g>
                )}

                {/* 라벨 — 저자 */}
                {n.author && (
                  <text
                    y={NODE_H / 2 + 16}
                    textAnchor="middle"
                    fontSize={11.5}
                    fontWeight={600}
                    fill="var(--rt-text-secondary)"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.author.length > 12 ? `${n.author.slice(0, 12)}…` : n.author}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 플로팅 툴바 */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          gap: 4,
          padding: 4,
          background: "var(--rt-bg-card)",
          border: "0.5px solid var(--rt-border)",
          borderRadius: 10,
          boxShadow: "var(--rt-shadow-sm)",
        }}
      >
        <ToolBtn onClick={() => setScale((s) => Math.min(s * 1.25, 2.5))} title="확대">
          <ZoomIn size={15} />
        </ToolBtn>
        <ToolBtn onClick={() => setScale((s) => Math.max(s / 1.25, 0.4))} title="축소">
          <ZoomOut size={15} />
        </ToolBtn>
        <ToolBtn onClick={handleFit} title="전체 보기">
          <Maximize2 size={15} />
        </ToolBtn>
        <ToolBtn onClick={handleReset} title="초기화">
          <RotateCcw size={15} />
        </ToolBtn>
      </div>

      {/* 좌하단 힌트 */}
      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "6px 10px",
          background: "var(--rt-bg-card)",
          border: "0.5px solid var(--rt-border)",
          borderRadius: 8,
          fontSize: 11,
          color: "var(--rt-text-tertiary)",
          boxShadow: "var(--rt-shadow-sm)",
        }}
      >
        <span>드래그로 노드 이동</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>스크롤로 확대</span>
      </div>
    </div>
  );
}

interface ToolBtnProps {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}

function ToolBtn({ onClick, title, children }: ToolBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        border: 0,
        background: "transparent",
        color: "var(--rt-text-secondary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 150ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--rt-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
