/**
 * t03 — 리딩 타임즈 제1면 (신문 1면 템플릿)
 *
 * 원본 정적 샘플(tpl-03.html)을 ShareCardData 바인딩으로 포팅.
 * html2canvas 제약으로 원본 .stamp 의 writing-mode:vertical-rl 은
 * flex 세로 글자 적층으로 대체했다.
 */
import type { ShareCardData, ShareCardTemplateDef } from "./types";
import { SHARE_NOTE_TYPE_LABELS } from "./types";
import { fmtDot, fmtKorean, fmtPeriod } from "./format";

const CSS = `
.tpl-03{--paper:#F5F1E8;--ink:#181613;--body:#2A2622;--sub:#55524C;--rule:#C9C2B4;--accent:#A63A2B;--hl:#EFE6CF;
width:800px;box-sizing:border-box;padding:40px 46px 30px;position:relative;color:var(--ink);
font-family:'Noto Serif KR',serif;word-break:keep-all;
background:radial-gradient(ellipse 90% 50% at 50% 0%,rgba(255,255,255,.5),transparent 70%),repeating-linear-gradient(0deg,rgba(28,27,24,.015) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(28,27,24,.012) 0 1px,transparent 1px 4px),#F5F1E8;
box-shadow:0 1px 2px rgba(0,0,0,.04),0 16px 40px -14px rgba(28,27,24,.25);}
.tpl-03 *{margin:0;padding:0;box-sizing:border-box;}
.tpl-03 .lbl{font-family:'IBM Plex Sans KR',sans-serif;font-size:10.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--sub);}
.tpl-03 .hr{height:1px;background:linear-gradient(90deg,transparent,var(--rule) 18%,var(--rule) 82%,transparent);}
.tpl-03 .rule2{border-top:3px solid var(--ink);}
.tpl-03 .rule2::after{content:'';display:block;border-top:1px solid var(--ink);margin-top:3px;}
.tpl-03 .rule2r{border-top:1px solid var(--ink);}
.tpl-03 .rule2r::after{content:'';display:block;border-top:3px solid var(--ink);margin-top:3px;}
.tpl-03 .mh-top{display:flex;justify-content:space-between;margin-bottom:10px;}
.tpl-03 .mh{text-align:center;padding:22px 0 20px;}
.tpl-03 .mh-kr{font-family:'IBM Plex Sans KR',sans-serif;font-size:12px;font-weight:500;letter-spacing:.62em;text-indent:.62em;color:var(--sub);margin-bottom:8px;}
.tpl-03 .mh-en{font-family:'Playfair Display',serif;font-weight:700;font-size:54px;line-height:1;letter-spacing:.01em;text-shadow:0 1px 0 rgba(255,255,255,.6);}
.tpl-03 .mh-tag{margin-top:12px;font-family:'Gowun Batang',serif;font-size:12.5px;color:var(--sub);letter-spacing:.08em;}
.tpl-03 .kick{display:flex;align-items:center;gap:14px;margin:26px 0 14px;}
.tpl-03 .kick .hr{flex:1;}
.tpl-03 .kick .t{font-family:'IBM Plex Sans KR',sans-serif;font-size:11px;font-weight:600;letter-spacing:.3em;text-indent:.3em;color:var(--accent);}
.tpl-03 .head{font-size:38px;font-weight:700;line-height:1.42;letter-spacing:-0.02em;text-align:center;text-shadow:0 1px 0 rgba(255,255,255,.55);}
.tpl-03 .deck{max-width:590px;margin:16px auto 0;font-family:'Gowun Batang',serif;font-size:15.5px;line-height:1.85;color:var(--sub);text-align:center;}
.tpl-03 .deck em{font-family:'Playfair Display',serif;font-style:italic;}
.tpl-03 .byline{display:flex;justify-content:space-between;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:8px 2px;margin:22px 0 26px;}
.tpl-03 .cols{display:flex;gap:26px;}
.tpl-03 .col-main{flex:1;min-width:0;}
.tpl-03 .col-side{width:252px;border-left:1px solid var(--rule);padding-left:26px;}
.tpl-03 .art p{font-family:'Gowun Batang',serif;font-size:14.5px;line-height:1.9;color:var(--body);margin-bottom:11px;}
.tpl-03 .dcap{float:left;font-family:'Playfair Display',serif;font-weight:700;font-size:54px;line-height:.82;padding:5px 10px 0 0;color:var(--accent);}
.tpl-03 .art h4{font-size:15.5px;font-weight:700;margin:16px 0 6px;letter-spacing:-0.01em;}
.tpl-03 .art h4::before{content:'\\25C6';font-size:10px;color:var(--accent);margin-right:7px;vertical-align:2px;}
.tpl-03 .hl{background:linear-gradient(transparent 62%,var(--hl) 62%);}
.tpl-03 figure img{display:block;width:100%;border:1px solid var(--rule);box-shadow:0 1px 2px rgba(0,0,0,.06),0 10px 22px -10px rgba(28,27,24,.3);}
.tpl-03 .cover-fallback{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:300px;padding:28px 20px;text-align:center;border:1px solid var(--rule);background:linear-gradient(160deg,rgba(255,255,255,.5),transparent 60%),var(--hl);box-shadow:0 1px 2px rgba(0,0,0,.06),0 10px 22px -10px rgba(28,27,24,.3);}
.tpl-03 .cover-fallback .cf-t{font-size:18px;font-weight:700;line-height:1.6;}
.tpl-03 .cover-fallback .cf-a{font-family:'Gowun Batang',serif;font-size:12.5px;color:var(--sub);}
.tpl-03 .cap{margin-top:10px;font-family:'IBM Plex Sans KR',sans-serif;font-size:11px;line-height:1.75;color:var(--sub);letter-spacing:.02em;}
.tpl-03 .cap::before{content:'';display:block;width:20px;height:1px;background:var(--ink);margin-bottom:7px;}
.tpl-03 .stats{position:relative;border:1px solid var(--ink);padding:16px 16px 12px;margin-top:24px;background:rgba(255,255,255,.28);}
.tpl-03 .stats .st-h{text-align:center;border-bottom:1px solid var(--rule);padding-bottom:9px;margin-bottom:12px;}
.tpl-03 .stats .st-h .en{display:block;font-family:'Playfair Display',serif;font-style:italic;font-size:11px;color:var(--sub);margin-top:3px;letter-spacing:.06em;}
.tpl-03 .st-grid{display:flex;flex-wrap:wrap;}
.tpl-03 .st{width:50%;text-align:center;padding:7px 0 9px;}
.tpl-03 .st:nth-child(1),.tpl-03 .st:nth-child(2){border-bottom:1px solid var(--rule);}
.tpl-03 .st:nth-child(2),.tpl-03 .st:nth-child(4){border-left:1px solid var(--rule);}
.tpl-03 .st:nth-child(1):nth-last-child(2),.tpl-03 .st:nth-child(2):nth-last-child(1){border-bottom:0;}
.tpl-03 .st .n{font-family:'Playfair Display',serif;font-weight:700;font-size:28px;line-height:1.1;}
.tpl-03 .st .u{display:block;margin-top:3px;font-family:'IBM Plex Sans KR',sans-serif;font-size:10.5px;letter-spacing:.14em;color:var(--sub);}
.tpl-03 .st-note{margin-top:10px;padding-top:9px;border-top:1px solid var(--rule);font-family:'Gowun Batang',serif;font-size:11.5px;line-height:1.7;color:var(--sub);text-align:center;}
.tpl-03 .stamp{position:absolute;top:-15px;right:-9px;display:flex;flex-direction:column;align-items:center;font-weight:700;font-size:14px;line-height:1.35;letter-spacing:0;color:var(--accent);border:2px solid var(--accent);border-radius:3px;padding:8px 5px;transform:rotate(-3deg);background:rgba(245,241,232,.9);box-shadow:0 1px 2px rgba(0,0,0,.08);}
.tpl-03 .stamp span{display:block;}
.tpl-03 .pq{margin:34px 0 6px;padding:24px 56px 26px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);text-align:center;}
.tpl-03 .pq .stars{font-size:11px;color:var(--accent);letter-spacing:1.1em;text-indent:1.1em;margin-bottom:16px;}
.tpl-03 .pq .q{font-size:19.5px;font-weight:600;line-height:1.8;letter-spacing:-0.01em;}
.tpl-03 .pq .src{margin-top:12px;font-family:'IBM Plex Sans KR',sans-serif;font-size:11px;letter-spacing:.2em;color:var(--sub);}
.tpl-03 .sec{display:flex;align-items:center;gap:14px;margin:30px 0 18px;}
.tpl-03 .sec .hr{flex:1;}
.tpl-03 .sec .t{font-family:'IBM Plex Sans KR',sans-serif;font-size:11px;font-weight:600;letter-spacing:.28em;text-indent:.28em;color:var(--ink);}
.tpl-03 .sec .t em{font-family:'Playfair Display',serif;font-style:italic;font-weight:400;color:var(--sub);letter-spacing:.06em;text-indent:0;font-size:11px;}
.tpl-03 .qrow{display:flex;gap:24px;}
.tpl-03 .qi{flex:1;border-left:2px solid var(--ink);padding-left:16px;}
.tpl-03 .qi p{font-family:'Gowun Batang',serif;font-size:13.5px;line-height:1.9;color:var(--body);}
.tpl-03 .qi .src{display:block;margin-top:8px;font-family:'IBM Plex Sans KR',sans-serif;font-size:10.5px;letter-spacing:.16em;color:var(--sub);}
.tpl-03 .lrow{display:flex;gap:24px;}
.tpl-03 .li{flex:1;min-width:0;}
.tpl-03 .li+.li{border-left:1px solid var(--rule);padding-left:24px;}
.tpl-03 .li .tag{font-family:'IBM Plex Sans KR',sans-serif;font-size:10px;font-weight:600;letter-spacing:.2em;color:var(--accent);text-transform:uppercase;}
.tpl-03 .li p{margin-top:8px;font-family:'Gowun Batang',serif;font-size:12.5px;line-height:1.85;color:var(--body);}
.tpl-03 .ad{margin-top:34px;border:2px solid var(--ink);padding:4px;}
.tpl-03 .ad-in{border:1px solid var(--ink);padding:20px 26px;display:flex;align-items:center;gap:26px;}
.tpl-03 .ad-l{flex:1;}
.tpl-03 .ad-l .bt{font-size:21px;font-weight:700;letter-spacing:-0.02em;margin:9px 0 8px;line-height:1.45;}
.tpl-03 .ad-l .bm{font-family:'Gowun Batang',serif;font-size:12.5px;line-height:1.8;color:var(--sub);}
.tpl-03 .ad-r{width:212px;border-left:1px solid var(--rule);padding-left:26px;text-align:center;}
.tpl-03 .ad-r .logo{font-family:'Playfair Display',serif;font-weight:700;font-size:23px;letter-spacing:.01em;}
.tpl-03 .ad-r .lk{font-family:'IBM Plex Sans KR',sans-serif;font-size:10px;letter-spacing:.3em;text-indent:.3em;color:var(--sub);margin-top:4px;}
.tpl-03 .ad-r .tag2{margin-top:9px;padding-top:9px;border-top:1px solid var(--rule);font-family:'Gowun Batang',serif;font-size:11.5px;line-height:1.7;color:var(--body);}
.tpl-03 .foot{margin-top:26px;}
.tpl-03 .foot-in{display:flex;justify-content:space-between;align-items:center;padding-top:10px;}
.tpl-03 .folio{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:var(--sub);}
`;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 2026년 8월 24일 월요일 (파싱 실패 시 null) */
function fmtKoreanWithWeekday(iso: string): string | null {
  const base = fmtKorean(iso);
  if (!base) return null;
  return `${base} ${WEEKDAYS[new Date(iso).getDay()]}요일`;
}

