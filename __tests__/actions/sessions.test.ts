import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted: import 평가 시점에 sessions.ts가 mock factory를 호출하므로
// mockSupabase 인스턴스를 hoist 시점에 초기화해야 함 (TDZ 회피).
const { mockSupabase, mockEarnPoints } = vi.hoisted(() => {
  const chainMethods: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  const client = {
    from: vi.fn().mockReturnValue(chainMethods),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    _chain: chainMethods,
  };
  return {
    mockSupabase: client,
    mockEarnPoints: vi.fn().mockResolvedValue({ success: true, points_earned: 10, new_total: 100 }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
  createAdminSupabaseClient: vi.fn().mockReturnValue(mockSupabase),
}));

vi.mock("@/app/actions/points", () => ({
  earnPoints: mockEarnPoints,
}));

vi.mock("@/app/actions/books/progress", () => ({
  updateBookProgress: vi.fn().mockResolvedValue({ reachedEnd: false }),
}));

vi.mock("@/app/actions/progress", () => ({
  getLastEndPage: vi.fn().mockResolvedValue(42),
}));

import {
  startReadingSession,
  endReadingSession,
  cancelActiveSession,
  addNoteToSession,
} from "@/app/actions/sessions";

// 테스트에서 호출 검증할 때 사용
const earnPoints = mockEarnPoints;

const VALID_UUID_USER_BOOK = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_SESSION = "22222222-2222-4222-8222-222222222222";
const VALID_UUID_CLIENT = "33333333-3333-4333-8333-333333333333";

const RESET_AUTH = () => {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@test.com" } },
    error: null,
  });
};

describe("startReadingSession — 멱등성 (client_session_id)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RESET_AUTH();
  });

  it("동일 client_session_id 재호출 시 isResumed=true 반환 (DB INSERT 없음)", async () => {
    // (A) 멱등 조회: 기존 세션 발견
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_UUID_SESSION, started_at: "2026-05-04T10:00:00Z" },
      error: null,
    });

    const result = await startReadingSession({
      user_book_id: VALID_UUID_USER_BOOK,
      client_session_id: VALID_UUID_CLIENT,
    });

    expect(result.isResumed).toBe(true);
    expect(result.sessionId).toBe(VALID_UUID_SESSION);
    // INSERT가 호출되지 않아야 함 (멱등 단축경로)
    expect(mockSupabase._chain.insert).not.toHaveBeenCalled();
  });

  it("client_session_id 형식 오류 시 명확한 에러", async () => {
    await expect(
      startReadingSession({
        user_book_id: VALID_UUID_USER_BOOK,
        client_session_id: "not-a-uuid",
      }),
    ).rejects.toThrow("유효하지 않은 세션 키");
  });
});

describe("startReadingSession — D2 동시 세션 1개 강제", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RESET_AUTH();
  });

  it("이미 진행 중 세션 있을 때 unique 위반 → 명확한 에러", async () => {
    // (A) client_session_id 없이 호출 (멱등 분기 skip)
    // (B) user_books 소유 확인 통과
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_UUID_USER_BOOK },
      error: null,
    });

    // (C) INSERT가 unique violation (23505) 반환
    mockSupabase._chain.single.mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "unique constraint idx_reading_logs_one_active" },
    });

    await expect(
      startReadingSession({ user_book_id: VALID_UUID_USER_BOOK }),
    ).rejects.toThrow("이미 진행 중인 기록이 있습니다");
  });
});

