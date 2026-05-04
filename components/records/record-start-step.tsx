"use client";

/**
 * RecordSheet - Start Step
 * 책 선택(변경 가능) + 시작 페이지 + 시간 옵션 → startReadingSession.
 * 메모/사진 입력 없음 (가벼운 진입).
 */

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { BookOpen, ChevronRight, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { startReadingSession } from "@/app/actions/sessions";
import { getLastEndPage } from "@/app/actions/progress";
import { QuickBookSelector } from "@/components/books/quick-book-selector";
import { PlaylistMiniPicker } from "@/components/music/playlist-mini-picker";
import { getGlobalAudio } from "@/components/music/music-mini-player";
import { getPlaylistTracks } from "@/lib/music";
import { loadLastPlaylistId, saveLastPlaylistId } from "@/lib/music/last-playlist";
import { useMusicPlayer } from "@/hooks/use-music-player";
import {
  broadcastSessionStarted,
  generateClientSessionId,
  useReadingSessionStore,
} from "@/hooks/use-reading-session";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";

const TARGET_PRESETS = [
  { label: "15분", seconds: 15 * 60 },
  { label: "25분", seconds: 25 * 60 },
  { label: "45분", seconds: 45 * 60 },
  { label: "무제한", seconds: 0 },
] as const;

interface Props {
  selectedBook: RecordSheetBook | null;
  prefillTargetSeconds: number | null;
  prefillStartPage: number | null;
}

export function RecordStartStep({ selectedBook, prefillTargetSeconds, prefillStartPage }: Props) {
  const [startPage, setStartPage] = useState<number>(prefillStartPage ?? 0);
  const [targetSeconds, setTargetSeconds] = useState<number>(prefillTargetSeconds ?? 25 * 60);
  const [isPending, startTransition] = useTransition();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // Phase 8.B — 음악 옵션 (D10: 마지막 선택 prefill, NULL = 음악 없이)
  const [musicPlaylistId, setMusicPlaylistId] = useState<string | null>(() => loadLastPlaylistId());
  const { setPendingClientSessionId } = useReadingSessionStore();
  const { close, selectBook } = useRecordSheetStore();

  // 시작 페이지 자동 prefill (selectedBook 변경 시)
  useEffect(() => {
    if (typeof prefillStartPage === "number") {
      setStartPage(prefillStartPage);
      return;
    }
    if (!selectedBook) {
      setStartPage(0);
      return;
    }
    let cancelled = false;
    getLastEndPage(selectedBook.id)
      .then((page) => {
        if (!cancelled) setStartPage(page);
      })
      .catch(() => {
        if (!cancelled) setStartPage(0);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBook, prefillStartPage]);

  const handleStart = () => {
    // (1) 음악 시작 — 사용자 클릭 컨텍스트에서 동기 호출 (autoplay 정책 W1)
    let preparedTracks: ReturnType<typeof getPlaylistTracks> = [];
    let randomStartIdx = 0;
    if (musicPlaylistId) {
      preparedTracks = getPlaylistTracks(musicPlaylistId);
      if (preparedTracks.length > 0) {
        randomStartIdx = Math.floor(Math.random() * preparedTracks.length);
        const audio = getGlobalAudio();
        const startTrack = preparedTracks[randomStartIdx];
        if (audio && startTrack) {
          audio.src = startTrack.sourceUrl;
          audio.volume = useMusicPlayer.getState().volume;
          audio.play().catch(() => {
            // 재생 실패는 조용히 — 세션은 그래도 시작
          });
        }
      }
    }

    startTransition(async () => {
      const clientSessionId = generateClientSessionId();
      setPendingClientSessionId(clientSessionId);
      const startedAtIso = new Date().toISOString();
      try {
        const result = await startReadingSession({
          user_book_id: selectedBook?.id,
          start_page: startPage,
          target_seconds: targetSeconds || undefined,
          client_session_id: clientSessionId,
          music_playlist_id: musicPlaylistId ?? undefined,
          music_started_at: musicPlaylistId ? startedAtIso : undefined,
        });
        broadcastSessionStarted(result.sessionId);

        // (2) 음악 zustand 동기화 (UI만 — audio는 이미 재생 중)
        if (musicPlaylistId && preparedTracks.length > 0) {
          useMusicPlayer.getState().loadPlaylist(preparedTracks, randomStartIdx);
          useMusicPlayer.getState().play();
          saveLastPlaylistId(musicPlaylistId);
        }

        toast.success(result.isResumed ? "이전 기록을 이어갑니다" : "기록을 시작했어요");
        close();
      } catch (err) {
        // 세션 시작 실패 시 음악도 정지
        if (musicPlaylistId) {
          const audio = getGlobalAudio();
          audio?.pause();
        }
        const msg = err instanceof Error ? err.message : "기록 시작에 실패했어요.";
        toast.error(msg);
      } finally {
        setPendingClientSessionId(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 책 정보 + 변경 (선택) */}
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        disabled={isPending}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
          selectedBook
            ? "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50"
            : "border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900",
        )}
        aria-label="책 변경"
      >
        {selectedBook?.coverImageUrl ? (
          <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded-md bg-slate-200 shadow-sm dark:bg-slate-700">
            <Image src={selectedBook.coverImageUrl} alt="" fill sizes="36px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-9 flex-shrink-0 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-700">
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {selectedBook ? (
            <>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedBook.title}
              </p>
              {selectedBook.author && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {selectedBook.author}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-emerald-600 group-hover:underline dark:text-emerald-400">
                탭해서 다른 책으로 변경
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                책을 선택하세요
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                선택하지 않으면 자유 기록으로 저장됩니다
              </p>
            </>
          )}
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
      </button>

      {/* 책 선택 다이얼로그 */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-xl max-h-[80dvh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-2">
            <DialogTitle>책 선택</DialogTitle>
            <DialogDescription>
              내 서재에서 책을 선택하거나, 책 없이 기록할 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-5 pb-3">
            <QuickBookSelector
              onSelect={(book) => {
                selectBook({
                  id: book.id, // user_books.id
                  bookId: book.books.id, // books.id
                  title: book.books.title,
                  author: book.books.author,
                  coverImageUrl: book.books.cover_image_url,
                  totalPages: book.books.total_pages ?? null,
                });
                setIsPickerOpen(false);
              }}
            />
          </div>
          <div className="border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                selectBook(null);
                setIsPickerOpen(false);
              }}
            >
              책 없이 자유 기록으로 시작
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 시작 페이지 */}
      <div className="space-y-2">
        <Label htmlFor="record-start-page" className="text-sm font-medium">
          시작 페이지
        </Label>
        <Input
          id="record-start-page"
          type="number"
          inputMode="numeric"
          min={0}
          max={selectedBook?.totalPages ?? undefined}
          value={startPage}
          onChange={(e) => {
            const v = Number(e.target.value);
            setStartPage(Number.isFinite(v) && v >= 0 ? v : 0);
          }}
          disabled={isPending}
        />
        <p className="text-xs text-slate-400">
          이전 기록의 끝 페이지가 자동으로 채워집니다. 다르게 시작하려면 수정하세요.
        </p>
      </div>

      {/* 시간 옵션 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">예상 시간 (선택)</Label>
        <div className="flex flex-wrap gap-2">
          {TARGET_PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant={targetSeconds === p.seconds ? "default" : "outline"}
              size="sm"
              className={cn(
                targetSeconds === p.seconds && "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
              onClick={() => setTargetSeconds(p.seconds)}
              disabled={isPending}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          시간은 안내용이에요. 실제 기록 시간은 종료 시점까지 자동으로 측정됩니다.
        </p>
      </div>

      {/* 배경음악 (Phase 8.B) */}
      <div className="space-y-2">
        <PlaylistMiniPicker
          value={musicPlaylistId}
          onChange={setMusicPlaylistId}
          disabled={isPending}
        />
        <p className="text-xs text-slate-400">
          기록 시작과 함께 음악이 재생됩니다. 진행 중에도 인디케이터에서 변경할 수 있어요.
        </p>
      </div>

      {/* 액션 */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close} disabled={isPending} className="flex-1">
          취소
        </Button>
        <Button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              시작 중…
            </>
          ) : (
            <>
              <Play className="mr-1 h-4 w-4" />
              기록 시작
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
