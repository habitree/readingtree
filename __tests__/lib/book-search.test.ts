import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchBooks, transformBookItem } from "@/lib/api/book-search";

/**
 * 책 검색 소스 체인 (2026-11-18)
 *
 * 알라딘 OpenAPI 종료(2026-11-01, errorCode 999) 후 모든 검색이 Google Books 로만
 * 처리돼 한국 도서 결과·표지가 깨졌다. 카카오(키 있을 때) → 국중도 → Google Books
 * 체인과 국중도 결과 정규화·표지 보충을 고정한다.
 */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const NL_RESULT = {
  total: 86,
  result: [
    {
      titleInfo: '<span class="searching_txt">채식주의자</span> : 한강 연작소설',
      authorInfo: "지은이: 한강",
      pubInfo: "창비",
      pubYearInfo: "20220331",
      isbn: "9788936433598",
      imageUrl: "kolis_on/2014/CNTS-00069251832_thumbnail.jpg",
    },
    // 같은 책의 다른 소장 레코드 — 중복 제거 대상
    { titleInfo: "채식주의자", authorInfo: "한강", pubInfo: "파주 : 창비, 2007", pubYearInfo: "2007", isbn: "9788936433598", imageUrl: "" },
    // 표지 없음 → Google ISBN 보충 대상
    { titleInfo: "역행자", authorInfo: "자청[1987-] 지은이", pubInfo: "파주 : 웅진씽크빅, 2023", pubYearInfo: "2023", isbn: "9788901272634", imageUrl: "" },
    // 표지 없음 + Google 에도 없음 → 빈 표지 유지
    { titleInfo: "불편한 편의점", authorInfo: "하워드 F. 리먼 지음;김이숙 옮김", pubInfo: "허밍버드 : 백도씨", pubYearInfo: "2022", isbn: "9791161571355", imageUrl: "" },
    // 역할어 없이 콜론만 앞에 붙은 표기
    { titleInfo: "2026 K-consumer trend insights", authorInfo: ": Rando Kim, Miyoung Jeon", pubInfo: "미래의창", pubYearInfo: "2025", isbn: "9791124073018", imageUrl: "kolis/2025/a.jpg" },
  ],
};

