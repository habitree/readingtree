import type { ShareCardData, ShareCardTemplateDef } from "./types";
import { SHARE_NOTE_TYPE_LABELS } from "./types";
import { fmtDot, fmtKorean, fmtMonthDay, fmtPeriod, fmtYear, monthOf } from "./format";

const CSS = `
.tpl-06{--ink:#1F3550;--ink2:#3D5578;--pen:#24457A;--red:#A94454;--paper:#FAF6EA;--line:#C9D6E6;--mut:#6C7A8E;width:800px;background:#E7E1D3;padding:34px;box-sizing:border-box;font-family:'Gowun Batang','Noto Serif KR',serif;color:var(--ink);word-break:keep-all;}
.tpl-06 *{box-sizing:border-box;margin:0;padding:0;}
.tpl-06 .letter{position:relative;background:var(--paper);box-shadow:0 2px 6px rgba(31,53,80,.14),0 20px 44px rgba(31,53,80,.16),inset 0 0 70px rgba(148,125,90,.10);padding-bottom:44px;}
.tpl-06 .letter::before,.tpl-06 .letter::after{content:'';position:absolute;left:0;right:0;height:2px;pointer-events:none;background:linear-gradient(180deg,rgba(107,79,58,.10),rgba(255,255,255,.55));}
.tpl-06 .letter::before{top:31%;}
.tpl-06 .letter::after{top:65%;}
.tpl-06 .airmail{height:10px;background:repeating-linear-gradient(-45deg,#AA4A55 0 13px,var(--paper) 13px 26px,#3D5B8C 26px 39px,var(--paper) 39px 52px);}
.tpl-06 .inner{padding:46px 58px 0;position:relative;z-index:1;}
.tpl-06 .hdr{position:relative;min-height:216px;padding-right:190px;}
.tpl-06 .kicker{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.28em;color:var(--red);margin-bottom:18px;}
.tpl-06 .booktitle{font-size:29px;font-weight:700;line-height:1.5;letter-spacing:.01em;margin-bottom:14px;}
.tpl-06 .booktitle small{display:block;font-size:12px;font-weight:400;font-family:'Courier Prime',monospace;letter-spacing:.22em;color:var(--mut);margin-bottom:10px;}
.tpl-06 .bookmeta{font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:12.5px;letter-spacing:.1em;color:var(--mut);}
.tpl-06 .stampwrap{position:absolute;top:0;right:0;width:170px;height:216px;}
.tpl-06 .stamp{width:130px;padding:8px 8px 6px;margin-left:40px;background-image:radial-gradient(circle,var(--paper) 0 3px,#FDFCF6 3.4px);background-size:13px 13px;transform:rotate(2.5deg);box-shadow:0 3px 9px rgba(31,53,80,.20);}
.tpl-06 .stamp img{display:block;width:100%;height:auto;}
.tpl-06 .stamp .ph{display:flex;align-items:center;justify-content:center;width:100%;height:152px;background:linear-gradient(150deg,#3D5B8C,#24457A 55%,#1F3550);color:rgba(250,246,234,.88);font-size:28px;letter-spacing:.18em;text-align:center;line-height:1.35;}
.tpl-06 .stamp .cap{font-family:'Courier Prime',monospace;font-size:8.5px;letter-spacing:.18em;text-align:center;color:var(--ink2);padding-top:4px;}
.tpl-06 .cancel{position:absolute;top:128px;right:88px;width:120px;height:34px;background:repeating-linear-gradient(180deg,rgba(42,74,127,.42) 0 2px,transparent 2px 12px);transform:rotate(-9deg);}
.tpl-06 .postmark{position:absolute;top:96px;right:92px;width:110px;height:110px;border:2px solid rgba(42,74,127,.62);border-radius:50%;transform:rotate(-11deg);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'Courier Prime',monospace;color:rgba(42,74,127,.85);background:rgba(250,246,234,.55);}
.tpl-06 .postmark::before{content:'';position:absolute;top:6px;left:6px;right:6px;bottom:6px;border:1px solid rgba(42,74,127,.45);border-radius:50%;}
.tpl-06 .postmark .p1{font-size:10px;letter-spacing:.16em;}
.tpl-06 .postmark .p2{font-size:13.5px;letter-spacing:.04em;margin:4px 0;}
.tpl-06 .postmark .p3{font-size:8.5px;letter-spacing:.22em;}
.tpl-06 .rule{height:1px;background:rgba(31,53,80,.18);margin:16px 0 40px;}
.tpl-06 .greet{font-family:'Nanum Pen Script',cursive;font-size:36px;color:var(--pen);transform:rotate(-.5deg);margin-bottom:10px;}
.tpl-06 .ruled{font-size:17px;line-height:46px;color:var(--ink);background-image:repeating-linear-gradient(180deg,transparent 0 35px,var(--line) 35px 36.5px,transparent 36.5px 46px);}
.tpl-06 .sec{display:flex;align-items:center;gap:14px;margin:52px 0 22px;}
.tpl-06 .sec .n{font-family:'Courier Prime',monospace;font-size:10.5px;letter-spacing:.2em;color:var(--red);border:1px solid rgba(169,68,84,.5);padding:4px 9px 3px;white-space:nowrap;}
.tpl-06 .sec h3{font-size:19px;font-weight:700;letter-spacing:.04em;white-space:nowrap;}
.tpl-06 .sec::after{content:'';flex:1;height:1px;background:rgba(31,53,80,.18);}
.tpl-06 .ins{position:relative;padding-left:38px;margin-bottom:26px;}
.tpl-06 .ins .no{position:absolute;left:2px;top:-2px;font-family:'Nanum Pen Script',cursive;font-size:29px;color:var(--red);}
.tpl-06 .ins b{display:block;font-size:17.5px;font-weight:700;letter-spacing:.02em;margin-bottom:7px;}
.tpl-06 .ins p{font-size:15px;line-height:1.85;color:var(--ink2);}
.tpl-06 .rec{margin-bottom:42px;}
.tpl-06 .rec-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:14px;}
.tpl-06 .rec-head b{font-size:16.5px;font-weight:700;letter-spacing:.02em;}
.tpl-06 .rec-head span{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.14em;color:var(--mut);white-space:nowrap;}
.tpl-06 .quo{position:relative;margin:0 0 14px;padding:20px 22px 18px 26px;background:#FDFAF0;border:1px solid rgba(31,53,80,.14);border-left:3px solid var(--pen);box-shadow:0 2px 7px rgba(31,53,80,.08);font-size:15.5px;line-height:1.9;color:var(--ink);}
.tpl-06 .quo::before{content:'\\201C';position:absolute;top:-6px;left:8px;font-size:52px;line-height:1;color:rgba(31,53,80,.14);}
.tpl-06 .quo::after{content:'';position:absolute;top:-11px;left:50%;margin-left:-44px;width:88px;height:22px;background:repeating-linear-gradient(90deg,rgba(207,217,233,.72) 0 6px,rgba(219,228,241,.72) 6px 12px);transform:rotate(-2.5deg);box-shadow:0 1px 2px rgba(31,53,80,.10);}
.tpl-06 .memo{font-family:'Nanum Pen Script',cursive;font-size:22px;line-height:1.55;color:var(--pen);transform:rotate(-.6deg);padding-left:6px;}
.tpl-06 .voyage{position:relative;margin:54px 0 0;border:1.5px solid rgba(42,74,127,.55);background:#FBF8EF;padding:26px 28px 22px;}
.tpl-06 .voyage .vt{font-family:'Courier Prime',monospace;font-size:10.5px;letter-spacing:.26em;color:var(--ink2);margin-bottom:18px;}
.tpl-06 .voyage .done{position:absolute;top:-15px;right:20px;font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.2em;color:var(--red);border:2px solid rgba(169,68,84,.7);background:var(--paper);padding:5px 12px 4px;transform:rotate(-4deg);opacity:.9;}
.tpl-06 .voyage .done.reading{color:var(--pen);border-color:rgba(42,74,127,.6);}
.tpl-06 .vrow{display:flex;justify-content:space-between;gap:8px;}
.tpl-06 .v{text-align:center;flex:1;}
.tpl-06 .v b{display:block;font-family:'Courier Prime',monospace;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:5px;}
.tpl-06 .v i{font-style:normal;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:10.5px;letter-spacing:.14em;color:var(--mut);}
.tpl-06 .vsub{margin-top:16px;padding-top:14px;border-top:1px dashed rgba(42,74,127,.35);display:flex;justify-content:space-between;align-items:center;gap:12px;}
.tpl-06 .vsub .vm{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.1em;color:var(--ink2);white-space:nowrap;}
.tpl-06 .vsub .vh{font-family:'Nanum Pen Script',cursive;font-size:19px;color:var(--pen);text-align:right;}
.tpl-06 .ask{font-family:'Nanum Pen Script',cursive;font-size:27px;color:var(--pen);text-align:center;margin:26px 0 6px;transform:rotate(-.4deg);}
.tpl-06 .sign{margin-top:36px;display:flex;justify-content:flex-end;align-items:center;gap:14px;}
.tpl-06 .sign .date{font-family:'Nanum Pen Script',cursive;font-size:28px;color:var(--pen);transform:rotate(-1deg);}
.tpl-06 .seal{width:36px;height:36px;background:#B23A3A;border-radius:8px;color:#FBF6EC;font-size:12px;line-height:1.15;display:flex;align-items:center;justify-content:center;text-align:center;transform:rotate(4deg);box-shadow:inset 0 0 7px rgba(0,0,0,.28),0 2px 4px rgba(31,53,80,.2);}
.tpl-06 .foot{margin:46px 58px 0;padding-top:20px;border-top:1px dashed rgba(31,53,80,.32);display:flex;justify-content:space-between;align-items:center;}
.tpl-06 .foot .lg{font-size:16px;font-weight:700;letter-spacing:.03em;}
.tpl-06 .foot .lg span{font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:10.5px;letter-spacing:.16em;color:var(--mut);margin-left:10px;}
.tpl-06 .foot .pub{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.18em;color:var(--mut);}
`;

