"use client";

/**
 * 월간 독서결산 본문 (프레젠테이션).
 *
 * /stats 인앱 섹션과 공개 페이지(/share/recaps/[id])에서 공용.
 * 데이터는 RecapComputed + 선택적 공유 정보. 공유 버튼은 인앱에서만 표시.
 */

import { Share2, BookOpen, Clock, Flame, PenLine, Target, TrendingUp, TrendingDown, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRecapShareStore } from "@/hooks/use-recap-share";
import type { RecapComputed } from "@/app/actions/recap/types";

interface RecapViewProps {
  computed: RecapComputed;
  /** AI 한줄평 (공유 스냅샷에 캐시된 경우) */
  aiCaption?: string | null;
  /** 인앱 공유용 — 있으면 공유 버튼 표시 */
  share?: { shareId: string; isPublic: boolean } | null;
  /** true면 읽기전용(공개 페이지) — 공유 버튼 숨김 */
  readOnly?: boolean;
  className?: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

export function RecapView({ computed, aiCaption, share, readOnly, className }: RecapViewProps) {
  const openShare = useRecapShareStore((s) => s.openShare);
  const { stats, highlights } = computed;

  if (computed.isEmpty) {
    return (
      <Card className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
        <BookOpen className="h-10 w-10 text-stone-300" />
        <p className="text-sm font-medium text-stone-600">{computed.month}월에는 아직 독서 기록이 없어요</p>
        <p className="text-xs text-stone-400">책을 읽고 기록을 남기면 이 달의 결산이 채워져요.</p>
      </Card>
    );
  }

  const canShare = !readOnly && share;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 히어로: 페르소나 타이틀 */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-100">
              {computed.year}년 {computed.month}월
            </p>
            <p className="mt-1 text-2xl font-bold leading-tight">{highlights.personaTitle}</p>
            {aiCaption && <p className="mt-1.5 text-sm leading-relaxed text-emerald-50">{aiCaption}</p>}
          </div>
          {canShare && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-shrink-0 gap-1.5 bg-white/90 text-emerald-700 hover:bg-white"
              onClick={() => openShare(share!.shareId)}
            >
              <Share2 className="h-4 w-4" />
              공유
            </Button>
          )}
        </div>
      </Card>

      {/* 핵심 스탯 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="완독" value={`${stats.completedBooks}권`} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="독서 시간" value={formatDuration(stats.totalReadingSeconds)} />
        <StatCard icon={<PenLine className="h-4 w-4" />} label="기록" value={`${stats.totalNotes}개`} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="최대 연속" value={`${stats.maxStreakInMonth}일`} />
        <StatCard icon={<BookOpen className="h-4 w-4" />} label="읽은 책" value={`${stats.booksTouched}권`} />
        <StatCard icon={<PenLine className="h-4 w-4" />} label="읽은 페이지" value={`${stats.totalPages}p`} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="기록한 날" value={`${stats.activeDays}일`} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="독서 세션" value={`${stats.sessionCount}회`} />
      </div>

      {/* 전월 대비 + 목표 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold text-stone-500">전월 대비</p>
          <div className="space-y-1.5">
            <DeltaRow label="기록" delta={stats.vsPrev.notesDelta} unit="개" />
            <DeltaRow label="독서 시간" delta={Math.round(stats.vsPrev.secondsDelta / 60)} unit="분" />
            <DeltaRow label="완독" delta={stats.vsPrev.booksDelta} unit="권" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold text-stone-500">올해 목표</p>
          </div>
          {stats.goal.target > 0 ? (
            <>
              <p className="text-sm">
                <span className="text-lg font-bold tabular-nums text-emerald-700">{stats.goal.completedYTD}</span>
                <span className="text-stone-400"> / {stats.goal.target}권</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.goal.progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-stone-400">달성률 {stats.goal.progress}%</p>
            </>
          ) : (
            <p className="text-xs text-stone-400">독서 목표를 설정하면 진행률을 볼 수 있어요.</p>
          )}
        </Card>
      </div>

      {/* 하이라이트 */}
      {(highlights.topBook || highlights.mostReadAuthor || highlights.longestSession) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlights.topBook && (
            <HighlightCard label="이달의 책" value={highlights.topBook.title} sub={`기록 ${highlights.topBook.noteCount}개`} />
          )}
          {highlights.mostReadAuthor && (
            <HighlightCard label="가장 많이 읽은 저자" value={highlights.mostReadAuthor.name} sub={`기록 ${highlights.mostReadAuthor.noteCount}개`} />
          )}
          {highlights.longestSession && (
            <HighlightCard label="가장 긴 독서" value={`${highlights.longestSession.minutes}분`} sub={highlights.longestSession.bookTitle} />
          )}
        </div>
      )}

      {/* 베스트 인용 */}
      {highlights.memorableQuote?.text && (
        <Card className="border-l-4 border-l-emerald-400 p-4">
          <div className="flex gap-2">
            <Quote className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm italic leading-relaxed text-stone-700">{highlights.memorableQuote.text}</p>
              {highlights.memorableQuote.bookTitle && (
                <p className="mt-1.5 text-[11px] text-stone-400">— {highlights.memorableQuote.bookTitle}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 뱃지 */}
      {highlights.badges.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold text-stone-500">이달의 뱃지</p>
          <div className="flex flex-wrap gap-2">
            {highlights.badges.map((b) => (
              <span
                key={b.key}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 px-3 py-3 text-center">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-stone-400">
        <span className="text-emerald-600">{icon}</span>
        {label}
      </div>
      <div className="text-base font-bold tabular-nums">{value}</div>
    </Card>
  );
}

function DeltaRow({ label, delta, unit }: { label: string; delta: number; unit: string }) {
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span
        className={cn(
          "flex items-center gap-0.5 font-medium tabular-nums",
          flat ? "text-stone-400" : up ? "text-emerald-600" : "text-rose-500",
        )}
      >
        {!flat && (up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
        {up ? "+" : ""}
        {delta}
        {unit}
      </span>
    </div>
  );
}

function HighlightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-bold text-stone-800">{value}</p>
      {sub && <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-400">{sub}</p>}
    </Card>
  );
}
