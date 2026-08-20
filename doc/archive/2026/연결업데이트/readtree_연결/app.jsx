// app.jsx — 메인 대시보드 컨테이너
const { useState, useEffect, useMemo } = React;

function App() {
  const [tweaks, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [tab, setTab] = useState("graph");
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [hoveredBookId, setHoveredBookId] = useState(null);
  const [userFilter, setUserFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [edges, setEdges] = useState(window.MOCK_EDGES);
  const [showCreate, setShowCreate] = useState(false);

  // 사용자 필터 적용
  const filteredEdges = useMemo(() => {
    if (userFilter === "all") return edges;
    return edges.filter((e) => e.user === userFilter);
  }, [edges, userFilter]);

  const filteredBooks = useMemo(() => {
    if (userFilter === "all") return window.MOCK_BOOKS;
    const ids = new Set();
    for (const e of filteredEdges) { ids.add(e.source); ids.add(e.target); }
    return window.MOCK_BOOKS.filter((b) => ids.has(b.id));
  }, [filteredEdges, userFilter]);

  const stats = useMemo(() => {
    const books = filteredBooks.length;
    const total = filteredEdges.length;
    const users = new Set(filteredEdges.map((e) => e.user)).size;
    const avg = books > 0 ? Math.round((total / books) * 10) / 10 : 0;
    return { totalRelations: total, uniqueBooks: books, usersWithRelations: users, avgConnectionsPerBook: avg };
  }, [filteredEdges, filteredBooks]);

  const selectedBook = useMemo(() => filteredBooks.find((b) => b.id === selectedBookId), [filteredBooks, selectedBookId]);

  const handleDelete = (sId, tId) => {
    setEdges((prev) => prev.filter((e) => !(
      (e.source === sId && e.target === tId) || (e.source === tId && e.target === sId)
    )));
  };

  // 키보드 단축키
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setTab("table"); document.querySelector(".search-box input")?.focus(); }
      if (e.key === "Escape") setSelectedBookId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isDark = tweaks.theme === "dark";
  const density = tweaks.density;
  const variant = tweaks.variant;

  return (
    <div className={`app variant-${variant} density-${density}`} data-theme={isDark ? "dark" : "light"}>
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon.book size={16} /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>ReadingTree</div>
            <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>Admin Console</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">Overview</div>
          <NavItem icon={Icon.chart} label="대시보드" />
          <NavItem icon={Icon.users} label="사용자" />
          <NavItem icon={Icon.book} label="도서" />
          <div className="nav-section">Relations</div>
          <NavItem icon={Icon.network} label="책 연결 관계" active />
          <NavItem icon={Icon.sparkle} label="AI 추천" />
          <div className="nav-section">System</div>
          <NavItem icon={Icon.sliders} label="설정" />
        </nav>

        <div className="sidebar-foot">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name="Admin" size={28} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>관리자</div>
              <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>admin@readtree.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 */}
      <main className="main">
        {/* 톱바 */}
        <header className="topbar">
          <div className="crumb">
            <span style={{ color: "var(--text-tertiary)" }}>Admin</span>
            <Icon.caret size={12} />
            <span>책 연결 관계</span>
          </div>
          <div className="topbar-actions">
            <div className="search-mini" onClick={() => { setTab("table"); setTimeout(() => document.querySelector(".search-box input")?.focus(), 50); }}>
              <Icon.search size={13} />
              <span>검색…</span>
              <kbd className="kbd">⌘K</kbd>
            </div>
            <div className="user-select">
              <Icon.users size={13} />
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                <option value="all">전체 사용자</option>
                {window.MOCK_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.relationCount})</option>
                ))}
              </select>
              <Icon.caret size={12} />
            </div>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Icon.plus size={13} /> 새 연결
            </button>
          </div>
        </header>

        {/* 페이지 헤더 */}
        <div className="page-hd">
          <div>
            <h1 className="page-title">책 연결 관계</h1>
            <p className="page-sub">사용자가 만든 책 사이의 연결을 한눈에 보고, 관계 그래프로 탐색합니다.</p>
          </div>
        </div>

        {/* KPI */}
        <div className="kpi-row">
          <KpiCard label="총 연결" value={stats.totalRelations} delta="+3 이번 주" tone="accent" icon={Icon.link} />
          <KpiCard label="참여 책" value={stats.uniqueBooks} delta={`+${Math.max(1, Math.round(stats.uniqueBooks * 0.08))} 이번 주`} tone="blue" icon={Icon.book} />
          <KpiCard label="참여 사용자" value={stats.usersWithRelations} delta="+1 이번 주" tone="emerald" icon={Icon.users} />
          <KpiCard label="평균 연결/책" value={stats.avgConnectionsPerBook} decimals={1} delta="+0.4" tone="amber" icon={Icon.trend} />
        </div>

        {/* 탭 */}
        <div className="tabs">
          {[
            { k: "graph", label: "관계 그래프", ic: Icon.network },
            { k: "table", label: "연결 목록", ic: Icon.list },
            { k: "stats", label: "통계", ic: Icon.chart },
          ].map((t) => (
            <button key={t.k} className={`tab ${tab === t.k ? "active" : ""}`} onClick={() => setTab(t.k)}>
              <t.ic size={14} /> {t.label}
              {tab === t.k && <span className="tab-bar" />}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-tertiary)" }}>
            <Pill size="xs" tone="success">실시간</Pill>
          </div>
        </div>

        {/* 콘텐츠 + 인스펙터 분할 */}
        <div className={`content-split ${tab === "graph" && selectedBook ? "split-open" : ""}`}>
          <div className="content">
            {tab === "graph" && (
              <BookRelationsGraph
                books={filteredBooks}
                edges={filteredEdges}
                selectedBookId={selectedBookId}
                hoveredBookId={hoveredBookId}
                onSelect={setSelectedBookId}
                onHover={setHoveredBookId}
                density={density}
              />
            )}
            {tab === "table" && (
              <RelationsList
                edges={edges}
                books={window.MOCK_BOOKS}
                onSelectBook={(id) => { setSelectedBookId(id); setTab("graph"); }}
                query={query}
                setQuery={setQuery}
                userFilter={userFilter}
              />
            )}
            {tab === "stats" && (
              <StatsView
                books={filteredBooks}
                edges={filteredEdges}
                top={window.MOCK_TOP}
                genres={window.MOCK_GENRES}
                timeline={window.MOCK_TIMELINE}
                onSelectBook={(id) => { setSelectedBookId(id); setTab("graph"); }}
              />
            )}
          </div>

          {tab === "graph" && (
            <aside className={`inspector-wrap ${selectedBook ? "open" : ""}`}>
              <Inspector
                book={selectedBook}
                edges={edges}
                books={window.MOCK_BOOKS}
                onClose={() => setSelectedBookId(null)}
                onSelect={setSelectedBookId}
                onDelete={handleDelete}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Create modal */}
      {showCreate && <CreateRelationModal onClose={() => setShowCreate(false)} books={window.MOCK_BOOKS} />}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="외관" />
        <TweakRadio label="테마" value={tweaks.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="밀도" value={tweaks.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakSection label="레이아웃" />
        <TweakRadio label="스타일" value={tweaks.variant} options={["editorial", "cartograph", "constellation"]} onChange={(v) => setTweak("variant", v)} />
        <TweakSection label="색감" />
        <TweakColor label="강조색" value={tweaks.accent} onChange={(v) => setTweak("accent", v)} />
      </TweaksPanel>
    </div>
  );
}

function NavItem({ icon: I, label, active }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`}>
      <I size={14} />
      <span>{label}</span>
    </button>
  );
}

function KpiCard({ label, value, decimals = 0, delta, tone, icon: I }) {
  const display = decimals > 0 ? value.toFixed(decimals) : value.toLocaleString();
  return (
    <div className={`kpi tone-${tone}`}>
      <div className="kpi-hd">
        <div className="kpi-icon"><I size={14} /></div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-num">{display}</div>
      <div className="kpi-delta">
        <Icon.trend size={11} /> {delta}
      </div>
    </div>
  );
}

function CreateRelationModal({ onClose, books }) {
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="modal-title">새 연결 만들기</div>
            <div className="modal-sub">두 권의 책을 선택하고 연결 사유를 입력하세요.</div>
          </div>
          <button className="btn-icon-sm" onClick={onClose}><Icon.close size={14} /></button>
        </div>

        <div className="step-bar">
          {["출발 책", "도착 책", "사유"].map((s, i) => (
            <div key={i} className={`step ${i <= step ? "step-on" : ""} ${i < step ? "step-done" : ""}`}>
              <div className="step-num">{i < step ? <Icon.check size={12} /> : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step <= 1 && (
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
                {step === 0 ? "연결의 출발이 될 책을 선택하세요." : "연결할 도착 책을 선택하세요."}
              </div>
              <div className="book-picker">
                {books.slice(0, 12).map((b) => {
                  const isSel = step === 0 ? src === b.id : tgt === b.id;
                  const isDisabled = step === 1 && b.id === src;
                  return (
                    <button
                      key={b.id}
                      className={`book-pick ${isSel ? "selected" : ""}`}
                      disabled={isDisabled}
                      onClick={() => step === 0 ? setSrc(b.id) : setTgt(b.id)}
                    >
                      <BookCover book={b} size={48} />
                      <div className="book-pick-meta">
                        <div className="book-pick-title">{b.title}</div>
                        <div className="book-pick-author">{b.author}</div>
                      </div>
                      {isSel && <div className="book-pick-check"><Icon.check size={11} /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="connection-preview">
                <BookCover book={books.find((b) => b.id === src)} size={64} />
                <div className="connection-line"><div className="connection-dot" /></div>
                <BookCover book={books.find((b) => b.id === tgt)} size={64} />
              </div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, marginTop: 16, color: "var(--text-secondary)" }}>연결 사유</label>
              <textarea
                className="textarea"
                placeholder="예: 같은 작가의 후속작, 비슷한 주제, 동시기에 읽음…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <div className="quick-tags">
                {["시리즈", "동일 작가", "유사 주제", "교차 분야", "동시기 독서"].map((t) => (
                  <button key={t} className="tag" onClick={() => setReason(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}><Icon.arrowLeft size={13} /> 이전</button>}
          <div style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={onClose}>취소</button>
          {step < 2 ? (
            <button className="btn-primary" disabled={(step === 0 && !src) || (step === 1 && !tgt)} onClick={() => setStep(step + 1)}>
              다음 <Icon.arrowRight size={13} />
            </button>
          ) : (
            <button className="btn-primary" disabled={!reason} onClick={onClose}>
              <Icon.check size={13} /> 연결 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

window.App = App;
