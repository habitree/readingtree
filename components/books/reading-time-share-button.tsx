"use client";

/**
 * 독서 시간 탭 이미지 복사 버튼 (v2 디자인 개편 — 2026-07-07).
 *
 * 동작:
 *   - hidden 1080×1080 카드를 캡처(html2canvas)
 *   - 캡처 Promise를 ClipboardItem 에 즉시 넘겨 "바로 복사" (Safari/iOS 제스처 유지)
 *   - 클립보드 미지원 브라우저만 PNG 다운로드 폴백
 *
 * 카드 디자인: 다크 오로라 그라데이션 + 벤토 타일 + 오버사이즈 히어로 숫자.
 * html2canvas 제약(box-shadow·filter·backdrop-blur 미지원)을 피해
 * 그라데이션/보더/투명 레이어만 사용한다.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, Check, ImageDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyImagePromiseToClipboard } from "@/lib/utils/clipboard";
import { downloadImage, isMobile } from "@/lib/utils/device";
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

/** 유리 타일 공통 스타일 — backdrop-blur 없이 투명 레이어로 표현 */
const TILE_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

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

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
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

  const recent = logs.slice(0, 2);
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
            backgroundColor: "#0a1614",
            backgroundImage:
              "radial-gradient(520px 420px at 88% -12%, rgba(16,185,129,0.30), transparent 65%)," +
              "radial-gradient(460px 400px at -10% 112%, rgba(245,158,11,0.14), transparent 62%)," +
              "radial-gradient(340px 300px at 55% 62%, rgba(45,212,191,0.07), transparent 70%)," +
              "linear-gradient(158deg, #0c1b17 0%, #0a1120 52%, #0b1a15 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          className="relative overflow-hidden rounded-[32px] text-white"
        >
          <div className="relative flex h-full flex-col p-9">
            {/* 아이브로 — 라벨 + 날짜 */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                Reading Record
              </p>
              <p className="text-[11px] tabular-nums text-slate-400">{fmtToday()}</p>
            </div>

            {/* 책 정보 */}
            <div className="mt-4 flex items-center gap-5">
              <div className="relative shrink-0">
                {/* 커버 뒤 은은한 글로우 (radial-gradient — filter 미사용) */}
                <div
                  className="absolute -inset-5"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(16,185,129,0.32), transparent)",
                  }}
                />
                {bookInfo?.coverImageUrl ? (
                  <div
                    className="relative h-[104px] w-[76px] overflow-hidden rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    <Image
                      src={bookInfo.coverImageUrl}
                      alt={bookInfo.title}
                      fill
                      sizes="76px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="relative flex h-[104px] w-[76px] items-center justify-center rounded-xl"
                    style={{ ...TILE_STYLE }}
                  >
                    <BookOpen className="h-8 w-8 text-emerald-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[21px] font-bold leading-snug text-white">
                  {bookInfo?.title ?? "독서 기록"}
                </p>
                {bookInfo?.author && (
                  <p className="mt-1 line-clamp-1 text-[13px] text-slate-400">
                    {bookInfo.author}
                  </p>
                )}
                {progressPct !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>읽기 진행률</span>
                      <span className="tabular-nums text-emerald-300">{progressPct}%</span>
                    </div>
                    <div
                      className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
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
            <div className="mt-5">
              <p className="text-[12px] font-semibold text-slate-400">총 독서 시간</p>
              <div className="mt-0.5 flex items-baseline">
                {hero.map((part, i) => (
                  <span key={i} className="flex items-baseline">
                    <span className="text-[42px] font-extrabold leading-none tracking-tight text-white tabular-nums">
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

            {/* 최근 기록 */}
            <div className="mt-4 flex-1 overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Recent
              </p>
              <div className="mt-1.5 space-y-1.5">
                {recent.map((log) => {
                  const sp = typeof log.start_page === "number" ? log.start_page : 0;
                  const ep = typeof log.end_page === "number" ? log.end_page : sp;
                  const pages = Math.max(0, ep - sp);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-1.5"
                      style={TILE_STYLE}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          log.image_url ? "bg-amber-300" : "bg-emerald-300",
                        )}
                      />
                      <div className="min-w-0 flex-1 text-[12px]">
                        <span className="font-semibold text-white">
                          {fmtDuration(log.reading_duration_seconds)}
                        </span>
                        {pages > 0 && (
                          <span className="ml-2 tabular-nums text-slate-400">{pages}p</span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                        {fmtDate(log.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 푸터 — 워드마크 */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] font-bold">
                🌳 Read<span className="text-emerald-300">Tree</span>
              </span>
              <span className="text-[11px] text-slate-500">매일의 독서가 나무가 됩니다</span>
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