function NewspaperCard({ data }: { data: ShareCardData }) {
  const publishedDot = fmtDot(data.publishedAt);
  const publishedKorean = fmtKoreanWithWeekday(data.publishedAt);
  const period = fmtPeriod(data.startedAt, data.completedAt);

  const deckText = data.summary || data.overview;
  const journeyChars = Array.from(data.journey);
  // 숫자로 시작하는 문장("2026년 …")은 드롭캡을 걸면 "2 / 026년"으로 어색해져 생략
  const useDropCap = journeyChars.length > 0 && !/\d/.test(journeyChars[0]);

  const insights = data.insights.slice(0, 5);
  const quotes = data.quotes.slice(0, 3);
  const leadQuote = quotes[0];
  const sideQuotes = quotes.slice(1);
  const thoughts = data.thoughts.slice(0, 3);

  const statCells: { n: string; u: string }[] = [];
  if (data.totalPages != null) {
    statCells.push({ n: String(data.totalPages), u: data.isCompleted ? "쪽 완독" : "쪽 분량" });
  }
  if (data.periodDays != null) {
    statCells.push({ n: String(data.periodDays), u: "일간 독서" });
  }
  statCells.push({ n: String(data.noteCount), u: "건의 기록" });
  statCells.push({ n: String(data.readingDays), u: "일 기록한 날" });

  const noteTypeLine = Object.entries(data.noteTypeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${SHARE_NOTE_TYPE_LABELS[type] ?? type} ${count}`)
    .join(" · ");

  const capMeta = [
    data.totalPages != null ? `${data.totalPages}쪽` : null,
    period ? `${period} 독서` : null,
  ]
    .filter((v): v is string => v !== null)
    .join(", ");
  const caption = `『${data.title}』${data.author ? `, ${data.author}` : ""}${capMeta ? ` — ${capMeta}` : ""}`;

  const bmParts = [
    data.author ? `${data.author} 지음` : null,
    data.totalPages != null ? `${data.totalPages}쪽` : null,
    period
      ? `독서 기간 ${period}${data.periodDays != null ? ` (${data.periodDays}일)` : ""}`
      : null,
    data.readReason ? `읽는 이유 “${data.readReason}”` : null,
  ].filter((v): v is string => v !== null);

  const stampText = data.isCompleted ? "완독" : "독서중";

  return (
    <>
      <style>{CSS}</style>
      <div className="tpl-03">
        <div className="mh-top">
          <span className="lbl">{publishedKorean ?? ""}</span>
          <span className="lbl" style={{ color: "var(--accent)" }}>
            독서 리포트 특별판
          </span>
          <span className="lbl">Vol. 1 · No. 1</span>
        </div>
        <div className="rule2" />
        <div className="mh">
          <div className="mh-kr">리 딩 타 임 즈</div>
          <h1 className="mh-en">The Reading Times</h1>
          <div className="mh-tag">“기록하는 만큼 자라는 독서” · ReadTree 발행</div>
        </div>
        <div className="rule2r" />

        <div className="kick">
          <div className="hr" />
          <span className="t">{data.isCompleted ? "완독 특집 보도" : "독서 기록 보도"}</span>
          <div className="hr" />
        </div>
        <h2 className="head">“{data.title}”</h2>
        {(deckText || data.closingQuestion) && (
          <p className="deck">
            {deckText}
            {data.closingQuestion && (
              <>
                {deckText ? " — " : ""}
                <em>“</em>
                {data.closingQuestion}
                <em>”</em>
              </>
            )}
          </p>
        )}

        <div className="byline">
          <span className="lbl">ReadTree AI 독서 리포트</span>
          <span className="lbl">독자 기록 {data.noteCount}건 기반 작성</span>
          {publishedDot && <span className="lbl">발행 {publishedDot}</span>}
        </div>

        <div className="cols">
          <div className="col-main art">
            {data.journey && (
              <p>
                {useDropCap ? (
                  <>
                    <span className="dcap">{journeyChars[0]}</span>
                    {journeyChars.slice(1).join("")}
                  </>
                ) : (
                  data.journey
                )}
              </p>
            )}
            {insights.map((insight, i) => (
              <div key={i}>
                <h4>{insight.title}</h4>
                <p>{insight.body}</p>
              </div>
            ))}
          </div>
          <div className="col-side">
            <figure>
              {data.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.coverUrl} alt={`${data.title} 표지`} crossOrigin="anonymous" />
              ) : (
                <div className="cover-fallback">
                  <span className="cf-t">『{data.title}』</span>
                  {data.author && <span className="cf-a">{data.author}</span>}
                </div>
              )}
              <figcaption className="cap">{caption}</figcaption>
            </figure>
            <div className="stats">
              <span className="stamp">
                {Array.from(stampText).map((ch, i) => (
                  <span key={i}>{ch}</span>
                ))}
              </span>
              <div className="st-h">
                <span className="lbl" style={{ color: "var(--ink)" }}>
                  오늘의 지표
                </span>
                <span className="en">Today’s Figures</span>
              </div>
              <div className="st-grid">
                {statCells.map((cell, i) => (
                  <div className="st" key={i}>
                    <span className="n">{cell.n}</span>
                    <span className="u">{cell.u}</span>
                  </div>
                ))}
              </div>
              {noteTypeLine && <div className="st-note">{noteTypeLine}</div>}
            </div>
          </div>
        </div>

        {leadQuote && (
          <div className="pq">
            <div className="stars">✳ ✳ ✳</div>
            <p className="q">“{leadQuote.text}”</p>
            {leadQuote.page && <div className="src">— 본문 {leadQuote.page}쪽</div>}
          </div>
        )}

        {sideQuotes.length > 0 && (
          <>
            <div className="sec">
              <div className="hr" />
              <span className="t">
                오늘의 문장 <em>Selected Lines</em>
              </span>
              <div className="hr" />
            </div>
            <div className="qrow">
              {sideQuotes.map((quote, i) => (
                <div className="qi" key={i}>
                  <p>“{quote.text}”</p>
                  {quote.page && <span className="src">— 본문 {quote.page}쪽</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {thoughts.length > 0 && (
          <>
            <div className="sec">
              <div className="hr" />
              <span className="t">
                독자 기고 · 나의 생각 정리 <em>Reader’s Notes</em>
              </span>
              <div className="hr" />
            </div>
            <div className="lrow">
              {thoughts.map((thought, i) => (
                <div className="li" key={i}>
                  <span className="tag">기록 {String(i + 1).padStart(2, "0")}</span>
                  <p>{thought}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="ad">
          <div className="ad-in">
            <div className="ad-l">
              <span className="lbl" style={{ color: "var(--accent)" }}>
                도서 안내{data.readReason ? ` — ${data.readReason}` : ""}
              </span>
              <div className="bt">{data.title}</div>
              {bmParts.length > 0 && <div className="bm">{bmParts.join(" · ")}</div>}
            </div>
            <div className="ad-r">
              <div className="logo">ReadTree</div>
              <div className="lk">리드트리</div>
              <div className="tag2">기록하는 만큼 자라는 독서</div>
            </div>
          </div>
        </div>

        <div className="foot">
          <div className="rule2r" />
          <div className="foot-in">
            <span className="lbl">The Reading Times</span>
            <span className="folio">— 제1면 —</span>
            <span className="lbl">발행 ReadTree{publishedDot ? ` · ${publishedDot}` : ""}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export const newspaperTemplate: ShareCardTemplateDef = {
  id: "newspaper",
  name: "리딩 타임즈 제1면",
  tagline: "당신의 완독이 오늘의 1면 기사가 됩니다",
  fonts: ["Noto Serif KR", "Gowun Batang", "Playfair Display", "IBM Plex Sans KR"],
  captureBg: "#F5F1E8",
  Component: NewspaperCard,
};
