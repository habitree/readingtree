import { vi } from "vitest";

/**
 * Supabase mock factory
 * 체이닝 패턴 (from→select→eq→single 등) 모킹
 */
export function createMockSupabaseClient(overrides: Record<string, any> = {}) {
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
    ...overrides,
  };

  // from() 호출 시 체인 객체 반환
  const from = vi.fn().mockReturnValue(chainMethods);

  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
  };

  return { from, auth, _chain: chainMethods };
}

// next/cache mock
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// @/lib/supabase/server mock
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));
