import { describe, it, expect, beforeEach, vi } from "vitest";

// useRecordSheet 훅은 React effect 의존성이 있지만, 본 테스트는 store 동작만 검증.
// store는 zustand 단순 상태 — 환경 의존성 없음.

vi.mock("@/app/actions/books", () => ({
  getContinueReadingBooks: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("@/hooks/use-reading-session", () => ({
  useReadingSession: () => ({ session: null, elapsedSeconds: 0, broadcastEnd: vi.fn(), refresh: vi.fn(), isLoading: false }),
}));

import { useRecordSheetStore } from "@/hooks/use-record-sheet";

describe("useRecordSheetStore — 모드 전환", () => {
  beforeEach(() => {
    useRecordSheetStore.getState().reset();
  });

  it("초기 상태는 닫힘 + start 모드", () => {
    const s = useRecordSheetStore.getState();
    expect(s.isOpen).toBe(false);
    expect(s.mode).toBe("start");
    expect(s.targetSessionId).toBeNull();
    expect(s.selectedBook).toBeNull();
  });

  it("openStart는 책·시간·시작페이지 prefill을 반영", () => {
    const book = {
      id: "ub1",
      bookId: "b1",
      title: "테스트 책",
      author: "저자",
      coverImageUrl: null,
      totalPages: 200,
    };
    useRecordSheetStore.getState().openStart({
      book,
      targetSeconds: 1500,
      startPage: 42,
    });
    const s = useRecordSheetStore.getState();
    expect(s.isOpen).toBe(true);
    expect(s.mode).toBe("start");
    expect(s.selectedBook).toEqual(book);
    expect(s.prefillTargetSeconds).toBe(1500);
    expect(s.prefillStartPage).toBe(42);
    expect(s.targetSessionId).toBeNull();
  });

  it("openEnd는 sessionId와 endPage prefill 반영", () => {
    useRecordSheetStore.getState().openEnd("sess-1", { endPage: 150 });
    const s = useRecordSheetStore.getState();
    expect(s.isOpen).toBe(true);
    expect(s.mode).toBe("end");
    expect(s.targetSessionId).toBe("sess-1");
    expect(s.prefillEndPage).toBe(150);
  });

  it("openDetail은 sessionId 옵셔널 — null이면 자유 상세 (D3)", () => {
    useRecordSheetStore.getState().openDetail(null);
    const s1 = useRecordSheetStore.getState();
    expect(s1.mode).toBe("detail");
    expect(s1.targetSessionId).toBeNull();

    useRecordSheetStore.getState().openDetail("sess-2");
    const s2 = useRecordSheetStore.getState();
    expect(s2.targetSessionId).toBe("sess-2");
  });

  it("close는 isOpen만 false로 (selectedBook 유지)", () => {
    const book = { id: "ub1", bookId: "b1", title: "T", author: null, coverImageUrl: null, totalPages: null };
    useRecordSheetStore.getState().openStart({ book });
    useRecordSheetStore.getState().close();
    const s = useRecordSheetStore.getState();
    expect(s.isOpen).toBe(false);
    expect(s.selectedBook).toEqual(book);
  });

  it("reset은 모든 상태 초기화", () => {
    useRecordSheetStore.getState().openEnd("sess-x", {
      book: { id: "ub1", bookId: "b1", title: "T", author: null, coverImageUrl: null, totalPages: null },
      endPage: 100,
    });
    useRecordSheetStore.getState().reset();
    const s = useRecordSheetStore.getState();
    expect(s.isOpen).toBe(false);
    expect(s.mode).toBe("start");
    expect(s.targetSessionId).toBeNull();
    expect(s.selectedBook).toBeNull();
    expect(s.prefillEndPage).toBeNull();
  });
});
