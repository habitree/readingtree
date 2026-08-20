// inspector.jsx — 우측 인스펙터 패널 (선택된 책 상세)
const { useMemo: useMemo_i } = React;

function Inspector({ book, edges, books, onClose, onSelect, onDelete }) {
  if (!book) return (
    <div className="inspector-empty">
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "var(--text-tertiary)" }}>
        <Icon.network size={24} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>책을 선택하세요</div>
      <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", lineHeight: 1.5, textAlign: "center", maxWidth: 220 }}>
        그래프나 목록에서 책을 클릭하면<br/>연결 정보를 확인할 수 있어요.
      </div>
    </div>
  );

  const connected = useMemo_i(() => {
    const list = [];
    for (const e of edges) {
      if (e.source === book.id) {
        const b = books.find((x) => x.id === e.target);
        if (b) list.push({ book: b, edge: e });
      } else if (e.target === book.id) {
        const b = books.find((x) => x.id === e.source);
        if (b) list.push({ book: b, edge: e });
      }
    }
    return list;
  }, [book, edges, books]);

  const user = window.MOCK_USERS.find((u) => u.id === book.user);

  return (
    <div className="inspector">
      {/* 헤더 — 큰 표지 + 메타 */}
      <div className="inspector-hero">
        <button className="inspector-close" onClick={onClose}><Icon.close size={14} /></button>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <BookCover book={book} size={84} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Pill tone="accent" size="xs">{book.genre}</Pill>
            <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25, margin: "8px 0 4px", letterSpacing: "-0.02em", color: "var(--text-primary)", fontFamily: '"Noto Serif KR", serif' }}>
              {book.title}
            </h2>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 10 }}>{book.author}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-tertiary)" }}>
              <Avatar name={user?.name} size={18} />
              <span>{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-mini">
            <div className="stat-mini-num">{book.connectionCount}</div>
            <div className="stat-mini-lbl">총 연결</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini-num">{new Set(connected.map((c) => c.book.genre)).size}</div>
            <div className="stat-mini-lbl">교차 장르</div>
          </div>
          <div className="stat-mini">
            <div className="stat-mini-num">{new Set(connected.map((c) => c.book.user)).size}</div>
            <div className="stat-mini-lbl">교차 유저</div>
          </div>
        </div>
      </div>

      {/* 연결 목록 */}
      <div className="inspector-section">
        <div className="section-hd">
          <span>연결된 책 <span style={{ color: "var(--text-tertiary)", fontWeight: 500, marginLeft: 4 }}>{connected.length}</span></span>
          <button className="btn-ghost-sm"><Icon.plus size={12} /> 추가</button>
        </div>
        <div className="rel-list">
          {connected.map(({ book: b, edge }, i) => (
            <button key={i} className="rel-item" onClick={() => onSelect(b.id)}>
              <BookCover book={b} size={36} />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 1 }}>{b.author} · {edge.reason}</div>
              </div>
              <button className="rel-del" onClick={(e) => { e.stopPropagation(); onDelete(book.id, b.id); }} title="연결 끊기">
                <Icon.trash size={13} />
              </button>
            </button>
          ))}
          {connected.length === 0 && (
            <div style={{ padding: "20px 12px", fontSize: 12.5, color: "var(--text-tertiary)", textAlign: "center" }}>
              연결된 책이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.Inspector = Inspector;
