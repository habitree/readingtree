"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getTrackMoodLabel } from "@/lib/music";
import { Music2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackListSheet() {
  const {
    isTrackListOpen,
    closeTrackList,
    playlist,
    currentTrack,
    currentIndex,
    selectTrack,
  } = useMusicPlayer();

  function handleSelect(index: number) {
    selectTrack(index);
    closeTrackList();
  }

  return (
    <Sheet
      open={isTrackListOpen}
      onOpenChange={(open) => !open && closeTrackList()}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pt-3 pb-6 flex flex-col max-h-[70vh]"
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-3">
          <SheetTitle className="text-base text-center flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4" />
            재생 목록
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-center">
            {playlist.length}곡 ·{" "}
            {Math.floor(
              playlist.reduce((s, t) => s + t.durationSeconds, 0) / 60
            )}
            분
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-1">
          {playlist.map((track, i) => {
            const isActive = i === currentIndex;
            const moodLabel = getTrackMoodLabel(track);

            return (
              <button
                key={`${track.id}-${i}`}
                onClick={() => handleSelect(i)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left",
                  isActive
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                {/* 번호 / 재생 중 표시 */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isActive ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>

                {/* 곡 정보 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive && "text-primary"
                    )}
                  >
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

                {/* 시간 */}
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
