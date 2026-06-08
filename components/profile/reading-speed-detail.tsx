"use client";

/**
 * 독서 속도 상세 — 페이스에 기여한 세션을 책별로 보여주고,
 * 잘못된 기록(시작/끝 페이지·시간)을 인라인 수정하거나 삭제한다.
 *
 * - 헤드라인 평균은 로버스트 집계(이상치 자동 제외)로 즉시 재계산(낙관적).
 * - 이상치/오기록 세션은 사유 배지로 투명하게 표시(제외돼도 수정/삭제 가능).
 * - 시간만 기록된 세션은 "페이지 추가"로 손쉽게 평균에 반영(예상값 prefill).
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
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeRobustPace,
  classifyPaceSessions,
  formatPacePerPage,
  type ExclusionReason,
} from "@/lib/reading/pace";
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
  initialPaced: PaceSession[];
  initialTimeOnly: PaceSession[];
}

/** 세션 → computeRobustPace 입력 형태 */
function toPaceLogs(sessions: PaceSession[]) {
  return sessions.map((s) => ({
    reading_duration_seconds: s.durationSeconds,
    start_page: s.startPage,
    end_page: s.endPage,
  }));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

/** 제외 사유 → 사람이 읽는 배지 텍스트/색 */
const REASON_LABEL: Record<Exclude<ExclusionReason, "not_paced">, string> = {
  below_min: "제외 · 너무 빠름",
  above_max: "제외 · 시간 의심",
  mad_outlier: "제외 · 이상치",
};

export function ReadingSpeedDetail({ initialPaced, initialTimeOnly }: Props) {
  const [paced, setPaced] = useState<PaceSession[]>(initialPaced);
  const [timeOnly, setTimeOnly] = useState<PaceSession[]>(initialTimeOnly);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [form, setForm] = useState({ start: 0, end: 0, min: 0, sec: 0 });

  // 로버스트 전체 평균 — 낙관적 재계산
  const robust = useMemo(() => computeRobustPace(toPaceLogs(paced)), [paced]);
  const overallPace = robust.pacePerPageSeconds;

  // paced 세션별 제외 사유(헤드라인과 동일 기준)
  const reasons = useMemo(() => classifyPaceSessions(toPaceLogs(paced)), [paced]);
  const reasonById = useMemo(() => {
    const m = new Map<string, ExclusionReason | null>();
    paced.forEach((s, i) => m.set(s.id, reasons[i]));
    return m;
  }, [paced, reasons]);
  const excludedCount = useMemo(() => reasons.filter((r) => r != null).length, [reasons]);
  const usedCount = paced.length - excludedCount;

  // 책별 그룹 (paced — 입력 순서=최신순)
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; cover: string | null; items: PaceSession[] }>();
    for (const s of paced) {
      const g = map.get(s.userBookId);
      if (g) g.items.push(s);
      else map.set(s.userBookId, { title: s.bookTitle, cover: s.coverImageUrl, items: [s] });
    }
    return Array.from(map.entries()).map(([userBookId, g]) => ({
      userBookId,
      ...g,
      pace: computeRobustPace(toPaceLogs(g.items)),
    }));
  }, [paced]);

  function beginEdit(s: PaceSession, prefillEndFromEstimate = false) {
    let end = s.endPage;
    if (prefillEndFromEstimate && overallPace && overallPace > 0) {
      // 시간만 기록 → 예상 페이지로 prefill (사용자 확인/수정 후 저장)
      end = s.startPage + Math.max(1, Math.round(s.durationSeconds / overallPace));
    }
    setForm({
      start: s.startPage,
      end,
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
        const updatedFields = {
          startPage: start,
          endPage: end,
          durationSeconds: duration,
          pacePerPageSeconds: duration / (end - start),
        };
        // timeOnly에서 수정했다면 paced로 이동(이제 페이지 진행 있음)
        const fromTimeOnly = timeOnly.find((s) => s.id === id);
        if (fromTimeOnly) {
          setTimeOnly((prev) => prev.filter((s) => s.id !== id));
          setPaced((prev) => [{ ...fromTimeOnly, ...updatedFields }, ...prev]);
        } else {
          setPaced((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
        }
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
        setPaced((prev) => prev.filter((s) => s.id !== id));
        setTimeOnly((prev) => prev.filter((s) => s.id !== id));
        toast.success("기록을 삭제했어요.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "삭제에 실패했어요.");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  const pendingSession = pendingDeleteId
    ? paced.find((s) => s.id === pendingDeleteId) ?? timeOnly.find((s) => s.id === pendingDeleteId)
    : null;

  if (paced.length === 0 && timeOnly.length === 0) {
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

  /** 편집 폼 (paced·timeOnly 공용) */
  function editForm(id: string) {
    return (
      <div className="rounded-xl border border-rose-300 bg-rose-50/60 p-3 dark:border-rose-800 dark:bg-rose-950/30">
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
            onClick={() => saveEdit(id)}
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
              {robust.pagesRead}p
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">읽은 분량</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-xl font-bold tabular-nums">
              <Hourglass className="h-4 w-4 text-muted-foreground" />
              {usedCount}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">계산에 사용</div>
          </div>
        </div>
        {(excludedCount > 0 || timeOnly.length > 0) && (
          <p className="mt-3 border-t border-rose-200/50 pt-2.5 text-center text-[11px] text-muted-foreground dark:border-rose-900/30">
            {excludedCount > 0 && <span>이상치 {excludedCount}개 자동 제외</span>}
            {excludedCount > 0 && timeOnly.length > 0 && " · "}
            {timeOnly.length > 0 && <span>시간만 기록 {timeOnly.length}개</span>}
          </p>
        )}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        시간이 잘못되었거나 페이지가 비어 평균을 흐리는 기록은 자동으로 빠지고, 아래에서{" "}
        <b className="text-foreground">수정</b>·<b className="text-foreground">삭제</b>할 수 있어요. 변경하면
        평균이 즉시 다시 계산됩니다.
      </p>

      {/* 책별 그룹 (paced) */}
      {groups.length > 0 && (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.userBookId}>
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

              <div className="space-y-1.5">
                {g.items.map((s) => {
                  if (editingId === s.id) return <div key={s.id}>{editForm(s.id)}</div>;
                  const reason = reasonById.get(s.id) ?? null;
                  const isExcluded = reason != null && reason !== "not_paced";

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                        isExcluded
                          ? "border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                          : "border-transparent bg-muted/30 hover:border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold tabular-nums">
                            페이지당 {formatPacePerPage(s.pacePerPageSeconds)}
                          </span>
                          {isExcluded && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {REASON_LABEL[reason as Exclude<ExclusionReason, "not_paced">]}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                          p.{s.startPage}→{s.endPage} · {s.endPage - s.startPage}p ·{" "}
                          {formatDuration(s.durationSeconds)} · {formatDate(s.createdAt)}
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
      )}

      {/* 시간만 기록 — 페이지 추가하면 평균에 반영 */}
      {timeOnly.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">시간만 기록된 독서</span>
            <span className="text-[11px] text-muted-foreground">· 페이지를 더하면 속도에 반영돼요</span>
          </div>
          <div className="space-y-1.5">
            {timeOnly.map((s) => {
              if (editingId === s.id) return <div key={s.id}>{editForm(s.id)}</div>;
              const estimate =
                overallPace && overallPace > 0
                  ? s.startPage + Math.max(1, Math.round(s.durationSeconds / overallPace))
                  : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold tabular-nums">{formatDuration(s.durationSeconds)}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {s.bookTitle} · {s.startPage > 0 ? `p.${s.startPage}~ · ` : ""}
                      {formatDate(s.createdAt)}
                      {estimate != null && (
                        <span className="ml-1 text-rose-600/80 dark:text-rose-400/80">
                          · 예상 ~p.{estimate}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => beginEdit(s, estimate != null)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                      aria-label="페이지 추가"
                    >
                      {estimate != null ? <Sparkles className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                      페이지 추가
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
          {overallPace != null && (
            <p className="mt-2 px-1 text-[11px] text-muted-foreground/70">
              <Sparkles className="mr-1 inline h-3 w-3" />
              “페이지 추가”를 누르면 내 평균 속도로 계산한 예상 페이지가 미리 채워져요. 확인·수정 후 저장하세요.
            </p>
          )}
        </div>
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
              {pendingSession
                ? `${formatDuration(pendingSession.durationSeconds)} 기록이 삭제되고 평균 속도가 다시 계산돼요. 되돌릴 수 없어요.`
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
