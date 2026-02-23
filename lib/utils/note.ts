import type { NoteType } from "@/types/note";

/**
 * 기록 타입에 따른 라벨 반환
 * 업로드 타입에 따라 기록/필사/사진 3개로 구분
 */
export function getNoteTypeLabel(
  type: NoteType,
  hasImage: boolean
): string {
  // 진행 기록 타입
  if (type === "progress") {
    return "진행";
  }

  // 이미지가 있고 type이 photo면 "사진"
  if (hasImage && type === "photo") {
    return "사진";
  }

  // 이미지가 있고 type이 transcription이면 "필사"
  if (hasImage && type === "transcription") {
    return "필사";
  }

  // type이 quote면 "인용구"
  if (type === "quote") {
    return "인용구";
  }

  // 그 외는 모두 "기록"
  return "기록";
}

/**
 * 기록 내용을 파싱하여 표시용 텍스트로 변환
 * JSON 형태: {"quote":"구절","memo":"1"} → "인상깊은 구절: 구절\n내 생각: 1"
 */
export function parseNoteContent(
  content: string | null,
  pageNumber: number | null
): string | null {
  if (!content) {
    return null;
  }

  try {
    // JSON 형태인지 확인
    const parsed = JSON.parse(content);
    
    if (typeof parsed === "object" && parsed !== null) {
      const parts: string[] = [];
      
      if (parsed.quote) {
        parts.push(`인상깊은 구절: ${parsed.quote}`);
      }
      
      if (parsed.memo) {
        parts.push(`내 생각: ${parsed.memo}`);
      }
      
      if (pageNumber) {
        parts.push(`페이지: ${pageNumber}`);
      }
      
      return parts.length > 0 ? parts.join("\n") : null;
    }
  } catch {
    // JSON이 아니면 원본 내용 반환
  }

  // JSON이 아니거나 파싱 실패 시 원본 반환
  return content;
}

/**
 * 기록 내용을 파싱하여 각 필드를 개별적으로 반환
 */
export function parseNoteContentFields(content: string | null): {
  quote: string | null;
  memo: string | null;
} {
  if (!content) {
    return { quote: null, memo: null };
  }

  try {
    const parsed = JSON.parse(content);
    
    if (typeof parsed === "object" && parsed !== null) {
      return {
        quote: parsed.quote || null,
        memo: parsed.memo || null,
      };
    }
  } catch {
    // JSON이 아니면 원본을 memo로 처리
    return { quote: null, memo: content };
  }

  return { quote: null, memo: null };
}

/**
 * page_number를 string에서 number로 변환
 * @param pageNumber string | null | number 타입의 페이지 번호
 * @returns number | null 타입의 페이지 번호
 */
export function parsePageNumber(pageNumber: string | null | number): number | null {
  if (pageNumber === null || pageNumber === undefined) return null;
  
  // 이미 number 타입이면 그대로 반환
  if (typeof pageNumber === 'number') return pageNumber;
  
  // string 타입이면 파싱
  const parsed = parseInt(pageNumber, 10);
  return isNaN(parsed) ? null : parsed;
}
