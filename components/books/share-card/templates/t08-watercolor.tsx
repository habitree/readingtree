import type { ReactNode } from "react";
import type { ShareCardData, ShareCardTemplateDef } from "./types";
import { SHARE_NOTE_TYPE_LABELS } from "./types";
import { fmtDot, fmtMonthDay, fmtPeriod, fmtYear, monthOf } from "./format";

const CSS = `
.tpl-08{--cream:#FBF7F0;--ink:#3E3A36;--ink2:#6B6259;--ink3:#9C9187;--petal:#EFB9BC;--blossom:#F6D8D8;--apricot:#FFCBB0;--sage:#A8BFA5;--saged:#7E9480;--seal:#BC5A54;width:800px;margin:0;background:var(--cream);color:var(--ink);font-family:'Gowun Batang',serif;position:relative;overflow:hidden;word-break:keep-all;line-height:1.7}
.tpl-08 *{margin:0;padding:0;box-sizing:border-box}
.tpl-08 .wash{position:absolute;border-radius:50%;pointer-events:none}
.tpl-08 .w1{top:-170px;left:-190px;width:560px;height:560px;background:radial-gradient(circle,rgba(246,216,216,.8) 0%,rgba(246,216,216,0) 68%)}
.tpl-08 .w2{top:-130px;right:-170px;width:500px;height:500px;background:radial-gradient(circle,rgba(255,203,176,.58) 0%,rgba(255,203,176,0) 66%)}
.tpl-08 .w3{top:780px;left:-230px;width:540px;height:540px;background:radial-gradient(circle,rgba(168,191,165,.42) 0%,rgba(168,191,165,0) 66%)}
.tpl-08 .w4{top:1400px;right:-240px;width:560px;height:560px;background:radial-gradient(circle,rgba(246,216,216,.5) 0%,rgba(246,216,216,0) 66%)}
.tpl-08 .w5{bottom:380px;left:-230px;width:520px;height:520px;background:radial-gradient(circle,rgba(255,203,176,.4) 0%,rgba(255,203,176,0) 66%)}
.tpl-08 .w6{bottom:-190px;right:-180px;width:520px;height:520px;background:radial-gradient(circle,rgba(168,191,165,.34) 0%,rgba(168,191,165,0) 66%)}
.tpl-08 .in{position:relative;padding:58px 72px 0}
.tpl-08 .mast{display:flex;justify-content:space-between;align-items:center;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:10.5px;letter-spacing:.24em;color:var(--ink3)}
.tpl-08 .vt{position:absolute;top:138px;right:60px;display:flex;flex-direction:column;align-items:center;gap:7px;font-size:13.5px;color:var(--ink2);letter-spacing:0}
.tpl-08 .vt .bar{width:1px;height:30px;background:rgba(62,58,54,.22);margin-bottom:4px}
.tpl-08 .seal{min-width:27px;height:27px;padding:0 6px;background:var(--seal);color:#FBF7F0;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border-radius:6px;transform:rotate(-6deg);margin-top:10px;box-shadow:0 2px 5px rgba(188,90,84,.3)}
.tpl-08 .hero{text-align:center;margin-top:66px}
.tpl-08 .season{display:inline-flex;align-items:center;gap:14px;font-size:15px;color:var(--ink2);letter-spacing:.09em}
.tpl-08 .petal{display:inline-block;width:8px;height:8px;background:linear-gradient(135deg,#F3C8CA,#E8A4A9);border-radius:50% 50% 50% 0;transform:rotate(45deg)}
.tpl-08 .petal.s{background:linear-gradient(135deg,#BCCDB9,#8FA68C)}
.tpl-08 .petal.a{background:linear-gradient(135deg,#FFD9C2,#F2AE85)}
.tpl-08 .title{margin:24px auto 0;max-width:540px;font-size:34px;font-weight:700;line-height:1.55;letter-spacing:.01em}
.tpl-08 .author{margin-top:18px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:13.5px;letter-spacing:.18em;color:var(--ink2)}
.tpl-08 .hr{display:inline-block;width:26px;height:1px;background:rgba(62,58,54,.28);vertical-align:middle;margin:0 14px 3px}
.tpl-08 .coverwrap{display:inline-block;margin-top:50px;background:#FFFDF9;padding:12px 12px 16px;border-radius:3px;box-shadow:0 2px 4px rgba(62,58,54,.08),0 18px 40px rgba(62,58,54,.16);transform:rotate(-1.6deg);position:relative}
.tpl-08 .coverwrap img{display:block;width:196px;height:auto;border-radius:2px}
.tpl-08 .tape{position:absolute;top:-13px;left:50%;width:96px;height:27px;background:rgba(246,216,216,.62);transform:translateX(-50%) rotate(-3deg);box-shadow:0 1px 2px rgba(62,58,54,.08)}
.tpl-08 .cap{margin-top:22px;font-family:'Nanum Pen Script',cursive;font-size:22px;color:var(--ink2)}
.tpl-08 .cap.nocover{margin-top:42px}
.tpl-08 .meta{margin-top:24px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:12px;letter-spacing:.1em;color:var(--ink3)}
.tpl-08 .meta .n{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:14.5px;letter-spacing:.06em;color:var(--ink2)}
.tpl-08 .sec{margin-top:104px}
.tpl-08 .sh{text-align:center;margin-bottom:48px}
.tpl-08 .sh .en{font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:.42em;color:#C08E90;text-transform:uppercase}
.tpl-08 .sh h2{margin-top:11px;font-size:22px;font-weight:700;letter-spacing:.06em}
.tpl-08 .sh .sub{margin-top:9px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:11.5px;letter-spacing:.1em;color:var(--ink3)}
.tpl-08 .qmark{text-align:center;font-family:'Cormorant Garamond',serif;font-size:110px;line-height:.62;color:rgba(239,185,188,.55);height:50px}
.tpl-08 .q{max-width:560px;margin:0 auto;text-align:center;font-size:17.5px;line-height:2.1}
.tpl-08 .q .pg{display:block;margin-top:14px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:14.5px;letter-spacing:.14em;color:var(--ink3)}
.tpl-08 .qsep{display:flex;justify-content:center;align-items:center;gap:12px;margin:48px 0}
.tpl-08 .qsep .tick{width:34px;height:1px;background:rgba(62,58,54,.14)}
.tpl-08 .ins{max-width:584px;margin:0 auto}
.tpl-08 .it{display:flex;gap:26px;align-items:flex-start}
.tpl-08 .it+.it{margin-top:42px}
.tpl-08 .num{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:30px;line-height:1.1;color:var(--saged);min-width:46px;text-align:center;border-top:1px solid rgba(126,148,128,.4);padding-top:10px}
.tpl-08 .it h3{font-size:17px;font-weight:700;letter-spacing:.02em;line-height:1.6}
.tpl-08 .it p{margin-top:9px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:13.5px;line-height:1.95;color:var(--ink2)}
.tpl-08 .rec{position:relative;max-width:600px;margin:0 auto;background:rgba(255,253,249,.82);border:1px solid rgba(62,58,54,.07);border-radius:4px;box-shadow:0 1px 2px rgba(62,58,54,.05),0 12px 28px rgba(62,58,54,.08);padding:38px 42px 34px}
.tpl-08 .rec+.rec{margin-top:42px}
.tpl-08 .tp2{background:rgba(255,203,176,.55)}
.tpl-08 .tp3{background:rgba(168,191,165,.45)}
.tpl-08 .rtag{font-family:'Noto Sans KR',sans-serif;font-weight:400;font-size:10.5px;letter-spacing:.22em;color:var(--saged)}
.tpl-08 .rec h3{margin-top:11px;font-size:16.5px;font-weight:700;line-height:1.6}
.tpl-08 .rec blockquote{margin-top:16px;padding-left:18px;border-left:2px solid var(--petal);font-size:14px;line-height:1.95;color:var(--ink2)}
.tpl-08 .memoL{margin-top:22px;font-family:'Noto Sans KR',sans-serif;font-weight:400;font-size:9.5px;letter-spacing:.26em;color:var(--ink3)}
.tpl-08 .memo{margin-top:6px;font-family:'Nanum Pen Script',cursive;font-size:22px;line-height:1.55;color:#57504A}
.tpl-08 .tl{display:flex;align-items:flex-start;max-width:520px;margin:14px auto 0}
.tpl-08 .pt{text-align:center;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:11.5px;color:var(--ink2);letter-spacing:.1em}
.tpl-08 .pt .d{display:block;font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:500;letter-spacing:.06em;color:var(--ink);margin:6px 0 4px}
.tpl-08 .dot{width:10px;height:10px;border-radius:50%;background:var(--petal);margin:0 auto;box-shadow:0 0 0 4px rgba(239,185,188,.25)}
.tpl-08 .dot.g{background:var(--saged);box-shadow:0 0 0 4px rgba(126,148,128,.2)}
.tpl-08 .ln{flex:1;border-top:1px dashed rgba(62,58,54,.3);margin:5px 18px 0;position:relative}
.tpl-08 .ln .day{position:absolute;top:-30px;left:50%;transform:translateX(-50%);font-family:'Cormorant Garamond',serif;font-style:italic;font-size:14px;letter-spacing:.1em;color:var(--ink3);white-space:nowrap}
.tpl-08 .jtxt{max-width:500px;margin:40px auto 0;text-align:center;font-size:14.5px;line-height:2.05;color:var(--ink2)}
.tpl-08 .stats{display:flex;justify-content:center;margin-top:46px}
.tpl-08 .st{width:186px;text-align:center;padding:8px 0}
.tpl-08 .st+.st{border-left:1px solid rgba(62,58,54,.12)}
.tpl-08 .st .v{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:36px;line-height:1;color:var(--ink)}
.tpl-08 .st .u{font-family:'Gowun Batang',serif;font-size:14px;color:var(--ink2);margin-left:3px}
.tpl-08 .st .k{margin-top:9px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:10.5px;letter-spacing:.16em;color:var(--ink3)}
.tpl-08 .why{margin-top:36px;text-align:center;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:12.5px;letter-spacing:.1em;color:var(--ink2)}
.tpl-08 .why b{font-weight:500;color:var(--ink)}
.tpl-08 .sum{margin-top:104px;background:linear-gradient(180deg,rgba(246,216,216,.4),rgba(255,203,176,.2) 55%,rgba(251,247,240,0));padding:64px 70px 52px;border-radius:8px;text-align:center}
.tpl-08 .sum .en{font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:.42em;color:#BB8A8C;text-transform:uppercase}
.tpl-08 .sum p{max-width:520px;margin:26px auto 0;font-size:15px;line-height:2.05}
.tpl-08 .sum .qq{max-width:460px;margin:36px auto 0;font-size:20px;font-weight:700;line-height:1.9}
.tpl-08 .prow{display:flex;justify-content:center;gap:10px;margin-top:34px}
.tpl-08 .foot{text-align:center;margin:88px 72px 0;padding:56px 0 60px;border-top:1px solid rgba(62,58,54,.1);position:relative}
.tpl-08 .logo{font-size:20px;font-weight:700;letter-spacing:.16em}
.tpl-08 .leaf{display:inline-block;width:9px;height:9px;background:linear-gradient(135deg,#A8BFA5,#7E9480);border-radius:50% 50% 50% 0;transform:rotate(45deg);margin:0 10px 2px 0}
.tpl-08 .tag{margin-top:11px;font-family:'Noto Sans KR',sans-serif;font-weight:300;font-size:12px;letter-spacing:.14em;color:var(--ink2)}
.tpl-08 .iss{margin-top:16px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;letter-spacing:.2em;color:var(--ink3)}
`;