const COUNT_WORDS = ["한", "두", "세", "네", "다섯"];
const SCENE_ORDINALS = ["첫", "두", "세"];
const SECTION_ORDINALS = ["첫째 장", "둘째 장", "셋째 장"];

/** noteTypeCounts → "메모 1 · 필사 1 · 사진 1" 조각 (0인 타입 생략) */
function noteTypeParts(counts: Record<string, number>, unit: string): string[] {
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([type, c]) => `${SHARE_NOTE_TYPE_LABELS[type] ?? type} ${c}${unit}`);
}

/** 편지 서두 문단 — readReason·날짜·여정 수치가 없어도 자연스럽게 조립 */
function buildLetterBody(data: ShareCardData): string {
  const started = fmtKorean(data.startedAt);
  const completed = fmtKorean(data.completedAt);
  const opening = data.readReason
    ? `‘${data.readReason}’ — 그렇게 만난 이 책을 `
    : "이 책을 ";

  let first: string;
  if (started && completed) first = `${opening}${started}에 펼쳐, ${completed}에 덮었다.`;
  else if (started) first = `${opening}${started}에 펼쳤다.`;
  else if (completed) first = `${opening}${completed}에 마지막 장까지 읽고 덮었다.`;
  else first = `${opening}천천히 읽어 나갔다.`;

  const mid: string[] = [];
  if (data.periodDays) mid.push(`${data.periodDays}일의 여정 동안`);
  if (data.totalPages) mid.push(`${data.totalPages}쪽을 지나며`);

  let second = "";
  if (data.noteCount > 0) {
    const parts = noteTypeParts(data.noteTypeCounts, "개");
    const trace = parts.length > 0 ? parts.join(", ") : `기록 ${data.noteCount}개`;
    second = ` ${[...mid, `${trace}를 남겼다.`].join(" ")}`;
  } else if (mid.length > 0) {
    second = ` ${mid.join(" ")} 한 문장 한 문장을 눈에 담았다.`;
  }

  const closing =
    data.noteCount > 0
      ? " 그 흔적들을 여기, 편지로 옮겨 적는다."
      : " 그 시간을 여기, 편지로 옮겨 적는다.";

  return `${first}${second}${closing}`;
}

