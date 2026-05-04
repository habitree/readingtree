"use client";

/**
 * PlaylistMiniPicker (Phase 8.B)
 *
 * playlist-sheet.tsx의 "배경음악 선택" UI(라인 472-538)를 추출.
 * RecordStartStep과 MusicChangeSheet, MusicOnlySheet에서 재사용.
 *
 * - "음악 없이" 옵션을 첫 셀에 무음 아이콘으로
 * - compact 모드: 장르 탭 제거, 8개 플레이리스트 횡스크롤
 * - 책·시간·즐겨찾기 입력 없음 — 플레이리스트 선택만
 */

import { useMemo, useState } from "react";
import { Music2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlaylists, getThemeGroups } from "@/lib/music";

interface Props {
  value: string | null;
  onChange: (playlistId: string | null) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function PlaylistMiniPicker({ value, onChange, compact, disabled }: Props) {
  const playlists = getPlaylists();
  const themeGroups = getThemeGroups();

  // 현재 선택된 플레이리스트가 속한 장르 자동 감지 (NULL일 땐 첫 그룹)
  const detectedGenre = useMemo(() => {
    if (value) {
      const group = themeGroups.find((g) => g.playlists.includes(value));
      if (group) return group.id;
    }
    return themeGroups[0]?.id ?? null;
  }, [value, themeGroups]);

  const [selectedGenre, setSelectedGenre] = useState(detectedGenre);

  const genrePlaylists = useMemo(() => {
    if (!selectedGenre) return playlists;
    const group = themeGroups.find((g) => g.id === selectedGenre);
    if (!group) return playlists;
    return group.playlists
      .map((pid) => playlists.find((p) => p.id === pid))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [selectedGenre, themeGroups, playlists]);

  const isMute = value === null;

  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2 px-0.5">
        <Music2 className="w-3 h-3" />
        배경음악
      </span>

      {/* 장르 탭 (compact 모드는 숨김) */}
      {!compact && themeGroups.length > 1 && (
        <div className="flex gap-1.5 mb-2.5">
          {themeGroups.map((group) => {
            const isActive = selectedGenre === group.id;
            return (
              <button
                key={group.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedGenre(group.id);
                  // 새 장르의 플레이리스트가 현재 선택과 다르면 첫 항목으로 자동 전환
                  if (value && !group.playlists.includes(value)) {
                    onChange(group.playlists[0]);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
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

      {/* 그리드: 첫 셀 = "음악 없이", 나머지 = 플레이리스트 */}
      <div
        className={cn(
          "grid gap-1.5",
          compact
            ? "grid-cols-3 sm:grid-cols-4"
            : genrePlaylists.length >= 3
              ? "grid-cols-4"
              : "grid-cols-3",
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2.5 px-1.5 rounded-xl text-center transition-all",
            isMute
              ? "bg-slate-100 ring-1 ring-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              : "bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
          aria-pressed={isMute}
        >
          <VolumeX className="h-4 w-4" />
          <span className="text-[10px] font-semibold leading-tight">음악 없이</span>
        </button>

        {genrePlaylists.map((pl) => {
          const isSelected = value === pl.id;
          return (
            <button
              key={pl.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pl.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 px-1.5 rounded-xl text-center transition-all",
                isSelected
                  ? "bg-primary/10 ring-1 ring-primary/30 text-primary"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted",
              )}
              aria-pressed={isSelected}
            >
              <span className="text-lg">{pl.emoji}</span>
              <span className="text-[10px] font-semibold leading-tight">{pl.name}</span>
              <span className="text-[9px] opacity-60">{pl.trackIds.length}곡</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