/** 월별 순우리말/한자 관용 표기 (유월·시월 예외 포함) */
const MONTH_KO = ["일", "이", "삼", "사", "오", "유", "칠", "팔", "구", "시", "십일", "십이"];

/** 1~5 개수의 한글 관형사 */
const KO_COUNT = ["한", "두", "세", "네", "다섯"];

/** 1~5 개수의 영어 서수 키커 */
const EN_COUNT = ["One", "Two", "Three", "Four", "Five"];

const SEASONS = {
  winter: { ko: "겨울", en: "WINTER" },
  spring: { ko: "봄", en: "SPRING" },
  summer: { ko: "여름", en: "SUMMER" },
  autumn: { ko: "가을", en: "AUTUMN" },
} as const;

function seasonOfMonth(month: number): (typeof SEASONS)[keyof typeof SEASONS] {
  if (month <= 3) return SEASONS.winter;
  if (month <= 6) return SEASONS.spring;
  if (month <= 9) return SEASONS.summer;
  return SEASONS.autumn;
}

/** "215" / "p.215" / "P. 215" → "p. 215" */
function fmtPage(page: string | null): string | null {
  if (!page) return null;
  const cleaned = page.replace(/^\s*p\.?\s*/i, "").trim();
  return cleaned ? `p. ${cleaned}` : null;
}

