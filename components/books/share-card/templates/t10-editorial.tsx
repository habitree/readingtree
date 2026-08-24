import type { ShareCardData, ShareCardTemplateDef } from "./types";
import { SHARE_NOTE_TYPE_LABELS } from "./types";
import { fmtDot, fmtPeriod, fmtYear } from "./format";

const CSS = `
.tpl-10{--paper:#FAF8F4;--ink:#1C1B18;--body:#3A3833;--muted:#8A8378;--hair:#E4DFD6;--rule:#CFC8BB;--sage:#6B7159;--mark:#EFE6CF;
width:800px;box-sizing:border-box;position:relative;background:var(--paper);color:var(--ink);
font-family:'Gowun Batang','Noto Serif KR',serif;padding:58px 72px 54px;word-break:keep-all;line-height:1.7;}
.tpl-10 *{box-sizing:border-box;margin:0;padding:0;}
.tpl-10::before{content:"";position:absolute;inset:0;pointer-events:none;
background:repeating-linear-gradient(0deg,rgba(28,27,24,.013) 0 1px,transparent 1px 4px),
radial-gradient(140% 80% at 50% 0%,rgba(255,255,255,.55),transparent 55%);}
/* ---- masthead ---- */
.tpl-10 .mast{border-top:3px solid var(--ink);position:relative;padding:16px 0 14px;
display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--rule);}
.tpl-10 .mast::before{content:"";position:absolute;top:5px;left:0;right:0;height:1px;background:var(--ink);}
.tpl-10 .mast-side{font-family:'IBM Plex Sans KR',sans-serif;font-weight:500;font-size:10px;
letter-spacing:.22em;text-transform:uppercase;color:var(--muted);width:200px;}
.tpl-10 .mast-side.r{text-align:right;}
.tpl-10 .brand{font-family:'Playfair Display',serif;font-weight:500;font-size:27px;
letter-spacing:.34em;text-indent:.34em;text-align:center;color:var(--ink);}
/* ---- hero ---- */
.tpl-10 .hero{text-align:center;padding:64px 0 0;}
.tpl-10 .kicker{font-family:'IBM Plex Sans KR',sans-serif;font-weight:500;font-size:11px;
letter-spacing:.30em;text-transform:uppercase;color:var(--sage);}
.tpl-10 .kicker::after{content:"";display:block;width:40px;height:1px;background:var(--sage);margin:16px auto 0;opacity:.7;}
.tpl-10 h1{font-family:'Noto Serif KR',serif;font-weight:600;font-size:46px;line-height:1.32;
letter-spacing:-0.02em;margin:30px auto 0;max-width:600px;
text-shadow:0 1px 0 rgba(255,255,255,.6);}
.tpl-10 .deck{font-family:'Playfair Display','Noto Serif KR',serif;font-style:italic;font-size:19px;
color:var(--body);margin-top:22px;letter-spacing:.01em;}
.tpl-10 .hero-meta{font-family:'IBM Plex Sans KR',sans-serif;font-weight:400;font-size:10.5px;
letter-spacing:.20em;text-transform:uppercase;color:var(--muted);margin-top:26px;}
.tpl-10 .hero-meta b{font-weight:500;color:var(--body);}
/* ---- lead : cover + overview ---- */
.tpl-10 .lead{display:flex;gap:44px;margin-top:58px;align-items:flex-start;}
.tpl-10 .cov{width:166px;flex:none;padding-top:6px;}
.tpl-10 .cov img{display:block;width:166px;height:auto;
box-shadow:0 1px 2px rgba(0,0,0,.05),0 14px 30px -12px rgba(28,27,24,.28);}
.tpl-10 .cov figcaption{margin-top:16px;font-family:'IBM Plex Sans KR',sans-serif;font-size:10px;
letter-spacing:.06em;color:var(--muted);line-height:1.75;}
.tpl-10 .cov figcaption::before{content:"";display:block;width:20px;height:1px;background:var(--rule);margin-bottom:10px;}
.tpl-10 .cov figcaption i{font-style:normal;color:var(--body);}
.tpl-10 .lead-txt{flex:1;padding-top:2px;}
.tpl-10 .lead-lab{font-family:'IBM Plex Sans KR',sans-serif;font-weight:500;font-size:10px;
letter-spacing:.26em;text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
.tpl-10 .lead-txt p{font-size:15px;line-height:2.0;color:var(--body);}
.tpl-10 .dropcap{float:left;font-family:'Noto Serif KR',serif;font-weight:600;font-size:52px;
line-height:.9;padding:6px 12px 0 0;color:var(--ink);}
.tpl-10 .lead-q{margin-top:26px;font-family:'Noto Serif KR',serif;font-size:16.5px;font-weight:500;
color:var(--ink);line-height:1.85;}
.tpl-10 .lead-q::before{content:"";display:inline-block;width:26px;height:1px;background:var(--sage);
vertical-align:middle;margin-right:12px;}
/* ---- dividers & section heads ---- */
.tpl-10 .aster{text-align:center;color:var(--sage);font-size:13px;letter-spacing:1.4em;text-indent:1.4em;
margin:64px 0 0;opacity:.85;}
.tpl-10 .sec{margin-top:60px;text-align:center;}
.tpl-10 .sec-no{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;
letter-spacing:.14em;color:var(--muted);}
.tpl-10 .sec h2{font-family:'Noto Serif KR',serif;font-weight:600;font-size:23px;letter-spacing:.06em;margin-top:8px;}
.tpl-10 .sec h2::after{content:"";display:block;width:40px;height:1px;background:var(--rule);margin:18px auto 0;}
/* ---- insights ---- */
.tpl-10 .ins{margin-top:44px;display:flex;flex-direction:column;gap:38px;}
.tpl-10 .ins-row{display:flex;gap:28px;align-items:flex-start;}
.tpl-10 .ins-no{font-family:'Playfair Display',serif;font-weight:400;font-size:34px;color:var(--sage);
width:58px;flex:none;text-align:right;line-height:1;padding-top:2px;}
.tpl-10 .ins-bd{flex:1;border-left:1px solid var(--hair);padding-left:26px;}
.tpl-10 .ins-bd h3{font-family:'Noto Serif KR',serif;font-weight:600;font-size:17px;letter-spacing:-.01em;}
.tpl-10 .ins-bd p{margin-top:10px;font-size:14px;line-height:1.95;color:var(--body);}
/* ---- quotes ---- */
.tpl-10 .qwrap{margin-top:46px;}
.tpl-10 .quote{text-align:center;padding:0 30px;}
.tpl-10 .quote .qm{display:block;font-family:'Playfair Display',serif;font-size:46px;line-height:.6;
color:var(--sage);opacity:.55;margin-bottom:18px;}
.tpl-10 .quote p{font-family:'Noto Serif KR',serif;font-weight:500;font-size:17px;line-height:1.95;
letter-spacing:-.005em;color:var(--ink);}
.tpl-10 .quote .folio{display:block;margin-top:16px;font-family:'Playfair Display',serif;font-style:italic;
font-size:13px;letter-spacing:.16em;color:var(--muted);}
.tpl-10 .qdiv{width:60px;height:1px;background:linear-gradient(90deg,transparent,var(--rule),transparent);
margin:38px auto;}
/* ---- my notes ---- */
.tpl-10 .note{display:flex;gap:30px;margin-top:44px;}
.tpl-10 .note + .note{margin-top:36px;}
.tpl-10 .note-mg{width:150px;flex:none;text-align:right;padding-top:3px;}
.tpl-10 .note-type{font-family:'IBM Plex Sans KR',sans-serif;font-weight:500;font-size:10px;
letter-spacing:.20em;text-transform:uppercase;color:var(--sage);}
.tpl-10 .note-tt{margin-top:8px;font-family:'Noto Serif KR',serif;font-size:12.5px;font-weight:500;
color:var(--muted);line-height:1.7;}
.tpl-10 .note-bd{flex:1;border-left:3px solid var(--hair);padding-left:26px;}
.tpl-10 .note-bd p{font-size:14.5px;line-height:2.0;color:var(--body);}
.tpl-10 .hl{font-style:normal;background:linear-gradient(transparent 62%,var(--mark) 62%);}
/* ---- journey ---- */
.tpl-10 .journey{margin-top:44px;text-align:center;padding:34px 60px;position:relative;}
.tpl-10 .journey::before,.tpl-10 .journey::after{content:"";position:absolute;left:20%;right:20%;height:1px;
background:linear-gradient(90deg,transparent,var(--rule),transparent);}
.tpl-10 .journey::before{top:0;}
.tpl-10 .journey::after{bottom:0;}
.tpl-10 .jr-dates{font-family:'Playfair Display',serif;font-size:14px;letter-spacing:.20em;color:var(--ink);}
.tpl-10 .jr-dates span{color:var(--muted);font-style:italic;letter-spacing:.06em;padding:0 10px;}
.tpl-10 .journey p{margin-top:16px;font-size:13.5px;line-height:1.95;color:var(--body);}
/* ---- colophon ---- */
.tpl-10 .colo{margin-top:64px;border-top:1px solid var(--rule);position:relative;padding-top:34px;}
.tpl-10 .colo::before{content:"";position:absolute;top:4px;left:0;right:0;height:3px;background:var(--ink);}
.tpl-10 .stats{display:flex;}
.tpl-10 .stat{flex:1;text-align:center;position:relative;}
.tpl-10 .stat + .stat::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:1px;background:var(--hair);}
.tpl-10 .stat b{display:block;font-family:'Playfair Display',serif;font-weight:500;font-size:31px;color:var(--ink);line-height:1.2;}
.tpl-10 .stat b i{font-family:'Noto Serif KR',serif;font-style:normal;font-weight:500;font-size:14px;color:var(--muted);margin-left:2px;}
.tpl-10 .stat span{display:block;margin-top:8px;font-family:'IBM Plex Sans KR',sans-serif;font-weight:500;
font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);}
.tpl-10 .credit{margin-top:44px;text-align:center;}
.tpl-10 .credit .cr-brand{font-family:'Playfair Display',serif;font-size:15px;letter-spacing:.34em;text-indent:.34em;color:var(--ink);}
.tpl-10 .credit .cr-tag{margin-top:10px;font-family:'Noto Serif KR',serif;font-size:12px;color:var(--body);letter-spacing:.14em;}
.tpl-10 .credit .cr-issue{margin-top:14px;font-family:'IBM Plex Sans KR',sans-serif;font-size:9.5px;
letter-spacing:.20em;text-transform:uppercase;color:var(--muted);}
.tpl-10 .folio-pg{margin-top:30px;text-align:center;font-family:'Playfair Display',serif;font-style:italic;
font-size:12px;letter-spacing:.3em;color:var(--muted);}
`;

