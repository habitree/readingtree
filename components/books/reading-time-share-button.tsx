"use client";

/**
 * 독서 시간 탭 이미지 복사 버튼 (v3 디자인 개편 — 2026-07-08).
 *
 * 동작:
 *   - hidden 1080×1080 카드를 캡처(html2canvas)
 *   - 캡처 Promise를 ClipboardItem 에 즉시 넘겨 "바로 복사" (Safari/iOS 제스처 유지)
 *   - 클립보드 미지원 브라우저만 PNG 다운로드 폴백
 *
 * 카드 디자인(v3.1 "Reading Rhythm" — 2026-07-12 정제): 다크 오로라 그라데이션 +
 * 상단 서비스 로고(Trees 마크 + ReadTree 워드마크) + 오버사이즈 히어로 숫자 +
 * "최근 7일 독서 리듬" 미니 바 차트(Wrapped형 데이터 스토리) +
 * 글래스 벤토 타일 + SNS 해시태그 푸터.
 * html2canvas 제약(box-shadow·filter·backdrop-blur 미지원)을 피해
 * 그라데이션/보더/투명 레이어만 사용한다.
 *
 * 텍스트 잘림 주의: 캡처 DOM 안에서는 CSS line-clamp(-webkit-box + overflow
 * hidden)를 쓰면 html2canvas가 글자를 위로 밀어 그려 상단이 잘린다.
 * 반드시 truncateText()로 JS 절단할 것.
 */

import { useRef, useState } from "react";
import { BookOpen, Check, ImageDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyImagePromiseToClipboard } from "@/lib/utils/clipboard";
import { downloadImage, isMobile } from "@/lib/utils/device";
import { getProxiedImageUrl } from "@/lib/utils/image";
import type { ReadingLog } from "@/types/progress";
import { cn } from "@/lib/utils";

interface BookInfo {
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
}

interface Stats {
  totalSeconds: number;
  sessionCount: number;
  averageSeconds: number;
}

interface ReadingTimeShareButtonProps {
  bookInfo: BookInfo | null;
  stats: Stats;
  logs: ReadingLog[];
  stampCount: number;
  className?: string;
}

const CARD_PX = 540; // 화면(hidden) 사이즈
const TARGET_PX = 1080; // 출력(인스타 정사각)

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 유리 타일 공통 스타일 — backdrop-blur 없이 투명 레이어로 표현 */
const TILE_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
};

/**
 * CSS line-clamp 대체용 JS 절단.
 * html2canvas가 -webkit-line-clamp(overflow hidden) 텍스트를 위로 밀어 그려
 * 글자 상단이 잘리는 문제를 피하기 위해 캡처 DOM의 텍스트는 여기서 자른다.
 */
function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

/** 히어로 표기용 — 숫자와 단위를 분리해 크기를 달리 렌더 */
function heroParts(s: number): { num: string; unit: string }[] {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0)
    return [
      { num: String(h), unit: "시간" },
      { num: String(m), unit: "분" },
    ];
  if (h > 0) return [{ num: String(h), unit: "시간" }];
  if (m > 0) return [{ num: String(m), unit: "분" }];
  return [{ num: "1", unit: "분 미만" }];
}

function fmtToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}

interface DayBar {
  label: string;
  seconds: number;
  isToday: boolean;
}

/** 오늘 기준 최근 7일 독서량 집계 (로컬 날짜 기준) — 리듬 바 차트용 */
function weeklyActivity(logs: ReadingLog[]): DayBar[] {
  const now = new Date();
  const days: DayBar[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    indexByKey.set(key, days.length);
    days.push({ label: WEEKDAY_KO[d.getDay()], seconds: 0, isToday: i === 0 });
  }
  for (const log of logs) {
    const d = new Date(log.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const idx = indexByKey.get(key);
    if (idx !== undefined) days[idx].seconds += log.reading_duration_seconds || 0;
  }
  return days;
}

/** hidden 카드 → 1080px PNG Blob (이미지 로딩 대기 + html2canvas) */
async function captureCardPng(target: HTMLElement): Promise<Blob> {
  const html2canvasModule = await import("html2canvas");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvas = html2canvasModule.default as any;

  // 이미지 로딩 대기
  const images = target.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const t = setTimeout(() => resolve(), 5000);
        img.onload = () => {
          clearTimeout(t);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(t);
          resolve();
        };
      });
    }),
  );

  const isMobileDevice = isMobile();
  await new Promise((r) => setTimeout(r, isMobileDevice ? 1200 : 800));

  const scale = TARGET_PX / CARD_PX;
  const canvas = await html2canvas(target, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    imageTimeout: isMobileDevice ? 20000 : 15000,
    windowWidth: CARD_PX,
    windowHeight: CARD_PX,
    width: CARD_PX,
    height: CARD_PX,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b: Blob | null) =>
        b && b.size > 0 ? resolve(b) : reject(new Error("이미지 변환 실패")),
      "image/png",
    );
  });
}

