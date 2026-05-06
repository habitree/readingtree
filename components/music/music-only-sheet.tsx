"use client";

/**
 * MusicOnlySheet (분리 단계 B — 2026-05-05)
 *
 * 사용자 결정: 음악과 기록 완전 분리. 음악 시트는 단순 — 플레이리스트 선택 + 재생/정지만.
 *
 * 폐기된 영역 (기존 TimerSheet에서):
 *   - 책 선택 (최근 3권 책 표지)
 *   - 시간 프리셋 + 즐겨찾기 + 직접 입력
 *   - "독서 시작" 버튼 → startTimer
 * → 모두 제거. 기록 시작은 RecordSheet에서만 처리.
 */

import { useEffect, useMemo, useState } from "react";
import { Music2, Pause, Play, Shuffle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getPlaylists, getThemeGroups, getPlaylistTracks } from "@/lib/music";
import type { MusicTrack } from "@/types/music";
import { getGlobalAudio } from "./music-mini-player";

const LAST_PLAYLIST_KEY = "readingtree-last-playlist";
/** 첫 셀("전체")의 sentinel 플레이리스트 ID — 모든 큐레이션 트랙 합집합 풀 */
const ALL_PLAYLIST_ID = "all";

function loadLastPlaylist(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_PLAYLIST_KEY);
  } catch {
    return null;
  }
}

function saveLastPlaylist(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id === null) localStorage.removeItem(LAST_PLAYLIST_KEY);
    else localStorage.setItem(LAST_PLAYLIST_KEY, id);
  } catch {
    // 무음
  }
}

export function MusicOnlySheet() {
  const {
    isMusicSheetOpen,
    closeMusicSheet,
    isPlaying,
    selectedPlaylistId,
    pause,
    loadPlaylist,
    play,
  } = useMusicPlayer();

  const playlists = getPlaylists();
  const themeGroups = getThemeGroups();

  // "전체" 풀 — 모든 큐레이션 플레이리스트의 trackIds 합집합 (중복 제거)
  // 저품질 트랙(playlists.ts에서 이미 제외된 ID)은 자연스럽게 빠짐.
  const allCuratedTracks = useMemo<MusicTrack[]>(() => {
    const seen = new Set<string>();
    const merged: MusicTrack[] = [];
    for (const pl of playlists) {
      for (const t of getPlaylistTracks(pl.id)) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          merged.push(t);
        }
      }
    }
    return merged;
  }, [playlists]);

  // 첫 진입 기본값: "전체"(ALL_PLAYLIST_ID). 마지막 선택이 있으면 복원.
  const [pickedId, setPickedId] = useState<string>(
    selectedPlaylistId ?? loadLastPlaylist() ?? ALL_PLAYLIST_ID,
  );
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // 시트 열릴 때 prefill 동기
  useEffect(() => {
    if (isMusicSheetOpen) {
      setPickedId(selectedPlaylistId ?? loadLastPlaylist() ?? ALL_PLAYLIST_ID);
    }
  }, [isMusicSheetOpen, selectedPlaylistId]);

  // 첫 그룹 자동 선택 — "전체" 선택 시 첫 장르 그룹 표시
  useEffect(() => {
    if (!activeGenre && themeGroups.length > 0) {
      const detected =
        pickedId !== ALL_PLAYLIST_ID
          ? themeGroups.find((g) => g.playlists.includes(pickedId))?.id
          : undefined;
      setActiveGenre(detected ?? themeGroups[0].id);
    }
  }, [activeGenre, themeGroups, pickedId]);

  const genrePlaylists = activeGenre
    ? themeGroups
        .find((g) => g.id === activeGenre)
        ?.playlists.map((pid) => playlists.find((p) => p.id === pid))
        .filter((p): p is NonNullable<typeof p> => !!p) ?? []
    : playlists;

  const handlePlay = () => {
    // "전체" — 모든 큐레이션 플레이리스트 합집합에서 랜덤 재생
    const tracks =
      pickedId === ALL_PLAYLIST_ID ? allCuratedTracks : getPlaylistTracks(pickedId);

    if (tracks.length === 0) {
      closeMusicSheet();
      return;
    }
    const randomIdx = Math.floor(Math.random() * tracks.length);
    const startTrack = tracks[randomIdx];

    // 사용자 클릭 컨텍스트 — audio.play() 동기 호출 (autoplay 정책)
    // 볼륨 0 으로 시작 → 컴포넌트의 startFadeIn 이 트랙 변경 useEffect 에서 인계받아 페이드 인.
    const audio = getGlobalAudio();
    if (audio && startTrack) {
      audio.src = startTrack.sourceUrl;
      audio.volume = 0;
      audio.play().catch(() => {});
    }

    loadPlaylist(tracks, pickedId, randomIdx);
    play();
    saveLastPlaylist(pickedId);
    closeMusicSheet();
  };

  const handleStop = () => {
    const audio = getGlobalAudio();
    audio?.pause();
    pause();
    useMusicPlayer.getState().close();
    closeMusicSheet();
  };

  const isAllSelected = pickedId === ALL_PLAYLIST_ID;

  return (
    <Sheet open={isMusicSheetOpen} onOpenChange={(open) => (open ? null : closeMusicSheet())}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85dvh] overflow-y-auto p-0 sm:max-w-lg sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-emerald-600" />
              배경음악
            </SheetTitle>
            <SheetDescription>
              플레이리스트를 선택하고 재생하세요. 기록과는 별도로 동작합니다.
            </SheetDescription>
          </SheetHeader>

          {/* 장르 탭 */}
          {themeGroups.length > 1 && (
            <div className="mb-3 flex gap-1.5">
              {themeGroups.map((group) => {
                const isActive = activeGenre === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGenre(group.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 플레이리스트 그리드 — "전체"(랜덤 합집합) 첫 셀 + 장르별 8개 */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setPickedId(ALL_PLAYLIST_ID)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2.5 text-center transition-all",
                isAllSelected
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
            >
              <Shuffle className="h-4 w-4" />
              <span className="text-[10px] font-semibold leading-tight">전체</span>
              <span className="text-[9px] opacity-60">{allCuratedTracks.length}곡</span>
            </button>

            {genrePlaylists.map((pl) => {
              const isSelected = pickedId === pl.id;
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => setPickedId(pl.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2.5 text-center transition-all",
                    isSelected
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="text-lg">{pl.emoji}</span>
                  <span className="text-[10px] font-semibold leading-tight">{pl.name}</span>
                  <span className="text-[9px] opacity-60">{pl.trackIds.length}곡</span>
                </button>
              );
            })}
          </div>

          {/* 액션 — 재생/정지 */}
          <div className="flex gap-2 pt-2">
            {isPlaying && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStop}
                className="flex-1"
              >
                <Pause className="mr-1 h-4 w-4" />
                정지
              </Button>
            )}
            <Button
              type="button"
              onClick={handlePlay}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isAllSelected ? (
                <Shuffle className="mr-1 h-4 w-4" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              {isPlaying ? "다른 곡 재생" : isAllSelected ? "전체 랜덤 재생" : "재생"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
