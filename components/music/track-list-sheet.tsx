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
import { getTrackMoodLabel, getAllTracks, getPlaylists } from "@/lib/music";
import { Music2, Check, ListMusic, Library, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MusicTrack } from "@/types/music";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
  const [filterPlaylistId, setFilterPlaylistId] = useState<string | null>(null);

  function handleSelectCurrent(index: number) {
    selectTrack(index);
    closeTrackList();
  }

  function handleSelectFromAll(track: MusicTrack) {
    // 전체 목록에서 선택 → 해당 곡을 포함하는 새 플레이리스트로 로드
    const allTracks = filterPlaylistId
      ? getFilteredTracks()
      : getAllTracks();
    const idx = allTracks.findIndex((t) => t.id === track.id);
    loadPlaylist(allTracks, idx >= 0 ? idx : 0);
    // 선택 후 재생 시작
    setTimeout(() => useMusicPlayer.getState().play(), 100);
    closeTrackList();
  }

  function getFilteredTracks(): MusicTrack[] {
    if (!filterPlaylistId) return getAllTracks();
    const pl = getPlaylists().find((p) => p.id === filterPlaylistId);
    if (!pl) return getAllTracks();
    const allTracks = getAllTracks();
    return pl.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter((t): t is MusicTrack => t !== undefined);
  }

  const filteredTracks = tab === "all" ? getFilteredTracks() : playlist;
  const playlists = getPlaylists();

  return (
    <Sheet
      open={isTrackListOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeTrackList();
          setTab("current");
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
          <SheetDescription className="sr-only">클래식 음악 재생 목록</SheetDescription>
        </SheetHeader>

        {/* 탭 전환 */}
        <div className="flex gap-1 mb-3 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => { setTab("current"); setFilterPlaylistId(null); }}
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

        {/* 전체곡 탭: 카테고리 필터 */}
        {tab === "all" && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterPlaylistId(null)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                !filterPlaylistId
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              전체 {getAllTracks().length}곡
            </button>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => setFilterPlaylistId(pl.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                  filterPlaylistId === pl.id
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {pl.emoji} {pl.name}
              </button>
            ))}
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