/** 서명 라인 — "2026년 봄, 책을 덮으며" */
function buildSignDate(data: ShareCardData): string {
  const base = data.completedAt ?? data.publishedAt;
  const year = fmtYear(base);
  const month = monthOf(base);
  const season =
    month === null ? "" : month >= 3 && month <= 5 ? "봄" : month >= 6 && month <= 8 ? "여름" : month >= 9 && month <= 11 ? "가을" : "겨울";
  const verb = data.isCompleted ? "책을 덮으며" : "책장을 넘기며";
  return year && season ? `${year}년 ${season}, ${verb}` : verb;
}

function pageLabel(page: string): string {
  return /^p/i.test(page) ? page : `p.${page}`;
}

function LetterCard({ data }: { data: ShareCardData }) {
  const period = fmtPeriod(data.startedAt, data.completedAt);
  const metaParts: string[] = [];
  if (data.author) metaParts.push(`${data.author} 지음`);
  if (data.totalPages) metaParts.push(`${data.totalPages}쪽`);
  if (period) metaParts.push(`${period} ${data.isCompleted ? "완독" : "읽는 중"}`);

  const insights = data.insights.slice(0, 5);
  const quotes = data.quotes.slice(0, 3);
  const thoughts = data.thoughts.slice(0, 3);
  const sceneCount = Math.max(quotes.length, thoughts.length);

  const hasInsights = insights.length > 0;
  const hasScenes = sceneCount > 0;
  let ordinalIndex = 0;
  const insightsOrdinal = hasInsights ? SECTION_ORDINALS[ordinalIndex++] : "";
  const scenesOrdinal = hasScenes ? SECTION_ORDINALS[ordinalIndex++] : "";
  const voyageOrdinal = SECTION_ORDINALS[ordinalIndex];

  const startDay = fmtMonthDay(data.startedAt);
  const endDay = fmtMonthDay(data.completedAt);
  const publishedDot = fmtDot(data.publishedAt);
  const voyageParts = noteTypeParts(data.noteTypeCounts, "");
  const insightCountWord = COUNT_WORDS[insights.length - 1] ?? String(insights.length);
  const sceneCountWord = COUNT_WORDS[sceneCount - 1] ?? String(sceneCount);

  return (
    <>
      <style>{CSS}</style>
      <div className="tpl-06">
        <div className="letter">
          <div className="airmail" />
          <div className="inner">
            <div className="hdr">
              <div className="kicker">A LETTER TO MYSELF · AI 독서 리포트</div>
              <h1 className="booktitle">
                <small>VIA READTREE POST</small>
                {data.title}
              </h1>
              {metaParts.length > 0 && <div className="bookmeta">{metaParts.join(" · ")}</div>}
              <div className="stampwrap">
                <div className="stamp">
                  {data.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.coverUrl} alt="" crossOrigin="anonymous" />
                  ) : (
                    <div className="ph">
                      讀
                      <br />樹
                    </div>
                  )}
                  <div className="cap">
                    {data.totalPages ? `BOOK · ${data.totalPages} P` : "BOOK · READTREE"}
                  </div>
                </div>
                <div className="cancel" />
                <div className="postmark">
                  <span className="p1">READTREE</span>
                  <span className="p2">{publishedDot}</span>
                  <span className="p3">{data.isCompleted ? "SEOUL · 完讀" : "SEOUL · 讀書"}</span>
                </div>
              </div>
            </div>
            <div className="rule" />
            <div className="greet">나에게,</div>
            <p className="ruled">{buildLetterBody(data)}</p>

            {hasInsights && (
              <>
                <div className="sec">
                  <span className="n">{insightsOrdinal}</span>
                  <h3>이 책이 남긴 {insightCountWord} 가지</h3>
                </div>
                {insights.map((ins, i) => (
                  <div className="ins" key={i}>
                    <span className="no">{i + 1}.</span>
                    <b>{ins.title}</b>
                    <p>{ins.body}</p>
                  </div>
                ))}
              </>
            )}

            {hasScenes && (
              <>
                <div className="sec">
                  <span className="n">{scenesOrdinal}</span>
                  <h3>책갈피처럼 끼워 둔 {sceneCountWord} 장면</h3>
                </div>
                {Array.from({ length: sceneCount }, (_, i) => {
                  const quote = quotes[i];
                  const thought = thoughts[i];
                  return (
                    <div className="rec" key={i}>
                      <div className="rec-head">
                        <b>{`${SCENE_ORDINALS[i]} 번째 책갈피`}</b>
                        {quote?.page && <span>{pageLabel(quote.page)}</span>}
                      </div>
                      {quote && <div className="quo">{quote.text}</div>}
                      {thought && <div className="memo">— {thought}</div>}
                    </div>
                  );
                })}
              </>
            )}

            <div className="sec">
              <span className="n">{voyageOrdinal}</span>
              <h3>여정의 기록</h3>
            </div>
            <div className="voyage">
              <div className={data.isCompleted ? "done" : "done reading"}>
                {data.isCompleted ? "완독 COMPLETE" : "READING 여정 중"}
              </div>
              <div className="vt">READING VOYAGE · 독서 여정</div>
              <div className="vrow">
                {startDay && (
                  <div className="v">
                    <b>{startDay}</b>
                    <i>시작</i>
                  </div>
                )}
                {endDay && (
                  <div className="v">
                    <b>{endDay}</b>
                    <i>완독</i>
                  </div>
                )}
                {data.periodDays !== null && (
                  <div className="v">
                    <b>{data.periodDays}일</b>
                    <i>여정</i>
                  </div>
                )}
                {data.totalPages !== null && (
                  <div className="v">
                    <b>{data.totalPages}쪽</b>
                    <i>분량</i>
                  </div>
                )}
                <div className="v">
                  <b>{data.noteCount}개</b>
                  <i>기록</i>
                </div>
                <div className="v">
                  <b>{data.readingDays}일</b>
                  <i>기록한 날</i>
                </div>
              </div>
              {(voyageParts.length > 0 || data.journey) && (
                <div className="vsub">
                  {voyageParts.length > 0 && <span className="vm">{voyageParts.join(" · ")}</span>}
                  {data.journey && <span className="vh">{data.journey}</span>}
                </div>
              )}
            </div>

            {data.summary && (
              <p className="ruled" style={{ marginTop: 44 }}>
                {data.summary}
              </p>
            )}
            {data.closingQuestion && <div className="ask">“{data.closingQuestion}”</div>}
            <div className="sign">
              <span className="date">{buildSignDate(data)}</span>
              <span className="seal">
                讀
                <br />樹
              </span>
            </div>
          </div>
          <div className="foot">
            <div className="lg">
              ReadTree<span>기록하는 만큼 자라는 독서</span>
            </div>
            <div className="pub">AI READING REPORT{publishedDot ? ` · ${publishedDot} 발행` : ""}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export const letterTemplate: ShareCardTemplateDef = {
  id: "letter",
  name: "푸른 잉크의 손편지",
  tagline: "완독 후, 나에게 부치는 블루블랙 잉크의 편지",
  fonts: ["Gowun Batang", "Nanum Pen Script", "Noto Sans KR", "Courier Prime"],
  captureBg: "#E7E1D3",
  Component: LetterCard,
};
