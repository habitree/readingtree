/**
 * 마지막 선택 플레이리스트 localStorage 헬퍼 (Phase 8.B)
 *
 * playlist-sheet.tsx의 LAST_PLAYLIST_KEY 로직을 추출.
 * RecordStartStep와 MusicOnlySheet 모두에서 재사용.
 */

const LAST_PLAYLIST_KEY = "readingtree-last-playlist";

/** 마지막 선택 플레이리스트 ID (없으면 NULL — 음악 없이 시작이 기본) */
export function loadLastPlaylistId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_PLAYLIST_KEY);
  } catch {
    return null;
  }
}

/** 마지막 선택 플레이리스트 ID 저장 (NULL이면 키 제거) */
export function saveLastPlaylistId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id === null) {
      localStorage.removeItem(LAST_PLAYLIST_KEY);
    } else {
      localStorage.setItem(LAST_PLAYLIST_KEY, id);
    }
  } catch {
    // localStorage 차단 환경 — 무음
  }
}