/** noteTypeCounts → "메모 1 · 필사 1 · 사진 1" (0인 타입 생략) */
function noteTypeDist(counts: Record<string, number>): string | null {
  const parts = Object.keys(SHARE_NOTE_TYPE_LABELS)
    .filter((key) => (counts[key] ?? 0) > 0)
    .map((key) => `${SHARE_NOTE_TYPE_LABELS[key]} ${counts[key]}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

const SEP = "  ·  ";
const QSEP_PETALS = ["", "a", "s"];
const REC_TAPES = ["", "tp2", "tp3"];

function WatercolorCard({ data }: { data: ShareCardData }) {
  const month = monthOf(data.completedAt ?? data.startedAt) ?? monthOf(data.publishedAt) ?? 4;
  const season = seasonOfMonth(month);
  const verticalChars = `${MONTH_KO[month - 1]}월의수채`.split("");
  const year = fmtYear(data.completedAt ?? data.startedAt) ?? fmtYear(data.publishedAt);
  const period = fmtPeriod(data.startedAt, data.completedAt);
  const startDay = fmtMonthDay(data.startedAt);
  const endDay = data.isCompleted ? fmtMonthDay(data.completedAt) : fmtMonthDay(data.publishedAt);
  const issued = fmtDot(data.publishedAt);
  const dist = noteTypeDist(data.noteTypeCounts);

  const quotes = data.quotes.slice(0, 3);
  const insights = data.insights.slice(0, 5);
  const thoughts = data.thoughts.slice(0, 3);

  const metaParts: ReactNode[] = [];
  if (period) metaParts.push(<span className="n">{period}</span>);
  if (data.totalPages) {
    metaParts.push(<span>{data.totalPages}쪽{data.isCompleted ? " 완독" : ""}</span>);
  }
  if (data.periodDays) {
    metaParts.push(
      <span>
        <span className="n">{data.periodDays}</span>일의 여정
      </span>
    );
  }

  const tracesSubParts: string[] = [];
  if (dist) tracesSubParts.push(dist);
  if (data.readingDays > 0) tracesSubParts.push(`${data.readingDays}일에 걸쳐 남긴 흔적`);

  const hasStats = data.totalPages !== null || data.noteCount > 0 || data.readingDays > 0;
  const hasJourneySec = Boolean(startDay || data.journey || hasStats || data.readReason);
  const hasSum = Boolean(data.summary || data.closingQuestion);

  return (
    <>
      <style>{CSS}</style>
      <div className="tpl-08">
        <div className="wash w1" />
        <div className="wash w2" />
        <div className="wash w3" />
        <div className="wash w4" />
        <div className="wash w5" />
        <div className="wash w6" />
        <div className="in">
          <div className="mast">
            <span>READTREE · AI READING REPORT</span>
            <span>
              NO. {String(month).padStart(2, "0")} — {season.en}
            </span>
          </div>
          <div className="vt">
            <span className="bar" />
            {verticalChars.map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
            <span className="seal">{season.ko}</span>
          </div>

          <div className="hero">
            <div className="season">
              <span className="petal" />
              {`${season.ko}에 만나 오래 머문 한 권`}
              <span className="petal a" />
            </div>
            <h1 className="title">{data.title}</h1>
            {data.author && (
              <div className="author">
                <span className="hr" />
                {data.author} 지음
                <span className="hr" />
              </div>
            )}
            {data.coverUrl && (
              <div className="coverwrap">
                <span className="tape" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.coverUrl} alt={`${data.title} 표지`} crossOrigin="anonymous" />
              </div>
            )}
            <div className={data.coverUrl ? "cap" : "cap nocover"}>
              {year}년 {season.ko}
              {data.periodDays ? `, ${data.periodDays}일 동안` : "의 기록"}
            </div>
            {metaParts.length > 0 && (
              <div className="meta">
                {metaParts.map((part, i) => (
                  <span key={i}>
                    {i > 0 && SEP}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>

          {quotes.length > 0 && (
            <div className="sec">
              <div className="sh">
                <div className="en">Underlined Lines</div>
                <h2>밑줄 그은 문장들</h2>
                <div className="sub">책 속에서 오래 머문 {KO_COUNT[quotes.length - 1]} 문장</div>
              </div>
              <div className="qmark">{"“"}</div>
              {quotes.map((quote, i) => {
                const page = fmtPage(quote.page);
                return (
                  <div key={i}>
                    {i > 0 && (
                      <div className="qsep">
                        <span className="tick" />
                        <span className={`petal ${QSEP_PETALS[i % QSEP_PETALS.length]}`.trim()} />
                        <span className="tick" />
                      </div>
                    )}
                    <blockquote className="q">
                      {quote.text}
                      {page && <span className="pg">{page}</span>}
                    </blockquote>
                  </div>
                );
              })}
            </div>
          )}

          {insights.length > 0 && (
            <div className="sec">
              <div className="sh">
                <div className="en">
                  {insights.length === 1 ? "One Insight" : `${EN_COUNT[insights.length - 1]} Insights`}
                </div>
                <h2>책이 남긴 {KO_COUNT[insights.length - 1]} 가지 생각</h2>
                <div className="sub">AI가 나의 기록에서 길어 올린 인사이트</div>
              </div>
              <div className="ins">
                {insights.map((insight, i) => (
                  <div className="it" key={i}>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{insight.title}</h3>
                      <p>{insight.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {thoughts.length > 0 && (
            <div className="sec">
              <div className="sh">
                <div className="en">My Traces</div>
                <h2>나의 기록</h2>
                {tracesSubParts.length > 0 && <div className="sub">{tracesSubParts.join(" — ")}</div>}
              </div>
              {thoughts.map((thought, i) => (
                <div className="rec" key={i}>
                  <span className={`tape ${REC_TAPES[i % REC_TAPES.length]}`.trim()} />
                  <span className="rtag">기록 {String(i + 1).padStart(2, "0")}</span>
                  <div className="memoL">MY NOTE</div>
                  <div className="memo">{thought}</div>
                </div>
              ))}
            </div>
          )}

          {hasJourneySec && (
            <div className="sec">
              <div className="sh">
                <div className="en">The Journey</div>
                <h2>독서 여정</h2>
              </div>
              {startDay && (
                <div className="tl">
                  <div className="pt">
                    <span className="dot" />
                    <span className="d">{startDay}</span>
                    읽기 시작
                  </div>
                  <div className="ln">
                    {data.periodDays && <span className="day">{data.periodDays} days</span>}
                  </div>
                  <div className="pt">
                    <span className="dot g" />
                    {endDay && <span className="d">{endDay}</span>}
                    {data.isCompleted ? "완독" : "읽는 중"}
                  </div>
                </div>
              )}
              {data.journey && <p className="jtxt">{data.journey}</p>}
              {hasStats && (
                <div className="stats">
                  {data.totalPages !== null && (
                    <div className="st">
                      <div className="v">
                        {data.totalPages}
                        <span className="u">쪽</span>
                      </div>
                      <div className="k">{data.isCompleted ? "완독" : "전체 분량"}</div>
                    </div>
                  )}
                  {data.noteCount > 0 && (
                    <div className="st">
                      <div className="v">
                        {data.noteCount}
                        <span className="u">개</span>
                      </div>
                      <div className="k">{dist ? `기록 — ${dist}` : "기록"}</div>
                    </div>
                  )}
                  {data.readingDays > 0 && (
                    <div className="st">
                      <div className="v">
                        {data.readingDays}
                        <span className="u">일</span>
                      </div>
                      <div className="k">기록한 날</div>
                    </div>
                  )}
                </div>
              )}
              {data.readReason && (
                <div className="why">
                  이 책을 펼친 이유 — <b>{data.readReason}</b>
                </div>
              )}
            </div>
          )}

          {hasSum && (
            <div className="sum">
              <div className="en">Epilogue</div>
              {data.summary && <p>{data.summary}</p>}
              {data.closingQuestion && (
                <div className="qq">
                  {"“"}
                  {data.closingQuestion}
                  {"”"}
                </div>
              )}
              <div className="prow">
                <span className="petal" />
                <span className="petal a" />
                <span className="petal s" />
              </div>
            </div>
          )}
        </div>

        <div className="foot">
          <div className="logo">
            <span className="leaf" />
            ReadTree
          </div>
          <div className="tag">기록하는 만큼 자라는 독서</div>
          {issued && <div className="iss">AI READING REPORT · ISSUED {issued}</div>}
        </div>
      </div>
    </>
  );
}

export const watercolorTemplate: ShareCardTemplateDef = {
  id: "watercolor",
  name: "사월의 수채",
  tagline: "봄의 한강을 달리며 읽은 책 — 계절을 물들여 남기는 수채 독서 리포트",
  fonts: ["Gowun Batang", "Noto Sans KR", "Nanum Pen Script", "Cormorant Garamond"],
  captureBg: "#FBF7F0",
  Component: WatercolorCard,
};
