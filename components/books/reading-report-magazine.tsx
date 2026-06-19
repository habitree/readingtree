"use client";

/**
 * AI 독서 리포트 — 매거진형 프레젠테이션 (단권 리포트 공용 본문)
 *
 * `/books/[id]/report`(본인)와 `/share/reports/[id]`(공개) 양쪽에서 사용한다.
 * 디자인: ReadTree Reading Review (다크그린 + 골드, 고정 팔레트 / 테마 비의존).
 * 데이터: parseReportSections로 나눈 마크다운 섹션 + 실제 독서 통계.
 */

import type { ReactNode } from "react";
import type { ReportSection } from "@/types/ai/report";
import {
  mdToPlain,
  parseInsightItems,
  parseBlocks,
  firstQuote,
  firstSentence,
  type Block,
} from "@/lib/utils/report-magazine";

/* ── 노트 타입 메타 (기록 분포) ───────────────────────────── */
const NOTE_TYPE_LABEL: Record<string, string> = {
  quote: "인용",
  memo: "메모",
  transcription: "필사",
  progress: "여정",
  photo: "사진",
};
const NOTE_TYPE_BAR: Record<string, string> = {
  quote: "linear-gradient(90deg,#E0B65E,#C68A2E)",
  memo: "#9A9079",
  transcription: "#4E8B5B",
  progress: "#5A7D9A",
  photo: "#B5728A",
};
const NOTE_TYPE_ORDER = ["quote", "memo", "transcription", "progress", "photo"];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getMonth() + 1).padStart(2, "0")} · ${String(d.getDate()).padStart(2, "0")}`;
}
function fmtFullDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export interface ReadingReportMagazineProps {
  bookTitle: string;
  author?: string | null;
  coverImageUrl?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: string;
  totalPages?: number | null;
  noteCount: number;
  /** 회독 수 */
  completedCount?: number;
  /** 노트 타입별 개수 */
  noteTypeCounts?: Record<string, number>;
  /** 기록한 날 수 (독서 일수) */
  readingDays?: number;
  /** 나의 N번째 책 / Vol.N */
  bookOrdinal?: number | null;
  /** 발행일 (저장/생성 시각) */
  publishedAt?: string | null;
  /** 파싱된 마크다운 섹션 */
  sections: ReportSection[];
  /** 공유 카드 노출 여부 */
  showShareCard?: boolean;
  /** 하단 액션바 슬롯 (본인 뷰: 뒤로/새로생성/저장/공유) */
  actionSlot?: ReactNode;
  /** 추가 슬롯 (공개 뷰: 반응/공개 기록 등) */
  extraSlot?: ReactNode;
}

export function ReadingReportMagazine({
  bookTitle,
  author,
  coverImageUrl,
  startedAt,
  completedAt,
  status,
  totalPages,
  noteCount,
  completedCount = 1,
  noteTypeCounts = {},
  readingDays = 0,
  bookOrdinal,
  publishedAt,
  sections,
  showShareCard = true,
  actionSlot,
  extraSlot,
}: ReadingReportMagazineProps) {
  /* ── 섹션 매핑 ── */
  const overview = sections.find((s) => s.id === "book-overview");
  const insights = sections.find((s) => s.id === "key-insights");
  const quotes = sections.find((s) => s.id === "memorable-quotes");
  const thoughts = sections.find((s) => s.id === "my-thoughts");
  const journeyText = sections.find((s) => s.id === "reading-journey");
  const summary = sections.find((s) => s.id === "summary");
  const knownIds = new Set([
    "book-overview",
    "key-insights",
    "memorable-quotes",
    "my-thoughts",
    "reading-journey",
    "summary",
  ]);
  const extras = sections.filter((s) => !knownIds.has(s.id));

  /* ── 통계 ── */
  const totalTyped = NOTE_TYPE_ORDER.reduce((a, t) => a + (noteTypeCounts[t] || 0), 0);
  const dist = NOTE_TYPE_ORDER.map((t) => ({
    type: t,
    label: NOTE_TYPE_LABEL[t],
    count: noteTypeCounts[t] || 0,
    pct: totalTyped > 0 ? Math.round(((noteTypeCounts[t] || 0) / totalTyped) * 100) : 0,
  })).filter((d) => d.count > 0);
  const hasJourney = dist.length > 0 || !!startedAt || !!completedAt;

  /* ── 표지 지표 밴드 (최대 4) ── */
  const metrics: { value: string; label: string }[] = [{ value: String(noteCount), label: "기록" }];
  if (readingDays > 0) metrics.push({ value: String(readingDays), label: "독서일수" });
  if (noteTypeCounts.quote) metrics.push({ value: String(noteTypeCounts.quote), label: "인용" });
  if (completedCount > 1) metrics.push({ value: String(completedCount), label: "회독" });
  else if (totalPages) metrics.push({ value: totalPages.toLocaleString(), label: "완독한 쪽" });

  /* ── 표지 커버라인 (핵심 인사이트 상위 3) ── */
  const coverlines = insights ? parseInsightItems(insights.content).slice(0, 3) : [];

  /* ── 로마 넘버 ── */
  const order: string[] = [];
  if (overview) order.push("book-overview");
  if (insights) order.push("key-insights");
  if (thoughts) order.push("my-thoughts");
  if (hasJourney) order.push("journey");
  extras.forEach((s) => order.push(s.id));
  if (summary) order.push("summary");
  const numeral: Record<string, string> = {};
  order.forEach((k, i) => (numeral[k] = ROMAN[i + 1] || String(i + 1)));

  const overviewBlocks = overview ? parseBlocks(overview.content) : [];
  const insightItems = insights ? parseInsightItems(insights.content) : [];
  const featureQuote = quotes ? firstQuote(quotes.content) : null;
  const thoughtBlocks = thoughts ? parseBlocks(thoughts.content) : [];
  const journeyBlocks = journeyText ? parseBlocks(journeyText.content) : [];
  const summaryText = summary
    ? parseBlocks(summary.content)
        .filter((b) => b.kind === "p")
        .map((b) => (b.kind === "p" ? b.text : ""))
        .join(" ") || mdToPlain(summary.content)
    : "";

  const shareLine =
    firstSentence(summary?.content || "") ||
    (featureQuote?.text ?? "") ||
    firstSentence(overview?.content || "");

  const startD = fmtDate(startedAt);
  const endD = fmtDate(completedAt);
  const ordinalText =
    typeof bookOrdinal === "number" && bookOrdinal > 0 ? `나의 ${bookOrdinal}번째 책` : null;
  const volText =
    typeof bookOrdinal === "number" && bookOrdinal > 0
      ? `Vol. ${bookOrdinal}`
      : completedAt
        ? `${new Date(completedAt).getFullYear()}`
        : null;

  return (
    <div className="rrm">
      <style>{RRM_CSS}</style>

      <div className="rrm-paper">
        {/* ═══════════ 표지 ═══════════ */}
        <section className="rrm-cover">
          <div className="rrm-cover-glow" />
          <div className="rrm-cover-kanji">読</div>
          <div className="rrm-cover-frame">
            {/* 마스트헤드 */}
            <div style={{ textAlign: "center" }}>
              <div className="rrm-masthead-tag">EST. 2026 — 기록하는 만큼 자라는 독서</div>
              <div className="rrm-wordmark">READTREE</div>
              <div className="rrm-rule-row">
                <span className="rrm-rule rrm-rule-l" />
                <span className="rrm-rule-label">READING REVIEW</span>
                <span className="rrm-rule rrm-rule-r" />
              </div>
            </div>

            <div className="rrm-cover-meta">
              <span>{volText ?? "READING REVIEW"}</span>
              <span>{ordinalText ?? (author || "")}</span>
            </div>

            {/* 표지 비주얼 */}
            <div className="rrm-cover-visual">
              <div className="rrm-cover-book-wrap">
                <div className="rrm-cover-book-shadow" />
                {coverImageUrl ? (
                  <img src={coverImageUrl} alt={bookTitle} className="rrm-cover-book-img" />
                ) : (
                  <div className="rrm-cover-book-mock">
                    {author && <span className="rrm-mock-author">{author}</span>}
                    <span className="rrm-mock-title">{bookTitle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 타이틀 */}
            <div style={{ textAlign: "center" }}>
              <div className="rrm-cover-pretitle">a reading on</div>
              <h1 className="rrm-cover-title">{bookTitle}</h1>
              {author && <div className="rrm-cover-subtitle">{author}</div>}
            </div>

            {/* 커버라인 */}
            {coverlines.length > 0 && (
              <div className="rrm-coverlines">
                {coverlines.map((c, i) => (
                  <div key={i}>
                    {i > 0 && <div className="rrm-coverline-div" />}
                    <div className="rrm-coverline">
                      <span className="rrm-coverline-num">{["i", "ii", "iii"][i]}.</span>
                      <span className="rrm-coverline-text">{c.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 지표 밴드 */}
            <div className="rrm-metrics">
              {metrics.map((m, i) => (
                <div key={m.label} style={{ display: "contents" }}>
                  {i > 0 && <div className="rrm-metric-div" />}
                  <div className="rrm-metric">
                    <div className="rrm-metric-value">{m.value}</div>
                    <div className="rrm-metric-label">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ 본문 ═══════════ */}
        <div className="rrm-body">
          {/* I 개요 */}
          {overview && overviewBlocks.length > 0 && (
            <section className="rrm-section">
              <SectionHead numeral={numeral["book-overview"]} kicker={overview.title} />
              <RichBody blocks={overviewBlocks} dropcap />
            </section>
          )}

          {(overviewBlocks.length > 0 || insightItems.length > 0) && <Divider />}

          {/* II 핵심 인사이트 */}
          {insights && insightItems.length > 0 && (
            <section className="rrm-section">
              <SectionHead numeral={numeral["key-insights"]} kicker={insights.title} />
              <div className="rrm-insights">
                {insightItems.map((it, i) => (
                  <div key={i} className="rrm-insight">
                    <span className="rrm-insight-num">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="rrm-insight-title">{it.title}</div>
                      {it.body && <p className="rrm-insight-body">{it.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 인상 깊은 구절 (feature) */}
          {featureQuote && (
            <section className="rrm-quote">
              <div className="rrm-quote-glow" />
              <div className="rrm-quote-frame" />
              <div className="rrm-quote-inner">
                <div className="rrm-quote-mark">“</div>
                <p className="rrm-quote-text">{featureQuote.text}</p>
                {featureQuote.attribution && (
                  <div className="rrm-quote-attr-row">
                    <span className="rrm-quote-attr-rule" />
                    <span className="rrm-quote-attr">{featureQuote.attribution}</span>
                    <span className="rrm-quote-attr-rule" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* III 나의 기록에서 */}
          {thoughts && thoughtBlocks.length > 0 && (
            <section className="rrm-section">
              <SectionHead numeral={numeral["my-thoughts"]} kicker={thoughts.title} />
              <RichBody blocks={thoughtBlocks} />
            </section>
          )}

          {((thoughts && thoughtBlocks.length > 0) || hasJourney) && <Divider />}

          {/* IV 여정 + 데이터 */}
          {hasJourney && (
            <section className="rrm-section">
              <SectionHead
                numeral={numeral["journey"]}
                kicker={readingDays > 0 ? `${readingDays}일의 여정` : "독서의 여정"}
              />
              {journeyBlocks.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <RichBody blocks={journeyBlocks} />
                </div>
              )}

              {/* 타임라인 */}
              {(startD || endD) && (
                <div className="rrm-timeline">
                  {startD && (
                    <div className="rrm-tl-node">
                      <div className="rrm-tl-date">{startD}</div>
                      <div className="rrm-tl-label">읽기 시작</div>
                    </div>
                  )}
                  {startD && endD && <div className="rrm-tl-dash">—</div>}
                  {endD && (
                    <div className="rrm-tl-node rrm-tl-node-final">
                      <div className="rrm-tl-date rrm-tl-date-final">{endD}</div>
                      <div className="rrm-tl-label rrm-tl-label-final">
                        {completedCount > 1 ? `${completedCount}회독 완독 ✦` : "완독 ✦"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 기록 분포 + 보조 지표 */}
              {dist.length > 0 && (
                <div className="rrm-data-row">
                  <div className="rrm-dist">
                    <div className="rrm-dist-head">남긴 기록 {noteCount}개의 결</div>
                    <div className="rrm-dist-bars">
                      {dist.map((d) => (
                        <div key={d.type} className="rrm-dist-bar">
                          <span className="rrm-dist-label">{d.label}</span>
                          <div className="rrm-dist-track">
                            <div
                              className="rrm-dist-fill"
                              style={{ width: `${d.pct}%`, background: NOTE_TYPE_BAR[d.type] }}
                            />
                          </div>
                          <span className="rrm-dist-pct">{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rrm-minicards">
                    {readingDays > 0 && (
                      <div className="rrm-minicard">
                        <div className="rrm-minicard-value" style={{ color: "#2A5A32" }}>
                          {readingDays}
                        </div>
                        <div className="rrm-minicard-label">독서 일수</div>
                      </div>
                    )}
                    {totalPages ? (
                      <div className="rrm-minicard">
                        <div className="rrm-minicard-value" style={{ color: "#C68A2E" }}>
                          {totalPages.toLocaleString()}
                        </div>
                        <div className="rrm-minicard-label">
                          {status === "completed" ? "완독한 쪽" : "총 쪽수"}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 추가 섹션 (토론/실천 등) */}
          {extras.map((s) => (
            <section className="rrm-section" key={s.id}>
              <SectionHead numeral={numeral[s.id]} kicker={s.title} />
              <RichBody blocks={parseBlocks(s.content)} />
            </section>
          ))}
        </div>

        {/* V 종합 (다시 덮으며) */}
        {summary && summaryText && (
          <section className="rrm-closing">
            <div className="rrm-closing-glow" />
            <div className="rrm-closing-inner">
              <div className="rrm-closing-numeral">{numeral["summary"]}</div>
              <div className="rrm-closing-kicker">{cleanKicker(summary.title)}</div>
              <p className="rrm-closing-text">{summaryText}</p>
            </div>
          </section>
        )}

        {/* 공유 카드 */}
        {showShareCard && shareLine && (
          <section className="rrm-share">
            <div className="rrm-share-tag">
              <span className="rrm-share-tag-strong">CAPTURE &amp; SHARE</span>
              <span className="rrm-share-tag-muted">— 이 카드를 캡처해서 공유하세요</span>
            </div>
            <div className="rrm-share-border">
              <div className="rrm-share-card">
                <div className="rrm-share-bigquote">”</div>
                <div className="rrm-share-card-inner">
                  <div className="rrm-share-eyebrow">
                    {volText ? `${volText} · ` : ""}
                    {bookTitle}
                  </div>
                  <p className="rrm-share-line">{shareLine}</p>
                  <div className="rrm-share-foot">
                    <span className="rrm-share-logo">READTREE</span>
                    <span className="rrm-share-tagline">기록하는 만큼 자라는 독서</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 액션바 슬롯 */}
        {actionSlot && <div className="rrm-actions">{actionSlot}</div>}

        {/* 추가 슬롯 (반응/공개 기록) */}
        {extraSlot && <div className="rrm-extra">{extraSlot}</div>}

        {/* 푸터 */}
        <footer className="rrm-footer">
          <span className="rrm-footer-pub">
            {publishedAt && fmtFullDate(publishedAt)
              ? `발행 ${fmtFullDate(publishedAt)} · `
              : ""}
            ReadTree Reading Review
          </span>
          {volText && <span className="rrm-footer-vol">{volText}</span>}
        </footer>
      </div>
    </div>
  );
}

/* ── 섹션 제목에서 선행 번호("1. ", "2) ") 제거 ── */
function cleanKicker(t: string): string {
  return (t || "").replace(/^\s*\d+\s*[.)]\s*/, "").trim();
}

/* ── 섹션 헤더 (로마숫자 + 키커) ── */
function SectionHead({ numeral, kicker }: { numeral?: string; kicker: string }) {
  return (
    <div className="rrm-sechead">
      {numeral && <div className="rrm-sechead-num">{numeral}</div>}
      <div className="rrm-sechead-kicker">{cleanKicker(kicker)}</div>
    </div>
  );
}

/* ── 본문 렌더러 (문단 / 리스트 / 인용 블록) ── */
function RichBody({ blocks, dropcap }: { blocks: Block[]; dropcap?: boolean }) {
  const dropIndex = dropcap ? blocks.findIndex((b) => b.kind === "p" && !!b.text) : -1;
  return (
    <div className="rrm-rich">
      {blocks.map((b, i) => {
        if (b.kind === "p") {
          if (i === dropIndex) {
            return (
              <p key={i} className="rrm-lead">
                <span className="rrm-dropcap">{b.text.charAt(0)}</span>
                {b.text.slice(1)}
              </p>
            );
          }
          return (
            <p key={i} className="rrm-lead">
              {b.text}
            </p>
          );
        }
        if (b.kind === "list") {
          return (
            <ul key={i} className="rrm-mlist">
              {b.items.map((it, j) => (
                <li key={j}>
                  {it.title && <span className="rrm-mlist-title">{it.title}</span>}
                  {it.body && (
                    <span className="rrm-mlist-body">
                      {it.title ? " — " : ""}
                      {it.body}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <div key={i} className="rrm-pull">
            <span className="rrm-pull-mark">“</span>
            <p className="rrm-pull-text">
              {b.text}
              {b.attribution ? ` — ${b.attribution}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── 장식 디바이더 ── */
