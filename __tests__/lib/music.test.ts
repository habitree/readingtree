import { describe, expect, it } from "vitest";

import { AMBIENCE_GENRES, MUSIC_GENRES, getGenreById } from "@/lib/music";

/**
 * 곡 데이터 무결성 (개별 곡 재생 — 2026-07-24)
 *
 * 병합 스트림을 폐기하고 곡=파일 구조로 전환했다. 곡 겹침·끊김의 근본 원인이던
 * 타임라인 seek/파트 경계 매칭이 사라졌으므로, 회귀 검증 대상도 "곡 데이터가
 * 런타임에서 안전하게 재생 가능한 형태인지"로 바뀐다.
 *
 * 2026-07-31: 활기찬 클래식을 클래식으로 통합(3채널), 백색소음 4채널 추가.
 */
describe("music genre data", () => {
  it("음악 3채널 + 백색소음 4채널이 모두 존재한다", () => {
    expect(MUSIC_GENRES.map((g) => g.id).sort()).toEqual([
      "classic",
      "fire",
      "forest",
      "jazz",
      "piano",
      "rain",
      "waves",
    ]);
  });

  it("활기찬 클래식 곡들이 클래식 채널에 통합되었다", () => {
    const classic = getGenreById("classic");
    const titles = classic?.tracks.map((t) => t.title) ?? [];
    expect(titles).toContain("보칼리제"); // 기존 클래식
    expect(titles).toContain("터키 행진곡"); // 기존 활기찬 클래식
    expect(classic?.tracks.length).toBe(38); // 24 + 14
  });

  it("재즈 중복 음원(Dreamy Jazz = Groovy Jazz)이 제거되어 34곡이다", () => {
    const jazz = getGenreById("jazz");
    const titles = jazz?.tracks.map((t) => t.title) ?? [];
    expect(titles).toContain("Groovy Jazz");
    expect(titles).not.toContain("Dreamy Jazz");
    expect(jazz?.tracks.length).toBe(34);
  });

  it("백색소음 채널은 ambience 플래그와 단일 곡을 가진다", () => {
    expect(AMBIENCE_GENRES.map((g) => g.id).sort()).toEqual([
      "fire",
      "forest",
      "rain",
      "waves",
    ]);
    for (const g of AMBIENCE_GENRES) {
      expect(g.ambience).toBe(true);
      expect(g.tracks.length).toBe(1);
    }
  });

  it("음악 채널에는 ambience 플래그가 없다", () => {
    for (const id of ["piano", "classic", "jazz"] as const) {
      expect(getGenreById(id)?.ambience).toBeFalsy();
    }
  });

  it("getGenreById 로 채널을 조회할 수 있다", () => {
    expect(getGenreById("piano")?.name).toBe("피아노");
    expect(getGenreById("rain")?.name).toBe("빗소리");
    expect(getGenreById("nope")).toBeUndefined();
  });

  describe.each(MUSIC_GENRES.map((g) => [g.id, g] as const))("%s", (_id, genre) => {
    it("곡이 하나 이상 있다", () => {
      expect(genre.tracks.length).toBeGreaterThan(0);
    });

    it("모든 곡이 유효한 필드를 가진다", () => {
      const bad = genre.tracks.filter(
        (t) =>
          !t.title ||
          !t.composer ||
          !/^\/music\/.+\.mp3$/.test(t.url) ||
          !(t.duration > 0),
      );
      expect(bad).toEqual([]);
    });

    it("곡 파일 URL 이 채널 내에서 유일하다", () => {
      const urls = genre.tracks.map((t) => t.url);
      expect(new Set(urls).size).toBe(urls.length);
    });
  });

  it("전체 곡 파일 URL 이 전 채널에서 유일하다(파일명 충돌 없음)", () => {
    const urls = MUSIC_GENRES.flatMap((g) => g.tracks.map((t) => t.url));
    expect(new Set(urls).size).toBe(urls.length);
  });
});
