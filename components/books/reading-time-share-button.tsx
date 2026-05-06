"use client";

/**
 * 독서 시간 탭 공유 버튼.
 *
 * 동작:
 *   - hidden 1080×1080 카드를 캡처(html2canvas)
 *   - 클립보드 복사 우선, 실패 시 PNG 다운로드 폴백
 *   - 카드는 책 정보 + 통계 + 최근 5개 기록 요약을 포함
 *
 * 패턴은 components/stamps/stamp-share-button.tsx 와 동일.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, Check, Loader2, Share2, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyImageToClipboard } from "@/lib/utils/clipboard";
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

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
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

  const recent = logs.slice(0, 5);
  const totalPagesRead = logs.reduce((sum, l) => {
    const sp = typeof l.start_page === "number" ? l.start_page : 0;
    const ep = typeof l.end_page === "number" ? l.end_page : sp;
    return sum + Math.max(0, ep - sp);
  }, 0);

  const handleShare = async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const html2canvasModule = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = html2canvasModule.default as any;
      const target = captureRef.current;

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

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b: Blob | null) =>
            b && b.size > 0 ? resolve(b) : reject(new Error("이미지 변환 실패")),
          "image/png",
        );
      });

      const clipboardOk = await copyImageToClipboard(blob, {
        onSuccess: () => {
          setCopied(true);
          toast.success("독서 카드를 복사했어요. 인스타·카카오에 붙여넣기 해보세요.");
          setTimeout(() => setCopied(false), 2500);
        },
        onError: () => {
          // 아래 fallback
        },
      });

      if (!clipboardOk) {
        const filename = `readtree-reading-time-${Date.now()}.png`;
        downloadImage(blob, filename);
        setCopied(true);
        toast.success("독서 카드 이미지를 다운로드했어요.");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("독서 카드 공유 실패:", err);
      toast.error("공유에 실패했어요. 다시 시도해주세요.");
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
          style={{ width: CARD_PX, height: CARD_PX }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-50 via-white to-emerald-50 text-slate-900"
        >
          {/* 장식 배경 */}
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative flex h-full flex-col p-9">
            {/* 헤더 — 책 정보 */}
            <div className="flex items-start gap-4">
              {bookInfo?.coverImageUrl ? (
                <div className="relative h-[120px] w-[88px] shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-black/10">
                  <Image
                    src={bookInfo.coverImageUrl}
                    alt={bookInfo.title}
                    fill
                    sizes="88px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-[120px] w-[88px] shrink-0 items-center justify-center rounded-lg bg-emerald-100 shadow-md ring-1 ring-black/10">
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Reading Time
                </p>
                <p className="mt-1 line-clamp-2 text-[20px] font-bold leading-tight text-slate-900">
                  {bookInfo?.title ?? "독서 기록"}
                </p>
                {bookInfo?.author && (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {bookInfo.author}
                  </p>
                )}
              </div>
            </div>

            {/* 통계 큰 숫자 */}
            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-emerald-100 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500">총 시간</p>
                <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums leading-tight">
                  {fmtDuration(stats.totalSeconds)}
                </p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] font-medium text-slate-500">세션</p>
                <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums leading-tight">
                  {stats.sessionCount}
                </p>
                {stampCount > 0 && (
                  <p className="text-[10px] text-emerald-600 font-medium">스탬프 {stampCount}</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500">평균/회</p>
                <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums leading-tight">
                  {fmtDuration(stats.averageSeconds)}
                </p>
              </div>
            </div>

            {/* 누적 페이지 */}
            {totalPagesRead > 0 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                지금까지 <span className="tabular-nums">{totalPagesRead}</span>페이지를 읽었어요
              </div>
            )}

            {/* 최근 기록 */}
            <div className="mt-5 flex-1 overflow-hidden">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Recent
              </p>
              <div className="space-y-1.5">
                {recent.map((log) => {
                  const sp = typeof log.start_page === "number" ? log.start_page : 0;
                  const ep = typeof log.end_page === "number" ? log.end_page : sp;
                  const pages = Math.max(0, ep - sp);
                  const hasImage = !!log.image_url;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 ring-1 ring-emerald-100"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md shrink-0",
                          hasImage ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        <Timer className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-[12px]">
                        <span className="font-semibold text-slate-900">
                          {fmtDuration(log.reading_duration_seconds)}
                        </span>
                        {pages > 0 && (
                          <span className="ml-2 text-slate-500 tabular-nums">{pages}p</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                        {fmtDate(log.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 워터마크 */}
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-700">🌳 ReadTree</span>
              <span className="tabular-nums">{new Date().toLocaleDateString("ko-KR")}</span>
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
            준비 중...
          </>
        ) : copied ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5" />
            복사됨
          </>
        ) : (
          <>
            <Share2 className="mr-1 h-3.5 w-3.5" />
            이미지 공유
          </>
        )}
      </Button>
    </>
  );
}
