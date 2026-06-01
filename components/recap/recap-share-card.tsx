"use client";

import Image from "next/image";
import { BookOpen, Clock, Flame, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecapShareData } from "@/app/actions/recap/types";

export interface RecapShareCardProps {
  data: RecapShareData;
  className?: string;
  /** html2canvas 캡처 대상 ref */
  captureRef?: React.Ref<HTMLDivElement>;
}

/**
 * 월간 독서결산 공유 카드 (1080×1350, 인스타 세로형 비율).
 *
 * 구성: 상단 월/페르소나 타이틀 → 완독 표지 스트립 → 핵심 스탯 3종 →
 * 베스트 인용 → 뱃지 → 브랜드. 스탬프 카드(stamp-share-card)와 동일한
 * 캡처 패턴(모든 img unoptimized).
 */
export function RecapShareCard({ data, className, captureRef }: RecapShareCardProps) {
  const { stats, highlights } = data;
  const hours = Math.floor(stats.totalReadingSeconds / 3600);
  const minutes = Math.round((stats.totalReadingSeconds % 3600) / 60);
  const timeLabel = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  const quote = highlights.memorableQuote;

  return (
    <div
      ref={captureRef}
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-50 text-stone-900 shadow-lg",
        "flex flex-col",
        className,
      )}
    >
      {/* 상단 헤더 */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pb-5 pt-6 text-white">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-100">
          {data.year}년 {data.month}월 독서결산
        </p>
        <p className="mt-1 text-2xl font-bold leading-tight">{highlights.personaTitle}</p>
        {data.aiCaption && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-emerald-50">{data.aiCaption}</p>
        )}
        {data.profile?.name && (
          <p className="mt-2 text-[11px] text-emerald-100">{data.profile.name}</p>
        )}
      </div>

      {/* 완독 표지 스트립 */}
      {highlights.completedCovers.length > 0 && (
        <div className="flex items-center gap-2 px-6 pt-4">
          {highlights.completedCovers.slice(0, 5).map((url, i) => (
            <div
              key={i}
              className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-stone-200 shadow-md"
            >
              <Image src={url} alt="" fill sizes="56px" className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* 핵심 스탯 */}
      <div className="grid grid-cols-3 gap-2 px-6 pt-4">
        <Stat icon={<BookOpen className="h-4 w-4 text-emerald-600" />} label="완독" value={`${stats.completedBooks}권`} />
        <Stat icon={<Clock className="h-4 w-4 text-emerald-600" />} label="독서 시간" value={timeLabel} />
        <Stat icon={<Flame className="h-4 w-4 text-emerald-600" />} label="최대 연속" value={`${stats.maxStreakInMonth}일`} />
        <Stat icon={<PenLine className="h-4 w-4 text-emerald-600" />} label="기록" value={`${stats.totalNotes}개`} />
        <Stat icon={<BookOpen className="h-4 w-4 text-emerald-600" />} label="읽은 책" value={`${stats.booksTouched}권`} />
        <Stat icon={<Clock className="h-4 w-4 text-emerald-600" />} label="기록한 날" value={`${stats.activeDays}일`} />
      </div>

      {/* 베스트 인용 */}
      {quote?.text && (
        <div className="mx-6 mt-4 flex-1 overflow-hidden rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
          <p className="line-clamp-3 text-sm italic leading-relaxed text-stone-700">“{quote.text}”</p>
          {quote.bookTitle && <p className="mt-1.5 text-[11px] text-stone-400">— {quote.bookTitle}</p>}
        </div>
      )}

      {/* 뱃지 + 브랜드 */}
      <div className="px-6 pb-5 pt-4">
        {highlights.badges.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {highlights.badges.slice(0, 4).map((b) => (
              <span
                key={b.key}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-stone-500">
          <span>habitree · 읽는 습관이 자라는 곳</span>
          <span className="font-bold tracking-tight text-emerald-700">ReadTree</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white px-2 py-2.5 text-center shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-stone-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-sm font-bold tabular-nums leading-tight">{value}</div>
    </div>
  );
}
