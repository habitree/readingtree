"use client";

/**
 * 통합 기록 피드 — 기록 기획 13 Phase 2
 *
 * 모든 입력 경로의 기록을 "날짜 · 책" 그룹 헤더 + 개별 카드로 시간순 표시(D2).
 * cursor "더 보기" 페이지네이션. 카드 탭 → 단일 편집(useUnifiedRecordEdit).
 * 편집 시트가 닫히면 router.refresh()로 최신 데이터 반영.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { getUnifiedRecords } from "@/app/actions/records";
import {
  groupUnifiedByDateBook,
  groupUnifiedByMonth,
  groupUnifiedByBook,
  toKstDateKey,
} from "@/lib/reading/unified";
import { useUnifiedRecordEdit } from "@/hooks/use-unified-record-edit";
import { useRecordSheetStore } from "@/hooks/use-record-sheet";
import { Lightbox } from "@/components/stamps/photo-gallery";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UnifiedRecordCard } from "./unified-record-card";
import type { UnifiedRecord, UnifiedRecordKind } from "@/types/unified-record";

interface UnifiedRecordFeedProps {
  initialRecords: UnifiedRecord[];
  initialNextCursor: string | null;
  /** 책 상세 스코프(user_books.id) — 미지정 = 전체 */
  bookId?: string;
  /** 그룹핑 모드: dateBook(기본·list) | month(타임라인) | book(책별) */
  groupBy?: "dateBook" | "month" | "book";
  /** 정렬 — initial과 loadMore의 keyset 방향 일치 필요 */
  sort?: "latest" | "oldest";
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}년 ${Number(m)}월`;
}

type KindFilter = "all" | UnifiedRecordKind;

const KIND_SEGMENTS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "time", label: "시간" },
  { value: "progress", label: "진행" },
  { value: "stamp", label: "스탬프" },
  { value: "detail", label: "상세" },
];

function formatDateKeyLabel(dateKey: string, todayKey: string, yesterdayKey: string): string {
  if (dateKey === todayKey) return "오늘";
  if (dateKey === yesterdayKey) return "어제";
  const parts = dateKey.split("-");
  if (parts.length === 3) return `${Number(parts[1])}월 ${Number(parts[2])}일`;
  return dateKey;
}

export function UnifiedRecordFeed({
  initialRecords,
  initialNextCursor,
  bookId,
  groupBy = "dateBook",
  sort = "latest",
}: UnifiedRecordFeedProps) {
  const router = useRouter();
  const { editRecord } = useUnifiedRecordEdit();

  const [records, setRecords] = useState<UnifiedRecord[]>(initialRecords);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number; alt: string } | null>(
    null,
  );

  // 오늘/어제 KST 키 (그룹 라벨용) — 마운트 시 1회
  const [{ todayKey, yesterdayKey }] = useState(() => ({
    todayKey: toKstDateKey(new Date().toISOString()),
    yesterdayKey: toKstDateKey(new Date(Date.now() - 86400000).toISOString()),
  }));

  // 서버 데이터 갱신(router.refresh) 시 동기화 — effect 대신 렌더 중 조정(React 19 권장)
  const [prevInitial, setPrevInitial] = useState(initialRecords);
  if (prevInitial !== initialRecords) {
    setPrevInitial(initialRecords);
    setRecords(initialRecords);
    setCursor(initialNextCursor);
  }

  // 편집 시트 닫힘 → 최신 반영 (attach/update는 서버에서 revalidatePath 수행)
  const sheetOpen = useRecordSheetStore((s) => s.isOpen);
  const prevOpen = useRef(sheetOpen);
  useEffect(() => {
    if (prevOpen.current && !sheetOpen) router.refresh();
    prevOpen.current = sheetOpen;
  }, [sheetOpen, router]);

  const loadMore = useCallback(() => {
    if (!cursor) return;
    startTransition(async () => {
      try {
        const res = await getUnifiedRecords({ cursor, bookId, sort, limit: 20 });
        setRecords((prev) => [...prev, ...res.records]);
        setCursor(res.nextCursor);
      } catch {
        // 더 보기 실패 — 조용히 무시 (다음 시도 가능)
      }
    });
  }, [cursor, bookId, sort]);

  if (records.length === 0) {
    return (
      <EmptyState
        variant="encouraging"
        icon={FileText}
        title="아직 기록이 없어요"
        description="독서를 시작하거나 진행률을 기록하면 여기에 모두 모여요."
        action={{ label: "기록 쓰기", href: "/notes/new" }}
      />
    );
  }

  const filtered = kindFilter === "all" ? records : records.filter((r) => r.kind === kindFilter);
  const displayGroups: { key: string; header: string; records: UnifiedRecord[] }[] =
    groupBy === "month"
      ? groupUnifiedByMonth(filtered).map((g) => ({
          key: g.key,
          header: formatMonthLabel(g.key),
          records: g.records,
        }))
      : groupBy === "book"
        ? groupUnifiedByBook(filtered).map((g) => ({
            key: g.key,
            header: g.book.title ?? "책 없음",
            records: g.records,
          }))
        : groupUnifiedByDateBook(filtered).map((g) => ({
            key: g.key,
            header: `${formatDateKeyLabel(g.kstDateKey, todayKey, yesterdayKey)}${
              g.book.title ? ` · ${g.book.title}` : ""
            }`,
            records: g.records,
          }));

  return (
    <>
      {/* 종류 필터 (전체/시간/진행/스탬프/상세) */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {KIND_SEGMENTS.map((seg) => (
          <button
            key={seg.value}
            type="button"
            onClick={() => setKindFilter(seg.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              kindFilter === seg.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {displayGroups.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          해당 종류의 기록이 없어요.
        </p>
      ) : (
      <div className="space-y-5">
        {displayGroups.map((g) => (
          <div key={g.key}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              <span suppressHydrationWarning>{g.header}</span>
            </p>
            <div className="space-y-1.5">
              {g.records.map((r) => (
                <UnifiedRecordCard
                  key={`${r.source}-${r.sourceId}`}
                  record={r}
                  onEdit={editRecord}
                  onOpenLightbox={(urls, alt) => setLightbox({ urls, index: 0, alt })}
                />
              ))}
            </div>
          </div>
        ))}

        {cursor && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={loadMore} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                "더 보기"
              )}
            </Button>
          </div>
        )}
      </div>
      )}

      {lightbox && (
        <Lightbox
          urls={lightbox.urls}
          index={lightbox.index}
          alt={lightbox.alt}
          onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
