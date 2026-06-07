"use client";

/**
 * (main) 레이아웃에 always-mount되던 시트/모달 5종을 lazy mount로 전환.
 *
 * 효과:
 *   - 모든 (main) 페이지 초기 JS 번들에서 RecordSheet/StampCaptureSheet/CommandPalette/
 *     MusicMiniPlayer/UpgradeModal 청크 제외 → 모바일 셀룰러 진입 시 파싱 시간 단축.
 *   - 각 컴포넌트는 사용자 인터랙션 시점(스토어 open / 단축키)에만 청크 fetch.
 *
 * 트레이드오프:
 *   - 첫 트리거 시 청크 fetch+파싱 ~100~300ms 지연 1회. 이후는 캐시되어 즉시.
 *   - 음악 자동 재생 복원 등 첫 진입 시 미니 플레이어 표시는 청크 로드 후로 미뤄짐.
 *     단, 자동 재생을 트리거하는 store 자체는 즉시 살아있으므로 음원 재생은 정상 시작됨.
 *
 * 단축키 처리:
 *   CommandPalette는 Cmd+K 단축키 핸들러를 컴포넌트 내부에 가지고 있는데, 그 컴포넌트가
 *   lazy면 단축키도 청크 로드 후에만 동작 → 첫 Cmd+K 입력이 무시될 수 있음.
 *   이를 막기 위해 wrapper에서 단축키만 직접 처리하고, 트리거되면 그 시점에 mount.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRecordSheetStore } from "@/hooks/use-record-sheet";
import { useStampCaptureStore } from "@/hooks/use-stamp-capture";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useStampShareStore } from "@/hooks/use-stamp-share";
import { useRecapShareStore } from "@/hooks/use-recap-share";

const RecordSheet = dynamic(
  () => import("@/components/records/record-sheet").then((m) => ({ default: m.RecordSheet })),
  { ssr: false },
);

const StampCaptureSheet = dynamic(
  () =>
    import("@/components/stamps/stamp-capture-sheet").then((m) => ({
      default: m.StampCaptureSheet,
    })),
  { ssr: false },
);

const MusicMiniPlayer = dynamic(
  () =>
    import("@/components/music/music-mini-player").then((m) => ({
      default: m.MusicMiniPlayer,
    })),
  { ssr: false },
);

const CommandPalette = dynamic(
  () =>
    import("@/components/search/command-palette").then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false },
);

const UpgradeModal = dynamic(
  () =>
    import("@/components/subscription/upgrade-modal").then((m) => ({
      default: m.UpgradeModal,
    })),
  { ssr: false },
);

const StampShareDialog = dynamic(
  () =>
    import("@/components/stamps/stamp-share-dialog").then((m) => ({
      default: m.StampShareDialog,
    })),
  { ssr: false },
);

const RecapShareDialog = dynamic(
  () =>
    import("@/components/recap/recap-share-dialog").then((m) => ({
      default: m.RecapShareDialog,
    })),
  { ssr: false },
);

export function LazyOverlays() {
  // 각 store의 open/active 상태 구독.
  // "한 번이라도 active였던 적이 있으면 mount 유지" 패턴 — render 중 setState로 latch 처리.
  // (React 19 권장: "Adjusting state during render". 같은 렌더 안에서 즉시 반영.)
  const recordOpen = useRecordSheetStore((s) => s.isOpen);
  const stampOpen = useStampCaptureStore((s) => s.isOpen);
  const musicEverActive = useMusicPlayer(
    (s) => s.isPlaying || s.isMusicSheetOpen,
  );
  const upgradeOpen = useUpgradeModal((s) => s.open);
  const stampShareOpen = useStampShareStore((s) => s.isOpen);
  const recapShareOpen = useRecapShareStore((s) => s.isOpen);

  const [recordSeen, setRecordSeen] = useState(false);
  const [stampSeen, setStampSeen] = useState(false);
  const [musicSeen, setMusicSeen] = useState(false);
  const [upgradeSeen, setUpgradeSeen] = useState(false);
  const [stampShareSeen, setStampShareSeen] = useState(false);
  const [recapShareSeen, setRecapShareSeen] = useState(false);
  if (recordOpen && !recordSeen) setRecordSeen(true);
  if (stampOpen && !stampSeen) setStampSeen(true);
  if (musicEverActive && !musicSeen) setMusicSeen(true);
  if (upgradeOpen && !upgradeSeen) setUpgradeSeen(true);
  if (stampShareOpen && !stampShareSeen) setStampShareSeen(true);
  if (recapShareOpen && !recapShareSeen) setRecapShareSeen(true);

  // CommandPalette 단축키 — 본체는 lazy지만 단축키는 layout에 항상 살아있어야 함.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSeen, setPaletteSeen] = useState(false);
  if (paletteOpen && !paletteSeen) setPaletteSeen(true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {recordSeen && <RecordSheet />}
      {stampSeen && <StampCaptureSheet />}
      {musicSeen && <MusicMiniPlayer />}
      {paletteSeen && (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
      {upgradeSeen && <UpgradeModal />}
      {stampShareSeen && <StampShareDialog />}
      {recapShareSeen && <RecapShareDialog />}
    </>
  );
}
