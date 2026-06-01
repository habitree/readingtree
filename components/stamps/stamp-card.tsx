"use client";

import Image from "next/image";
import Link from "next/link";
import { Images, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingStamp } from "@/types/progress";
import { useStampShareStore } from "@/hooks/use-stamp-share";

export interface StampCardProps {
  stamp: ReadingStamp;
  className?: string;
  showBookInfo?: boolean;
  onClick?: () => void;
  href?: string;
  /** 공유 버튼 노출 여부. 기본 true. */
  enableShare?: boolean;
}

/**
 * 컬렉션 그리드에 표시되는 정사각 스탬프 썸네일.
 * - 사진 배경 + 페이지 수 한 줄 오버레이
 * - 클릭 시 라이트박스(상위 컴포넌트가 처리)
 */
export function StampCard({
  stamp,
  className,
  showBookInfo = false,
  onClick,
  href,
  enableShare = true,
}: StampCardProps) {
  const openShare = useStampShareStore((s) => s.openShare);
  const pages = Math.max(0, (stamp.end_page ?? 0) - (stamp.start_page ?? 0));
  const minutes = Math.round((stamp.reading_duration_seconds ?? 0) / 60);
  const photoCount = Array.isArray(stamp.image_urls) ? stamp.image_urls.length : 0;
  const hasMultiplePhotos = photoCount > 1;

  const handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    openShare(stamp.id, { bookTitle: stamp.book?.title ?? null });
  };

  const inner = (
    <div
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-900 text-white shadow-sm transition-transform hover:scale-[1.02]",
        className,
      )}
    >
      {stamp.image_url ? (
        <Image
          src={stamp.image_url}
          alt={stamp.book?.title ? `${stamp.book.title} 스탬프` : "스탬프"}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover"
          unoptimized
        />
      ) : stamp.book?.cover_image_url ? (
        <Image
          src={stamp.book.cover_image_url}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover blur-sm"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-500 to-stone-700" />
      )}

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* 좌상단: pages */}
      <div className="absolute left-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-xs font-bold tabular-nums backdrop-blur-sm">
        {pages}p
      </div>

      {/* 우상단: time */}
      <div className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur-sm">
        {minutes}분
      </div>

      {/* 다중 사진 배지 (좌상단 pages 아래) */}
      {hasMultiplePhotos && (
        <div
          className="absolute left-2 top-8 inline-flex items-center gap-0.5 rounded-md bg-emerald-600/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums backdrop-blur-sm"
          aria-label={`사진 ${photoCount}장`}
        >
          <Images className="h-2.5 w-2.5" />
          {photoCount}
        </div>
      )}

      {/* 하단 메타 */}
      {showBookInfo && stamp.book && (
        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="line-clamp-1 text-xs font-semibold drop-shadow">
            {stamp.book.title}
          </p>
        </div>
      )}

      {/* 공유 버튼 (우측 하단) — Link로 감싸진 경우에도 클릭 격리 */}
      {enableShare && (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="스탬프 공유"
          className="absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full">
        {inner}
      </button>
    );
  }
  return inner;
}
