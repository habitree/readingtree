import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../setup";

// Mock modules
const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Import after mocking
import { earnPoints, getUserPoints } from "@/app/actions/points";

describe("earnPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 인증 사용자 설정
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });
  });

  it("포인트 액션 설정이 없으면 실패 반환", async () => {
    // action config 없음
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const result = await earnPoints("note_create");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid action.");
  });

  it("일일 제한 초과 시 실패 반환", async () => {
    // action config 반환
    mockSupabase._chain.maybeSingle.mockResolvedValueOnce({
      data: {
        action_type: "note_create",
        base_points: 10,
        daily_limit: 5,
        is_repeatable: true,
        is_active: true,
        description: "노트 작성",
      },
      error: null,
    });

    // 일일 제한 횟수 초과 (count: 5)
    mockSupabase._chain.select.mockReturnValueOnce({
      ...mockSupabase._chain,
      eq: vi.fn().mockReturnValue({
        ...mockSupabase._chain,
        eq: vi.fn().mockReturnValue({
          ...mockSupabase._chain,
          gte: vi.fn().mockReturnValue({
            ...mockSupabase._chain,
            lte: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      }),
    });

    const result = await earnPoints("note_create");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Daily limit reached.");
  });

  it("반복 불가 액션 이미 획득 시 실패", async () => {
    // action config 반환 (non-repeatable, no daily limit)
    mockSupabase._chain.maybeSingle
      .mockResolvedValueOnce({
        data: {
          action_type: "first_book",
          base_points: 35,
          daily_limit: null,
          is_repeatable: false,
          is_active: true,
          description: "첫 책 등록",
        },
        error: null,
      })
      // 이미 기존 트랜잭션 존재
      .mockResolvedValueOnce({
        data: { id: "existing-tx" },
        error: null,
      });

    const result = await earnPoints("first_book");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Already claimed.");
  });
});

describe("getUserPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
      error: null,
    });
  });

  it("로그인하지 않은 경우 null 반환", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const result = await getUserPoints();

    expect(result).toBeNull();
  });
});