function Divider() {
  return (
    <div className="rrm-divider">
      <span className="rrm-divider-rule rrm-divider-l" />
      <span className="rrm-divider-orn">✦ ✦ ✦</span>
      <span className="rrm-divider-rule rrm-divider-r" />
    </div>
  );
}

/* ════════════════════ 스타일 ════════════════════ */
const RRM_CSS = `
.rrm{
  --gold:#E8C77E; --gold2:#C68A2E; --gold3:#9C6512; --gold-soft:#C6A86A;
  --ink:#0C1F12; --green:#2A5A32; --green-d:#143420;
  --paper:#FBF8EF; --paper2:#F4EEDF; --line:#E7DEC8;
  --serif:var(--font-noto-serif-kr),serif;
  --sans:var(--font-noto-sans-kr),sans-serif;
  --lat:var(--font-cormorant),serif;
  background:linear-gradient(180deg,#20271F,#171C16);
  padding:clamp(0px,3vw,40px); font-family:var(--sans);
}
.rrm-paper{
  max-width:880px; margin:0 auto; border-radius:2px;
  background-color:var(--paper);
  background-image:
    radial-gradient(circle at 18% 22%, rgba(198,138,46,.035), transparent 30%),
    radial-gradient(circle at 82% 78%, rgba(42,90,50,.035), transparent 32%);
  box-shadow:0 40px 100px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.04);
  overflow:hidden;
}

/* 표지 */
.rrm-cover{ position:relative; background:var(--ink); overflow:hidden; }
.rrm-cover-glow{ position:absolute; inset:0; background:radial-gradient(120% 65% at 70% -5%, rgba(122,168,120,.20), transparent 55%); }
.rrm-cover-kanji{ position:absolute; right:-7%; bottom:-16%; font-family:var(--serif); font-size:clamp(300px,54vw,580px); line-height:1; color:rgba(255,255,255,.03); font-weight:900; pointer-events:none; }
.rrm-cover-frame{ position:relative; margin:clamp(14px,2.5vw,20px); border:1px solid rgba(232,199,126,.28); padding:clamp(24px,4.5vw,44px) clamp(22px,5vw,56px) clamp(34px,5vw,52px); }
.rrm-masthead-tag{ font-size:clamp(8.5px,1.9vw,10px); font-weight:700; letter-spacing:.5em; color:#9FBF9C; padding-left:.5em; margin-bottom:clamp(12px,2.2vw,16px); }
.rrm-wordmark{ font-family:var(--lat); font-size:clamp(38px,9vw,62px); font-weight:600; letter-spacing:.06em; line-height:1; background:linear-gradient(160deg,#F6E4B4 0%,#E0B65E 40%,#B8842F 70%,#E8C77E 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.rrm-rule-row{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:clamp(10px,2vw,14px); }
.rrm-rule{ height:1px; width:clamp(28px,8vw,60px); }
.rrm-rule-l{ background:linear-gradient(90deg,transparent,rgba(232,199,126,.6)); }
.rrm-rule-r{ background:linear-gradient(90deg,rgba(232,199,126,.6),transparent); }
.rrm-rule-label{ font-size:clamp(9px,2vw,10.5px); font-weight:700; letter-spacing:.36em; color:var(--gold-soft); padding-left:.36em; }
.rrm-cover-meta{ display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:clamp(18px,3vw,24px); padding-top:clamp(12px,2vw,16px); border-top:1px solid rgba(232,199,126,.15); font-family:var(--lat); font-style:italic; font-size:clamp(12px,2.4vw,14px); letter-spacing:.04em; color:#7FA17C; }
.rrm-cover-meta span{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:48%; }
.rrm-cover-visual{ display:flex; justify-content:center; margin:clamp(30px,5vw,46px) 0 clamp(24px,4vw,34px); }
.rrm-cover-book-wrap{ position:relative; }
.rrm-cover-book-shadow{ position:absolute; inset:0; transform:translate(10px,14px) rotate(-3deg); background:rgba(0,0,0,.35); filter:blur(18px); border-radius:4px; }
.rrm-cover-book-img{ position:relative; width:clamp(152px,34vw,196px); aspect-ratio:172/254; object-fit:cover; border-radius:3px; box-shadow:0 18px 40px rgba(0,0,0,.45); transform:rotate(-3deg); display:block; }
.rrm-cover-book-mock{ position:relative; width:clamp(152px,34vw,196px); aspect-ratio:172/254; background:linear-gradient(150deg,#F7F1E2,#E4D9BF); border-radius:3px; box-shadow:inset 0 0 0 1px rgba(156,101,18,.18), 0 18px 40px rgba(0,0,0,.4); display:flex; flex-direction:column; justify-content:center; gap:12px; padding:clamp(17px,3vw,23px) clamp(14px,2.4vw,19px); transform:rotate(-3deg); text-align:center; }
.rrm-mock-author{ font-family:var(--lat); font-size:clamp(9px,1.9vw,11px); letter-spacing:.18em; color:var(--gold3); font-weight:600; }
.rrm-mock-title{ font-family:var(--serif); font-size:clamp(24px,5.5vw,34px); font-weight:900; color:var(--green-d); line-height:1.15; }
.rrm-cover-pretitle{ font-family:var(--lat); font-style:italic; font-size:clamp(14px,2.8vw,17px); color:var(--gold-soft); letter-spacing:.02em; margin-bottom:clamp(8px,1.6vw,12px); }
.rrm-cover-title{ font-family:var(--serif); font-size:clamp(40px,10vw,80px); line-height:1.02; font-weight:900; margin:0; color:#F6F1E4; letter-spacing:-.02em; word-break:keep-all; }
.rrm-cover-subtitle{ font-family:var(--serif); font-size:clamp(12.5px,2.7vw,15px); font-weight:400; color:#9FBF9C; margin-top:clamp(14px,2.6vw,18px); letter-spacing:.04em; }
.rrm-coverlines{ margin:clamp(28px,4.5vw,38px) auto 0; max-width:480px; }
.rrm-coverline{ display:flex; gap:14px; align-items:baseline; }
.rrm-coverline-div{ height:1px; background:rgba(255,255,255,.08); margin:clamp(10px,1.8vw,13px) 0; }
.rrm-coverline-num{ font-family:var(--lat); font-size:clamp(14px,2.8vw,17px); font-weight:600; color:var(--gold); flex:none; font-style:italic; }
.rrm-coverline-text{ font-size:clamp(12.5px,2.6vw,14px); color:#E8F0E5; line-height:1.5; }
.rrm-metrics{ margin:clamp(28px,4.5vw,38px) auto 0; max-width:480px; display:flex; justify-content:space-between; padding:clamp(16px,3vw,20px) 0; border-top:1px solid rgba(232,199,126,.22); border-bottom:1px solid rgba(232,199,126,.22); }
.rrm-metric{ text-align:center; flex:1; }
.rrm-metric-div{ width:1px; background:rgba(255,255,255,.1); }
.rrm-metric-value{ font-family:var(--lat); font-size:clamp(28px,6vw,38px); font-weight:600; color:var(--gold); line-height:1; }
.rrm-metric-label{ font-size:clamp(8.5px,1.7vw,9.5px); letter-spacing:.14em; color:#7FA17C; margin-top:7px; }

/* 본문 */
.rrm-body{ padding:clamp(8px,2vw,18px); }
.rrm-section{ padding:clamp(34px,5vw,60px) clamp(20px,5vw,60px); }
.rrm-sechead{ text-align:center; margin-bottom:clamp(22px,3.5vw,34px); }
.rrm-sechead-num{ font-family:var(--lat); font-style:italic; font-size:clamp(22px,5vw,32px); color:var(--gold2); line-height:1; }
.rrm-sechead-kicker{ font-size:clamp(9.5px,2vw,11px); font-weight:700; letter-spacing:.28em; color:#A9803A; padding-left:.28em; margin-top:8px; }
.rrm-h2{ font-family:var(--serif); font-size:clamp(26px,6vw,44px); line-height:1.2; font-weight:700; color:#1C2B22; margin:0 0 clamp(22px,3.5vw,30px); letter-spacing:-.01em; text-align:center; word-break:keep-all; }
.rrm-lead{ font-family:var(--sans); font-size:clamp(15px,2.6vw,16.5px); line-height:2.05; color:#3A3830; margin:0; max-width:640px; margin-left:auto; margin-right:auto; }
.rrm-dropcap{ font-family:var(--serif); float:left; font-size:clamp(58px,11vw,80px); line-height:.78; font-weight:900; color:var(--green); margin:9px 16px 0 0; }
.rrm-rich{ max-width:640px; margin:0 auto; }
.rrm-rich > * + *{ margin-top:16px; }
.rrm-mlist{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:clamp(12px,2vw,15px); }
.rrm-mlist li{ position:relative; padding-left:24px; font-family:var(--sans); font-size:clamp(14px,2.5vw,15.5px); line-height:1.85; color:#5C5A4F; }
.rrm-mlist li::before{ content:""; position:absolute; left:2px; top:.85em; width:9px; height:1px; background:var(--gold2); }
.rrm-mlist-title{ font-family:var(--serif); font-weight:600; color:#1C2B22; }

/* 인사이트 */
.rrm-insights{ display:flex; flex-direction:column; max-width:680px; margin:0 auto; }
.rrm-insight{ display:flex; gap:clamp(18px,3.5vw,30px); align-items:flex-start; padding:clamp(18px,3vw,26px) 0; border-top:1px solid var(--line); }
.rrm-insight:last-child{ border-bottom:1px solid var(--line); }
.rrm-insight-num{ font-family:var(--lat); font-size:clamp(40px,8vw,60px); font-weight:500; color:var(--gold2); line-height:.82; flex:none; opacity:.9; }
.rrm-insight-title{ font-family:var(--serif); font-size:clamp(18px,3.6vw,23px); font-weight:600; color:#1C2B22; line-height:1.3; word-break:keep-all; }
.rrm-insight-body{ font-size:clamp(14px,2.4vw,15px); line-height:1.9; color:#5C5A4F; margin:8px 0 0; }

/* 인용 (feature) */
.rrm-quote{ position:relative; background:linear-gradient(155deg,#1E4023 0%,#0F2614 100%); overflow:hidden; border-radius:4px; margin:0 clamp(8px,3vw,24px); }
.rrm-quote-glow{ position:absolute; inset:0; background:radial-gradient(90% 60% at 50% 0%, rgba(122,168,120,.16), transparent 60%); }
.rrm-quote-frame{ position:absolute; inset:clamp(12px,2.2vw,18px); border:1px solid rgba(232,199,126,.2); pointer-events:none; border-radius:2px; }
.rrm-quote-inner{ position:relative; padding:clamp(52px,8vw,86px) clamp(28px,6vw,68px); text-align:center; }
.rrm-quote-mark{ font-family:var(--lat); font-size:clamp(70px,14vw,110px); line-height:0; color:rgba(232,199,126,.4); height:clamp(34px,7vw,52px); }
.rrm-quote-text{ font-family:var(--serif); font-size:clamp(22px,5vw,38px); line-height:1.55; font-weight:600; color:#F6F1E4; margin:0 auto; max-width:600px; word-break:keep-all; }
.rrm-quote-attr-row{ display:flex; align-items:center; justify-content:center; gap:12px; margin-top:clamp(20px,4vw,28px); }
.rrm-quote-attr-rule{ height:1px; width:24px; background:rgba(232,199,126,.5); }
.rrm-quote-attr{ font-size:clamp(10px,2.2vw,11.5px); letter-spacing:.16em; color:var(--gold-soft); }

/* 풀쿼트 (나의 생각) */
.rrm-pull{ max-width:640px; margin:0 auto; position:relative; padding:clamp(22px,4vw,30px) clamp(24px,4vw,34px); background:linear-gradient(135deg,#F4EEDF,#F0E8D6); border-radius:4px; box-shadow:inset 0 0 0 1px rgba(198,138,46,.18); }
.rrm-pull-mark{ position:absolute; left:clamp(20px,4vw,30px); top:-2px; font-family:var(--lat); font-size:clamp(48px,9vw,68px); color:rgba(198,138,46,.3); line-height:1; }
.rrm-pull-text{ font-family:var(--serif); font-size:clamp(17px,3.4vw,22px); line-height:1.7; font-weight:500; font-style:italic; color:#1E4023; margin:0; padding-left:clamp(20px,4vw,30px); word-break:keep-all; }

/* 디바이더 */
.rrm-divider{ display:flex; align-items:center; justify-content:center; gap:16px; padding:clamp(6px,1.5vw,12px) clamp(20px,5vw,60px); }
.rrm-divider-rule{ height:1px; flex:1; max-width:160px; }
.rrm-divider-l{ background:linear-gradient(90deg,transparent,#D8C9A4); }
.rrm-divider-r{ background:linear-gradient(90deg,#D8C9A4,transparent); }
.rrm-divider-orn{ font-size:9px; color:var(--gold2); letter-spacing:.3em; }

/* 타임라인 */
.rrm-timeline{ display:flex; flex-wrap:wrap; gap:clamp(10px,2vw,14px); margin-bottom:clamp(28px,5vw,40px); align-items:stretch; justify-content:center; }
.rrm-tl-node{ flex:1; min-width:130px; max-width:240px; background:var(--paper2); border-radius:6px; padding:clamp(15px,2.5vw,20px); box-shadow:inset 0 0 0 1px rgba(198,138,46,.12); }
.rrm-tl-node-final{ background:linear-gradient(150deg,#2A5A32,#1A3D20); box-shadow:0 6px 18px rgba(26,61,32,.25); }
.rrm-tl-date{ font-family:var(--lat); font-size:clamp(13px,2.6vw,15px); color:#A9803A; letter-spacing:.06em; }
.rrm-tl-date-final{ color:var(--gold-soft); }
.rrm-tl-label{ font-family:var(--serif); font-size:clamp(15px,3vw,17px); font-weight:600; color:#1C2B22; margin-top:6px; }
.rrm-tl-label-final{ color:#F6F1E4; }
.rrm-tl-dash{ display:flex; align-items:center; color:var(--gold2); font-family:var(--lat); font-size:20px; }

/* 데이터 (분포 + 미니카드) */
.rrm-data-row{ display:flex; flex-wrap:wrap; gap:clamp(24px,5vw,44px); }
.rrm-dist{ flex:1.4; min-width:280px; }
.rrm-dist-head{ font-size:clamp(11px,2.2vw,12px); font-weight:700; letter-spacing:.04em; color:#5C5A4F; margin-bottom:clamp(16px,2.8vw,20px); }
.rrm-dist-bars{ display:flex; flex-direction:column; gap:clamp(11px,2vw,14px); }
.rrm-dist-bar{ display:flex; align-items:center; gap:13px; }
.rrm-dist-label{ font-size:12.5px; color:#3A3830; width:48px; flex:none; }
.rrm-dist-track{ flex:1; height:8px; background:var(--line); border-radius:4px; overflow:hidden; }
.rrm-dist-fill{ height:100%; border-radius:4px; }
.rrm-dist-pct{ font-family:var(--lat); font-size:14px; color:#A9803A; width:42px; text-align:right; flex:none; }
.rrm-minicards{ flex:1; min-width:200px; display:flex; gap:clamp(12px,2.5vw,16px); }
.rrm-minicard{ flex:1; background:var(--paper2); border-radius:8px; padding:clamp(18px,3vw,24px) clamp(12px,2vw,16px); text-align:center; box-shadow:inset 0 0 0 1px rgba(198,138,46,.12); }
.rrm-minicard-value{ font-family:var(--lat); font-size:clamp(34px,7vw,46px); font-weight:600; line-height:1; }
.rrm-minicard-label{ font-size:clamp(10px,2vw,11px); color:#8A8275; margin-top:8px; }

/* 종합 (closing) */
.rrm-closing{ position:relative; padding:clamp(44px,6vw,70px) clamp(24px,6vw,68px); margin:clamp(8px,2vw,18px); background:var(--ink); border-radius:4px; overflow:hidden; }
.rrm-closing-glow{ position:absolute; inset:0; background:radial-gradient(80% 60% at 50% 100%, rgba(122,168,120,.14), transparent 60%); }
.rrm-closing-inner{ position:relative; text-align:center; max-width:600px; margin:0 auto; }
.rrm-closing-numeral{ font-family:var(--lat); font-style:italic; font-size:clamp(22px,5vw,32px); color:var(--gold); line-height:1; }
.rrm-closing-kicker{ font-size:clamp(9.5px,2vw,11px); font-weight:700; letter-spacing:.28em; color:var(--gold-soft); padding-left:.28em; margin:8px 0 clamp(20px,3.5vw,28px); }
.rrm-closing-text{ font-family:var(--serif); font-size:clamp(19px,4vw,28px); font-weight:500; line-height:1.6; color:#F6F1E4; margin:0; word-break:keep-all; }

/* 공유 카드 */
.rrm-share{ padding:clamp(20px,3vw,30px) clamp(20px,5vw,60px) clamp(20px,4vw,30px); }
.rrm-share-tag{ display:flex; align-items:center; gap:8px; margin-bottom:clamp(14px,2.5vw,18px); flex-wrap:wrap; }
.rrm-share-tag-strong{ font-size:clamp(10px,2.2vw,11px); font-weight:700; letter-spacing:.1em; color:#A9803A; }
.rrm-share-tag-muted{ font-size:clamp(10px,2.2vw,11px); color:#A99E89; }
.rrm-share-border{ border-radius:16px; padding:1.5px; background:linear-gradient(135deg,#F1D89A,#C68A2E,#9C6512,#E8C77E); }
.rrm-share-card{ border-radius:14.5px; background:linear-gradient(155deg,#1E4023,#0C1F12); padding:clamp(28px,5vw,40px) clamp(26px,5vw,38px); position:relative; overflow:hidden; }
.rrm-share-bigquote{ position:absolute; right:-22px; bottom:-66px; font-family:var(--lat); font-size:clamp(150px,30vw,240px); line-height:1; color:rgba(232,199,126,.07); }
.rrm-share-card-inner{ position:relative; }
.rrm-share-eyebrow{ font-family:var(--lat); font-style:italic; font-size:clamp(13px,2.6vw,15px); letter-spacing:.04em; color:var(--gold-soft); }
.rrm-share-line{ font-family:var(--serif); font-size:clamp(20px,4.4vw,30px); line-height:1.5; font-weight:600; color:#F6F1E4; margin:clamp(16px,3vw,20px) 0 clamp(20px,4vw,26px); word-break:keep-all; }
.rrm-share-foot{ display:flex; align-items:center; gap:10px; padding-top:clamp(16px,3vw,20px); border-top:1px solid rgba(232,199,126,.22); }
.rrm-share-logo{ font-family:var(--lat); font-weight:600; letter-spacing:.08em; font-size:clamp(15px,3vw,18px); background:linear-gradient(135deg,#F1D89A,#E8C77E); -webkit-background-clip:text; background-clip:text; color:transparent; }
.rrm-share-tagline{ font-family:var(--lat); font-style:italic; font-size:clamp(11px,2.2vw,12.5px); color:#9FBF9C; margin-left:auto; }

/* 액션 / 추가 / 푸터 */
.rrm-actions{ padding:clamp(6px,2vw,14px) clamp(20px,5vw,60px) clamp(20px,4vw,34px); }
.rrm-extra{ padding:0 clamp(20px,5vw,60px) clamp(24px,4vw,36px); }
.rrm-footer{ padding:clamp(22px,4vw,28px) clamp(24px,6vw,68px); border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
.rrm-footer-pub{ font-family:var(--lat); font-style:italic; font-size:13px; letter-spacing:.04em; color:#A99E89; }
.rrm-footer-vol{ font-family:var(--lat); font-size:15px; font-weight:600; letter-spacing:.08em; background:linear-gradient(135deg,#C68A2E,#9C6512); -webkit-background-clip:text; background-clip:text; color:transparent; }
`;
