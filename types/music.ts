/**
 * 음악 타입 (병합 + 파트 분할 재구성 — 2026-06-08)
 *
 * 장르(클래식/재즈)별로 "연속된 하나의 스트림"을 곡 경계 기준 ≤45MB 파트로 분할.
 * 런타임은 파트를 이중 버퍼로 끊김 없이 이어 붙여 단일 음원처럼 재생한다.
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

/** 음악 장르 */
export interface MusicGenre {
  id: "classic" | "jazz";
  name: string;
  emoji: string;
  /** 전체 길이(초) */
  durationSeconds: number;
  /** 곡 경계 목록(재생 순서, 장르 전체 타임라인) */
  cues: MusicCue[];
  /** 분할 파트 목록(재생 순서) */
  parts: MusicPart[];
}
