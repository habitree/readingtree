"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  getReadingTimeLogs,
  getReadingTimeStats,
  getUserReadingTimeStats,
  getReadingSpeedGuide,
  deleteProgressLog,
} from "@/app/actions/progress";
import {
  Clock,
  Image as ImageIcon,
  Images,
  Timer,
  TrendingUp,
  Calendar,
  Trash2,
  Loader2,
  Pencil,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDuration, formatTimeRange } from "@/lib/utils/duration";
import type { ReadingLog, ReadingSpeedGuide } from "@/types/progress";
import { useStampCaptureStore } from "@/hooks/use-stamp-capture";
import { useStampShareStore } from "@/hooks/use-stamp-share";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReadingTimeShareButton } from "./reading-time-share-button";
import { ReadingTimeLinkShare } from "./reading-time-link-share";
import { ReadingPacePanel } from "./reading-pace-panel";
import { Lightbox } from "@/components/stamps/photo-gallery";

interface ReadingTimeTabProps {
  userBookId: string;
  bookInfo?: {
    bookId: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    totalPages: number | null;
  };
}

function groupByDate(logs: ReadingLog[]): Map<string, ReadingLog[]> {
  const groups = new Map<string, ReadingLog[]>();
  const today = new Date().toLocaleDateString("ko-KR");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("ko-KR");

  for (const log of logs) {
    const dateStr = new Date(log.created_at).toLocaleDateString("ko-KR");
    let label: string;
    if (dateStr === today) label = "오늘";
    else if (dateStr === yesterday) label = "어제";
    else label = dateStr;

    const existing = groups.get(label);
    if (existing) existing.push(log);
    else groups.set(label, [log]);
  }
  return groups;
}

