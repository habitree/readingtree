"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getTrackMoodLabel, getAllTracks, getPlaylists, getThemeGroups } from "@/lib/music";
import { Music2, Check, ListMusic, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock as formatTime } from "@/lib/utils/duration";
import type { MusicTrack } from "@/types/music";

type TabMode = "current" | "all";

export function TrackListSheet() {
  const {
    isTrackListOpen,
    closeTrackList,
    playlist,
    currentTrack,
    currentIndex,
    selectTrack,
    loadPlaylist,
  } = useMusicPlayer();

  const [tab, setTab] = useState<TabMode>("current");
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [filterPlaylistId, setFilterPlaylistId] = useState<string | null>(null);

  const allPlaylists = getPlaylists();
  const themeGroups = getThemeGroups();

  // 장르 필터에 따른 플레이리스트 목록
  const visiblePlaylists = filterGenre
    ? allPlaylists.filter((pl) => {
        const group = themeGroups.find((g) => g.id === filterGenre);
        return group?.playlists.includes(pl.id);
      })
    : allPlaylists;

  function handleSelectCurrent(index: number) {
    selectTrack(index);
    closeTrackList();
  }

  function handleSelectFromAll(track: MusicTrack) {
    const tracks = getFilteredTracks();
    const idx = tracks.findIndex((t) => t.id === track.id);
    loadPlaylist(tracks, undefined, idx >= 0 ? idx : 0);
    setTimeout(() => useMusicPlayer.getState().play(), 100);
    closeTrackList();
  }

  function getFilteredTracks(): MusicTrack[] {
    const allTracks = getAllTracks();

    // 플레이리스트 필터 우선
    if (filterPlaylistId) {
      const pl = allPlaylists.find((p) => p.id === filterPlaylistId);
      if (pl) {
        return pl.trackIds
          .map((id) => allTracks.find((t) => t.id === id))
          .filter((t): t is MusicTrack => t !== undefined);
      }
    }

    // 장르 필터
    if (filterGenre) {
      const group = themeGroups.find((g) => g.id === filterGenre);
      if (group) {
        const genreTrackIds = new Set(
          group.playlists.flatMap((pid) => {
            const pl = allPlaylists.find((p) => p.id === pid);
            return pl?.trackIds ?? [];
          })
        );
        return allTracks.filter((t) => genreTrackIds.has(t.id));
      }
    }

    return allTracks;
  }

  const filteredTracks = tab === "all" ? getFilteredTracks() : playlist;

  return (
    <Sheet
      open={isTrackListOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeTrackList();
          setTab("current");
          setFilterGenre(null);
          setFilterPlaylistId(null);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pt-3 pb-6 flex flex-col max-h-[75vh]"
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-2">
          <SheetTitle className="text-base text-center flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4" />
            음악 목록
          </SheetTitle>
          <SheetDescription className="sr-only">음악 재생 목록</SheetDescription>
        </SheetHeader>

        {/* 탭 전환 */}
        <div className="flex gap-1 mb-3 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => { setTab("current"); setFilterGenre(null); setFilterPlaylistId(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === "current"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListMusic className="w-3.5 h-3.5" />
            재생중 ({playlist.length})
          </button>
          <button
            onClick={() => setTab("all")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === "all"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Library className="w-3.5 h-3.5" />
            전체곡 ({getAllTracks().length})
          </button>
        </div>

        {/* 전체곡 탭: 장르 → 플레이리스트 2단 필터 */}
        {tab === "all" && (
          <div className="space-y-2 mb-3">
            {/* 장르 필터 */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => { setFilterGenre(null); setFilterPlaylistId(null); }}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                  !filterGenre
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                전체
              </button>
              {themeGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { setFilterGenre(group.id); setFilterPlaylistId(null); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                    filterGenre === group.id
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{group.emoji}</span>
                  {group.name}
                </button>
              ))}
            </div>

            {/* 플레이리스트 필터 */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setFilterPlaylistId(null)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                  !filterPlaylistId
                    ? "bg-foreground/8 text-foreground ring-1 ring-foreground/10"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                전체 {getFilteredTracks().length}곡
              </button>
              {visiblePlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => setFilterPlaylistId(pl.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                    filterPlaylistId === pl.id
                      ? "bg-foreground/8 text-foreground ring-1 ring-foreground/10"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {pl.emoji} {pl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 곡 수/시간 요약 */}
        <p className="text-xs text-muted-foreground text-center mb-2">
          {filteredTracks.length}곡 ·{" "}
          {Math.floor(filteredTracks.reduce((s, t) => s + t.durationSeconds, 0) / 60)}분
        </p>

        {/* 곡 목록 */}
        <div className="flex-1 overflow-y-auto -mx-1">
          {filteredTracks.map((track, i) => {
            const isActive = tab === "current"
              ? i === currentIndex
              : currentTrack?.id === track.id;
            const moodLabel = getTrackMoodLabel(track);

            return (
              <button
                key={`${track.id}-${tab}-${i}`}
                onClick={() =>
                  tab === "current"
                    ? handleSelectCurrent(i)
                    : handleSelectFromAll(track)
                }
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left",
                  isActive
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isActive ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
                    {track.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0",
                      track.era === "jazz"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}>
                      {track.era === "jazz" ? "🎷" : "🎻"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {track.composer}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {moodLabel.emoji} {moodLabel.name}
                    </span>
                  </div>
                </div>

                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {formatTime(track.durationSeconds)}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
