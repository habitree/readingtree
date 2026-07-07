/**
 * 음악 타입 (4채널 + 셔플 재생 개편 — 2026-07-07)
 *
 * 채널(피아노/클래식/활기찬 클래식/재즈)별로 "연속된 하나의 스트림"을
 * 곡 경계 기준 ≤45MB 파트로 분할. 런타임은 셔플 큐 순서대로 곡(큐) 단위로
 * 이중 버퍼 전환하며 재생한다 — 들을 때마다 순서가 다르다.
 */

/** 장르 전체 타임라인 내 한 곡의 경계 정보 */
export interface MusicCue {
  title: string;
  composer: string;
  /** 장르 전체 기준 시작 위치(초) */
  start: number;
  /** 곡 길이(초) */
  duration: number;
}

/** 분할된 음원 파트 (장르 전체 스트림의 연속 구간) */
export interface MusicPart {
  /** 파트 MP3 공개 URL */
  url: string;
  /** 장르 전체 기준 이 파트의 시작 위치(초) */
  start: number;
  /** 파트 길이(초) */
  duration: number;
}

/** 음악 채널(장르) */
export interface MusicGenre {
  id: "piano" | "classic" | "energetic" | "jazz";
  name: string;
  emoji: string;
  /** 전체 길이(초) */
  durationSeconds: number;
  /** 곡 경계 목록(재생 순서, 장르 전체 타임라인) */
  cues: MusicCue[];
  /** 분할 파트 목록(재생 순서) */
  parts: MusicPart[];
}
