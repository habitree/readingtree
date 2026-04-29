"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReadingStamp } from "@/types/progress";

export interface StampCardProps {
  stamp: ReadingStamp;
  className?: string;
  showBookInfo?: boolean;
  onClick?: () => void;
  href?: string;
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
}: StampCardProps) {
  const pages = Math.max(0, (stamp.end_page ?? 0) - (stamp.start_page ?? 0));
  const minutes = Math.round((stamp.reading_duration_seconds ?? 0) / 60);

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

      {/* 하단 메타 */}
      {showBookInfo && stamp.book && (
        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="line-clamp-1 text-xs font-semibold drop-shadow">
            {stamp.book.title}
          </p>
        </div>
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
