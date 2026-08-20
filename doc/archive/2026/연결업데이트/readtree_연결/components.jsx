// components.jsx — 공통 UI 빌딩블록
// BookCover: 표지 placeholder (제목 첫 글자 + 색상 + 종이 텍스처 느낌)
// Avatar: 사용자 이니셜
// Pill: 작은 라벨
// Icon: SVG 아이콘 모음 (lucide 스타일, 인라인)

const { useMemo } = React;

// ───────────────────────────── BookCover ─────────────────────────────
function BookCover({ book, size = 56, radius = 4, className = "", style = {} }) {
  const w = size;
  const h = Math.round(size * 1.45);
  const hue = book.hue ?? 200;
  // 표지 색조 — 채도/명도 두 톤으로 빈티지한 책표지 느낌
  const bg1 = `oklch(0.62 0.13 ${hue})`;
  const bg2 = `oklch(0.42 0.14 ${hue})`;
  const ink = `oklch(0.96 0.02 ${hue})`;
  const accent = `oklch(0.85 0.12 ${(hue + 30) % 360})`;
  const initial = (book.title || "?").charAt(0);

  return (
    <div
      className={`book-cover ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 10px rgba(15,15,30,0.18), 0 0 0 0.5px rgba(0,0,0,0.2)",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* 종이 결 */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)`,
        mixBlendMode: "overlay",
      }} />
      {/* 책등 그림자 */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(90deg, rgba(0,0,0,0.28), rgba(0,0,0,0))`,
      }} />
      {/* 제목 글자 */}
      <div style={{
        position: "absolute",
        inset: `${Math.max(6, h * 0.12)}px ${Math.max(6, w * 0.16)}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        <div style={{ color: accent, fontSize: Math.max(7, size * 0.13), fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.85 }}>
          {book.genre || "BOOK"}
        </div>
        <div style={{
          color: ink,
          fontSize: Math.max(9, size * 0.18),
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          fontFamily: '"Noto Serif KR", "Source Serif Pro", serif',
        }}>
          {book.title.length > 14 ? book.title.slice(0, 14) + "…" : book.title}
        </div>
      </div>
      {/* 큰 이니셜 워터마크 */}
      <div style={{
        position: "absolute",
        right: -size * 0.15,
        bottom: -size * 0.1,
        fontSize: size * 0.95,
        fontWeight: 800,
        color: ink,
        opacity: 0.08,
        fontFamily: '"Noto Serif KR", serif',
        lineHeight: 1,
        pointerEvents: "none",
      }}>
        {initial}
      </div>
    </div>
  );
}

// 원형 표지 (그래프 노드용)
function BookCoverCircle({ book, size = 64, selected = false, dimmed = false }) {
  const hue = book.hue ?? 200;
  const initial = (book.title || "?").charAt(0);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, oklch(0.65 0.13 ${hue}), oklch(0.42 0.15 ${hue}))`,
        position: "relative",
        boxShadow: selected
          ? `0 0 0 2px oklch(0.78 0.16 ${hue}), 0 6px 18px oklch(0.5 0.18 ${hue} / 0.45)`
          : "0 2px 6px rgba(15,15,30,0.18), 0 0 0 0.5px rgba(0,0,0,0.15)",
        opacity: dimmed ? 0.25 : 1,
        transition: "opacity 250ms, box-shadow 250ms",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)`,
      }} />
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: `oklch(0.96 0.02 ${hue})`,
        fontSize: size * 0.4,
        fontWeight: 800,
        fontFamily: '"Noto Serif KR", serif',
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}>
        {initial}
      </div>
    </div>
  );
}

// ───────────────────────────── Avatar ─────────────────────────────
function Avatar({ name, size = 24 }) {
  const initial = (name || "?").charAt(0);
  // 이름 → 색상
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, oklch(0.78 0.10 ${hue}), oklch(0.62 0.13 ${hue}))`,
      color: "white",
      fontSize: size * 0.45,
      fontWeight: 600,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 0 0 1.5px var(--bg-card)",
      fontFamily: '"Noto Sans KR", system-ui',
    }}>
      {initial}
    </div>
  );
}

// ───────────────────────────── Pill ─────────────────────────────
function Pill({ children, tone = "neutral", size = "sm" }) {
  const tones = {
    neutral: { bg: "var(--pill-neutral-bg)", fg: "var(--pill-neutral-fg)", border: "var(--pill-neutral-border)" },
    accent:  { bg: "var(--pill-accent-bg)",  fg: "var(--pill-accent-fg)",  border: "var(--pill-accent-border)" },
    success: { bg: "var(--pill-success-bg)", fg: "var(--pill-success-fg)", border: "var(--pill-success-border)" },
    warn:    { bg: "var(--pill-warn-bg)",    fg: "var(--pill-warn-fg)",    border: "var(--pill-warn-border)" },
  };
  const c = tones[tone] || tones.neutral;
  const sizes = {
    xs: { padding: "1px 6px", fontSize: 10.5, height: 18, gap: 4 },
    sm: { padding: "2px 8px", fontSize: 11.5, height: 22, gap: 5 },
    md: { padding: "3px 10px", fontSize: 12.5, height: 26, gap: 6 },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      ...sizes[size],
      background: c.bg, color: c.fg, border: `0.5px solid ${c.border}`,
      borderRadius: 999, fontWeight: 500, letterSpacing: "-0.01em",
      whiteSpace: "nowrap", lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
    }}>
      {children}
    </span>
  );
}

// ───────────────────────────── Icons ─────────────────────────────
const Icon = {
  network: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 7.2v9.6M10.4 17.4 6.6 18.5M13.6 17.4l3.8 1.1"/></svg>,
  list: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  chart: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 16l4-6 4 3 5-7"/></svg>,
  link: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>,
  book: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5"/><path d="M4 4.5v18M9 6h7M9 10h7"/></svg>,
  users: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trend: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>,
  search: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  filter: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>,
  zoomIn: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-3.5-3.5"/></svg>,
  zoomOut: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-3.5-3.5"/></svg>,
  fit: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/></svg>,
  reset: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>,
  arrowRight: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  arrowLeft: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>,
  close: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  trash: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  plus: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  check: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  external: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>,
  dot: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>,
  sliders: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>,
  sparkle: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>,
  command: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>,
  download: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  more: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>,
  caret: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  layout: (p) => <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 12h6"/></svg>,
};

Object.assign(window, { BookCover, BookCoverCircle, Avatar, Pill, Icon });
