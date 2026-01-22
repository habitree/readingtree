/**
 * @deprecated lib/ai/providers/gemini.ts로 이동됨. 하위 호환성을 위해 유지.
 *
 * 새 코드에서는 다음을 사용하세요:
 * import { summarizeWithGemini } from "@/lib/ai/providers/gemini";
 */

// 새 경로에서 re-export
export { summarizeWithGemini as summarizeBookDescription } from "@/lib/ai/providers/gemini";

// 추가 export (필요시)
export {
  getGeminiClient,
  getGeminiModel,
  generateWithGemini,
  summarizeWithGemini,
  createGeminiChatSession,
  streamGeminiMessage,
} from "@/lib/ai/providers/gemini";
