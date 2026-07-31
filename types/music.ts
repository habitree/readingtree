/**
 * 음악 타입 (개별 곡 재생 — 병합 스트림 폐기, 2026-07-24)
 *
 * 음악 채널(피아노/클래식/재즈)마다 곡을 **개별 파일**로 둔다.
 * 런타임은 셔플 큐 순서대로 곡(=파일) 단위로 이중 버퍼 전환하며 재생한다 —
 * 곡 하나가 독립 파일이므로 "파일상 다음 곡" 이 없어 곡 겹침이 원천 불가능하다.
 *
 * 백색소음 채널(빗소리/숲속/파도/모닥불)은 채널당 1곡을 같은 셔플 큐 메커니즘으로
 * 반복 재생한다(곡 끝 크로스페이드 가공으로 경계가 매끄럽다). — 2026-07-31
 */

/** 한 곡 = 하나의 오디오 파일 */
export interface MusicTrack {
  title: string;
  composer: string;
  /** 곡 파일 공개 URL (public: /music/<파일명>.mp3) */
  url: string;
  /** 곡 길이(초) */
  duration: number;
}

/** 음악 채널(장르) */
export interface MusicGenre {
  id: "piano" | "classic" | "jazz" | "rain" | "forest" | "waves" | "fire";
  name: string;
  emoji: string;
  /** 백색소음 채널 — 채널당 1곡 반복, UI 에서 음악과 구분 표시 */
  ambience?: boolean;
  /** 곡 목록(재생 순서 — 런타임에서 셔플) */
  tracks: MusicTrack[];
}
