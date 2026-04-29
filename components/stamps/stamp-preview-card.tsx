"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface StampPreviewCardProps {
  imageUrl?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  coverImageUrl?: string | null;
  startPage: number;
  endPage: number;
  durationSeconds: number;
  date?: Date;
  className?: string;
  /** 캡처용 ref 컨테이너 — html2canvas 대상 */
  captureRef?: React.Ref<HTMLDivElement>;
}

/**
 * 사진 + distance/time/pace 오버레이 스탬프 카드.
 * - 1080x1080 비율 (aspect-square)
 * - 사진 없을 때 책 표지 또는 그라데이션 fallback
 * - CSS 기반 라이브 미리보기 (캡처는 StampShareButton에서 html2canvas 사용)
 */
export function StampPreviewCard({
  imageUrl,
  bookTitle,
  bookAuthor,
  coverImageUrl,
  startPage,
  endPage,
  durationSeconds,
  date = new Date(),
  className,
  captureRef,
}: StampPreviewCardProps) {
  const pages = Math.max(0, endPage - startPage);
  const time = formatDuration(durationSeconds);
  const pace = pages > 0 && durationSeconds > 0
    ? formatPace(durationSeconds / pages)
    : null;

  const dateLabel = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replaceAll(". ", ".").replace(".", ".").replace(/\.$/, "");

  // fallback 배경: 사진 없으면 책 표지 → 그라데이션
  const hasPhoto = !!imageUrl;
  const hasCover = !!coverImageUrl;

  return (
    <div
      ref={captureRef}
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-lg",
        className,
      )}
    >
      {/* 배경 */}
      {hasPhoto ? (
        <Image
          src={imageUrl}
          alt={bookTitle ? `${bookTitle} 스탬프` : "독서 스탬프"}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          priority
          unoptimized
        />
      ) : hasCover ? (
        <>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="scale-110 object-cover blur-xl"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-emerald-700/60 to-stone-900/80" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-500 to-stone-700" />
      )}

      {/* 어두운 그라데이션 오버레이 (가독성) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

      {/* 오버레이 텍스트 */}
      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
        {/* 상단: distance */}
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-white/80 sm:text-sm">
            distance
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tabular-nums leading-none drop-shadow-md sm:text-6xl">
              {pages}
            </span>
            <span className="text-2xl font-semibold leading-none sm:text-3xl">
              pages
            </span>
          </div>
          {startPage !== endPage && (
            <div className="mt-1 text-xs font-medium text-white/70 tabular-nums sm:text-sm">
              {startPage} → {endPage}p
            </div>
          )}
        </div>

        {/* 중단: time */}
        <div className="self-end text-right">
          <div className="text-xs font-medium uppercase tracking-widest text-white/80 sm:text-sm">
            time
          </div>
          <div className="text-4xl font-extrabold tabular-nums leading-none drop-shadow-md sm:text-5xl">
            {time}
          </div>
        </div>

        {/* 하단: pace + 책 정보 */}
        <div className="flex items-end justify-between gap-3">
          <div>
            {pace && (
              <>
                <div className="text-xs font-medium uppercase tracking-widest text-white/80 sm:text-sm">
                  pace
                </div>
                <div className="text-3xl font-extrabold tabular-nums leading-none drop-shadow-md sm:text-4xl">
                  {pace}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-right">
            {hasCover && (
              <div className="relative h-12 w-9 overflow-hidden rounded shadow-md sm:h-16 sm:w-12">
                <Image
                  src={coverImageUrl}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="text-xs leading-tight text-white/90 sm:text-sm">
              {bookTitle && (
                <div className="line-clamp-1 font-semibold">{bookTitle}</div>
              )}
              {bookAuthor && (
                <div className="line-clamp-1 text-white/70">{bookAuthor}</div>
              )}
              <div className="text-white/60 tabular-nums">{dateLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 초 단위를 "MM:SS" 또는 "Hh MMm" 형태로 포맷.
 */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

/**
 * 페이지당 초 → "Mm SSs" 또는 "SSs" 페이스 포맷.
 */
function formatPace(secondsPerPage: number): string {
  const total = Math.max(0, Math.round(secondsPerPage));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
