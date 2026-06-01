"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  urls: string[];
  alt?: string;
  className?: string;
  /** 대표 영역 종횡비. 기본 square. share 페이지에서는 video로. */
  coverAspect?: "square" | "video" | "portrait";
  /** 라이트박스 사용 여부. 기본 true. */
  enableLightbox?: boolean;
  /** 대표 클릭 시 별도 동작이 필요하면 사용 (라이트박스 비활성 시) */
  onCoverClick?: () => void;
}

/**
 * 다중 사진 갤러리 — 대표 사진 + 하단 썸네일 스트립.
 *
 * - 사진 0장: 렌더 없음
 * - 사진 1장: 대표만, 썸네일 스트립 숨김
 * - 사진 2장+: 대표 큰 화면 + 하단 가로 스크롤 썸네일 (현재 선택 인덱스 강조)
 * - 대표 또는 썸네일 탭 → 라이트박스 모달 (좌우/키보드/Esc 네비)
 *
 * 디테일·공유 페이지 공통 사용.
 */
export function PhotoGallery({
  urls,
  alt = "사진",
  className,
  coverAspect = "square",
  enableLightbox = true,
  onCoverClick,
}: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // urls 길이 변경 시 인덱스 클램프
  useEffect(() => {
    if (activeIndex >= urls.length && urls.length > 0) {
      setActiveIndex(0);
    }
  }, [urls.length, activeIndex]);

  const openLightbox = useCallback(
    (idx: number) => {
      if (!enableLightbox) return onCoverClick?.();
      setActiveIndex(idx);
      setLightboxOpen(true);
    },
    [enableLightbox, onCoverClick],
  );

  if (urls.length === 0) return null;

  const aspectClass =
    coverAspect === "video"
      ? "aspect-video"
      : coverAspect === "portrait"
        ? "aspect-[4/5]"
        : "aspect-square";

  const cover = urls[activeIndex] ?? urls[0];

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => openLightbox(activeIndex)}
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800",
          aspectClass,
          "transition-transform active:scale-[0.99]",
        )}
        aria-label={`${alt} 크게 보기`}
      >
        <Image
          src={cover}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          priority
          unoptimized
        />
        {urls.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur-sm">
            {activeIndex + 1} / {urls.length}
          </span>
        )}
      </button>

      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                i === activeIndex
                  ? "border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`사진 ${i + 1} 보기`}
              aria-pressed={i === activeIndex}
            >
              <Image src={url} alt="" fill sizes="56px" className="object-cover" unoptimized />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-600/85 to-transparent px-1 text-center text-[9px] font-bold uppercase tracking-wide text-white">
                  대표
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          urls={urls}
          index={activeIndex}
          onIndexChange={setActiveIndex}
          onClose={() => setLightboxOpen(false)}
          alt={alt}
        />
      )}
    </div>
  );
}

interface LightboxProps {
  urls: string[];
  index: number;
  onIndexChange: (n: number) => void;
  onClose: () => void;
  alt: string;
}

export function Lightbox({ urls, index, onIndexChange, onClose, alt }: LightboxProps) {
  // 키보드 네비
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + urls.length) % urls.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % urls.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, urls.length, onClose, onIndexChange]);

  // body 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((index - 1 + urls.length) % urls.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((index + 1) % urls.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="닫기"
      >
        <X className="h-5 w-5" />
      </button>

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
            aria-label="이전 사진"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
            aria-label="다음 사진"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative h-[90vh] w-[90vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={urls[index]}
          alt={`${alt} ${index + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {urls.length > 1 && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white tabular-nums backdrop-blur-sm">
          {index + 1} / {urls.length}
        </span>
      )}
    </div>
  );
}
