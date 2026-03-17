import { createClient } from "@supabase/supabase-js";

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

/** 메인 Supabase 클라이언트 (notes/books 등 기존 DB) */
export function createServiceClient() {
  return createClient(
    getEnvOrThrow("SUPABASE_URL"),
    getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY")
  );
}

/** 쇼츠 전용 Supabase 클라이언트 (콘텐츠/파이프라인/분석 DB) */
export function createShortsClient() {
  return createClient(
    getEnvOrThrow("SHORTS_SUPABASE_URL"),
    getEnvOrThrow("SHORTS_SUPABASE_SERVICE_ROLE_KEY")
  );
}
