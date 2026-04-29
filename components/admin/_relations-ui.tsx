"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

// ============================================================
// 디자인 토큰 — 새 기획(에디토리얼/저널)을 페이지 스코프로 적용
// 라이트: 베이지 #f6f5f2 / 청록 #2f4f4f
// ============================================================

export const RELATIONS_TOKENS_CSS = `
  .rt-relations {
    --rt-bg: #f6f5f2;
    --rt-bg-card: #ffffff;
    --rt-bg-subtle: #f1efea;
    --rt-bg-hover: rgba(20,18,12,0.04);
    --rt-bg-active: rgba(20,18,12,0.06);
    --rt-border: rgba(20,18,12,0.08);
    --rt-border-strong: rgba(20,18,12,0.14);
    --rt-text-primary: #1a1815;
    --rt-text-secondary: #4a4640;
    --rt-text-tertiary: #8a847a;
    --rt-accent: #2f4f4f;
    --rt-accent-soft: #6b8b8b;
    --rt-accent-bg: #e8eded;
    --rt-graph-bg: #fbfaf6;
    --rt-grid-dot: rgba(20,18,12,0.07);
    --rt-edge: rgba(20,18,12,0.18);

    --rt-pill-neutral-bg: #f1efea;
    --rt-pill-neutral-fg: #4a4640;
    --rt-pill-neutral-border: rgba(20,18,12,0.06);
    --rt-pill-accent-bg: #e8eded;
    --rt-pill-accent-fg: #2f4f4f;
    --rt-pill-accent-border: rgba(47,79,79,0.18);
    --rt-pill-success-bg: #e6f0e6;
    --rt-pill-success-fg: #2d5a2d;
    --rt-pill-success-border: rgba(45,90,45,0.18);
    --rt-pill-warn-bg: #fbeed6;
    --rt-pill-warn-fg: #7a5414;
    --rt-pill-warn-border: rgba(122,84,20,0.2);

    --rt-shadow-sm: 0 1px 2px rgba(20,18,12,0.04);
    --rt-shadow-md: 0 4px 14px rgba(20,18,12,0.06), 0 1px 2px rgba(20,18,12,0.04);
    --rt-shadow-lg: 0 12px 40px rgba(20,18,12,0.12), 0 2px 4px rgba(20,18,12,0.04);

    --rt-serif: "Noto Serif KR", ui-serif, Georgia, serif;

    background: var(--rt-bg);
    color: var(--rt-text-primary);
    font-size: 13px;
    line-height: 1.5;
    letter-spacing: -0.01em;
  }
  .rt-relations[data-theme="dark"] {
    --rt-bg: #14130f;
    --rt-bg-card: #1c1a16;
    --rt-bg-subtle: #232017;
    --rt-bg-hover: rgba(255,250,235,0.04);
    --rt-bg-active: rgba(255,250,235,0.06);
    --rt-border: rgba(255,250,235,0.08);
    --rt-border-strong: rgba(255,250,235,0.14);
    --rt-text-primary: #f4f1ea;
    --rt-text-secondary: #b8b1a3;
    --rt-text-tertiary: #7a7468;
    --rt-accent: #8eb5b5;
    --rt-accent-soft: #5a7a7a;
    --rt-accent-bg: rgba(142,181,181,0.12);
    --rt-graph-bg: #18160f;
    --rt-grid-dot: rgba(255,250,235,0.06);
    --rt-edge: rgba(255,250,235,0.18);

    --rt-pill-neutral-bg: rgba(255,250,235,0.06);
    --rt-pill-neutral-fg: #b8b1a3;
    --rt-pill-neutral-border: rgba(255,250,235,0.08);
    --rt-pill-accent-bg: rgba(142,181,181,0.14);
    --rt-pill-accent-fg: #b8d6d6;
    --rt-pill-accent-border: rgba(142,181,181,0.25);
    --rt-pill-success-bg: rgba(120,160,90,0.14);
    --rt-pill-success-fg: #b8d699;
    --rt-pill-success-border: rgba(120,160,90,0.25);
    --rt-pill-warn-bg: rgba(200,140,60,0.14);
    --rt-pill-warn-fg: #d6b888;
    --rt-pill-warn-border: rgba(200,140,60,0.25);

    --rt-shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --rt-shadow-md: 0 4px 14px rgba(0,0,0,0.3);
    --rt-shadow-lg: 0 12px 40px rgba(0,0,0,0.4);
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
  let h = 0;
  for (let i = 0; i < (name ?? "").length; i++) {
    h = (h * 31 + (name ?? "").charCodeAt(i)) % 360;
  }
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, oklch(0.78 0.10 ${h}), oklch(0.62 0.13 ${h}))`,
        color: "white",
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
  let hue = 0;
  for (let i = 0; i < title.length; i++) {
    hue = (hue * 31 + title.charCodeAt(i)) % 360;
  }
  return (
    <span
      style={{
        width,
        height: h,
        borderRadius: radius,
        background: `linear-gradient(135deg, oklch(0.62 0.10 ${hue}), oklch(0.42 0.12 ${hue}))`,
        color: "white",
        fontSize: width * 0.42,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--rt-serif)",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(0,0,0,0.2)",
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