const EN_MONTHS = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.",
  "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

/** Aug. 24, 2026 — 매스트헤드 우측 영문 날짜 */
function fmtEnglish(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function EditorialCard({ data }: { data: ShareCardData }) {
  const insights = data.insights.slice(0, 5);
  const quotes = data.quotes.slice(0, 3);
  const thoughts = data.thoughts.slice(0, 3);

  // 섹션 번호는 존재하는 섹션 순서대로 다시 매긴다
  let secCount = 0;
  const insightsNo = insights.length > 0 ? ++secCount : null;
  const quotesNo = quotes.length > 0 ? ++secCount : null;
  const thoughtsNo = thoughts.length > 0 ? ++secCount : null;

  // 히어로 메타: 기간 + "8일, 252쪽 완독"
  const period = fmtPeriod(data.startedAt, data.completedAt);
  const boldBits: string[] = [];
  if (data.periodDays !== null) boldBits.push(`${data.periodDays}일`);
  if (data.totalPages !== null) boldBits.push(`${data.totalPages}쪽`);
  const statusWord = data.isCompleted ? "완독" : "읽는 중";
  const boldText = boldBits.length > 0 ? `${boldBits.join(", ")} ${statusWord}` : statusWord;

  // 덱: 저자 + 읽게 된 이유
  const deckParts: string[] = [];
  if (data.author) deckParts.push(`${data.author} 지음`);
  if (data.readReason) deckParts.push(data.readReason);

  // 리드(개요) 본문 — 종합 요약을 우선, 없으면 개요 서술
  const overviewText = data.summary || data.overview;
  const hasLead = Boolean(data.coverUrl || overviewText || data.closingQuestion);

  const startDot = fmtDot(data.startedAt);
  const completedDot = fmtDot(data.completedAt);
  const publishedDot = fmtDot(data.publishedAt);
  const publishedEn = fmtEnglish(data.publishedAt);
  const publishedYear = fmtYear(data.publishedAt);

  // 콜로폰 통계 — 값이 있는 셀만
  const typeBreakdown = Object.entries(data.noteTypeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${SHARE_NOTE_TYPE_LABELS[type] ?? type} ${count}`)
    .join(" ");
  const stats: { value: number; unit: string; label: string }[] = [];
  if (data.totalPages !== null) {
    stats.push({ value: data.totalPages, unit: "쪽", label: data.isCompleted ? "완독" : "전체 쪽수" });
  }
  if (data.periodDays !== null) {
    stats.push({ value: data.periodDays, unit: "일", label: "독서 기간" });
  }
  if (data.noteCount > 0) {
    stats.push({
      value: data.noteCount,
      unit: "개",
      label: typeBreakdown ? `기록 · ${typeBreakdown}` : "기록",
    });
  }
  if (data.readingDays > 0) {
    stats.push({ value: data.readingDays, unit: "일", label: "기록한 날" });
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="tpl-10">
        <div className="mast">
          <span className="mast-side">
            {publishedYear ? `Vol. ${publishedYear} · Book Essay` : "Book Essay"}
          </span>
          <span className="brand">READTREE</span>
          <span className="mast-side r">{publishedEn ?? ""}</span>
        </div>

        <div className="hero">
          <div className="kicker">AI Reading Report</div>
          <h1>{data.title}</h1>
          {deckParts.length > 0 && <div className="deck">{deckParts.join(" — ")}</div>}
          {(period || boldBits.length > 0) && (
            <div className="hero-meta">
              {period}
              {period && <>&nbsp;·&nbsp;</>}
              <b>{boldText}</b>
            </div>
          )}
        </div>

        {hasLead && (
          <div className="lead">
            {data.coverUrl && (
              <figure className="cov">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.coverUrl} alt="표지" crossOrigin="anonymous" />
                <figcaption>
                  <i>{data.title}</i>
                  {data.author && `, ${data.author}`}
                  <br />
                  {data.totalPages !== null && `${data.totalPages}쪽 — `}
                  {data.isCompleted ? "완독의 기록" : "독서의 기록"}
                </figcaption>
              </figure>
            )}
            {(overviewText || data.closingQuestion) && (
              <div className="lead-txt">
                <div className="lead-lab">Overview · 종합 요약</div>
                {overviewText && (
                  <p>
                    <span className="dropcap">{overviewText.slice(0, 1)}</span>
                    {overviewText.slice(1)}
                  </p>
                )}
                {data.closingQuestion && (
                  <p className="lead-q">{`“${data.closingQuestion}”`}</p>
                )}
              </div>
            )}
          </div>
        )}

        {secCount > 0 && <div className="aster">✳ ✳ ✳</div>}

        {insightsNo !== null && (
          <>
            <div className="sec">
              <div className="sec-no">No. {insightsNo} — Insights</div>
              <h2>핵심 인사이트</h2>
            </div>
            <div className="ins">
              {insights.map((insight, i) => (
                <div className="ins-row" key={i}>
                  <div className="ins-no">{pad2(i + 1)}</div>
                  <div className="ins-bd">
                    <h3>{insight.title}</h3>
                    <p>{insight.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {quotesNo !== null && (
          <>
            <div className="sec">
              <div className="sec-no">No. {quotesNo} — Passages</div>
              <h2>인상깊은 구절</h2>
            </div>
            <div className="qwrap">
              {quotes.map((quote, i) => (
                <div key={i}>
                  {i > 0 && <div className="qdiv" />}
                  <div className="quote">
                    <span className="qm">{"“"}</span>
                    <p>{quote.text}</p>
                    {quote.page && <span className="folio">p. {quote.page}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {thoughtsNo !== null && (
          <>
            <div className="sec">
              <div className="sec-no">No. {thoughtsNo} — Marginalia</div>
              <h2>나의 생각 정리</h2>
            </div>
            {thoughts.map((thought, i) => (
              <div className="note" key={i}>
                <div className="note-mg">
                  <div className="note-type">Note {pad2(i + 1)}</div>
                </div>
                <div className="note-bd">
                  <p>{thought}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {data.journey && (
          <div className="journey">
            {(startDot || completedDot) && (
              <div className="jr-dates">
                {startDot && (
                  <>
                    {startDot} <span>시작</span>
                  </>
                )}
                {startDot && completedDot && " — "}
                {completedDot && (
                  <>
                    {completedDot} <span>완독</span>
                  </>
                )}
              </div>
            )}
            <p>{data.journey}</p>
          </div>
        )}

        <div className="colo">
          {stats.length > 0 && (
            <div className="stats">
              {stats.map((stat, i) => (
                <div className="stat" key={i}>
                  <b>
                    {stat.value}
                    <i>{stat.unit}</i>
                  </b>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="credit">
            <div className="cr-brand">READTREE</div>
            <div className="cr-tag">기록하는 만큼 자라는 독서</div>
            <div className="cr-issue">
              AI Reading Report{publishedDot && ` · Issued ${publishedDot}`}
            </div>
          </div>
          <div className="folio-pg">— 01 —</div>
        </div>
      </div>
    </>
  );
}

export const editorialTemplate: ShareCardTemplateDef = {
  id: "editorial",
  name: "조용한 지면",
  tagline: "킨포크 매거진의 북 에세이 한 페이지처럼, 힘을 뺀 기록의 격식",
  fonts: ["Noto Serif KR", "Gowun Batang", "Playfair Display", "IBM Plex Sans KR"],
  captureBg: "#FAF8F4",
  Component: EditorialCard,
};
