"use client";

import Image from "next/image";
import { BookOpen, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StampShareData } from "@/app/actions/stamps/share";

export interface StampShareCardProps {
  data: StampShareData;
  className?: string;
  /** html2canvas 캡처 대상 ref */
  captureRef?: React.Ref<HTMLDivElement>;
}

/**
 * 스탬프 공유용 풍부한 카드 (1080×1350, 인스타 세로형 비율).
 *
 * 정보 구성:
 *   - 상단: 책 표지 + 제목·저자 / 사용자 아바타·이름
 *   - 중앙: 스탬프 사진 (image_urls[0])
 *   - 하단: 독서 시간, 페이지 구간, 페이스, 날짜, 메모 인용
 *
 * StampPreviewCard(러닝앱 풍 1080×1080)와 별개로, "기록 정보 공유" 목적에 맞춘
 * 정보 우선 레이아웃. 이미지 없는 reading_log도 placeholder로 노출 가능.
 */
export function StampShareCard({ data, className, captureRef }: StampShareCardProps) {
  const startPage = data.startPage ?? 0;
  const endPage = data.endPage ?? startPage;
  const pages = Math.max(0, endPage - startPage);
  const minutes = Math.round(data.durationSeconds / 60);
  const time = formatDuration(data.durationSeconds);
  const pace = pages > 0 && data.durationSeconds > 0 ? formatPace(data.durationSeconds / pages) : null;

  const dateLabel = formatDateLabel(data.createdAt);
  const photoUrl = data.imageUrls[0] ?? null;
  const memoPreview = (data.memo ?? "").trim().slice(0, 90);

  return (
    <div
      ref={captureRef}
      className={cn(
        // 1080×1350 비율(0.8). 화면 라이브 미리보기는 작게 표시되지만 캡처는 확대 적용.
        "relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-50 text-stone-900 shadow-lg",
        "flex flex-col",
        className,
      )}
    >
      {/* 상단 헤더: 책 정보 + 사용자 */}
      <div className="flex items-start gap-3 px-5 pt-5">
        {data.book?.coverImageUrl ? (
          <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-stone-200 shadow-md">
            <Image
              src={data.book.coverImageUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded-md bg-stone-200">
            <BookOpen className="h-5 w-5 text-stone-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-bold leading-tight">
            {data.book?.title ?? "제목 미상"}
          </p>
          {data.book?.author && (
            <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{data.book.author}</p>
          )}
        </div>

        {/* 사용자 아바타·이름 (작게) */}
        {data.profile && (
          <div className="flex flex-col items-end gap-1">
            {data.profile.avatarUrl ? (
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-stone-200 ring-2 ring-white">
                <Image
                  src={data.profile.avatarUrl}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {(data.profile.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            {data.profile.name && (
              <span className="max-w-[90px] truncate text-[10px] font-medium text-stone-600">
                {data.profile.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 중앙 사진 — 없으면 표지→타이포그래피 순 자연스러운 폴백 */}
      <div className="relative mx-5 mt-3 flex-1 overflow-hidden rounded-xl bg-stone-200">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={data.book?.title ? `${data.book.title} 스탬프` : "스탬프"}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
            priority
            unoptimized
          />
        ) : data.book?.coverImageUrl ? (
          <>
            {/* 배경: 표지 확대 블러 + 어두운 오버레이 (캡처 시 블러 미적용이어도 톤 유지) */}
            <Image
              src={data.book.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="scale-110 object-cover blur-xl"
              unoptimized
            />
            <div className="absolute inset-0 bg-stone-900/45" />
            {/* 전경: 실제 책 표지를 책처럼 보여줌 — 아이콘 대신 자연스러운 연출 */}
            <div className="absolute inset-0 flex items-center justify-center py-6">
              <div className="relative aspect-[2/3] h-4/5 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/25">
                <Image
                  src={data.book.coverImageUrl}
                  alt={data.book.title ?? ""}
                  fill
                  sizes="240px"
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-8 text-center">
            <BookOpen className="h-8 w-8 text-white/80" />
            <p className="line-clamp-3 text-lg font-bold leading-snug text-white">
              {data.book?.title ?? "나의 독서 기록"}
            </p>
            {data.book?.author && (
              <p className="line-clamp-1 text-xs text-white/75">{data.book.author}</p>
            )}
          </div>
        )}
      </div>

      {/* 정보 블록 + 메모 + 브랜드 */}
      <div className="px-5 pb-5 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-stone-200">
          <Stat
            icon={<Timer className="h-3.5 w-3.5 text-emerald-600" />}
            label="독서 시간"
            value={time}
          />
          <Stat
            icon={<BookOpen className="h-3.5 w-3.5 text-emerald-600" />}
            label="페이지"
            value={pages > 0 ? `${pages}p` : `${endPage}p`}
            sub={pages > 0 ? `${startPage} → ${endPage}` : null}
          />
          <Stat
            icon={<Clock className="h-3.5 w-3.5 text-emerald-600" />}
            label={pace ? "페이스" : "분당"}
            value={pace ?? `${minutes}분`}
          />
        </div>

        {memoPreview && (
          <p className="mt-3 line-clamp-2 border-l-2 border-emerald-300 pl-2.5 text-xs italic text-stone-700">
            “{memoPreview}{(data.memo ?? "").length > 90 ? "…" : ""}”
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-[10px] text-stone-500">
          <span className="tabular-nums">{dateLabel}</span>
          <span className="font-bold tracking-tight text-emerald-700">ReadTree</span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-stone-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-sm font-bold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-stone-400 tabular-nums">{sub}</div>}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

function formatPace(secondsPerPage: number): string {
  const total = Math.max(0, Math.round(secondsPerPage));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}분 ${s}초/p`;
  return `${s}초/p`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${da}`;
}
