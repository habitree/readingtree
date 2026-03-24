"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { MUSIC_CATEGORIES, MUSIC_PLAYLISTS, getPlaylistTracks } from "@/lib/music-data";
import type { MusicCategory } from "@/types/music";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaylistSheet() {
  const {
    isPlaylistOpen,
    closePlaylist,
    playlist,
    currentTrack,
    selectTrack,
    loadPlaylist,
  } = useMusicPlayer();

  const [filter, setFilter] = useState<MusicCategory | "all">("all");

  const filteredPlaylists =
    filter === "all"
      ? MUSIC_PLAYLISTS
      : MUSIC_PLAYLISTS.filter(
          (p) => p.category === filter || p.category === "mixed"
        );

  function handlePlaylistSelect(playlistId: string) {
    const tracks = getPlaylistTracks(playlistId);
    if (tracks.length > 0) {
      loadPlaylist(tracks);
      selectTrack(0);
      closePlaylist();
    }
  }

  function handleTrackSelect(trackIndex: number) {
    selectTrack(trackIndex);
    closePlaylist();
  }

  return (
    <Sheet open={isPlaylistOpen} onOpenChange={(open) => !open && closePlaylist()}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-2xl px-4 pt-3 pb-6 flex flex-col"
      >
        {/* 드래그 인디케이터 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-3">
          <SheetTitle className="text-base">플레이리스트</SheetTitle>
        </SheetHeader>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            전체
          </button>
          {MUSIC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* 플레이리스트 + 현재 재생 목록 */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 플레이리스트 선택 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground px-1">
              플레이리스트 선택
            </p>
            {filteredPlaylists.map((pl) => {
              const tracks = getPlaylistTracks(pl.id);
              const totalMin = Math.floor(
                tracks.reduce((sum, t) => sum + t.durationSeconds, 0) / 60
              );
              return (
                <button
                  key={pl.id}
                  onClick={() => handlePlaylistSelect(pl.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-2xl">{pl.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pl.description} · {tracks.length}곡 · {totalMin}분
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 현재 재생 목록 */}
          {playlist.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-1">
                현재 재생 목록
              </p>
              {playlist.map((track, i) => {
                const isActive = track.id === currentTrack?.id;
                const catInfo = MUSIC_CATEGORIES.find(
                  (c) => c.id === track.category
                );
                return (
                  <button
                    key={`${track.id}-${i}`}
                    onClick={() => handleTrackSelect(i)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left",
                      isActive
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isActive ? "▶" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isActive && "text-primary"
                        )}
                      >
                        {track.composer} — {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {catInfo?.emoji} {catInfo?.name} · {track.instrument}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(track.durationSeconds)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
