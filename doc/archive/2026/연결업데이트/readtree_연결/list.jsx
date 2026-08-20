// list.jsx — 연결 목록 탭, 통계 탭
const { useState: useState_l, useMemo: useMemo_l } = React;

function RelationsList({ edges, books, onSelectBook, query, setQuery, userFilter }) {
  const filtered = useMemo_l(() => {
    return edges.filter((e) => {
      if (userFilter && userFilter !== "all" && e.user !== userFilter) return false;
      if (!query) return true;
      const s = books.find((b) => b.id === e.source);
      const t = books.find((b) => b.id === e.target);
      const q = query.toLowerCase();
      return [s?.title, s?.author, t?.title, t?.author, e.reason]
        .filter(Boolean).some((x) => x.toLowerCase().includes(q));
    });
  }, [edges, books, query, userFilter]);

  return (
    <div className="rel-table">
      <div className="rel-table-hd">
        <div className="search-box">
          <Icon.search size={14} />
          <input
            type="text"
            placeholder="책 제목, 저자, 사유 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button className="search-clear" onClick={() => setQuery("")}><Icon.close size={12} /></button>}
          <kbd className="kbd">⌘K</kbd>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ghost"><Icon.filter size={13} /> 필터</button>
          <button className="btn-ghost"><Icon.download size={13} /> 내보내기</button>
        </div>
      </div>

      <div className="rel-table-body">
        <div className="rel-table-row rel-table-thead">
          <div style={{ flex: "1.2 1 0" }}>출발 책</div>
          <div style={{ width: 36, textAlign: "center" }}></div>
          <div style={{ flex: "1.2 1 0" }}>도착 책</div>
          <div style={{ width: 100 }}>사유</div>
          <div style={{ width: 80 }}>등록자</div>
          <div style={{ width: 92 }}>날짜</div>
          <div style={{ width: 36 }}></div>
        </div>
        {filtered.map((e, i) => {
          const s = books.find((b) => b.id === e.source);
          const t = books.find((b) => b.id === e.target);
          const u = window.MOCK_USERS.find((x) => x.id === e.user);
          if (!s || !t) return null;
          return (
            <div key={i} className="rel-table-row">
              <button className="cell-book" onClick={() => onSelectBook(s.id)}>
                <BookCover book={s} size={28} radius={3} />
                <div style={{ minWidth: 0 }}>
                  <div className="cell-book-title">{s.title}</div>
                  <div className="cell-book-author">{s.author}</div>
                </div>
              </button>
              <div style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
                <Icon.arrowRight size={14} />
              </div>
              <button className="cell-book" onClick={() => onSelectBook(t.id)}>
                <BookCover book={t} size={28} radius={3} />
                <div style={{ minWidth: 0 }}>
                  <div className="cell-book-title">{t.title}</div>
                  <div className="cell-book-author">{t.author}</div>
                </div>
              </button>
              <div style={{ width: 100 }}>
                <Pill size="xs" tone="neutral">{e.reason}</Pill>
              </div>
              <div style={{ width: 80, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                <Avatar name={u?.name} size={18} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u?.name}</span>
              </div>
              <div style={{ width: 92, fontSize: 12, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {new Date(e.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </div>
              <div style={{ width: 36 }}>
                <button className="btn-icon-sm"><Icon.more size={14} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function StatsView({ books, edges, top, genres, timeline, onSelectBook }) {
  const max = Math.max(...timeline.map((d) => d.count), 1);
  return (
    <div className="stats-grid">
      {/* Top connected */}
      <div className="card">
        <div className="card-hd">
          <span><Icon.trend size={14} /> 연결이 많은 책 Top 10</span>
        </div>
        <div className="top-list">
          {top.map((b, i) => (
            <button key={b.userBookId} className="top-row" onClick={() => onSelectBook(b.userBookId)}>
              <div className="rank-num">{String(i + 1).padStart(2, "0")}</div>
              <BookCover book={b} size={32} radius={3} />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div className="top-title">{b.title}</div>
                <div className="top-author">{b.author} · {b.userName}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="bar-bg" style={{ width: 60 }}>
                  <div className="bar-fg" style={{ width: `${(b.connectionCount / top[0].connectionCount) * 100}%`, background: `oklch(0.6 0.16 ${b.hue})` }} />
                </div>
                <div style={{ width: 22, textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{b.connectionCount}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Genre distribution */}
      <div className="card">
        <div className="card-hd">
          <span><Icon.layout size={14} /> 장르 분포</span>
        </div>
        <div style={{ padding: "8px 0 4px" }}>
          {genres.map((g) => {
            const total = genres.reduce((s, x) => s + x.count, 0);
            const pct = (g.count / total) * 100;
            return (
              <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: `oklch(0.6 0.16 ${g.hue})` }} />
                <div style={{ width: 60, fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500 }}>{g.name}</div>
                <div className="bar-bg" style={{ flex: 1 }}>
                  <div className="bar-fg" style={{ width: `${pct}%`, background: `oklch(0.62 0.14 ${g.hue})` }} />
                </div>
                <div style={{ width: 30, fontSize: 12, color: "var(--text-tertiary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{g.count}권</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-hd">
          <span><Icon.trend size={14} /> 최근 28일 연결 추이</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500 }}>총 {timeline.reduce((s, d) => s + d.count, 0)}건</span>
        </div>
        <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "flex-end", gap: 4, height: 110 }}>
          {timeline.map((d, i) => (
            <div key={i} title={`${d.date}: ${d.count}건`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%",
                height: `${(d.count / max) * 80}px`,
                minHeight: d.count > 0 ? 4 : 0,
                background: d.count > 0 ? "linear-gradient(180deg, var(--accent), var(--accent-soft))" : "var(--bg-subtle)",
                borderRadius: 3,
                transition: "height 300ms",
              }} />
              {i % 4 === 0 && <div style={{ fontSize: 9.5, color: "var(--text-tertiary)" }}>{d.date.slice(5).replace("-", "/")}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.RelationsList = RelationsList;
window.StatsView = StatsView;
