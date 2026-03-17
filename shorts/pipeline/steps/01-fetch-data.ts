import { PipelineContext, QuoteData } from "../../src/types/common";
import { selectQuote } from "../selectors/quote-selector";
import { selectBookForReview } from "../selectors/book-selector";
import { selectTip } from "../selectors/tip-selector";
import { createShortsClient } from "../utils/supabase";

/** 메인 DB 기반 시리즈 (기존 로직 유지) */
const MAIN_DB_SERIES = new Set(["daily-quote", "book-review", "reading-tip"]);

/**
 * 쇼츠 DB에서 approved 상태의 콘텐츠를 랜덤 조회
 */
async function fetchFromShortsDB(seriesId: string): Promise<Record<string, unknown>> {
  const supabase = createShortsClient();
  const { data, error } = await supabase
    .from("contents")
    .select("id, props, title")
    .eq("series_id", seriesId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(`쇼츠 DB 조회 실패 (${seriesId}): ${error.message}`);
  if (!data || data.length === 0) throw new Error(`No approved content for series: ${seriesId}`);

  // 랜덤 선택
  const selected = data[Math.floor(Math.random() * data.length)];
  return { ...selected.props, _contentId: selected.id, _title: selected.title };
}

export async function fetchData(ctx: PipelineContext): Promise<Record<string, unknown>> {
  const { series } = ctx;

  // 메인 DB 연동 시리즈는 기존 로직 유지
  if (MAIN_DB_SERIES.has(series)) {
    switch (series) {
      case "daily-quote": {
        const quote = await selectQuote();
        if (!quote) throw new Error("No eligible quote found");
        return { quote };
      }
      case "book-review": {
        const result = await selectBookForReview();
        if (!result) throw new Error("No eligible book found");
        return result;
      }
      case "reading-tip": {
        const tip = selectTip();
        return tip;
      }
    }
  }

  // 나머지 시리즈는 쇼츠 DB에서 조회
  return fetchFromShortsDB(series);
}
