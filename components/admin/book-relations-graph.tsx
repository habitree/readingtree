"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, Maximize2, BookOpen } from "lucide-react";
import type { BookRelationsGraphData, GraphNode } from "@/app/actions/admin/book-relations";

interface BookRelationsGraphProps {
  data: BookRelationsGraphData;
  isLoading?: boolean;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

/**
 * 방사형 레이아웃으로 노드 배치
 * 가장 연결이 많은 노드를 중심에, 나머지를 동심원으로 배치
 */
function computeRadialLayout(
  data: BookRelationsGraphData,
  width: number,
  height: number
): LayoutNode[] {
  if (data.nodes.length === 0) return [];

  const cx = width / 2;
  const cy = height / 2;

  // 연결 수 기준 정렬
  const sorted = [...data.nodes].sort(
    (a, b) => b.connectionCount - a.connectionCount
  );

  if (sorted.length === 1) {
    return [{ ...sorted[0], x: cx, y: cy }];
  }

  const result: LayoutNode[] = [];

  // 중심 노드
  result.push({ ...sorted[0], x: cx, y: cy });

  // 나머지 노드를 동심원으로 배치
  const remaining = sorted.slice(1);
  const nodesPerRing = Math.max(6, Math.ceil(Math.sqrt(remaining.length) * 2));
  const ringSpacing = Math.min(width, height) / (Math.ceil(remaining.length / nodesPerRing) + 2) * 0.4;

  let ringIndex = 0;
  let posInRing = 0;

  for (const node of remaining) {
    if (posInRing >= nodesPerRing + ringIndex * 3) {
      ringIndex++;
      posInRing = 0;
    }

    const nodesInThisRing = nodesPerRing + ringIndex * 3;
    const radius = ringSpacing * (ringIndex + 1);
    const angle = (2 * Math.PI * posInRing) / nodesInThisRing - Math.PI / 2;

    result.push({
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });

    posInRing++;
  }

  return result;
}

export function BookRelationsGraph({ data, isLoading }: BookRelationsGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width: Math.max(400, width), height: Math.max(400, Math.min(600, width * 0.65)) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const layoutNodes = useMemo(
    () => computeRadialLayout(data, dimensions.width, dimensions.height),
    [data, dimensions]
  );

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">연결된 책이 없습니다</p>
          <p className="text-xs mt-1">사용자가 책을 연결하면 여기에 그래프가 표시됩니다</p>
        </CardContent>
      </Card>
    );
  }

  // 노드 크기 계산 (연결 수에 비례)
  const maxConnections = Math.max(...data.nodes.map((n) => n.connectionCount), 1);
  const getNodeRadius = (count: number) => 12 + (count / maxConnections) * 18;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">네트워크 그래프</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {data.nodes.length}개 책 · {data.edges.length}개 연결
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-b-lg bg-slate-50 dark:bg-slate-900/50 border-t"
          style={{ height: dimensions.height }}
        >
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
            {/* 배경 */}
            <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

            <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
              {/* 엣지 */}
              {data.edges.map((edge, i) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const isHighlighted =
                  selectedNode &&
                  (edge.source === selectedNode || edge.target === selectedNode);
                const isDimmed = selectedNode && !isHighlighted;

                return (
                  <line
                    key={`edge-${i}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.5}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* 노드 */}
              {layoutNodes.map((node) => {
                const radius = getNodeRadius(node.connectionCount);
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isDimmed =
                  selectedNode !== null && !isConnected;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(
                        selectedNode === node.id ? null : node.id
                      );
                    }}
                    opacity={isDimmed ? 0.2 : 1}
                    style={{ transition: "opacity 200ms" }}
                  >
                    {/* 외부 링 (호버/선택 시) */}
                    {(isHovered || isSelected) && (
                      <circle
                        r={radius + 4}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        opacity={0.6}
                      />
                    )}

                    {/* 배경 원 */}
                    <circle
                      r={radius}
                      fill={
                        isSelected
                          ? "hsl(var(--primary))"
                          : node.coverImageUrl
                          ? "hsl(var(--muted))"
                          : "hsl(var(--muted))"
                      }
                      stroke={
                        isSelected
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))"
                      }
                      strokeWidth={1.5}
                    />

                    {/* 책 표지 이미지 (clipPath) */}
                    {node.coverImageUrl && (
                      <>
                        <defs>
                          <clipPath id={`clip-${node.id}`}>
                            <circle r={radius - 1} />
                          </clipPath>
                        </defs>
                        <image
                          href={node.coverImageUrl}
                          x={-(radius - 1)}
                          y={-(radius - 1)}
                          width={(radius - 1) * 2}
                          height={(radius - 1) * 2}
                          clipPath={`url(#clip-${node.id})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </>
                    )}

                    {/* 이미지 없을 때 이니셜 */}
                    {!node.coverImageUrl && (
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={radius * 0.7}
                        fill="hsl(var(--muted-foreground))"
                        className="pointer-events-none select-none"
                      >
                        {node.title.charAt(0)}
                      </text>
                    )}

                    {/* 연결 수 배지 */}
                    <g transform={`translate(${radius * 0.7}, ${-radius * 0.7})`}>
                      <circle r={7} fill="hsl(var(--primary))" />
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
                      y={radius + 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill="hsl(var(--foreground))"
                      className="pointer-events-none select-none"
                      opacity={0.8}
                    >
                      {node.title.length > 10
                        ? node.title.slice(0, 10) + "…"
                        : node.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 툴팁 */}
          {hoveredNode && (() => {
            const node = nodeMap.get(hoveredNode);
            if (!node) return null;
            return (
              <div
                className="absolute z-10 px-3 py-2 rounded-lg shadow-lg border bg-popover text-popover-foreground text-xs max-w-[200px] pointer-events-none"
                style={{
                  left: Math.min(node.x * scale + translate.x + 20, dimensions.width - 210),
                  top: Math.max(node.y * scale + translate.y - 30, 10),
                }}
              >
                <p className="font-semibold truncate">{node.title}</p>
                {node.author && (
                  <p className="text-muted-foreground truncate">{node.author}</p>
                )}
                <p className="mt-1">
                  연결: <span className="font-medium">{node.connectionCount}개</span>
                </p>
                {node.userName && (
                  <p className="text-muted-foreground">사용자: {node.userName}</p>
                )}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
