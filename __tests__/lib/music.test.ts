import { describe, expect, it } from "vitest";

import { MUSIC_GENRES, findCueAt, findCueIndexAt, findPartIndexAt } from "@/lib/music";

/**
 * 회귀 방지 — 곡/파트 경계 매칭 (2026-07-15)
 *
 * genres.ts 는 start 와 duration 을 각각 ms 로 반올림해 생성하므로 start+duration 이
 * 다음 구간의 start 와 ±0.001s 어긋난다. 이를 경계로 쓰던 시절 103곡 중 15곡이 앞 곡으로,
 * 2곡이 앞 파트(=파일 끝)로 매칭되어 재생이 끊기고 곡이 겹쳤다.
 * 실데이터로 전수 검증한다 — 음원을 재빌드해도 이 성질은 유지돼야 한다.
 */
describe("music timeline lookup", () => {
  it("채널 데이터가 존재한다", () => {
    expect(MUSIC_GENRES.length).toBeGreaterThan(0);
    for (const genre of MUSIC_GENRES) {
      expect(genre.cues.length).toBeGreaterThan(0);
      expect(genre.parts.length).toBeGreaterThan(0);
    }
  });

  describe.each(MUSIC_GENRES.map((g) => [g.id, g] as const))("%s", (_id, genre) => {
    it("모든 곡의 시작점이 자기 자신으로 매칭된다", () => {
      const wrong = genre.cues
        .map((cue, i) => ({ i, title: cue.title, got: findCueIndexAt(genre.cues, cue.start) }))
        .filter((r) => r.got !== r.i);
      expect(wrong).toEqual([]);
    });

    it("모든 파트의 시작점이 자기 자신으로 매칭된다", () => {
      const wrong = genre.parts
        .map((part, i) => ({ i, got: findPartIndexAt(genre.parts, part.start) }))
        .filter((r) => r.got !== r.i);
      expect(wrong).toEqual([]);
    });

    it("모든 곡이 해석된 파트 안에서 끝까지 재생 가능하다", () => {
      // 곡 시작점이 앞 파트로 매칭되면 offset 이 파일 길이에 닿아 파일 끝으로 seek 되고,
      // 재생이 0초 만에 ended → 딥 전환 후 플레이어가 영구 정지한다.
      const truncated = genre.cues
        .map((cue) => {
          const part = genre.parts[findPartIndexAt(genre.parts, cue.start)];
          const playable = part.duration - Math.max(0, cue.start - part.start);
          return { title: cue.title, playable, needed: cue.duration };
        })
        .filter((r) => r.playable < r.needed - 0.05);
      expect(truncated).toEqual([]);
    });

    it("곡 중간 위치가 해당 곡으로 매칭된다", () => {
      for (const cue of genre.cues) {
        expect(findCueAt(genre.cues, cue.start + cue.duration / 2)?.title).toBe(cue.title);
      }
    });
  });
});
