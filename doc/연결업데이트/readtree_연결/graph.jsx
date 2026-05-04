// graph.jsx — 리뉴얼된 네트워크 그래프
// - 책 표지를 사각 카드(둥근 모서리)로 노드화 → 책이 주인공
// - force-simulation 가벼운 버전, 클릭/드래그/호버
// - 선택 시 인접 노드만 강조, 나머지는 디밍
// - 엣지에 흐르는 점(선택 시) — 인터랙티브 느낌

const { useState, useEffect, useRef, useMemo, useCallback } = React;

function BookRelationsGraph({
  books, edges, selectedBookId, onSelect, onHover,
  hoveredBookId, density = "regular", style = "card", showLabels = true,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const animRef = useRef(0);
  const nodesRef = useRef([]);
  const tickRef = useRef(0);
  const [, force] = useState(0);
  const [dim, setDim] = useState({ w: 900, h: 580 });
  const [running, setRunning] = useState(true);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);
  const DRAG_THRESHOLD = 5;

  // 사이즈
  const NODE_W = density === "compact" ? 56 : density === "comfy" ? 84 : 70;
  const NODE_H = Math.round(NODE_W * 1.4);
  const RADIUS = NODE_W * 0.6;

  // 컨테이너 사이즈
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width } = e.contentRect;
        setDim({ w: Math.max(400, width), h: Math.max(440, Math.min(680, width * 0.62)) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 노드 초기화 (골든 앵글)
  useEffect(() => {
    const cx = dim.w / 2, cy = dim.h / 2;
    const sorted = [...books].sort((a, b) => b.connectionCount - a.connectionCount);
    nodesRef.current = sorted.map((b, i) => {
      if (i === 0) return { ...b, x: cx, y: cy, vx: 0, vy: 0, fx: null, fy: null };
      const ga = Math.PI * (3 - Math.sqrt(5));
      const angle = i * ga;
      const r = Math.sqrt(i) * 56;
      return { ...b, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0, fx: null, fy: null };
    });
    tickRef.current = 0;
    setRunning(true);
    force((c) => c + 1);
  }, [books, dim]);

  // 시뮬레이션
  useEffect(() => {
    if (!running || books.length === 0) return;
    const cx = dim.w / 2, cy = dim.h / 2;
    const pad = 50;
    const maxTicks = 250;

    const tick = () => {
      const ns = nodesRef.current;
      tickRef.current++;
      const t = tickRef.current;
      if (t > maxTicks && !draggingId) { setRunning(false); return; }
      const cooling = Math.max(0.02, 1 - t / maxTicks);
      const repulsion = 5500 * (draggingId ? 1 : cooling);
      const attraction = 0.008;
      const center = 0.003 * (draggingId ? 0.3 : cooling);

      // 반발
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i], b = ns[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = repulsion / (d * d);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          if (a.fx === null) { a.vx += fx; a.vy += fy; }
          if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
        }
      }
      // 연결 인력
      const map = new Map(ns.map((n) => [n.id, n]));
      for (const e of edges) {
        const s = map.get(e.source), tt = map.get(e.target);
        if (!s || !tt) continue;
        const dx = tt.x - s.x, dy = tt.y - s.y;
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const f = (d - 160) * attraction;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        if (s.fx === null) { s.vx += fx; s.vy += fy; }
        if (tt.fx === null) { tt.vx -= fx; tt.vy -= fy; }
      }
      const damping = draggingId ? 0.6 : 0.84;
      for (const n of ns) {
        if (n.fx !== null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; continue; }
        n.vx += (cx - n.x) * center;
        n.vy += (cy - n.y) * center;
        n.vx *= damping; n.vy *= damping;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(pad, Math.min(dim.w - pad, n.x));
        n.y = Math.max(pad, Math.min(dim.h - pad, n.y));
      }
      force((c) => c + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, books, edges, dim, draggingId]);

  const nodeMap = useMemo(() => {
    const m = new Map();
    for (const n of nodesRef.current) m.set(n.id, n);
    return m;
  }, [nodesRef.current]);

  const connectedIds = useMemo(() => {
    const target = selectedBookId || hoveredBookId;
    if (!target) return new Set();
    const s = new Set([target]);
    for (const e of edges) {
      if (e.source === target) s.add(e.target);
      if (e.target === target) s.add(e.source);
    }
    return s;
  }, [selectedBookId, hoveredBookId, edges]);

  const getRadius = (count) => {
    const max = Math.max(...books.map((b) => b.connectionCount), 1);
    return RADIUS + (count / max) * (RADIUS * 0.45);
  };

  // 좌표 변환
  const screenToSvg = useCallback((cx, cy) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    const sx = (cx - r.left) * (dim.w / r.width);
    const sy = (cy - r.top) * (dim.h / r.height);
    return { x: (sx - translate.x) / scale, y: (sy - translate.y) / scale };
  }, [dim, scale, translate]);

  // 마우스 핸들러
  const onMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === "rect") {
      setPanning(true);
      setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };
  const onMouseMove = (e) => {
    if (draggingId) {
      if (dragStartPos && !hasDragged) {
        const dx = e.clientX - dragStartPos.x, dy = e.clientY - dragStartPos.y;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        setHasDragged(true);
      }
      const p = screenToSvg(e.clientX, e.clientY);
      const n = nodesRef.current.find((x) => x.id === draggingId);
      if (n) { n.fx = p.x; n.fy = p.y; n.x = p.x; n.y = p.y; }
      return;
    }
    if (panning) setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const onMouseUp = () => {
    if (draggingId) {
      const n = nodesRef.current.find((x) => x.id === draggingId);
      if (n) { n.fx = null; n.fy = null; n.vx = 0; n.vy = 0; }
      if (!hasDragged) onSelect(selectedBookId === draggingId ? null : draggingId);
      setDraggingId(null); setDragStartPos(null); setHasDragged(false);
      tickRef.current = Math.max(0, tickRef.current - 60);
      setRunning(true);
    }
    setPanning(false);
  };
  const onNodeMouseDown = (e, id) => {
    e.stopPropagation(); e.preventDefault();
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    const p = screenToSvg(e.clientX, e.clientY);
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) { n.fx = p.x; n.fy = p.y; }
    setDraggingId(id); setRunning(true);
  };
  const onWheel = (e) => {
    e.preventDefault();
    const svg = svgRef.current; if (!svg) return;
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (dim.w / r.width);
    const my = (e.clientY - r.top) * (dim.h / r.height);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const ns = Math.max(0.4, Math.min(2.5, scale * factor));
    setTranslate((p) => ({ x: mx - (mx - p.x) * (ns / scale), y: my - (my - p.y) * (ns / scale) }));
    setScale(ns);
  };

  const handleFit = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;
    const pad = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of ns) {
      const r = getRadius(n.connectionCount);
      minX = Math.min(minX, n.x - r); minY = Math.min(minY, n.y - r);
      maxX = Math.max(maxX, n.x + r); maxY = Math.max(maxY, n.y + r);
    }
    const cw = maxX - minX + pad * 2, ch = maxY - minY + pad * 2;
    const ns2 = Math.min(dim.w / cw, dim.h / ch, 1.6);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setScale(ns2);
    setTranslate({ x: dim.w / 2 - cx * ns2, y: dim.h / 2 - cy * ns2 });
  }, [dim, books]);

  const handleReset = () => { setScale(1); setTranslate({ x: 0, y: 0 }); onSelect(null); };

  // 베지어 커브
  const curve = (sx, sy, tx, ty, c) => {
    const mx = (sx + tx) / 2, my = (sy + ty) / 2;
    const dx = tx - sx, dy = ty - sy;
    return `M${sx},${sy} Q${mx - dy * c},${my + dx * c} ${tx},${ty}`;
  };

  const ns = nodesRef.current;
  const cursor = draggingId ? "grabbing" : panning ? "grabbing" : "grab";

  return (
    <div ref={containerRef} className="graph-canvas" style={{ position: "relative", height: dim.h, borderRadius: 12, overflow: "hidden", background: "var(--graph-bg)", border: "0.5px solid var(--border)" }}>
      {/* 배경 그리드 */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, var(--grid-dot) 1px, transparent 1.2px)`,
        backgroundSize: "28px 28px",
      }} />

      <svg
        ref={svgRef}
        width="100%" height="100%"
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        style={{ cursor, display: "block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {books.map((b) => (
            <clipPath key={`clip-${b.id}`} id={`clip-${b.id}`}>
              <rect x={-NODE_W/2} y={-NODE_H/2} width={NODE_W} height={NODE_H} rx={6} />
            </clipPath>
          ))}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.18" />
          </filter>
          <style>{`@keyframes flow { to { stroke-dashoffset: -24; } }`}</style>
        </defs>

        <rect width={dim.w} height={dim.h} fill="transparent" />

        <g transform={`translate(${translate.x},${translate.y}) scale(${scale})`}>
          {/* 엣지 */}
          {edges.map((e, i) => {
            const s = nodeMap.get(e.source), t = nodeMap.get(e.target);
            if (!s || !t) return null;
            const isHigh = (selectedBookId || hoveredBookId) && (e.source === (selectedBookId || hoveredBookId) || e.target === (selectedBookId || hoveredBookId));
            const isDim = (selectedBookId || hoveredBookId) && !isHigh;
            const c = 0.12 + (i % 3) * 0.05;
            const path = curve(s.x, s.y, t.x, t.y, i % 2 ? c : -c);

            return (
              <g key={`e-${i}`} opacity={isDim ? 0.06 : 1} style={{ transition: "opacity 300ms" }}>
                <path
                  d={path}
                  stroke={isHigh ? `oklch(0.62 0.16 ${s.hue})` : "var(--edge)"}
                  strokeWidth={isHigh ? 2 : 1.2}
                  opacity={isHigh ? 0.85 : 0.45}
                  fill="none"
                  strokeLinecap="round"
                />
                {isHigh && (
                  <path
                    d={path}
                    stroke={`oklch(0.7 0.18 ${s.hue})`}
                    strokeWidth={2}
                    opacity={0.55}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="3 14"
                    style={{ animation: "flow 2s linear infinite" }}
                  />
                )}
              </g>
            );
          })}

          {/* 노드 */}
          {ns.map((n) => {
            const isSelected = selectedBookId === n.id;
            const isHovered = hoveredBookId === n.id;
            const isDimmed = (selectedBookId || hoveredBookId) && !connectedIds.has(n.id);
            const isDragging = draggingId === n.id;
            const hue = n.hue ?? 200;

            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                style={{ cursor: isDragging ? "grabbing" : "grab", opacity: isDimmed ? 0.18 : 1, transition: isDragging ? "none" : "opacity 300ms" }}
                onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                onMouseEnter={() => !draggingId && onHover(n.id)}
                onMouseLeave={() => onHover(null)}
              >
                {/* 선택 글로우 */}
                {(isSelected || isHovered) && (
                  <rect
                    x={-NODE_W/2 - 6} y={-NODE_H/2 - 6}
                    width={NODE_W + 12} height={NODE_H + 12} rx={10}
                    fill="none"
                    stroke={`oklch(0.68 0.16 ${hue})`}
                    strokeWidth={1.5}
                    opacity={isSelected ? 0.7 : 0.4}
                  />
                )}

                {/* 책 표지 (사각) */}
                <g clipPath={`url(#clip-${n.id})`}>
                  <rect
                    x={-NODE_W/2} y={-NODE_H/2}
                    width={NODE_W} height={NODE_H} rx={6}
                    fill={`oklch(0.55 0.14 ${hue})`}
                    filter="url(#soft-shadow)"
                  />
                  <rect
                    x={-NODE_W/2} y={-NODE_H/2}
                    width={NODE_W} height={NODE_H}
                    fill={`url(#g-${n.id})`}
                  />
                </g>
                <defs>
                  <linearGradient id={`g-${n.id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={`oklch(0.68 0.13 ${hue})`} />
                    <stop offset="100%" stopColor={`oklch(0.4 0.15 ${hue})`} />
                  </linearGradient>
                </defs>

                {/* 책등 그림자 */}
                <rect x={-NODE_W/2} y={-NODE_H/2} width={4} height={NODE_H} fill="rgba(0,0,0,0.25)" rx={1} />

                {/* 외곽선 */}
                <rect
                  x={-NODE_W/2} y={-NODE_H/2}
                  width={NODE_W} height={NODE_H} rx={6}
                  fill="none"
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth={0.8}
                />

                {/* 표지 텍스트 */}
                <text
                  x={4} y={-NODE_H/2 + 14}
                  fontSize={NODE_W * 0.13}
                  fontWeight={700}
                  fill={`oklch(0.95 0.04 ${hue})`}
                  letterSpacing="0.06em"
                  opacity={0.85}
                  className="select-none"
                  style={{ textTransform: "uppercase", pointerEvents: "none" }}
                >
                  {n.genre}
                </text>
                <foreignObject x={-NODE_W/2 + 8} y={-NODE_H/2 + NODE_H * 0.32} width={NODE_W - 16} height={NODE_H * 0.5}>
                  <div style={{
                    color: `oklch(0.96 0.03 ${hue})`,
                    fontSize: Math.max(9, NODE_W * 0.16),
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    fontFamily: '"Noto Serif KR", serif',
                    textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    pointerEvents: "none",
                  }}>
                    {n.title}
                  </div>
                </foreignObject>

                {/* 연결 카운트 배지 */}
                <g transform={`translate(${NODE_W/2 - 4},${-NODE_H/2 + 4})`}>
                  <circle r={11} fill="white" />
                  <circle r={11} fill={`oklch(0.55 0.18 ${hue})`} opacity={0.95} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="white" style={{ pointerEvents: "none" }}>
                    {n.connectionCount}
                  </text>
                </g>

                {/* 라벨 */}
                {showLabels && (
                  <text
                    y={NODE_H/2 + 16}
                    textAnchor="middle"
                    fontSize={11.5}
                    fontWeight={600}
                    fill="var(--text-secondary)"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.author}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 플로팅 툴바 */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        display: "flex", gap: 4, padding: 4,
        background: "var(--bg-card)", border: "0.5px solid var(--border)",
        borderRadius: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <ToolBtn onClick={() => setScale((s) => Math.min(s * 1.25, 2.5))}><Icon.zoomIn size={15} /></ToolBtn>
        <ToolBtn onClick={() => setScale((s) => Math.max(s / 1.25, 0.4))}><Icon.zoomOut size={15} /></ToolBtn>
        <ToolBtn onClick={handleFit} title="전체 보기"><Icon.fit size={15} /></ToolBtn>
        <ToolBtn onClick={handleReset} title="초기화"><Icon.reset size={15} /></ToolBtn>
      </div>

      {/* 좌하단 힌트 */}
      <div style={{
        position: "absolute", left: 12, bottom: 12,
        display: "flex", gap: 6, alignItems: "center",
        padding: "6px 10px",
        background: "var(--bg-card)", border: "0.5px solid var(--border)",
        borderRadius: 8, fontSize: 11, color: "var(--text-tertiary)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <span>드래그로 노드 이동</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>스크롤로 확대</span>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 28, height: 28, borderRadius: 7, border: 0, background: "transparent",
      color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "background 150ms",
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      {children}
    </button>
  );
}

window.BookRelationsGraph = BookRelationsGraph;
