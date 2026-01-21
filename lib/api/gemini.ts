/**
 * Gemini API 클라이언트
 * 텍스트 요약 및 AI 기능 제공
 * Gemini API 실패 시 GPT API로 자동 fallback
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

/**
 * Gemini API 클라이언트 초기화
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * GPT API 클라이언트 초기화
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  
  return new OpenAI({ apiKey });
}

/**
 * 책소개를 25~35자 이내의 완결된 평서문 2~3문장으로 요약
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트 (25~35자 이내, 완결된 평서문 2~3문장)
 */
export async function summarizeBookDescription(description: string): Promise<string> {
  if (!description || description.trim().length === 0) {
    return "";
  }

  // 이미 짧은 경우 그대로 반환
  if (description.length <= 35) {
    return description.trim();
  }

  const prompt = `다음 책소개를 다음 조건에 정확히 맞게 요약해주세요:

필수 조건:
1. 정확히 25자 이상 35자 이하의 한국어 문장으로 작성
2. 반드시 완전한 문장으로 끝나야 합니다. 문장이 중간에 끊기거나 미완성되면 안 됩니다
3. 문장 끝에 마침표(.)를 포함하여 의미가 완결되도록 작성
4. 평서문 형식으로 작성 (의문문, 감탄문 사용 금지)
5. 따옴표(" '), 백틱(\`), 별표(*), 줄바꿈, 이모지, 특수기호 사용 절대 금지
6. 요약 텍스트만 반환하고 다른 설명이나 주석은 포함하지 마세요

중요: 문장이 35자를 초과하면 안 되며, 반드시 완전한 의미를 가진 문장으로 끝나야 합니다.

책소개:
${description}`;

  let summary = "";

  // 1. Gemini API 시도
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    summary = result.response.text().trim();
  } catch (geminiError) {
    console.error("[Gemini] 책소개 요약 실패, GPT API로 fallback:", geminiError);
    
    // 2. Gemini 실패 시 GPT API로 fallback
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 책소개를 간결하게 요약하는 전문가입니다. 요약 텍스트만 반환하세요.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });
      
      summary = completion.choices[0]?.message?.content?.trim() || "";
      
      if (!summary) {
        throw new Error("GPT API 응답이 비어있습니다.");
      }
    } catch (gptError) {
      console.error("[GPT] 책소개 요약 실패:", gptError);
      // GPT도 실패하면 원본 텍스트를 35자로 자르기
      return description.substring(0, 35).trim();
    }
  }

  // summary가 있으면 후처리 진행
  if (summary) {

    // 특수문자 제거 (따옴표, 백틱, *, 줄바꿈, 이모지 등)
    summary = summary
      .replace(/["'`*]/g, "") // 따옴표, 백틱, * 제거
      .replace(/\n/g, " ") // 줄바꿈을 공백으로
      .replace(/\s+/g, " ") // 연속된 공백을 하나로
      .trim();

    // 35자 초과 시 자르기 (문장이 끊기지 않도록 완전한 문장으로)
    if (summary.length > 35) {
      // 25~35자 범위 내에서 마지막 문장 부호(., !, ?) 찾기
      const searchRange = summary.substring(0, 35);
      const lastPeriod = searchRange.lastIndexOf(".");
      const lastExclamation = searchRange.lastIndexOf("!");
      const lastQuestion = searchRange.lastIndexOf("?");
      const lastPunctuation = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastPunctuation >= 24) {
        // 문장 부호가 24자 이상 위치에 있으면 그 위치에서 자르기
        summary = summary.substring(0, lastPunctuation + 1);
      } else {
        // 문장 부호가 없거나 너무 앞에 있으면 35자에서 자르고 마침표 추가
        // 단, 이미 문장이 완결된 것처럼 보이면 그대로 사용
        const truncated = summary.substring(0, 35).trim();
        // 마지막 문자가 문장 부호가 아니면 마침표 추가
        if (!truncated.match(/[.!?]$/)) {
          summary = truncated + ".";
        } else {
          summary = truncated;
        }
      }
    }

    // 25자 미만이면 원본에서 적절히 자르고 마침표 추가
    if (summary.length < 25) {
      // 원본에서 30자까지 가져와서 공백이나 문장 부호 앞에서 자르기
      let truncated = description.substring(0, 30).trim();
      
      // 마지막 공백 위치 찾기 (25자 이상이 되도록)
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace >= 24 && lastSpace < 30) {
        truncated = truncated.substring(0, lastSpace).trim();
      }
      
      // 마지막 문자가 문장 부호가 아니면 마침표 추가
      if (!truncated.match(/[.!?]$/)) {
        truncated = truncated + ".";
      }
      
      // 여전히 25자 미만이면 원본에서 더 가져오기
      if (truncated.length < 25 && description.length > truncated.length) {
        const needed = 25 - truncated.length;
        const additional = description.substring(truncated.length - 1, truncated.length - 1 + needed).trim();
        truncated = (truncated.slice(0, -1) + additional).trim();
        
        // 35자 초과하지 않도록 조정
        if (truncated.length > 35) {
          const lastSpace2 = truncated.lastIndexOf(" ", 35);
          if (lastSpace2 >= 24) {
            truncated = truncated.substring(0, lastSpace2).trim();
          } else {
            truncated = truncated.substring(0, 35).trim();
          }
        }
        
        // 마지막 문자가 문장 부호가 아니면 마침표 추가
        if (!truncated.match(/[.!?]$/)) {
          truncated = truncated + ".";
        }
      }
      
      return truncated;
    }

    return summary;
  }

  // summary가 없으면 원본 텍스트를 35자로 자르기
  return description.substring(0, 35).trim();
}
