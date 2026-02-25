"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  BookOpen,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deriveReadingSessions } from "@/lib/utils/reading-sessions";
import type { NoteWithBook } from "@/types/note";

interface ReadingJourneyProps {
  startedAt: string;
  completedDates: string[];
  status: string;
  currentPage: number;
  totalPages: number | null;
  progressNotes: NoteWithBook[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function extractMemo(content: string | null): string | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return parsed?.memo || null;
  } catch {
    return content;
  }
}

/**
 * 독서 여정 컴포넌트
 * 회독 단위로 독서 세션을 시각화 (여정 요약 + 회독별 카드)
 */
export function ReadingJourney({
  startedAt,
  completedDates,
  status,
  currentPage,
  totalPages,
  progressNotes,
}: ReadingJourneyProps) {
  const [showAllLogs, setShowAllLogs] = useState(false);

  const sessions = deriveReadingSessions(
    { started_at: startedAt, status, current_page: currentPage, completedDates },
    totalPages,
    progressNotes
  );

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">아직 진행 기록이 없어요</p>
        <p className="text-xs mt-1 opacity-70">페이지를 업데이트하면 여정이 시작돼요</p>
      </div>
    );
  }

  const totalDays = sessions.reduce((sum, s) => sum + s.durationDays, 0);
  const totalLogs = progressNotes.length;
  const completedCount = sessions.filter((s) => !s.isCurrentSession).length;
  const activeCount = sessions.filter((s) => s.isCurrentSession).length;

  return (
    <div className="space-y-4">
      {/* ── 독서 여정 요약 카드 ── */}
      <div className="rounded-xl border border-border/50 bg-card/80 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          독서 여정 요약
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {sessions.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              회독
              {completedCount > 0 || activeCount > 0 ? (
                <span className="block">
                  ({completedCount > 0 ? `${completedCount}완` : ""}
                  {completedCount > 0 && activeCount > 0 ? " " : ""}
                  {activeCount > 0 ? "1진행" : ""})
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {totalDays}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">총 독서일</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalLogs}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">총 기록 수</div>
          </div>
        </div>
      </div>

      {/* ── 회독별 여정 ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">회독별 여정</h3>
        </div>

        <div className="relative space-y-3">
          {/* 연결선 */}
          {sessions.length > 1 && (
            <div className="absolute left-[33px] top-10 bottom-10 w-0.5 bg-border/50 z-0 pointer-events-none" />
          )}

          {sessions.map((session) => {
            const isCompleted = !session.isCurrentSession;
            const progressPercent = session.isCurrentSession
              ? totalPages && currentPage
                ? Math.min(100, Math.round((currentPage / totalPages) * 100))
                : 0
              : 100;

            const remainingPages =
              session.isCurrentSession && totalPages
                ? Math.max(0, totalPages - currentPage)
                : null;

            const estimatedDays =
              remainingPages !== null &&
              remainingPages > 0 &&
              session.avgPagesPerDay
                ? Math.ceil(remainingPages / session.avgPagesPerDay)
                : null;

            const previewNotes = session.notes.slice(0, 2);
            const remainingNoteCount = Math.max(0, session.notes.length - 2);

            return (
              <div
                key={session.sessionNumber}
                className={cn(
                  "relative z-10 rounded-xl border p-4 transition-shadow hover:shadow-sm",
                  isCompleted
                    ? "border-emerald-200/60 dark:border-emerald-800/40 bg-card"
                    : "border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-br from-card to-blue-50/30 dark:to-blue-950/20"
                )}
              >
                {/* 세션 헤더 */}
                <div className="flex items-start gap-3 mb-3">
                  {/* 회독 번호 배지 */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm",
                      isCompleted
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                        : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                    )}
                  >
                    {session.sessionNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">
                        {session.sessionNumber}회독
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                        )}
                      >
                        {isCompleted ? "✓ 완독" : "● 진행 중"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                      <span>{formatShortDate(session.startDate)}</span>
                      <span className="opacity-40">→</span>
                      {isCompleted && session.completedDate ? (
                        <>
                          <span>{formatShortDate(session.completedDate)}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ({session.durationDays}일)
                          </span>
                        </>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {session.durationDays}일째
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="mb-3">
                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        isCompleted
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span
                      className={cn(
                        "font-semibold",
                        isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {isCompleted ? "100% 완독" : `${progressPercent}%`}
                    </span>
                    {totalPages && (
                      <span className="text-muted-foreground">
                        {isCompleted ? totalPages : currentPage} / {totalPages}쪽
                      </span>
                    )}
                  </div>
                </div>

                {/* 현재 세션 상세 통계 */}
                {session.isCurrentSession &&
                  (remainingPages !== null ||
                    session.avgPagesPerDay ||
                    estimatedDays) && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {remainingPages !== null && (
                        <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                          <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            {remainingPages}
                          </div>
                          <div className="text-[10px] text-muted-foreground">남은 쪽수</div>
                        </div>
                      )}
                      {session.avgPagesPerDay && (
                        <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                          <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            {session.avgPagesPerDay}
                          </div>
                          <div className="text-[10px] text-muted-foreground">일평균 쪽</div>
                        </div>
                      )}
                      {estimatedDays && (
                        <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                          <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            ~{estimatedDays}일
                          </div>
                          <div className="text-[10px] text-muted-foreground">예상 완독</div>
                        </div>
                      )}
                    </div>
                  )}

                {/* 세션 통계 */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    기록 {session.notes.length}개
                  </span>
                  {session.avgPagesPerDay && !session.isCurrentSession && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      일평균 {session.avgPagesPerDay}쪽
                    </span>
                  )}
                  {session.isCurrentSession && session.notes.length > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      ↑ 계속 기록해요!
                    </span>
                  )}
                </div>

                {/* 기록 미리보기 칩 */}
                {session.notes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                      {session.isCurrentSession ? "최근 기록" : "기록 미리보기"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewNotes.map((note) => {
                        const page = note.page_number
                          ? parseInt(note.page_number, 10)
                          : null;
                        const memo = extractMemo(note.content);
                        const chipText =
                          [
                            page ? `p.${page}` : null,
                            memo
                              ? memo.slice(0, 14) +
                                (memo.length > 14 ? "..." : "")
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "기록";

                        return (
                          <Link
                            key={note.id}
                            href={`/notes/${note.id}`}
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-md text-[10px] border transition-colors",
                              session.isCurrentSession
                                ? "bg-blue-50 border-blue-200/60 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-400"
                                : "bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400"
                            )}
                          >
                            {chipText}
                          </Link>
                        );
                      })}
                      {remainingNoteCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] bg-muted/40 text-muted-foreground border border-border/40">
                          +{remainingNoteCount}개 더보기
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 전체 기록 토글 ── */}
      {totalLogs > 0 && (
        <>
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground hover:border-blue-300/70 hover:text-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 dark:hover:border-blue-700/50 transition-all"
          >
            <FileText className="h-4 w-4" />
            <span>전체 기록 {totalLogs}개 모아보기</span>
            {showAllLogs ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAllLogs && (
            <div className="space-y-2">
              {progressNotes.map((note) => {
                const page = note.page_number
                  ? parseInt(note.page_number, 10)
                  : null;
                const memo = extractMemo(note.content);
                return (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/60 hover:shadow-sm hover:border-border/80 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-100/60 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                      {page !== null && !isNaN(page) ? (
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                          {page}
                        </span>
                      ) : (
                        <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-muted-foreground">
                        {page !== null && !isNaN(page) && (
                          <span className="font-medium text-teal-600 dark:text-teal-400 mr-1.5">
                            p.{page}
                          </span>
                        )}
                        {formatShortDate(note.created_at)}
                      </div>
                      {memo && (
                        <p className="text-xs text-foreground/80 mt-0.5 line-clamp-1">
                          {memo}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
