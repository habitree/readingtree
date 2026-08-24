/**
 * t07 — 한 권의 LP, 라이너 노트
 * 크래프트지 위의 빈티지 LP 앨범 콘셉트 공유 카드.
 */
import type { ShareCardData, ShareCardTemplateDef } from "./types";
import { SHARE_NOTE_TYPE_LABELS } from "./types";
import { fmtDot, fmtPeriod } from "./format";

const CSS = `
.tpl-07{--kraft:#E7D8B9;--kraft-d:#DBC79F;--paper:#F4ECDA;--ink:#2B2620;--ink-soft:#59503F;--mustard:#D9A441;--red:#C0533E;--blue:#5C7A8A;
width:800px;box-sizing:border-box;position:relative;color:var(--ink);
font-family:'IBM Plex Sans KR','Noto Sans KR',sans-serif;word-break:keep-all;line-height:1.7;
background:repeating-linear-gradient(0deg,rgba(43,38,32,.028) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(255,253,245,.05) 0 2px,transparent 2px 5px),linear-gradient(165deg,#ECDFC2 0%,var(--kraft) 46%,var(--kraft-d) 100%);
box-shadow:inset 0 0 110px rgba(94,72,38,.22);overflow:hidden;}
.tpl-07 *{margin:0;padding:0;box-sizing:border-box;}
.tpl-07 .masthead{display:flex;justify-content:space-between;align-items:baseline;padding:26px 52px 14px;border-bottom:3px solid var(--ink);}
.tpl-07 .masthead b{font-family:'Bebas Neue',sans-serif;font-size:21px;letter-spacing:.22em;font-weight:400;}
.tpl-07 .masthead span{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:.3em;color:var(--ink-soft);}
.tpl-07 .hero{position:relative;height:540px;}
.tpl-07 .vinyl{position:absolute;top:44px;left:296px;width:456px;height:456px;border-radius:50%;
background:radial-gradient(circle at 38% 30%,rgba(255,246,224,.14) 0 18%,transparent 42%),repeating-radial-gradient(circle at 50% 50%,#17120E 0 1.5px,#2B241C 1.5px 4px);
box-shadow:0 14px 34px rgba(35,24,12,.42),inset 0 0 46px rgba(0,0,0,.55);}
.tpl-07 .vlabel{position:absolute;inset:33.5%;border-radius:50%;background:radial-gradient(circle,#E4B354 0 58%,var(--mustard) 100%);border:2px solid #B9872F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;box-shadow:0 0 0 6px #17120E;}
.tpl-07 .vlabel em{font-style:normal;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:.24em;line-height:1.2;}
.tpl-07 .vlabel span{font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:.26em;color:#4A3813;line-height:1.5;}
.tpl-07 .vlabel i{width:9px;height:9px;border-radius:50%;background:var(--kraft);border:2px solid #7A5C1E;margin-top:3px;}
.tpl-07 .jacket{position:absolute;top:44px;left:52px;width:466px;height:466px;background:linear-gradient(150deg,#CB6047,var(--red) 60%,#A94534);padding:17px;z-index:2;box-shadow:10px 12px 0 rgba(43,38,32,.18),0 18px 40px rgba(43,38,32,.34);}
.tpl-07 .jacket img{width:100%;height:100%;object-fit:cover;display:block;border:1px solid rgba(43,38,32,.3);}
.tpl-07 .jacket-blank{width:100%;height:100%;border:1px solid rgba(43,38,32,.3);background:radial-gradient(circle at 50% 42%,#3A3128 0 34%,#241E17 72%,#17120E 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:36px;}
.tpl-07 .jacket-blank span{font-family:'Do Hyeon',sans-serif;font-size:34px;line-height:1.4;color:var(--kraft);letter-spacing:.01em;word-break:keep-all;}
.tpl-07 .hype{position:absolute;top:-20px;left:-22px;width:104px;height:104px;border-radius:50%;background:radial-gradient(circle,#E7BC5F 0 62%,var(--mustard));border:2px dashed rgba(74,56,19,.55);transform:rotate(-9deg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;box-shadow:0 5px 12px rgba(43,38,32,.3);text-align:center;overflow:hidden;padding:8px;}
.tpl-07 .hype b{font-family:'Do Hyeon',sans-serif;font-size:19px;line-height:1.25;letter-spacing:.04em;word-break:keep-all;}
.tpl-07 .hype span{font-family:'Bebas Neue',sans-serif;font-size:8.5px;letter-spacing:.2em;color:#4A3813;margin-top:2px;}
.tpl-07 .stamp{position:absolute;right:-14px;bottom:-16px;background:#B23A34;color:#FBF3E2;font-family:'Do Hyeon',sans-serif;font-size:24px;letter-spacing:.3em;padding:10px 14px 10px 18px;border-radius:8px;transform:rotate(-6deg);box-shadow:0 5px 14px rgba(43,38,32,.35),inset 0 0 0 2px rgba(251,243,226,.5);z-index:3;line-height:1;}
.tpl-07 .stamp.reading{background:var(--blue);color:#F2EEE2;}
.tpl-07 .titleblk{padding:8px 52px 0;}
.tpl-07 .eyebrow{font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:.42em;color:var(--red);margin-bottom:10px;}
.tpl-07 .titleblk h1{font-family:'Do Hyeon',sans-serif;font-weight:400;font-size:47px;line-height:1.24;letter-spacing:-.012em;}
.tpl-07 .artist{margin-top:12px;font-size:16px;letter-spacing:.06em;color:var(--ink-soft);}
.tpl-07 .artist span{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:.3em;color:var(--red);margin-right:10px;}
.tpl-07 .artist b{color:var(--ink);font-weight:600;font-size:19px;}
.tpl-07 .meta{display:flex;margin:30px 52px 0;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);}
.tpl-07 .meta>div{flex:1;padding:16px 6px 14px;text-align:center;border-left:1px solid rgba(43,38,32,.35);}
.tpl-07 .meta>div:first-child{border-left:0;}
.tpl-07 .meta .m-session{flex:1.35;}
.tpl-07 .meta i{display:block;font-style:normal;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:.24em;color:var(--ink-soft);margin-bottom:4px;}
.tpl-07 .meta b{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:30px;line-height:1.1;}
.tpl-07 .meta em{display:block;font-style:normal;font-size:11.5px;color:var(--ink-soft);margin-top:3px;letter-spacing:.03em;line-height:1.5;}
.tpl-07 .side{padding:52px 52px 0;}
.tpl-07 .side-head{display:flex;align-items:center;gap:18px;margin-bottom:26px;}
.tpl-07 .badge{flex:0 0 auto;width:62px;height:62px;border-radius:50%;background:var(--ink);color:var(--kraft);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.12em;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.15;box-shadow:3px 4px 0 rgba(43,38,32,.22);}
.tpl-07 .badge.b{background:var(--blue);color:#F2EEE2;}
.tpl-07 .badge.q{background:var(--mustard);color:#2B2620;}
.tpl-07 .side-head h2{font-family:'Do Hyeon',sans-serif;font-weight:400;font-size:27px;line-height:1.3;}
.tpl-07 .side-head p{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:.34em;color:var(--ink-soft);margin-top:2px;}
.tpl-07 .trk{margin-bottom:34px;}
.tpl-07 .trk:last-child{margin-bottom:0;}
.tpl-07 .trow{display:flex;align-items:baseline;}
.tpl-07 .tno{font-family:'Bebas Neue',sans-serif;font-size:19px;color:var(--red);width:38px;flex:0 0 auto;letter-spacing:.05em;}
.tpl-07 .side .b-side .tno{color:var(--blue);}
.tpl-07 .tname{font-family:'Do Hyeon',sans-serif;font-size:21px;letter-spacing:.01em;line-height:1.4;}
.tpl-07 .dots{flex:1;min-width:34px;border-bottom:2px dotted rgba(43,38,32,.5);margin:0 12px;transform:translateY(-5px);}
.tpl-07 .tdesc{margin:8px 0 0 38px;font-size:14px;color:var(--ink-soft);line-height:1.75;}
.tpl-07 .tq{margin:12px 0 0 38px;padding:2px 0 2px 18px;border-left:3px solid var(--mustard);font-family:'Gowun Batang',serif;font-size:15.5px;line-height:1.9;color:#3A332A;}
.tpl-07 .tq.qitem{margin:0 0 22px 38px;}
.tpl-07 .tq.qitem:last-child{margin-bottom:0;}
.tpl-07 .qpg{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:.12em;color:var(--ink-soft);margin-left:10px;}
.tpl-07 .b-side .tq{border-left-color:var(--blue);}
.tpl-07 .memo{margin:12px 0 0 38px;font-family:'Nanum Pen Script',cursive;font-size:23px;line-height:1.55;color:#4A3E2C;}
.tpl-07 .trow .memo{margin:0;}
.tpl-07 .memo b{font-weight:400;box-shadow:inset 0 -.42em 0 rgba(217,164,65,.4);}
.tpl-07 .memo span{font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:.2em;color:var(--red);margin-right:8px;}
.tpl-07 .b-side .memo span{color:var(--blue);}
.tpl-07 .divider{margin:52px 52px 0;border-top:1px dashed rgba(43,38,32,.45);height:0;}
.tpl-07 .liner{margin:52px 52px 0;background:linear-gradient(170deg,#F7F0DF,var(--paper) 70%,#EFE5CD);padding:44px 46px 46px;box-shadow:0 3px 0 rgba(43,38,32,.16),0 16px 34px rgba(43,38,32,.16);position:relative;}
.tpl-07 .liner::before{content:"";position:absolute;top:-12px;left:50%;width:150px;height:26px;transform:translateX(-50%) rotate(-1.5deg);background:rgba(217,164,65,.38);border:1px solid rgba(185,135,47,.28);box-shadow:0 1px 2px rgba(43,38,32,.1);}
.tpl-07 .liner h2{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:30px;letter-spacing:.34em;text-align:center;}
.tpl-07 .liner .lsub{text-align:center;font-size:12px;letter-spacing:.22em;color:var(--ink-soft);margin:4px 0 26px;}
.tpl-07 .liner .lbody{font-family:'Gowun Batang',serif;font-size:16.5px;line-height:2.0;color:#332D24;}
.tpl-07 .liner .journey{margin-top:22px;padding-top:20px;border-top:1px solid rgba(43,38,32,.25);font-size:13.5px;color:var(--ink-soft);line-height:1.85;}
.tpl-07 .liner .journey b{font-family:'Bebas Neue',sans-serif;font-weight:400;letter-spacing:.24em;font-size:12px;color:var(--red);display:block;margin-bottom:6px;}
.tpl-07 .liner .qline{margin-top:24px;text-align:center;font-family:'Gowun Batang',serif;font-size:19px;line-height:1.8;color:var(--red);}
.tpl-07 .liner .qline::before{content:"“";font-size:30px;}
.tpl-07 .liner .qline::after{content:"”";font-size:30px;}
.tpl-07 .footer{margin:56px 52px 0;border-top:3px double var(--ink);display:flex;align-items:center;justify-content:space-between;padding:22px 0 34px;gap:20px;}
.tpl-07 .brand b{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:26px;letter-spacing:.18em;}
.tpl-07 .brand b i{font-style:normal;color:var(--red);}
.tpl-07 .brand p{font-size:12px;letter-spacing:.08em;color:var(--ink-soft);margin-top:2px;}
.tpl-07 .cat{text-align:center;font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:.26em;color:var(--ink-soft);line-height:2;}
.tpl-07 .bcwrap{text-align:right;}
.tpl-07 .barcode{display:inline-block;width:148px;height:40px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,transparent 2px 5px,var(--ink) 5px 9px,transparent 9px 11px,var(--ink) 11px 12px,transparent 12px 16px);}
.tpl-07 .bcwrap p{font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:.34em;color:var(--ink-soft);margin-top:4px;}
`;

