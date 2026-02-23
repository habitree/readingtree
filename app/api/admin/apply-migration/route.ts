/**
 * 일회성 DB 마이그레이션 상태 확인 엔드포인트
 * 사용법: GET /api/admin/apply-migration?secret=readtree-migrate-2026
 * 적용 완료 후 이 파일을 삭제하세요.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MIGRATION_SECRET = process.env.MIGRATION_SECRET ?? "readtree-migrate-2026";

const MIGRATION_SQL = `-- Migration: ai_reports note_ids + include_notes
ALTER TABLE ai_generated_reports
  ADD COLUMN IF NOT EXISTS note_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_notes BOOLEAN NOT NULL DEFAULT true;`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 컬럼 존재 여부 확인
  const { error: noteIdsError } = await supabase
    .from("ai_generated_reports")
    .select("note_ids")
    .limit(1);

  const { error: includeNotesError } = await supabase
    .from("ai_generated_reports")
    .select("include_notes")
    .limit(1);

  const noteIdsMissing = noteIdsError?.message?.includes("does not exist");
  const includeNotesMissing = includeNotesError?.message?.includes("does not exist");

  if (!noteIdsMissing && !includeNotesMissing) {
    return NextResponse.json({
      status: "✅ already_applied",
      message: "모든 컬럼이 이미 존재합니다. 이 엔드포인트를 삭제해도 됩니다.",
    });
  }

  // 미적용 컬럼 목록 반환
  return NextResponse.json(
    {
      status: "⚠️ migration_required",
      missing: {
        note_ids: noteIdsMissing,
        include_notes: includeNotesMissing,
      },
      instructions: [
        "1. Supabase Dashboard 접속: https://supabase.com/dashboard",
        "2. 프로젝트 선택 → SQL Editor → New query",
        "3. 아래 SQL을 붙여넣고 실행하세요",
      ],
      sql: MIGRATION_SQL,
    },
    { status: 503 }
  );
}
