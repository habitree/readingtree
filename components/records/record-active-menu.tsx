"use client";

/**
 * RecordActiveMenu (Phase 8.C)
 *
 * 진행 중 세션 인디케이터의 ⋯ 메뉴 — 종료 / 음악 변경 / 음악 정지.
 * D7 결정에 따라 Pill 옆 별도 ⋯ 버튼으로 트리거.
 */

import { MoreHorizontal, Music2, MusicIcon, Square, VolumeX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ReadingLogActive } from "@/types/progress";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { useMusicChangeSheet } from "./music-change-sheet";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { getGlobalAudio } from "@/components/music/music-mini-player";
import { attachMusicToSession } from "@/app/actions/sessions";
import { toast } from "sonner";

interface Props {
  session: ReadingLogActive;
  className?: string;
}

export function RecordActiveMenu({ session, className }: Props) {
  const openEnd = useRecordSheetStore((s) => s.openEnd);
  const openMusicChange = useMusicChangeSheet((s) => s.open);
  const hasMusic = !!session.music_playlist_id;

  const handleEnd = () => {
    const book: RecordSheetBook | null = session.book
      ? {
          id: session.user_book_id,
          bookId: session.book.id,
          title: session.book.title,
          author: session.book.author,
          coverImageUrl: session.book.cover_image_url,
          totalPages: session.book.total_pages,
        }
      : null;
    openEnd(session.id, { book });
  };

  const handleMusicChange = () => {
    openMusicChange(session.id, session.music_playlist_id ?? null);
  };

  const handleMusicStop = async () => {
    const audio = getGlobalAudio();
    audio?.pause();
    useMusicPlayer.getState().pause();
    try {
      await attachMusicToSession({
        session_id: session.id,
        music_playlist_id: null,
      });
      toast.success("음악을 정지했어요. 기록은 계속됩니다.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "음악 정지에 실패했어요.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="기록 메뉴"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-300",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={handleEnd} className="cursor-pointer">
          <Square className="mr-2 h-4 w-4" />
          기록 종료
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleMusicChange} className="cursor-pointer">
          {hasMusic ? (
            <>
              <Music2 className="mr-2 h-4 w-4" />
              음악 변경
            </>
          ) : (
            <>
              <MusicIcon className="mr-2 h-4 w-4" />
              음악 추가
            </>
          )}
        </DropdownMenuItem>
        {hasMusic && (
          <DropdownMenuItem onSelect={handleMusicStop} className="cursor-pointer">
            <VolumeX className="mr-2 h-4 w-4" />
            음악 정지
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
