"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { Star, Plus, X, Clock, Infinity as InfinityIcon, Music2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlaylists, getThemeGroups, getPlaylistTracks } from "@/lib/music";
import { getGlobalAudio } from "./music-mini-player";
import { getContinueReadingBooks } from "@/app/actions/books/reading";
import Image from "next/image";

// ── 즐겨찾기 localStorage 관리 ──
const FAVORITES_KEY = "readingtree-timer-favorites";

function loadFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is number => typeof v === "number" && v > 0);
  } catch {
    return [];
  }
}

function saveFavorites(favorites: number[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ── 기본 프리셋 ──
const DEFAULT_PRESETS = [15, 30, 45, 60, 90];

// ── 플레이리스트 선택 기억 ──
const LAST_PLAYLIST_KEY = "readingtree-last-playlist";

function loadLastPlaylist(): string {
  if (typeof window === "undefined") return "comfortable";
  return localStorage.getItem(LAST_PLAYLIST_KEY) || "comfortable";
}

function saveLastPlaylist(id: string) {
  localStorage.setItem(LAST_PLAYLIST_KEY, id);
}

// ── 책 선택 타입 ──
interface RecentBook {
  userBookId: string;
  bookId: string;
  title: string;
  coverImageUrl: string | null;
}

export function TimerSheet() {
  const { isTimerSheetOpen, closeTimerSheet, startTimer, startUnlimitedTimer, setActiveBook, activeBook } = useMusicPlayer();
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [favorites, setFavorites] = useState<number[]>(loadFavorites);
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(loadLastPlaylist);

  // ── 읽을 책 선택 ──
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const playlists = getPlaylists();
  const themeGroups = getThemeGroups();

  // 현재 선택된 플레이리스트가 속한 장르 감지
  const getGenreForPlaylist = (pid: string) =>
    themeGroups.find((g) => g.playlists.includes(pid))?.id ?? themeGroups[0]?.id ?? "";
  const [selectedGenre, setSelectedGenre] = useState(() => getGenreForPlaylist("comfortable"));

  // 선택된 장르의 플레이리스트 필터링
  const genreGroup = themeGroups.find((g) => g.id === selectedGenre);
  const genrePlaylists = genreGroup
    ? playlists.filter((pl) => genreGroup.playlists.includes(pl.id))
    : playlists;

  // 시트 열릴 때 최근 읽던 책 로드
  useEffect(() => {
    if (!isTimerSheetOpen) return;
    let cancelled = false;
    getContinueReadingBooks(undefined, 3).then((books) => {
      if (cancelled) return;
      const mapped = books.map((b) => ({
        userBookId: b.userBookId,
        bookId: b.bookId,
        title: b.title,
        coverImageUrl: b.coverImageUrl,
      }));
      setRecentBooks(mapped);
      // 외부에서 activeBook이 미리 설정된 경우 (대시보드 원탭) 유지
      if (activeBook) {
        setSelectedBookId(activeBook.userBookId);
      } else if (mapped.length > 0) {
        setSelectedBookId(mapped[0].userBookId);
      } else {
        setSelectedBookId(null);
      }
    });
    return () => { cancelled = true; };
  }, [isTimerSheetOpen, activeBook]);

  // 모든 프리셋 (기본 + 즐겨찾기 합산, 중복 제거, 정렬)
  const allPresets = [...new Set([...DEFAULT_PRESETS, ...favorites])].sort(
    (a, b) => a - b
  );

  function handlePresetClick(minutes: number) {
    setSelectedMinutes(minutes);
    setIsCustom(false);
    setIsUnlimited(false);
  }

  function handleUnlimitedClick() {
    setIsUnlimited(true);
    setIsCustom(false);
  }

  function handleStart() {
    // validation 먼저
    if (!isUnlimited) {
      const minutes = isCustom ? parseInt(customInput, 10) : selectedMinutes;
      if (!minutes || minutes < 1) return;
    }

    // 0. 선택한 책을 activeBook에 설정
    const selectedBook = recentBooks.find((b) => b.userBookId === selectedBookId);
    setActiveBook(
      selectedBook
        ? { userBookId: selectedBook.userBookId, bookId: selectedBook.bookId, title: selectedBook.title, coverUrl: selectedBook.coverImageUrl }
        : null
    );

    // 플레이리스트 선택 기억
    saveLastPlaylist(selectedPlaylistId);

    // 1. 사용자 클릭 동기 컨텍스트에서 audio.play() 호출
    //    (useEffect 경유 시 브라우저 autoplay 정책에 의해 차단됨)
    const audio = getGlobalAudio();
    const tracks = getPlaylistTracks(selectedPlaylistId);
    const firstTrack = tracks[0];

    if (audio && firstTrack) {
      audio.src = firstTrack.sourceUrl;
      audio.volume = useMusicPlayer.getState().volume;
      audio.play().catch(() => {});
    }

    // 2. zustand 상태 업데이트 (UI 동기화)
    if (isUnlimited) {
      startUnlimitedTimer(selectedPlaylistId);
    } else {
      const minutes = isCustom ? parseInt(customInput, 10) : selectedMinutes;
      startTimer(minutes * 60, selectedPlaylistId);
    }
  }

  function toggleFavorite(minutes: number) {
    const next = favorites.includes(minutes)
      ? favorites.filter((f) => f !== minutes)
      : [...favorites, minutes].sort((a, b) => a - b);
    setFavorites(next);
    saveFavorites(next);
  }

  function addCustomFavorite() {
    const mins = parseInt(customInput, 10);
    if (!mins || mins < 1 || mins > 300) return;
    if (!favorites.includes(mins)) {
      const next = [...favorites, mins].sort((a, b) => a - b);
      setFavorites(next);
      saveFavorites(next);
    }
    setSelectedMinutes(mins);
    setIsCustom(false);
    setCustomInput("");
  }

  const canStart = isUnlimited
    ? true
    : isCustom
      ? !!customInput && parseInt(customInput, 10) >= 1
      : selectedMinutes > 0;

  return (
    <Sheet
      open={isTimerSheetOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeTimerSheet();
          setIsEditingFavorites(false);
          setIsCustom(false);
          setIsUnlimited(false);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-5 pt-3 pb-8 flex flex-col max-h-[85vh]"
      >
        {/* 드래그 인디케이터 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-4">
          <SheetTitle className="text-base text-center flex items-center justify-center gap-2">
            <Clock className="w-4.5 h-4.5" />
            독서 타이머
          </SheetTitle>
          <SheetDescription className="sr-only">독서 타이머 시간 및 플레이리스트 설정</SheetDescription>
          <p className="text-xs text-muted-foreground text-center mt-1">
            시간을 설정하면 음악과 함께 독서가 시작됩니다
          </p>
        </SheetHeader>

        {/* ── 읽을 책 선택 ── */}
        {!isEditingFavorites && recentBooks.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2 px-0.5">
              <BookOpen className="w-3 h-3" />
              읽을 책
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentBooks.map((book) => {
                const isSelected = selectedBookId === book.userBookId;
                return (
                  <button
                    key={book.userBookId}
                    onClick={() => setSelectedBookId(isSelected ? null : book.userBookId)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all shrink-0 max-w-[200px]",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {book.coverImageUrl ? (
                      <Image
                        src={book.coverImageUrl}
                        alt=""
                        width={24}
                        height={34}
                        className="rounded-sm object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-[34px] rounded-sm bg-muted-foreground/20 shrink-0 flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-muted-foreground/50" />
                      </div>
                    )}
                    <span className={cn(
                      "text-xs font-medium truncate",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {book.title}
                    </span>
                  </button>
                );
              })}
            </div>
            {!selectedBookId && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 px-0.5">
                책 없이 시작하면 독서 시간만 기록됩니다
              </p>
            )}
          </div>
        )}

        {/* ── 시각적 시간 표시 ── */}
        <div className="flex justify-center mb-5">
          <div className="relative w-36 h-36 sm:w-40 sm:h-40">
            {/* 외곽 원 */}
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/50"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={
                  isUnlimited
                    ? 0
                    : 2 * Math.PI * 54 * (1 - (isCustom ? parseInt(customInput, 10) || 0 : selectedMinutes) / 120)
                }
                className="text-primary transition-all duration-500"
              />
            </svg>
            {/* 중앙 시간 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isUnlimited ? (
                <>
                  <InfinityIcon className="w-10 h-10 text-primary" />
                  <span className="text-xs text-muted-foreground mt-0.5">무제한</span>
                </>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-bold tabular-nums">
                    {isCustom
                      ? customInput || "0"
                      : selectedMinutes}
                  </span>
                  <span className="text-xs text-muted-foreground -mt-0.5">분</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 시간 프리셋 그리드 ── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {isEditingFavorites ? "즐겨찾기 편집" : "시간 선택"}
            </span>
            <button
              onClick={() => setIsEditingFavorites(!isEditingFavorites)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors",
                isEditingFavorites
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className={cn("w-3 h-3", isEditingFavorites && "fill-primary")} />
              {isEditingFavorites ? "완료" : "즐겨찾기"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allPresets.map((minutes) => {
              const isFav = favorites.includes(minutes);
              const isDefault = DEFAULT_PRESETS.includes(minutes);
              const isSelected = selectedMinutes === minutes && !isCustom;

              return (
                <button
                  key={minutes}
                  onClick={() => {
                    if (isEditingFavorites) {
                      toggleFavorite(minutes);
                    } else {
                      handlePresetClick(minutes);
                    }
                  }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isEditingFavorites
                      ? isFav
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/30"
                        : "bg-muted text-muted-foreground"
                      : isSelected
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {isEditingFavorites && (
                    <Star
                      className={cn(
                        "w-3 h-3",
                        isFav && "fill-yellow-500 text-yellow-500"
                      )}
                    />
                  )}
                  {!isEditingFavorites && isFav && !isDefault && (
                    <Star className="w-2.5 h-2.5 fill-current opacity-50" />
                  )}
                  {minutes}분
                  {isEditingFavorites && isFav && !isDefault && (
                    <X className="w-3 h-3 opacity-60" />
                  )}
                </button>
              );
            })}

            {/* 무제한 버튼 */}
            {!isEditingFavorites && (
              <button
                onClick={handleUnlimitedClick}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isUnlimited
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <InfinityIcon className="w-4 h-4" />
                무제한
              </button>
            )}

            {/* 직접 입력 버튼 */}
            {!isEditingFavorites && (
              <button
                onClick={() => {
                  setIsCustom(true);
                  setIsUnlimited(false);
                  setCustomInput("");
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  isCustom
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                직접
              </button>
            )}
          </div>
        </div>

        {/* ── 직접 입력 필드 ── */}
        {isCustom && !isEditingFavorites && (
          <div className="flex items-center gap-2 mb-4 justify-center">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              placeholder="25"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-20 h-11 text-center text-lg font-semibold rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">분</span>
            {/* 즐겨찾기에 추가 버튼 */}
            {customInput && parseInt(customInput, 10) >= 1 && (
              <button
                onClick={addCustomFavorite}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 transition-colors"
                title="즐겨찾기에 추가"
              >
                <Star className="w-3 h-3" />
                저장
              </button>
            )}
          </div>
        )}

        {/* ── 배경음악 선택 ── */}
        {!isEditingFavorites && (
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2 px-0.5">
              <Music2 className="w-3 h-3" />
              배경음악
            </span>

            {/* 장르 탭 */}
            <div className="flex gap-1.5 mb-2.5">
              {themeGroups.map((group) => {
                const isActive = selectedGenre === group.id;
                const groupTrackCount = group.playlists.reduce((sum, pid) => {
                  const pl = playlists.find((p) => p.id === pid);
                  return sum + (pl?.trackIds.length ?? 0);
                }, 0);
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGenre(group.id);
                      if (!group.playlists.includes(selectedPlaylistId)) {
                        setSelectedPlaylistId(group.playlists[0]);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.name}</span>
                    <span className="text-[9px] opacity-50 font-normal">{groupTrackCount}곡</span>
                  </button>
                );
              })}
            </div>

            {/* 플레이리스트 그리드 (선택된 장르) */}
            <div className={cn(
              "grid gap-1.5",
              genrePlaylists.length >= 4 ? "grid-cols-4" : genrePlaylists.length >= 2 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {genrePlaylists.map((pl) => {
                const isSelected = selectedPlaylistId === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 px-1.5 rounded-xl text-center transition-all",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-lg">{pl.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight">{pl.name}</span>
                    <span className="text-[9px] opacity-60">{pl.trackIds.length}곡</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 독서 시작 버튼 ── */}
        {!isEditingFavorites && (
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "w-full py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2",
              canStart
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <span>📖</span>
            독서 시작
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
}
