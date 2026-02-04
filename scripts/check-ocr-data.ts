/**
 * OCR 데이터 상태 확인 스크립트
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("=".repeat(60));
  console.log("OCR 데이터 상태 확인");
  console.log("=".repeat(60));

  // 전체 transcriptions 수
  const { count: totalCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true });

  console.log(`\n📊 전체 transcriptions: ${totalCount}건`);

  // 상태별 분류
  const { count: completedCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  console.log(`   - completed: ${completedCount}건`);

  // raw_extracted_text가 있는 것
  const { count: hasRawCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true })
    .not("raw_extracted_text", "is", null);

  console.log(`   - raw_extracted_text 있음: ${hasRawCount}건`);

  // raw_extracted_text가 NULL인 것
  const { count: noRawCount } = await supabase
    .from("transcriptions")
    .select("id", { count: "exact", head: true })
    .is("raw_extracted_text", null);

  console.log(`   - raw_extracted_text 없음 (보정 대기): ${noRawCount}건`);

  // 샘플 데이터 확인
  const { data: samples } = await supabase
    .from("transcriptions")
    .select("id, note_id, extracted_text, raw_extracted_text, status")
    .limit(5);

  console.log("\n📋 샘플 데이터 (최대 5건):");
  samples?.forEach((s, i) => {
    console.log(`\n[${i + 1}] ID: ${s.id}`);
    console.log(`    상태: ${s.status}`);
    console.log(`    extracted_text: ${s.extracted_text?.slice(0, 50)}...`);
    console.log(`    raw_extracted_text: ${s.raw_extracted_text ? s.raw_extracted_text.slice(0, 50) + "..." : "NULL"}`);
  });

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
