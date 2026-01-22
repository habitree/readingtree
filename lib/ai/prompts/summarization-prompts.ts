/**
 * 책 요약 프롬프트
 *
 * lib/api/gemini.ts의 summarizeBookDescription()에서 사용되던 프롬프트를 추출
 */

/**
 * 책 요약 프롬프트 템플릿
 * 25-35자 이내의 완결된 평서문으로 요약
 */
export const BOOK_SUMMARY_PROMPT_TEMPLATE = `다음 책소개를 다음 조건에 정확히 맞게 요약해주세요:

필수 조건:
1. 정확히 25자 이상 35자 이하의 한국어 문장으로 작성
2. 반드시 완전한 문장으로 끝나야 합니다. 문장이 중간에 끊기거나 미완성되면 안 됩니다
3. 문장 끝에 마침표(.)를 포함하여 의미가 완결되도록 작성
4. 평서문 형식으로 작성 (의문문, 감탄문 사용 금지)
5. 따옴표(" '), 백틱(\`), 별표(*), 줄바꿈, 이모지, 특수기호 사용 절대 금지
6. 요약 텍스트만 반환하고 다른 설명이나 주석은 포함하지 마세요

중요: 문장이 35자를 초과하면 안 되며, 반드시 완전한 의미를 가진 문장으로 끝나야 합니다.`;

/**
 * 책 요약 프롬프트 생성
 * @param description 책소개 텍스트
 * @returns 완성된 프롬프트
 */
export function generateSummaryPrompt(description: string): string {
  return `${BOOK_SUMMARY_PROMPT_TEMPLATE}

책소개:
${description}`;
}

/**
 * GPT용 시스템 프롬프트
 */
export const GPT_SUMMARY_SYSTEM_PROMPT = "당신은 책소개를 간결하게 요약하는 전문가입니다. 요약 텍스트만 반환하세요.";