/** 노트 타입 분포를 "메모1 · 필사1" 형태로 (0개 타입 생략) */
function noteBreakdown(counts: Record<string, number>): string {
  return Object.entries(SHARE_NOTE_TYPE_LABELS)
    .filter(([key]) => (counts[key] ?? 0) > 0)
    .map(([key, label]) => `${label}${counts[key]}`)
    .join(" · ");
}

/** 하이프 스티커 폰트 크기 — 문구 길이에 맞춰 축소 */
function hypeFontSize(text: string): number {
  if (text.length <= 6) return 19;
  if (text.length <= 12) return 15;
  return 12;
}

/** "p." 접두를 정리한 쪽수 표기 */
function pageLabel(page: string | null): string | null {
  if (!page) return null;
  return `p.${page.replace(/^p\.?\s*/i, "")}`;
}

function LinerNotesCard({ data }: { data: ShareCardData }) {
  const pubDot = fmtDot(data.publishedAt);
  const catNo = pubDot
    ? `RT-${pubDot.slice(0, 4)}-${pubDot.slice(5, 7)}${pubDot.slice(8, 10)}`
    : null;
  const period = fmtPeriod(data.startedAt, data.completedAt);
  const breakdown = noteBreakdown(data.noteTypeCounts);

  const reason =
    data.readReason && data.readReason.length > 20
      ? `${data.readReason.slice(0, 19)}…`
      : data.readReason;

  const insights = data.insights.slice(0, 5);
  const quotes = data.quotes.slice(0, 3);
  const thoughts = data.thoughts.slice(0, 3);
  const hasSideA = insights.length > 0;
  const hasQuotes = quotes.length > 0;
  const hasSideB = thoughts.length > 0;
  const hasLiner =
    data.summary !== "" || data.journey !== "" || data.closingQuestion !== null;

  return (
    <>
      <style>{CSS}</style>
      <div className="tpl-07">
        <div className="masthead">
          <b>READTREE RECORDS</b>
          <span>LONG PLAY · 33⅓ RPM · STEREO</span>
          {catNo && <span>{catNo}</span>}
        </div>

        <div className="hero">
          <div className="vinyl">
            <div className="vlabel">
              <em>READTREE</em>
              <span>
                A READING ALBUM
                <br />
                SIDE A / SIDE B
              </span>
              <i />
            </div>
          </div>
          <div className="jacket">
            {data.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.coverUrl}
                alt={`${data.title} 표지`}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="jacket-blank">
                <span>{data.title}</span>
              </div>
            )}
            {reason && (
              <div className="hype">
                <b style={{ fontSize: hypeFontSize(reason) }}>{reason}</b>
                <span>WHY I READ</span>
              </div>
            )}
            <div className={data.isCompleted ? "stamp" : "stamp reading"}>
              {data.isCompleted ? "완독" : "독서중"}
            </div>
          </div>
        </div>

        <div className="titleblk">
          <p className="eyebrow">AI Reading Report · Liner Notes</p>
          <h1>{data.title}</h1>
          {data.author && (
            <p className="artist">
              <span>WRITTEN BY</span>
              <b>{data.author}</b>
            </p>
          )}
        </div>

        <div className="meta">
          {data.totalPages !== null && (
            <div>
              <i>PAGES</i>
              <b>{data.totalPages}</b>
              <em>{data.isCompleted ? "완독" : "독서중"}</em>
            </div>
          )}
          {data.periodDays !== null && (
            <div className="m-session">
              <i>SESSION</i>
              <b>
                {data.periodDays}
                <span style={{ fontSize: 16 }}>일</span>
              </b>
              {period && <em>{period}</em>}
            </div>
          )}
          <div>
            <i>RECORDS</i>
            <b>{data.noteCount}</b>
            {breakdown && <em>{breakdown}</em>}
          </div>
          <div>
            <i>REC DAYS</i>
            <b>{data.readingDays}</b>
            <em>기록한 날</em>
          </div>
        </div>

        {hasSideA && (
          <section className="side">
            <div className="side-head">
              <span className="badge">SIDE A</span>
              <div>
                <h2>핵심 인사이트</h2>
                <p>KEY INSIGHTS — TRACKLIST</p>
              </div>
            </div>
            {insights.map((insight, idx) => (
              <div className="trk" key={idx}>
                <div className="trow">
                  <span className="tno">A{idx + 1}</span>
                  <span className="tname">{insight.title}</span>
                  <span className="dots" />
                </div>
                <p className="tdesc">{insight.body}</p>
              </div>
            ))}
          </section>
        )}

        {hasQuotes && (
          <>
            {hasSideA && <div className="divider" />}
            <section className="side">
              <div className="side-head">
                <span className="badge q">EP</span>
                <div>
                  <h2>인상 깊은 구절</h2>
                  <p>QUOTED LINES — FROM THE BOOK</p>
                </div>
              </div>
              {quotes.map((quote, idx) => (
                <p className="tq qitem" key={idx}>
                  {quote.text}
                  {pageLabel(quote.page) && (
                    <span className="qpg">{pageLabel(quote.page)}</span>
                  )}
                </p>
              ))}
            </section>
          </>
        )}

        {hasSideB && (
          <>
            {(hasSideA || hasQuotes) && <div className="divider" />}
            <section className="side">
              <div className="b-side">
                <div className="side-head">
                  <span className="badge b">SIDE B</span>
                  <div>
                    <h2>나의 기록</h2>
                    <p>MY NOTES — B-SIDE ORIGINALS</p>
                  </div>
                </div>
                {thoughts.map((thought, idx) => (
                  <div className="trk" key={idx}>
                    <div className="trow">
                      <span className="tno">B{idx + 1}</span>
                      <p className="memo">
                        <span>MEMO</span>
                        <b>{thought}</b>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {hasLiner && (
          <section className="liner">
            <h2>LINER NOTES</h2>
            <p className="lsub">종합 요약 · 독서 여정</p>
            {data.summary && <p className="lbody">{data.summary}</p>}
            {data.journey && (
              <p className="journey">
                <b>READING JOURNEY</b>
                {data.journey}
              </p>
            )}
            {data.closingQuestion && (
              <p className="qline">{data.closingQuestion}</p>
            )}
          </section>
        )}

        <div className="footer">
          <div className="brand">
            <b>
              READ<i>TREE</i>
            </b>
            <p>기록하는 만큼 자라는 독서</p>
          </div>
          <div className="cat">
            {catNo && (
              <>
                CAT.NO {catNo}
                <br />
              </>
            )}
            {pubDot && <>PRESSED {pubDot}</>}
          </div>
          <div className="bcwrap">
            <span className="barcode" />
            <p>READ.HABITREE.IO</p>
          </div>
        </div>
      </div>
    </>
  );
}

export const linerNotesTemplate: ShareCardTemplateDef = {
  id: "liner-notes",
  name: "한 권의 LP, 라이너 노트",
  tagline: "책 한 권이 앨범 한 장이 되는 빈티지 레코드 리포트",
  fonts: ["Do Hyeon", "Gowun Batang", "Nanum Pen Script", "Bebas Neue", "IBM Plex Sans KR"],
  captureBg: "#E7D8B9",
  Component: LinerNotesCard,
};
