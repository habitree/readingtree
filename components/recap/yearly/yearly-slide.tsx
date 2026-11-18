/**
 * 연간 독서 결산 슬라이드 (REQ-0014).
 *
 * 360×640(9:16) 고정 크기로 그린다. 화면에서는 뷰어가 zoom 으로 맞추고,
 * 이미지 저장 때는 화면 밖 실제 크기 노드를 1080×1920 으로 캡처한다.
 *
 * 캡처(html2canvas) 제약 — 공유 카드 템플릿과 같은 규칙:
 *  - 색은 하드코딩(테마 무관), 셀렉터는 전부 `.yw` 접두
 *  - line-clamp / filter / backdrop-filter / box-shadow / writing-mode 금지 → 말줄임은 JS(clip)
 *  - 외부 이미지는 표지뿐이며 getProxiedImageUrl 로 프록시
 */

import { getProxiedImageUrl } from "@/lib/utils/image";
import { formatReadingTime } from "@/lib/recap/text";
import { PEAK_TIME_LABELS, type YearlyRecapComputed, type YearlySlideKey } from "@/lib/recap/yearly";

export const SLIDE_WIDTH = 360;
export const SLIDE_HEIGHT = 640;

const CSS = `
.yw{position:relative;width:${SLIDE_WIDTH}px;height:${SLIDE_HEIGHT}px;overflow:hidden;box-sizing:border-box;padding:28px 26px 24px;display:flex;flex-direction:column;font-family:var(--font-noto-sans-kr),"Noto Sans KR",sans-serif;line-height:1.45;letter-spacing:-0.01em;word-break:keep-all;overflow-wrap:anywhere}
.yw *{box-sizing:border-box;margin:0}
.yw-dark{background:#0E2A1F;color:#F3EFE4}
.yw-light{background:#F3EFE4;color:#14301F}
.yw-earth{background:#C4935A;color:#1B1408}
.yw-top{display:flex;justify-content:space-between;font-size:10px;letter-spacing:0.14em;opacity:0.7;text-transform:uppercase}
.yw-foot{margin-top:auto;font-size:10px;letter-spacing:0.08em;opacity:0.6}
.yw-body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;min-height:0}
.yw-serif{font-family:var(--font-noto-serif-kr),"Noto Serif KR",serif}
.yw-label{font-size:13px;opacity:0.75}
.yw-hero{font-size:76px;font-weight:900;line-height:1;letter-spacing:-0.04em}
.yw-big{font-size:44px;font-weight:900;line-height:1.1;letter-spacing:-0.03em}
.yw-title{font-size:26px;font-weight:700;line-height:1.3}
.yw-accent-dark{color:#E8C77E}
.yw-accent-light{color:#1A7555}
.yw-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.yw-cell{padding:12px 14px;border-radius:12px}
.yw-dark .yw-cell{background:#17382B}
.yw-light .yw-cell{background:#E6DFCD}
.yw-earth .yw-cell{background:#B28049}
.yw-cell b{display:block;font-size:22px;font-weight:900;line-height:1.2}
.yw-cell span{font-size:11px;opacity:0.75}
.yw-note{font-size:12px;opacity:0.8}
.yw-bars{display:flex;align-items:flex-end;gap:6px;height:190px}
.yw-bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%}
.yw-bar i{display:block;width:100%;border-radius:4px 4px 0 0;background:#3F6B57}
.yw-bar.yw-best i{background:#E8C77E}
.yw-bar em{font-style:normal;font-size:10px;opacity:0.7}
.yw-cover{width:132px;height:190px;border-radius:6px;object-fit:cover;background:#B28049;display:block}
.yw-covers{display:flex;flex-wrap:wrap;gap:6px}
.yw-covers img{width:44px;height:64px;border-radius:3px;object-fit:cover;display:block}
.yw-rows{display:flex;flex-direction:column;gap:12px}
.yw-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:10px;border-bottom:1px solid rgba(20,48,31,0.18)}
.yw-dark .yw-row{border-bottom-color:rgba(243,239,228,0.18)}
.yw-row span{font-size:12px;opacity:0.75}
.yw-row b{font-size:15px;font-weight:700;text-align:right}
.yw-quote-mark{font-size:72px;line-height:0.6;font-weight:900}
.yw-quote{font-size:19px;line-height:1.7;font-weight:400}
.yw-list{display:flex;flex-direction:column;gap:8px;padding:0;list-style:none}
.yw-list li{font-size:13px;padding-left:14px;position:relative}
.yw-list li::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;border-radius:50%;background:currentColor;opacity:0.6}
`;

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function signed(n: number, unit: string): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toLocaleString("ko-KR")}${unit}`;
}

function formatDateKey(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${m}월 ${d}일`;
}

