"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

// ============================================================
// 디자인 토큰 — 새 기획(에디토리얼/저널)을 페이지 스코프로 적용
// 라이트: 베이지 #f6f5f2 / 청록 #2f4f4f
// ============================================================

// 모든 토큰을 프로젝트 shadcn 변수(hsl(var(--background)) 등)에 매핑.
// 라이트/다크/forest/forest-dark 4테마 모두 자동으로 대응.
export const RELATIONS_TOKENS_CSS = `
  .rt-relations {
    --rt-bg: hsl(var(--background));
    --rt-bg-card: hsl(var(--card));
    --rt-bg-subtle: hsl(var(--muted));
    --rt-bg-hover: hsl(var(--muted) / 0.7);
    --rt-bg-active: hsl(var(--muted));
    --rt-border: hsl(var(--border));
    --rt-border-strong: hsl(var(--border) / 1.6);
    --rt-text-primary: hsl(var(--foreground));
    --rt-text-secondary: hsl(var(--foreground) / 0.78);
    --rt-text-tertiary: hsl(var(--muted-foreground));
    --rt-accent: hsl(var(--primary));
    --rt-accent-soft: hsl(var(--primary) / 0.7);
    --rt-accent-bg: hsl(var(--primary) / 0.12);
    --rt-accent-fg: hsl(var(--primary-foreground));
    --rt-graph-bg: hsl(var(--muted) / 0.35);
    --rt-grid-dot: hsl(var(--foreground) / 0.08);
    --rt-edge: hsl(var(--foreground) / 0.42);
    --rt-edge-strong: hsl(var(--primary));

    --rt-pill-neutral-bg: hsl(var(--muted));
    --rt-pill-neutral-fg: hsl(var(--muted-foreground));
    --rt-pill-neutral-border: hsl(var(--border));
    --rt-pill-accent-bg: hsl(var(--primary) / 0.12);
    --rt-pill-accent-fg: hsl(var(--primary));
    --rt-pill-accent-border: hsl(var(--primary) / 0.28);
    --rt-pill-success-bg: hsl(var(--chart-2) / 0.14);
    --rt-pill-success-fg: hsl(var(--chart-2));
    --rt-pill-success-border: hsl(var(--chart-2) / 0.3);
    --rt-pill-warn-bg: hsl(var(--chart-4) / 0.16);
    --rt-pill-warn-fg: hsl(var(--chart-4));
    --rt-pill-warn-border: hsl(var(--chart-4) / 0.3);

    --rt-shadow-sm: 0 1px 2px hsl(var(--foreground) / 0.04);
    --rt-shadow-md: 0 4px 14px hsl(var(--foreground) / 0.08), 0 1px 2px hsl(var(--foreground) / 0.04);
    --rt-shadow-lg: 0 12px 40px hsl(var(--foreground) / 0.16), 0 2px 4px hsl(var(--foreground) / 0.06);

    --rt-serif: "Noto Serif KR", ui-serif, Georgia, serif;

    background: var(--rt-bg);
    color: var(--rt-text-primary);
    font-size: 13px;
    line-height: 1.5;
    letter-spacing: -0.01em;
  }
  .rt-serif { font-family: var(--rt-serif); }
  .rt-kbd {
    display: inline-flex; align-items: center; justify-content: center;
    height: 18px; padding: 0 5px;
    background: var(--rt-bg-subtle);
    border: 0.5px solid var(--rt-border);
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 10.5px;
    color: var(--rt-text-tertiary);
  }
  @keyframes rt-flow { to { stroke-dashoffset: -24; } }
  @keyframes rt-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rt-scale-in { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes rt-dot-flow { from { left: 0; } to { left: calc(100% - 8px); } }
`;

// ============================================================
// Pill (작은 라벨)
// ============================================================

export type PillTone = "neutral" | "accent" | "success" | "warn";
export type PillSize = "xs" | "sm" | "md";

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  size?: PillSize;
  className?: string;
}

export function Pill({ children, tone = "neutral", size = "sm", className }: PillProps) {
  const sizeStyles: Record<PillSize, CSSProperties> = {
    xs: { padding: "1px 6px", fontSize: 10.5, height: 18, gap: 4 },
    sm: { padding: "2px 8px", fontSize: 11.5, height: 22, gap: 5 },
    md: { padding: "3px 10px", fontSize: 12.5, height: 26, gap: 6 },
  };
  const toneStyles: Record<PillTone, CSSProperties> = {
    neutral: {
      background: "var(--rt-pill-neutral-bg)",
      color: "var(--rt-pill-neutral-fg)",
      border: "0.5px solid var(--rt-pill-neutral-border)",
    },
    accent: {
      background: "var(--rt-pill-accent-bg)",
      color: "var(--rt-pill-accent-fg)",
      border: "0.5px solid var(--rt-pill-accent-border)",
    },
    success: {
      background: "var(--rt-pill-success-bg)",
      color: "var(--rt-pill-success-fg)",
      border: "0.5px solid var(--rt-pill-success-border)",
    },
    warn: {
      background: "var(--rt-pill-warn-bg)",
      color: "var(--rt-pill-warn-fg)",
      border: "0.5px solid var(--rt-pill-warn-border)",
    },
  };
  return (
    <span
      className={cn("rt-pill", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        ...sizeStyles[size],
        ...toneStyles[tone],
      }}
    >
      {children}
    </span>
  );
}

// ============================================================
// Avatar (사용자 이름 이니셜)
// ============================================================

interface AvatarProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 24, className }: AvatarProps) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--rt-accent-bg)",
        color: "var(--rt-accent)",
        fontSize: size * 0.45,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 0 0 1.5px var(--rt-bg-card)",
        fontFamily: "var(--rt-serif)",
      }}
    >
      {initial}
    </span>
  );
}

// ============================================================
// 표지 폴백 — cover_image_url이 null일 때 작은 이니셜 카드
// ============================================================

interface CoverFallbackProps {
  title: string;
  width: number;
  height?: number;
  radius?: number;
}

export function CoverFallback({ title, width, height, radius = 4 }: CoverFallbackProps) {
  const h = height ?? Math.round(width * 1.4);
  const initial = (title || "?").charAt(0);
  return (
    <span
      style={{
        width,
        height: h,
        borderRadius: radius,
        background: "var(--rt-accent-bg)",
        color: "var(--rt-accent)",
        fontSize: width * 0.42,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--rt-serif)",
        flexShrink: 0,
        border: "0.5px solid var(--rt-border)",
        boxShadow: "var(--rt-shadow-sm)",
      }}
    >
      {initial}
    </span>
  );
}

// ============================================================
// BookCover — cover_image_url 우선, 없으면 fallback
// ============================================================

interface BookCoverProps {
  src: string | null;
  title: string;
  width: number;
  height?: number;
  radius?: number;
  className?: string;
}

export function BookCover({ src, title, width, height, radius = 4, className }: BookCoverProps) {
  const h = height ?? Math.round(width * 1.4);
  if (!src) {
    return <CoverFallback title={title} width={width} height={h} radius={radius} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={title}
      width={width}
      height={h}
      className={className}
      style={{
        width,
        height: h,
        borderRadius: radius,
        objectFit: "cover",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(0,0,0,0.18)",
        background: "var(--rt-bg-subtle)",
      }}
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = "none";
      }}
    />
  );
}