export function ReadingTimeShareButton({
  bookInfo,
  stats,
  logs,
  stampCount,
  className,
}: ReadingTimeShareButtonProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalPagesRead = logs.reduce((sum, l) => {
    const sp = typeof l.start_page === "number" ? l.start_page : 0;
    const ep = typeof l.end_page === "number" ? l.end_page : sp;
    return sum + Math.max(0, ep - sp);
  }, 0);
  const readingDays = new Set(logs.map((l) => l.created_at.slice(0, 10))).size;
  const progressPct =
    bookInfo?.totalPages && totalPagesRead > 0
      ? Math.min(100, Math.round((totalPagesRead / bookInfo.totalPages) * 100))
      : null;
  const hero = heroParts(stats.totalSeconds);
  const week = weeklyActivity(logs);
  const weekSeconds = week.reduce((s, d) => s + d.seconds, 0);
  const weekMax = Math.max(...week.map((d) => d.seconds), 1);

  const handleShare = async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);

    // 캡처를 즉시 시작하고 그 Promise를 클립보드에 동기로 넘긴다.
    // await 후 write 하면 Safari 가 사용자 제스처 만료로 복사를 거부한다.
    const blobPromise = captureCardPng(captureRef.current);

    try {
      const copiedToClipboard = await copyImagePromiseToClipboard(blobPromise);
      if (copiedToClipboard) {
        toast.success("독서 카드를 복사했어요. 인스타·카카오에 붙여넣기 해보세요.");
      } else {
        const blob = await blobPromise;
        downloadImage(blob, `readtree-reading-time-${Date.now()}.png`);
        toast.success("이미지 복사를 지원하지 않는 브라우저라 다운로드했어요.");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("독서 카드 생성 실패:", err);
      toast.error("이미지 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* hidden 캡처 카드 (절대 위치, 화면 밖) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
      >
        <div
          ref={captureRef}
          style={{
            width: CARD_PX,
            height: CARD_PX,
            backgroundColor: "#081311",
            backgroundImage:
              "radial-gradient(600px 480px at 86% -14%, rgba(16,185,129,0.26), transparent 68%)," +
              "radial-gradient(460px 400px at -8% 108%, rgba(45,212,191,0.14), transparent 64%)," +
              "radial-gradient(360px 320px at 58% 66%, rgba(251,191,36,0.04), transparent 72%)," +
              "linear-gradient(160deg, #0b1a16 0%, #091320 54%, #0a1815 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          className="relative overflow-hidden rounded-[34px] text-white"
        >
          {/* 상단 셴(sheen) — 유리 카드 질감. filter 없이 투명 그라데이션만 사용 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[150px]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.05), transparent)",
            }}
          />
          <div className="relative flex h-full flex-col p-[30px]">
            {/* 헤더 — 서비스 로고(사이드바와 동일한 Trees 마크 + 워드마크) + 날짜 칩 */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-[7px]">
                {/* lucide Trees 마크 (scripts/export-trees-icon-png.mjs 와 동일 패스).
                    html2canvas 캡처 안정성을 위해 currentColor 대신 stroke 직접 지정 */}
                <svg
                  width={21}
                  height={21}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5ec496"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
                  <path d="M7 16v6" />
                  <path d="M13 19v3" />
                  <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
                </svg>
                <span className="text-[17px] font-bold leading-none tracking-tight text-white">
                  ReadTree
                </span>
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] tabular-nums text-slate-300"
                style={TILE_STYLE}
              >
                {fmtToday()}
              </span>
            </div>

            {/* 책 정보 — 표지를 히어로급으로 확대해 가시성 강화 */}
            <div className="mt-5 flex items-start gap-[18px]">
              <div className="relative shrink-0">
                {/* 커버 뒤 은은한 글로우 (radial-gradient — filter 미사용) */}
                <div
                  className="absolute -inset-6"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(16,185,129,0.38), transparent)",
                  }}
                />
                {bookInfo?.coverImageUrl ? (
                  <div
                    className="relative h-[128px] w-[88px] overflow-hidden rounded-xl"
                    style={{
                      border: "1px solid rgba(255,255,255,0.22)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* CORS 회피: 원본 URL 대신 same-origin 프록시로 로드해야
                        html2canvas 가 표지를 정상 캡처한다 (외부 표지 빈칸 방지) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProxiedImageUrl(bookInfo.coverImageUrl)}
                      alt={bookInfo.title}
                      crossOrigin="anonymous"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* 책 표지 광택 — 프리미엄 질감 */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(125deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(0,0,0,0.14) 100%)",
                      }}
                    />
                    {/* 책등(spine) 음영 */}
                    <div
                      className="absolute inset-y-0 left-0 w-[6px]"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(0,0,0,0.28) 0%, transparent 100%)",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="relative flex h-[128px] w-[88px] items-center justify-center rounded-xl"
                    style={{ ...TILE_STYLE }}
                  >
                    <BookOpen className="h-9 w-9 text-emerald-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                  Now Reading
                </p>
                {/* line-clamp 금지(캡처 시 글자 상단 잘림) — truncateText 로 JS 절단 */}
                <p className="mt-1.5 text-[20px] font-bold leading-[1.4] tracking-[-0.01em] text-white">
                  {truncateText(bookInfo?.title ?? "독서 기록", 34)}
                </p>
                {bookInfo?.author && (
                  <p className="mt-1 text-[12px] leading-normal text-slate-400">
                    {truncateText(bookInfo.author, 26)}
                  </p>
                )}
                {progressPct !== null && (
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>읽기 진행률</span>
                      <span className="tabular-nums text-emerald-300">{progressPct}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${progressPct}%`,
                          backgroundImage:
                            "linear-gradient(90deg, #34d399 0%, #2dd4bf 100%)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 히어로 — 총 독서 시간 */}
            <div className="mt-[18px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                총 독서 시간
              </p>
              <div className="mt-1 flex items-baseline">
                {hero.map((part, i) => (
                  <span key={i} className="flex items-baseline">
                    <span className="text-[48px] font-extrabold leading-none tracking-tighter text-white tabular-nums">
                      {part.num}
                    </span>
                    <span
                      className={cn(
                        "ml-1 text-[22px] font-bold leading-none text-emerald-300",
                        i < hero.length - 1 && "mr-3",
                      )}
                    >
                      {part.unit}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* 최근 7일 독서 리듬 — 미니 바 차트 (Wrapped형 데이터 스토리) */}
            <div className="mt-[18px]">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  최근 7일 리듬
                </p>
                <p className="text-[10px] tabular-nums text-slate-500">
                  {weekSeconds > 0 ? fmtDuration(weekSeconds) : "이번 주 기록 없음"}
                </p>
              </div>
              <div className="mt-2.5 grid grid-cols-7 gap-2">
                {week.map((d, i) => {
                  const h =
                    d.seconds > 0
                      ? Math.max(16, Math.round((d.seconds / weekMax) * 100))
                      : 0;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className="relative flex h-[48px] w-[18px] items-end overflow-hidden rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        {h > 0 && (
                          <div
                            className="w-full rounded-full"
                            style={{
                              height: `${h}%`,
                              backgroundImage: d.isToday
                                ? "linear-gradient(180deg, #a7f3d0 0%, #34d399 100%)"
                                : "linear-gradient(180deg, #6ee7b7 0%, #2dd4bf 100%)",
                            }}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[9px] font-semibold",
                          d.isToday ? "text-emerald-300" : "text-slate-500",
                        )}
                      >
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 벤토 타일 — 세션 / 평균 / 페이지(또는 기록일) */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl p-3" style={TILE_STYLE}>
                <p className="text-[10px] font-medium text-slate-400">세션</p>
                <p className="mt-0.5 text-[18px] font-bold leading-tight text-white tabular-nums">
                  {stats.sessionCount}
                  <span className="ml-0.5 text-[12px] font-semibold text-slate-400">회</span>
                </p>
                {stampCount > 0 && (
                  <p className="text-[10px] font-medium text-amber-300">스탬프 {stampCount}</p>
                )}
              </div>
              <div className="rounded-2xl p-3" style={TILE_STYLE}>
                <p className="text-[10px] font-medium text-slate-400">평균 / 회</p>
                <p className="mt-0.5 text-[18px] font-bold leading-tight text-white tabular-nums">
                  {fmtDuration(stats.averageSeconds)}
                </p>
              </div>
              {totalPagesRead > 0 ? (
                <div className="rounded-2xl p-3" style={TILE_STYLE}>
                  <p className="text-[10px] font-medium text-slate-400">읽은 페이지</p>
                  <p className="mt-0.5 text-[18px] font-bold leading-tight text-white tabular-nums">
                    {totalPagesRead}
                    <span className="ml-0.5 text-[12px] font-semibold text-slate-400">p</span>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl p-3" style={TILE_STYLE}>
                  <p className="text-[10px] font-medium text-slate-400">기록일</p>
                  <p className="mt-0.5 text-[18px] font-bold leading-tight text-white tabular-nums">
                    {readingDays}
                    <span className="ml-0.5 text-[12px] font-semibold text-slate-400">일</span>
                  </p>
                </div>
              )}
            </div>

            {/* 푸터 — 태그라인 + SNS 해시태그 */}
            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="text-[11px] text-slate-500">매일의 독서가 나무가 됩니다</span>
              <span className="text-[10px] font-medium tracking-tight text-emerald-300/80">
                #독서기록 #ReadTree
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isCapturing}
        className={cn("h-8 px-3 text-xs", className)}
      >
        {isCapturing ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            만드는 중...
          </>
        ) : copied ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5" />
            복사됨
          </>
        ) : (
          <>
            <ImageDown className="mr-1 h-3.5 w-3.5" />
            이미지 복사
          </>
        )}
      </Button>
    </>
  );
}
