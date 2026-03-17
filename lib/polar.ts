import { Polar } from "@polar-sh/sdk";

/**
 * Polar API 클라이언트 (서버 전용)
 *
 * 환경변수:
 *   POLAR_ACCESS_TOKEN  — Organization Access Token (Polar 대시보드에서 발급)
 *   POLAR_ENVIRONMENT   — "sandbox" | "production" (기본: sandbox)
 */
export function createPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.");
  }

  return new Polar({
    accessToken,
    server: (process.env.POLAR_ENVIRONMENT as "sandbox" | "production") ?? "sandbox",
  });
}
