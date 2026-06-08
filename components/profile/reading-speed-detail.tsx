"use client";

/**
 * 독서 속도 상세 — 페이스에 기여한 세션을 책별로 보여주고,
 * 잘못된 기록(시작/끝 페이지·시간)을 인라인 수정하거나 삭제한다.
 *
 * 전체/책별 평균은 클라이언트에서 computePace로 즉시 재계산(낙관적 갱신).
 */

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  Gauge,
  BookOpenCheck,
  Hourglass,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { computePace, formatPacePerPage } from "@/lib/reading/pace";
import { formatDuration } from "@/lib/utils/duration";
import { updateReadingLogEntry, deleteProgressLog } from "@/app/actions/progress";
import type { PaceSession } from "@/types/progress";
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

interface Props {
  initialSessions: PaceSession[];
}

/** 세션 → computePace 입력 형태 */
function toPaceLogs(sessions: PaceSession[]) {
  return sessions.map((s) => ({
    reading_duration_seconds: s.durationSeconds,
    start_page: s.startPage,
    end_page: s.endPage,
  }));
}

/** KST 날짜 표기 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export function ReadingSpeedDetail({ initialSessions }: Props) {
  const [sessions, setSessions] = useState<PaceSession[]>(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  // 편집 폼 로컬 상태
  const [form, setForm] = useState({ start: 0, end: 0, min: 0, sec: 0 });

  // 전체 평균 — 낙관적 재계산
  const overall = useMemo(() => computePace(toPaceLogs(sessions)), [sessions]);
  const overallPace = overall.pacePerPageSeconds;

  // 책별 그룹 (입력 순서 = 최신순 유지)
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; cover: string | null; items: PaceSession[] }>();
    for (const s of sessions) {
      const g = map.get(s.userBookId);
      if (g) g.items.push(s);
      else map.set(s.userBookId, { title: s.bookTitle, cover: s.coverImageUrl, items: [s] });
    }
    return Array.from(map.entries()).map(([userBookId, g]) => {
      const pace = computePace(toPaceLogs(g.items));
      return { userBookId, ...g, pace };
    });
  }, [sessions]);

  function beginEdit(s: PaceSession) {
    setForm({
      start: s.startPage,
      end: s.endPage,
      min: Math.floor(s.durationSeconds / 60),
      sec: s.durationSeconds % 60,
    });
    setEditingId(s.id);
  }

  function saveEdit(id: string) {
    const start = Math.max(0, Math.floor(form.start));
    const end = Math.max(0, Math.floor(form.end));
    const duration = Math.max(0, Math.floor(form.min) * 60 + Math.floor(form.sec));

    if (end <= start) {
      toast.error("끝 페이지는 시작 페이지보다 커야 해요.");
      return;
    }
    if (duration <= 0) {
      toast.error("독서 시간을 입력해 주세요.");
      return;
    }

    startSave(async () => {
      try {
        await updateReadingLogEntry(id, {
          start_page: start,
          end_page: end,
          reading_duration_seconds: duration,
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  startPage: start,
                  endPage: end,
                  durationSeconds: duration,
                  pacePerPageSeconds: duration / (end - start),
                }
              : s,
          ),
        );
        setEditingId(null);
        toast.success("기록을 수정했어요.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "수정에 실패했어요.");
      }
    });
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    startDelete(async () => {
      try {
        await deleteProgressLog(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("기록을 삭제했어요.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했어요.");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <Gauge className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">아직 속도를 계산할 독서 기록이 없어요</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          페이지 구간과 시간이 기록된 독서 세션이 쌓이면 여기에서 확인할 수 있어요
        </p>
      </div>
    );
  }

  const pendingSession = pendingDeleteId ? sessions.find((s) => s.id === pendingDeleteId) : null;

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <div className="rounded-2xl border border-rose-200/60 bg-rose-50/40 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="mb-3 flex items-center gap-1.5">
          <Gauge className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">내 전체 평균</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold tabular-nums">
              {overallPace != null ? formatPacePerPage(overallPace) : "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">페이지당 평균</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums">
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
              {overall.pagesRead}p
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">읽은 분량</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums">
              <Hourglass className="h-4 w-4 text-muted-foreground" />
              {overall.sessionCount}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">세션 · {formatDuration(overall.pacedSeconds)}</div>
          </div>
        </div>
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        잘못 기록된 세션은 <b className="text-foreground">수정</b>하거나 <b className="text-foreground">삭제</b>할 수
        있어요. 변경하면 평균 속도가 즉시 다시 계산됩니다.
      </p>

      {/* 책별 그룹 */}
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.userBookId}>
            {/* 책 헤더 */}
            <div className="mb-2 flex items-center gap-2.5 px-1">
              <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded bg-muted">
                {g.cover && (
                  <Image src={g.cover} alt={g.title} fill sizes="28px" className="object-cover" unoptimized />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  페이지당 {g.pace.pacePerPageSeconds != null ? formatPacePerPage(g.pace.pacePerPageSeconds) : "—"}
                  {" · "}
                  {g.pace.pagesRead}p · {g.items.length}세션
                </p>
              </div>
            </div>

            {/* 세션 목록 */}
            <div className="space-y-1.5">
              {g.items.map((s) => {
                const isEditing = editingId === s.id;
                // 이상치 — 전체 평균 대비 2.5배↑ 또는 0.4배↓ 면 의심 표시
                const isOutlier =
                  overallPace != null &&
                  overallPace > 0 &&
                  (s.pacePerPageSeconds > overallPace * 2.5 || s.pacePerPageSeconds < overallPace * 0.4);

                if (isEditing) {
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-rose-300 bg-rose-50/60 p-3 dark:border-rose-800 dark:bg-rose-950/30"
                    >
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        <label className="text-[11px] text-muted-foreground">
                          시작 페이지
                          <input
                            type="number"
                            min={0}
                            value={form.start}
                            onChange={(e) => setForm((f) => ({ ...f, start: Number(e.target.value) }))}
                            className="mt-1 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm tabular-nums"
                          />
                        </label>
                        <label className="text-[11px] text-muted-foreground">
                          끝 페이지
                          <input
                            type="number"
                            min={0}
                            value={form.end}
                            onChange={(e) => setForm((f) => ({ ...f, end: Number(e.target.value) }))}
                            className="mt-1 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm tabular-nums"
                          />
                        </label>
                        <label className="text-[11px] text-muted-foreground">
                          시간(분)
                          <input
                            type="number"
                            min={0}
                            value={form.min}
                            onChange={(e) => setForm((f) => ({ ...f, min: Number(e.target.value) }))}
                            className="mt-1 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm tabular-nums"
                          />
                        </label>
                        <label className="text-[11px] text-muted-foreground">
                          시간(초)
                          <input
                            type="number"
                            min={0}
                            max={59}
                            value={form.sec}
                            onChange={(e) => setForm((f) => ({ ...f, sec: Number(e.target.value) }))}
                            className="mt-1 w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm tabular-nums"
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(s.id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          저장
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-muted/30 p-3 transition-colors hover:border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold tabular-nums">
                          페이지당 {formatPacePerPage(s.pacePerPageSeconds)}
                        </span>
                        {isOutlier && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            이상치?
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                        p.{s.startPage}→{s.endPage} · {s.endPage - s.startPage}p · {formatDuration(s.durationSeconds)}
                        {" · "}
                        {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => beginEdit(s)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                        aria-label="기록 수정"
                      >
                        <Pencil className="h-3 w-3" />
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(s.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        aria-label="기록 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
              {pendingSession
                ? `p.${pendingSession.startPage}→${pendingSession.endPage} · ${formatDuration(
                    pendingSession.durationSeconds,
                  )} 기록이 삭제되고 평균 속도가 다시 계산돼요. 되돌릴 수 없어요.`
                : "삭제한 기록은 되돌릴 수 없어요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
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
    </div>
  );
}
