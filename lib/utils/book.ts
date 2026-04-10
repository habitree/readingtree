/**
 * 책 제목 유틸리티 함수
 */

/**
 * 책 제목에서 괄호 내용을 분리
 * 예: "제목 (부제목)" -> { mainTitle: "제목", subtitle: "부제목" }
 * 
 * @param title 원본 제목
 * @returns 분리된 제목과 부제목
 */
export function parseBookTitle(title: string): {
  mainTitle: string;
  subtitle: string | null;
} {
  if (!title || typeof title !== 'string') {
    return { mainTitle: title || '', subtitle: null };
  }

  // 괄호 패턴 매칭: (내용), (내용), [내용] 등
  // 가장 마지막 괄호 쌍을 찾아서 부제목으로 처리
  const patterns = [
    /^(.+?)\s*\(([^)]+)\)\s*$/,  // "제목 (부제목)"
    /^(.+?)\s*\[([^\]]+)\]\s*$/,  // "제목 [부제목]"
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        mainTitle: match[1].trim(),
        subtitle: match[2].trim(),
      };
    }
  }

  // 괄호가 없으면 원본 제목 반환
  return {
    mainTitle: title.trim(),
    subtitle: null,
  };
}

/**
 * 저자명의 ^ 구분자를 & 로 변환
 * DB에 "신영준^고영성" 형태로 저장된 저자명을 "신영준 & 고영성"으로 표시
 */
export function formatAuthor(author: string | null | undefined): string {
  if (!author) return "";
  return author.replace(/\^/g, " & ");
}

/**
 * 책 제목에 괄호가 포함되어 있는지 확인
 * 
 * @param title 제목
 * @returns 괄호 포함 여부
 */
export function hasTitleBrackets(title: string): boolean {
  if (!title || typeof title !== 'string') {
    return false;
  }
  return /[\(\[].+?[\)\]]/.test(title);
}
