"use client";

import { useCallback, useEffect, useState } from "react";
import { getReadingStamps } from "@/app/actions/progress";
import type { ReadingStamp } from "@/types/progress";
import { StampCard } from "./stamp-card";
import { Button } from "@/components/ui/button";
import { Loader2, StampIcon } from "lucide-react";
import { useStampCapture } from "@/hooks/use-stamp-capture";

interface StampCollectionGridProps {
  userBookId?: string;
  initialStamps?: ReadingStamp[];
  initialNextCursor?: string | null;
  showBookInfo?: boolean;
  /** 새 스탬프 작성 CTA 표시 여부 */
  showCaptureCTA?: boolean;
}

/**
 * 스탬프 그리드 — 모바일 3열, 데스크톱 5열.
 * 페이지네이션은 cursor 기반 무한 스크롤(현재 "더 보기" 버튼).
 */
export function StampCollectionGrid({
  userBookId,
  initialStamps,
  initialNextCursor = null,
  showBookInfo,
  showCaptureCTA,
}: StampCollectionGridProps) {
  const [stamps, setStamps] = useState<ReadingStamp[]>(initialStamps ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(!initialStamps);
  const stampCapture = useStampCapture();

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getReadingStamps({ userBookId, limit: 30 });
      setStamps(result.stamps);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error("스탬프 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userBookId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      const result = await getReadingStamps({
        userBookId,
        limit: 30,
        cursor: nextCursor,
      });
      setStamps((prev) => [...prev, ...result.stamps]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error("스탬프 추가 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading, userBookId]);

  useEffect(() => {
    if (!initialStamps) loadInitial();
  }, [initialStamps, loadInitial]);

  if (isLoading && stamps.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        스탬프 불러오는 중...
      </div>
    );
  }

  if (stamps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center dark:border-slate-800 dark:bg-slate-900/30">
        <StampIcon className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          기록에 사진을 추가하면 스탬프가 돼요
        </p>
        <p className="text-xs text-slate-500 max-w-xs">
          독서 시간 탭에서 기록 옆 ‘사진 추가’ 칩으로 빠르게 시작할 수 있어요
        </p>
        {showCaptureCTA && (
          <Button
            type="button"
            onClick={() => stampCapture.open()}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            바로 기록하기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {showCaptureCTA && (
          <button
            type="button"
            onClick={() => stampCapture.open()}
            className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
            aria-label="새 스탬프 찍기"
          >
            <span className="text-3xl font-light">+</span>
          </button>
        )}
        {stamps.map((stamp) => (
          <StampCard
            key={stamp.id}
            stamp={stamp}
            showBookInfo={showBookInfo}
            href={`/books/${stamp.user_book_id}#stamp-${stamp.id}`}
          />
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              "더 보기"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
