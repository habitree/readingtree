"use client";

/**
 * MusicChangeSheet (Phase 8.C)
 *
 * 진행 중 세션의 음악을 변경하거나 추가/정지.
 * ActivePill의 ⋯ 메뉴에서 진입.
 *
 * - autoplay 정책 회피: 사용자가 새 플레이리스트를 클릭하면 동기 직후 audio.play()
 * - 서버 액션 attachMusicToSession 호출 → DB music_playlist_id 갱신
 * - zustand는 audio 재생 후 동기화 (UI만)
 */

import { create } from "zustand";
import { useState, useTransition } from "react";
import { Loader2, Music2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlaylistMiniPicker } from "@/components/music/playlist-mini-picker";
import { getGlobalAudio } from "@/components/music/music-mini-player";
import { getPlaylistTracks } from "@/lib/music";
import { saveLastPlaylistId } from "@/lib/music/last-playlist";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { attachMusicToSession } from "@/app/actions/sessions";

interface MusicChangeState {
  isOpen: boolean;
  sessionId: string | null;
  initialPlaylistId: string | null;
  open: (sessionId: string, initialPlaylistId: string | null) => void;
  close: () => void;
}

export const useMusicChangeSheet = create<MusicChangeState>((set) => ({
  isOpen: false,
  sessionId: null,
  initialPlaylistId: null,
  open: (sessionId, initialPlaylistId) =>
    set({ isOpen: true, sessionId, initialPlaylistId }),
  close: () => set({ isOpen: false, sessionId: null, initialPlaylistId: null }),
}));

export function MusicChangeSheet() {
  const { isOpen, sessionId, initialPlaylistId, close } = useMusicChangeSheet();
  const [selected, setSelected] = useState<string | null>(initialPlaylistId);
  const [isPending, startTransition] = useTransition();

  // 시트 열릴 때 initialPlaylistId 동기
  if (isOpen && selected !== initialPlaylistId && !isPending) {
    // selected는 사용자 선택 후만 변경, 처음 열릴 때만 초기화
    // 단순화: 시트 닫힘 → 다음 열릴 때 initialPlaylistId 반영
  }

  const handleApply = () => {
    if (!sessionId) return;

    // (1) 음악 시작/변경 — 사용자 클릭 동기 컨텍스트
    const audio = getGlobalAudio();
    let preparedTracks: ReturnType<typeof getPlaylistTracks> = [];
    let randomStartIdx = 0;

    if (selected) {
      preparedTracks = getPlaylistTracks(selected);
      if (preparedTracks.length > 0) {
        randomStartIdx = Math.floor(Math.random() * preparedTracks.length);
        const startTrack = preparedTracks[randomStartIdx];
        if (audio && startTrack) {
          audio.src = startTrack.sourceUrl;
          audio.volume = useMusicPlayer.getState().volume;
          audio.play().catch(() => {});
        }
      }
    } else {
      // 음악 정지
      audio?.pause();
    }

    startTransition(async () => {
      try {
        const result = await attachMusicToSession({
          session_id: sessionId,
          music_playlist_id: selected,
        });

        // (2) zustand 동기화
        if (selected && preparedTracks.length > 0) {
          useMusicPlayer.getState().loadPlaylist(preparedTracks, randomStartIdx);
          useMusicPlayer.getState().play();
          saveLastPlaylistId(selected);
        } else {
          useMusicPlayer.getState().pause();
        }

        const label =
          result.action === "remove" ? "음악을 정지했어요"
            : result.action === "add" ? "음악을 추가했어요"
            : "음악을 변경했어요";
        toast.success(label);
        close();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "음악 변경에 실패했어요.");
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[80dvh] overflow-y-auto p-0 sm:max-w-lg sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-emerald-600" />
              음악 변경
            </SheetTitle>
            <SheetDescription>
              진행 중 기록에 어울리는 배경음악을 선택하세요. "음악 없이"를 누르면 정지됩니다.
            </SheetDescription>
          </SheetHeader>

          <div className="py-2">
            <PlaylistMiniPicker
              value={selected}
              onChange={setSelected}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isPending}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isPending}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              적용
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
