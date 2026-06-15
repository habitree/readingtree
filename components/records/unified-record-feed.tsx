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
import { groupUnifiedByDateBook, toKstDateKey } from "@/lib/reading/unified";
import { useUnifiedRecordEdit } from "@/hooks/use-unified-record-edit";
import { useRecordSheetStore } from "@/hooks/use-record-sheet";
import { Lightbox } from "@/components/stamps/photo-gallery";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UnifiedRecordCard } from "./unified-record-card";
import type { UnifiedRecord } from "@/types/unified-record";

interface UnifiedRecordFeedProps {
  initialRecords: UnifiedRecord[];
  initialNextCursor: string | null;
  /** 책 상세 스코프(user_books.id) — 미지정 = 전체 */
  bookId?: string;
}

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
}: UnifiedRecordFeedProps) {
  const router = useRouter();
  const { editRecord } = useUnifiedRecordEdit();

  const [records, setRecords] = useState<UnifiedRecord[]>(initialRecords);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
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
        const res = await getUnifiedRecords({ cursor, bookId, limit: 20 });
        setRecords((prev) => [...prev, ...res.records]);
        setCursor(res.nextCursor);
      } catch {
        // 더 보기 실패 — 조용히 무시 (다음 시도 가능)
      }
    });
  }, [cursor, bookId]);

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

  const groups = groupUnifiedByDateBook(records);

  return (
    <>
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              <span suppressHydrationWarning>
                {formatDateKeyLabel(g.kstDateKey, todayKey, yesterdayKey)}
              </span>
              {g.book.title && <span> · {g.book.title}</span>}
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
