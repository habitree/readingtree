import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../setup";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
  createAdminSupabaseClient: vi.fn().mockReturnValue(mockSupabase),
}));

import { getCurrentUser, isAdmin } from "@/app/actions/auth";

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증 에러 시 null 반환", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid token" },
    });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("인증된 사용자 반환", async () => {
    const mockUser = { id: "user-1", email: "test@test.com" };
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const result = await getCurrentUser();

    expect(result).toEqual(mockUser);
  });
});

describe("isAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그인하지 않은 경우 false 반환", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "no user" },
    });

    const result = await isAdmin();

    expect(result).toBe(false);
  });

  it("관리자가 아닌 경우 false 반환", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockSupabase._chain.single.mockResolvedValueOnce({
      data: { is_admin: false },
      error: null,
    });

    const result = await isAdmin();

    expect(result).toBe(false);
  });

  it("관리자인 경우 true 반환", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1" } },
      error: null,
    });

    mockSupabase._chain.single.mockResolvedValueOnce({
      data: { is_admin: true },
      error: null,
    });

    const result = await isAdmin();

    expect(result).toBe(true);
  });
});