describe("searchBooks 소스 체인", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NL_SEOJI_CERT_KEY", "nl-key");
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("카카오 키가 없으면 국중도 결과를 정규화·중복제거하고 빠진 표지를 Google ISBN 으로 보충한다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("nl.go.kr")) return json(NL_RESULT);
      if (url.includes("contents.kyobobook.co.kr")) return new Response(null, { status: 404 });
      if (url.includes("isbn%3A9788901272634")) {
        return json({ items: [{ volumeInfo: { imageLinks: { thumbnail: "http://books.google.com/books/content?id=x&zoom=1&edge=curl&source=gbs_api" } } }] });
      }
      if (url.includes("googleapis.com")) return json({ totalItems: 0 });
      throw new Error(`unexpected ${url}`);
    });

    const res = await searchBooks({ query: "채식주의자" });

    expect(res.source).toBe("nl");
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("kakao"))).toBe(false);
    expect(res.items.map((i) => i.isbn)).toEqual(["9788936433598", "9788901272634", "9791161571355", "9791124073018"]);

    const [first, second, third, fourth] = res.items.map(transformBookItem);
    expect(fourth.author).toBe("Rando Kim, Miyoung Jeon");
    expect(first).toMatchObject({
      title: "채식주의자 : 한강 연작소설",
      author: "한강",
      publisher: "창비",
      published_date: "2022-03-31",
      cover_image_url: "https://cover.nl.go.kr/kolis_on/2014/CNTS-00069251832_thumbnail.jpg",
    });
    expect(second).toMatchObject({
      author: "자청",
      publisher: "웅진씽크빅",
      published_date: null, // 연도만 있는 값은 일자로 지어내지 않는다
      cover_image_url: "https://books.google.com/books/content?id=x&zoom=1&source=gbs_api",
    });
    expect(third).toMatchObject({ author: "하워드 F. 리먼", publisher: "허밍버드 : 백도씨", cover_image_url: null });
  });

  it("소장자료에 아직 없는 신간은 서지 API 의 종이책(제목이 검색어로 시작)으로 보충한다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("seoji/SearchApi")) {
        return json({
          docs: [
            { TITLE: "트렌드 코리아 2027", AUTHOR: "저자 : 김난도;낭독자 : 문형진;", PUBLISHER: "미래의창 주식회사", EA_ISBN: "9791124073513", FORM: "오디오북", PUBLISH_PREDATE: "20261030" },
            { TITLE: "트렌드 코리아 2027", AUTHOR: "지은이: 김난도,전미영", PUBLISHER: "미래의창", EA_ISBN: "9791124073483", FORM: "종이책", REAL_PUBLISH_DATE: "20260930", PUBLISH_PREDATE: "20260930" },
            { TITLE: "아포리아 공통국어 트렌드 코리아 2027 A형", AUTHOR: "저자 : 아포리아에듀", PUBLISHER: "아포리아에듀", EA_ISBN: "9791177068580", FORM: "종이책", PUBLISH_PREDATE: "20261001" },
          ],
        });
      }
      if (url.includes("nl.go.kr")) return json({ total: 0, result: [] });
      return json({ totalItems: 0 });
    });

    const res = await searchBooks({ query: "트렌드코리아 2027" });
    expect(res.source).toBe("nl");
    expect(res.items.map(transformBookItem)).toEqual([
      expect.objectContaining({ isbn: "9791124073483", title: "트렌드 코리아 2027", author: "김난도,전미영", publisher: "미래의창", published_date: "2026-09-30" }),
    ]);
  });

  it("Google Books 에 표지가 없으면 교보문고 ISBN 표지로 보충하고, 교보에도 없으면 비워 둔다", async () => {
    const kyoboHeads: string[] = [];
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("contents.kyobobook.co.kr")) {
        kyoboHeads.push(`${init?.method} ${url}`);
        // 9791124073483(트렌드 코리아 2027)만 교보에 표지가 있다
        return url.includes("9791124073483") ? json({}) : new Response(null, { status: 404 });
      }
      if (url.includes("nl.go.kr/NL/search")) {
        return json({
          total: 2,
          result: [
            { titleInfo: "트렌드 코리아 2027", authorInfo: "지은이: 김난도", pubInfo: "미래의창", pubYearInfo: "20260930", isbn: "9791124073483", imageUrl: "" },
            { titleInfo: "표지 없는 책", authorInfo: "아무개", pubInfo: "아무출판사", pubYearInfo: "2026", isbn: "9791111111117", imageUrl: "" },
          ],
        });
      }
      if (url.includes("seoji/SearchApi")) return json({ docs: [] });
      return json({ totalItems: 0 }); // Google Books: 표지 없음
    });

    const res = await searchBooks({ query: "트렌드 코리아" });
    const [withCover, withoutCover] = res.items.map(transformBookItem);
    expect(withCover.cover_image_url).toBe("https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/9791124073483.jpg");
    expect(withoutCover.cover_image_url).toBeNull();
    // 존재 확인은 대체 이미지를 주지 않는 원본 경로로, HEAD 로만 한다
    expect(kyoboHeads).toEqual([
      "HEAD https://contents.kyobobook.co.kr/pdt/9791124073483.jpg",
      "HEAD https://contents.kyobobook.co.kr/pdt/9791111111117.jpg",
    ]);
  });

  it("서지 API 는 종이책만, 출간일 역순으로, UI 요청 건수와 무관하게 넓게 받는다", async () => {
    // 상위어("트렌드 코리아")로 검색해도 신간이 응답 창 안에 들어오게 하는 조건이다.
    let seojiUrl = "";
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("seoji/SearchApi")) {
        seojiUrl = url;
        return json({ docs: [] });
      }
      if (url.includes("nl.go.kr")) return json({ total: 0, result: [] });
      return json({ totalItems: 0 });
    });

    await searchBooks({ query: "트렌드 코리아", display: 10 });

    const params = new URL(seojiUrl).searchParams;
    expect(params.get("title")).toBe("트렌드 코리아");
    expect(params.get("form")).toBe("종이책");
    expect(params.get("sort")).toBe("PUBLISH_PREDATE");
    expect(params.get("order_by")).toBe("DESC");
    expect(params.get("page_size")).toBe("50");
  });

  it("카카오 키가 있으면 카카오를 1순위로 쓴다", async () => {
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-key");
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      expect(url).toContain("dapi.kakao.com");
      expect(new Headers(init?.headers).get("Authorization")).toBe("KakaoAK kakao-key");
      return json({
        meta: { total_count: 1 },
        documents: [{ title: "채식주의자", authors: ["한강"], publisher: "창비", isbn: "8936433598 9788936433598", datetime: "2007-10-30T00:00:00.000+09:00", thumbnail: "https://search1.kakaocdn.net/thumb/x.jpg", contents: "..." }],
      });
    });

    const res = await searchBooks({ query: "채식주의자" });
    expect(res.source).toBe("kakao");
    expect(transformBookItem(res.items[0])).toMatchObject({
      isbn: "9788936433598",
      published_date: "2007-10-30",
      cover_image_url: "https://search1.kakaocdn.net/thumb/x.jpg",
    });
  });

  it("국중도가 0건이면 Google Books 로 폴백한다", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("nl.go.kr")) return json({ total: 0, result: [] });
      return json({ totalItems: 1, items: [{ volumeInfo: { title: "Atomic Habits", authors: ["James Clear"], industryIdentifiers: [{ type: "ISBN_13", identifier: "9780735211292" }] } }] });
    });

    const res = await searchBooks({ query: "atomic habits" });
    expect(res.source).toBe("google_books");
    expect(res.items[0].title).toBe("Atomic Habits");
  });

  it("시도한 소스가 모두 장애면 결과 없음이 아니라 에러를 던진다", async () => {
    fetchMock.mockResolvedValue(json({}, 500));
    await expect(searchBooks({ query: "채식주의자" })).rejects.toThrow("일시적인 문제");
  });
});
