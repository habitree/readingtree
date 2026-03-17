/**
 * 파이프라인 비용 추적 유틸리티
 * OpenAI API 사용량 추적 (Edge TTS는 무료)
 */

interface CostEntry {
  timestamp: string;
  series: string;
  step: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

const costLog: CostEntry[] = [];

// gpt-4o-mini 가격 (2024 기준)
const PRICING = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 }, // per 1K tokens
} as const;

export function trackCost(
  series: string,
  step: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): void {
  const pricing = PRICING[model as keyof typeof PRICING] ?? { input: 0, output: 0 };
  const estimatedCost =
    (inputTokens / 1000) * pricing.input +
    (outputTokens / 1000) * pricing.output;

  costLog.push({
    timestamp: new Date().toISOString(),
    series,
    step,
    model,
    inputTokens,
    outputTokens,
    estimatedCost,
  });
}

export function getTotalCost(): number {
  return costLog.reduce((sum, entry) => sum + entry.estimatedCost, 0);
}

export function getCostSummary(): string {
  const total = getTotalCost();
  return `Total cost: $${total.toFixed(4)} (${costLog.length} API calls)`;
}