describe("endReadingSession — 입력 검증·포인트 적립 1회", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RESET_AUTH();
  });

  it("session_id가 UUID 아니면 거부", async () => {
    await expect(
      endReadingSession({ session_id: "bad", end_page: 10 }),
    ).rejects.toThrow("유효하지 않은 세션 ID");
  });

  it("end_page 음수 거부", async () => {
    await expect(
      endReadingSession({ session_id: VALID_UUID_SESSION, end_page: -1 }),
    ).rejects.toThrow("페이지 번호는 0 이상");
  });

  it("memo 200자 초과 거부", async () => {
    await expect(
      endReadingSession({
        session_id: VALID_UUID_SESSION,
        end_page: 10,
        memo: "a".repeat(201),
      }),
    ).rejects.toThrow("메모는 200자 이하");
  });

  it("image_urls 6장 초과 거부", async () => {
    await expect(
      endReadingSession({
        session_id: VALID_UUID_SESSION,
        end_page: 10,
        image_urls: Array.from({ length: 6 }, (_, i) => `https://x/${i}.jpg`),
      }),
    ).rejects.toThrow("사진은 5장까지");
  });

  it("진행 중 세션 종료 시 earnPoints가 정확히 1회 호출됨 (D4)", async () => {
    // (A) 세션 조회: in_progress
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: VALID_UUID_SESSION,
        user_id: "user-1",
        user_book_id: VALID_UUID_USER_BOOK,
        started_at: new Date(Date.now() - 60_000).toISOString(),
        start_page: 100,
        status: "in_progress",
      },
      error: null,
    });

    // (B) UPDATE 성공
    mockSupabase._chain.single.mockResolvedValueOnce({
      data: { id: VALID_UUID_SESSION, image_url: null, promoted_at: null },
      error: null,
    });

    const result = await endReadingSession({
      session_id: VALID_UUID_SESSION,
      end_page: 120,
    });

    expect(result.sessionId).toBe(VALID_UUID_SESSION);
    expect(result.promotedToStamp).toBe(false); // 사진 없음
    expect(earnPoints).toHaveBeenCalledTimes(1);
    expect(earnPoints).toHaveBeenCalledWith(
      "note_create",
      expect.objectContaining({
        referenceType: "reading_log",
        referenceId: VALID_UUID_SESSION,
        description: "독서 세션 기록", // 사진 없을 때
      }),
    );
  });

  it("이미 종료된 세션 재종료 시 거부", async () => {
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: VALID_UUID_SESSION,
        user_id: "user-1",
        user_book_id: VALID_UUID_USER_BOOK,
        started_at: "2026-05-04T10:00:00Z",
        start_page: 100,
        status: "completed",
      },
      error: null,
    });

    await expect(
      endReadingSession({ session_id: VALID_UUID_SESSION, end_page: 120 }),
    ).rejects.toThrow("이미 종료된 세션");
  });
});

describe("cancelActiveSession — 30초 임계값", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RESET_AUTH();
  });

  it("30초 미만 = DELETE 경로", async () => {
    // 5초 전 시작
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: VALID_UUID_SESSION,
        started_at: new Date(Date.now() - 5_000).toISOString(),
        status: "in_progress",
      },
      error: null,
    });

    // delete 체이닝의 마지막 eq()가 await 가능한 결과 반환 (체이너에서 then 처리)
    const deleteThen = Promise.resolve({ data: null, error: null });
    mockSupabase._chain.delete.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(deleteThen),
      }),
    });

    const result = await cancelActiveSession(VALID_UUID_SESSION);
    expect(result.deleted).toBe(true);
    expect(result.abandoned).toBe(false);
  });

  it("30초 이상 = abandoned 경로 (UPDATE)", async () => {
    // 60초 전 시작
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: VALID_UUID_SESSION,
        started_at: new Date(Date.now() - 60_000).toISOString(),
        status: "in_progress",
      },
      error: null,
    });

    const updateThen = Promise.resolve({ data: null, error: null });
    mockSupabase._chain.update.mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(updateThen),
      }),
    });

    const result = await cancelActiveSession(VALID_UUID_SESSION);
    expect(result.deleted).toBe(false);
    expect(result.abandoned).toBe(true);
  });

  it("이미 완료된 세션은 noop 반환", async () => {
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: VALID_UUID_SESSION, started_at: null, status: "completed" },
      error: null,
    });
    const result = await cancelActiveSession(VALID_UUID_SESSION);
    expect(result).toEqual({ deleted: false, abandoned: false });
  });
});

describe("addNoteToSession — 자유 상세 (D3) 허용", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RESET_AUTH();
  });

  it("sessionId NULL이면 자유 상세로 INSERT (포인트 0)", async () => {
    mockSupabase._chain.single.mockResolvedValueOnce({
      data: { id: "note-1" },
      error: null,
    });

    const result = await addNoteToSession(null, {
      detail_kind: "memo",
      memo_content: "자유 메모",
    });

    expect(result.noteId).toBe("note-1");
    expect(result.pointsEarned).toBe(0); // D4: 본 액션 별도 적립 없음
    expect(earnPoints).not.toHaveBeenCalled();
  });

  it("sessionId 지정 시 세션 소유 확인 (없으면 거부)", async () => {
    // 세션 조회: 없음
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      addNoteToSession(VALID_UUID_SESSION, {
        detail_kind: "quote",
        quote_content: "구절",
      }),
    ).rejects.toThrow("세션을 찾을 수 없습니다");
  });
});