interface SlideProps {
  slide: YearlySlideKey;
  computed: YearlyRecapComputed;
  userName: string | null;
}

export function YearlySlide({ slide, computed, userName }: SlideProps) {
  const { year, stats, highlights } = computed;
  const owner = userName ? `${clip(userName, 10)}님의` : "나의";

  const frame = (tone: "dark" | "light" | "earth", children: React.ReactNode) => (
    <div className={`yw yw-${tone}`}>
      <style>{CSS}</style>
      <div className="yw-top">
        <span>Habitree</span>
        <span>{year} 독서 결산</span>
      </div>
      <div className="yw-body">{children}</div>
      <div className="yw-foot">read.habitree.io</div>
    </div>
  );

  switch (slide) {
    case "intro":
      return frame(
        "dark",
        <>
          <p className="yw-label">{owner}</p>
          <p className="yw-hero yw-serif yw-accent-dark">{year}</p>
          <p className="yw-title yw-serif">독서 한 해</p>
          <p className="yw-note">올해 읽고 남긴 것들을 모았어요.</p>
        </>,
      );

    case "totals": {
      const prev = stats.vsPrev;
      return frame(
        "light",
        <>
          <p className="yw-label">올해 책과 함께한 시간</p>
          <p className="yw-big yw-serif yw-accent-light">{formatReadingTime(stats.totalReadingSeconds)}</p>
          <div className="yw-grid">
            <div className="yw-cell">
              <b>{stats.completedBooks.toLocaleString("ko-KR")}권</b>
              <span>완독</span>
            </div>
            <div className="yw-cell">
              <b>{stats.totalPages.toLocaleString("ko-KR")}쪽</b>
              <span>읽은 페이지</span>
            </div>
            <div className="yw-cell">
              <b>{stats.totalNotes.toLocaleString("ko-KR")}개</b>
              <span>남긴 기록</span>
            </div>
            <div className="yw-cell">
              <b>{stats.activeDays.toLocaleString("ko-KR")}일</b>
              <span>독서한 날</span>
            </div>
          </div>
          {prev && (
            <p className="yw-note">
              작년 대비 {signed(Math.round(prev.secondsDelta / 3600), "시간")} · 완독 {signed(prev.booksDelta, "권")} ·
              기록 {signed(prev.notesDelta, "개")}
            </p>
          )}
        </>,
      );
    }

    case "monthly": {
      const useSeconds = stats.monthly.seconds.some((v) => v > 0);
      const series = useSeconds
        ? stats.monthly.seconds
        : stats.monthly.notes.map((n, i) => n + stats.monthly.completed[i]);
      const max = Math.max(...series, 1);
      const best = stats.bestMonth ?? 1;
      const bestValue = series[best - 1];
      return frame(
        "dark",
        <>
          <p className="yw-label">월별 흐름</p>
          <p className="yw-title yw-serif">
            가장 많이 읽은 달은 <span className="yw-accent-dark">{best}월</span>
          </p>
          <div className="yw-bars">
            {series.map((v, i) => (
              <div key={i} className={`yw-bar${i === best - 1 ? " yw-best" : ""}`}>
                <i style={{ height: `${Math.max(2, Math.round((v / max) * 100))}%` }} />
                <em>{i + 1}</em>
              </div>
            ))}
          </div>
          <p className="yw-note">
            {best}월에 {useSeconds ? formatReadingTime(bestValue) : `기록·완독 ${bestValue}건`}
          </p>
        </>,
      );
    }

    case "book": {
      const top = highlights.topBook;
      const covers = highlights.completedCovers;
      return frame(
        "earth",
        <>
          {top ? (
            <>
              <p className="yw-label">올해 가장 많이 기록한 책</p>
              {top.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="yw-cover" src={getProxiedImageUrl(top.coverImageUrl)} alt="" crossOrigin="anonymous" />
              )}
              <div>
                <p className="yw-title yw-serif">{clip(top.title, 34)}</p>
                <p className="yw-note">
                  {top.author ? `${clip(top.author, 20)} · ` : ""}기록 {top.noteCount}개
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="yw-label">올해 완독한 책</p>
              <p className="yw-big yw-serif">{stats.completedBooks}권</p>
            </>
          )}
          {covers.length > 0 && (
            <div>
              {top && <p className="yw-note" style={{ marginBottom: 8 }}>올해 완독 {stats.completedBooks}권</p>}
              <div className="yw-covers">
                {covers.slice(0, top ? 6 : 12).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={getProxiedImageUrl(url)} alt="" crossOrigin="anonymous" />
                ))}
              </div>
            </div>
          )}
        </>,
      );
    }

    case "rhythm":
      return frame(
        "light",
        <>
          <p className="yw-label">독서 리듬</p>
          {highlights.peakTime && (
            <p className="yw-big yw-serif yw-accent-light">{PEAK_TIME_LABELS[highlights.peakTime]} 독서</p>
          )}
          <div className="yw-rows">
            {highlights.longestSession && (
              <div className="yw-row">
                <span>가장 길게 읽은 한 번</span>
                <b>
                  {formatReadingTime(highlights.longestSession.minutes * 60)}
                  {highlights.longestSession.bookTitle ? ` · ${clip(highlights.longestSession.bookTitle, 12)}` : ""}
                </b>
              </div>
            )}
            {stats.maxStreak >= 2 && (
              <div className="yw-row">
                <span>가장 길게 이어진 독서</span>
                <b>{stats.maxStreak}일 연속</b>
              </div>
            )}
            {highlights.busiestDay && (
              <div className="yw-row">
                <span>기록을 가장 많이 남긴 날</span>
                <b>
                  {formatDateKey(highlights.busiestDay.dateKey)} · {highlights.busiestDay.count}개
                </b>
              </div>
            )}
            <div className="yw-row">
              <span>독서 세션</span>
              <b>{stats.sessionCount.toLocaleString("ko-KR")}번</b>
            </div>
          </div>
        </>,
      );

    case "quote":
      return frame(
        "dark",
        <>
          <p className="yw-label">올해의 문장</p>
          <p className="yw-quote-mark yw-serif yw-accent-dark">“</p>
          <p className="yw-quote yw-serif">{highlights.memorableQuote?.text}</p>
          {highlights.memorableQuote?.bookTitle && (
            <p className="yw-note">— {clip(highlights.memorableQuote.bookTitle, 28)}</p>
          )}
        </>,
      );

    case "persona":
      return frame(
        "light",
        <>
          <p className="yw-label">올해의 독서 타입</p>
          <p className="yw-big yw-serif yw-accent-light">{highlights.personaTitle}</p>
          <ul className="yw-list">
            {highlights.personaReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>,
      );

    case "summary":
      return frame(
        "dark",
        <>
          <div>
            <p className="yw-label">{owner} {year}</p>
            <p className="yw-title yw-serif yw-accent-dark">{highlights.personaTitle}</p>
          </div>
          <div className="yw-grid">
            <div className="yw-cell">
              <b>{formatReadingTime(stats.totalReadingSeconds)}</b>
              <span>독서 시간</span>
            </div>
            <div className="yw-cell">
              <b>{stats.completedBooks.toLocaleString("ko-KR")}권</b>
              <span>완독</span>
            </div>
            <div className="yw-cell">
              <b>{stats.totalNotes.toLocaleString("ko-KR")}개</b>
              <span>기록</span>
            </div>
            <div className="yw-cell">
              <b>{stats.activeDays.toLocaleString("ko-KR")}일</b>
              <span>독서한 날</span>
            </div>
          </div>
          {highlights.topBook && (
            <p className="yw-note">올해의 책 · {clip(highlights.topBook.title, 26)}</p>
          )}
          {highlights.completedCovers.length > 0 && (
            <div className="yw-covers">
              {highlights.completedCovers.slice(0, 6).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={getProxiedImageUrl(url)} alt="" crossOrigin="anonymous" />
              ))}
            </div>
          )}
        </>,
      );
  }
}