export function ReadingTimeTab({ userBookId, bookInfo }: ReadingTimeTabProps) {
  const openStampAttach = useStampCaptureStore((s) => s.openAttach);
  const openStampShare = useStampShareStore((s) => s.openShare);
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [stats, setStats] = useState<{
    totalSeconds: number;
    sessionCount: number;
    averageSeconds: number;
  } | null>(null);
  const [overallPaceSeconds, setOverallPaceSeconds] = useState<number | null>(null);
  const [guide, setGuide] = useState<ReadingSpeedGuide | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number; alt: string } | null>(null);

  // "편집" — 사진 추가 시트(StampCaptureSheet attach 모드)로 통합 진입.
  // 시트 안에서 사진/메모/페이지 자유롭게 수정 가능. 사진 없이도 저장됨.
  function openEditSheet(log: ReadingLog) {
    openStampAttach(log.id, {
      book: bookInfo
        ? {
            id: userBookId,
            bookId: bookInfo.bookId,
            title: bookInfo.title,
            author: bookInfo.author,
            coverImageUrl: bookInfo.coverImageUrl,
            totalPages: bookInfo.totalPages,
          }
        : null,
      startPage: log.start_page ?? undefined,
      endPage: log.end_page ?? log.page_number ?? undefined,
      durationSeconds: log.reading_duration_seconds,
    });
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const targetId = pendingDeleteId;
    startDeleteTransition(async () => {
      try {
        await deleteProgressLog(targetId);
        setLogs((prev) => prev.filter((l) => l.id !== targetId));
        setStats((prev) => {
          if (!prev) return prev;
          const removed = logs.find((l) => l.id === targetId);
          if (!removed) return prev;
          const newCount = Math.max(0, prev.sessionCount - 1);
          const newTotal = Math.max(0, prev.totalSeconds - (removed.reading_duration_seconds || 0));
          return {
            totalSeconds: newTotal,
            sessionCount: newCount,
            averageSeconds: newCount > 0 ? Math.round(newTotal / newCount) : 0,
          };
        });
        toast.success("기록을 삭제했어요.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "삭제에 실패했어요.";
        toast.error(msg);
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [logsData, statsData, userTimeStats, guideData] = await Promise.all([
          getReadingTimeLogs(userBookId),
          getReadingTimeStats(userBookId),
          getUserReadingTimeStats().catch(() => null),
          getReadingSpeedGuide().catch(() => undefined),
        ]);
        if (cancelled) return;
        setLogs(logsData);
        setStats(statsData);
        setOverallPaceSeconds(userTimeStats?.pacePerPageSeconds ?? null);
        setGuide(guideData ?? undefined);
      } catch {
        // 에러 무시 (빈 상태)
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userBookId]);

  if (isLoading) {
    // 로드 후 레이아웃(통계 3-그리드 + 로그 리스트)에 맞춘 스켈레톤 — CLS 방지
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-xl border bg-muted/40 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[68px] rounded-xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.sessionCount === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">
          아직 독서 시간 기록이 없습니다
        </p>
        <p className="text-xs text-muted-foreground/60">
          헤더의 타이머 버튼으로 독서를 시작해보세요
        </p>
      </div>
    );
  }

  const grouped = groupByDate(logs);
  const stampCount = logs.filter((l) => !!l.image_url).length;
  const pendingLog = pendingDeleteId
    ? logs.find((l) => l.id === pendingDeleteId)
    : null;

  return (
    <>
      <div className="space-y-5">
        {/* 통계 카드 + 공유 버튼들 (링크 / 이미지) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-end gap-2">
            <ReadingTimeLinkShare bookTitle={bookInfo?.title ?? null} />
            <ReadingTimeShareButton
              bookInfo={bookInfo ?? null}
              stats={stats}
              logs={logs}
              stampCount={stampCount}
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
              <Timer className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                {formatDuration(stats.totalSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">총 독서 시간</p>
            </div>
            <div className="rounded-xl bg-muted/50 border p-3 text-center">
              <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-bold tabular-nums">
                {stats.sessionCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                세션{stampCount > 0 ? ` · 스탬프 ${stampCount}` : ""}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 border p-3 text-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-bold tabular-nums">
                {formatDuration(stats.averageSeconds)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">평균/회</p>
            </div>
          </div>
        </div>

        <ReadingPacePanel
          logs={logs}
          totalPages={bookInfo?.totalPages ?? null}
          overallPaceSeconds={overallPaceSeconds}
          guide={guide}
        />

        {/* 날짜별 기록 */}
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([dateLabel, dateLogs]) => (
            <div key={dateLabel}>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {dateLabel}
              </p>
              <div className="space-y-1.5">
                {dateLogs.map((log) => {
                  const photoUrls: string[] =
                    Array.isArray(log.image_urls) && log.image_urls.length > 0
                      ? log.image_urls
                      : log.image_url
                        ? [log.image_url]
                        : [];
                  const hasImage = photoUrls.length > 0;
                  const photoCount = photoUrls.length;
                  const pages =
                    typeof log.end_page === "number" && typeof log.start_page === "number"
                      ? Math.max(0, log.end_page - log.start_page)
                      : 0;
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors"
                    >
                      {/* 좌측: 사진 썸네일(스탬프) 또는 아이콘 — 클릭 시 라이트박스 */}
                      {hasImage ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              urls: photoUrls,
                              index: 0,
                              alt: bookInfo?.title ? `${bookInfo.title} 스탬프 사진` : "스탬프 사진",
                            })
                          }
                          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-emerald-200 dark:ring-emerald-900 transition-transform active:scale-95"
                          aria-label={photoCount > 1 ? `사진 ${photoCount}장 크게 보기` : "사진 크게 보기"}
                        >
                          <Image
                            src={photoUrls[0]}
                            alt="스탬프 사진"
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                          {photoCount > 1 && (
                            <span className="absolute bottom-0 right-0 inline-flex items-center gap-0.5 rounded-tl-md bg-emerald-600/90 px-1 text-[9px] font-bold tabular-nums text-white">
                              <Images className="h-2 w-2" />
                              {photoCount}
                            </span>
                          )}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-primary/10",
                          )}
                        >
                          <Timer className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}

                      {/* 가운데: 시간/페이지/메모 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">
                            {formatDuration(log.reading_duration_seconds)}
                          </span>
                          {pages > 0 && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {pages}p
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatTimeRange(log.started_at, log.ended_at)}
                          </span>
                          {hasImage && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <ImageIcon className="h-2.5 w-2.5" />
                              스탬프
                            </span>
                          )}
                        </div>
                        {log.memo && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {log.memo}
                          </p>
                        )}
                      </div>

                      {/* 우측: 편집 / 공유 / 삭제 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditSheet(log)}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
                          aria-label="기록 편집"
                        >
                          <Pencil className="h-3 w-3" />
                          편집
                        </button>
                        <button
                          type="button"
                          onClick={() => openStampShare(log.id, { bookTitle: bookInfo?.title ?? null })}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
                          aria-label="기록 공유"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(log.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label="기록 삭제"
                          disabled={isDeleting && pendingDeleteId === log.id}
                        >
                          {isDeleting && pendingDeleteId === log.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 기록을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingLog?.image_url
                ? "사진이 첨부된 스탬프 기록도 함께 삭제됩니다. 되돌릴 수 없어요."
                : "삭제한 시간 기록은 되돌릴 수 없어요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
