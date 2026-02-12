/**
 * 입력 검증 유틸리티 함수들
 */

/**
 * UUID 형식 검증
 * @param uuid 검증할 UUID 문자열
 * @returns 유효한 UUID인지 여부
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 문자열 길이 검증
 * @param str 검증할 문자열
 * @param min 최소 길이
 * @param max 최대 길이
 * @returns 유효한 길이인지 여부
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * 날짜 형식 검증 (ISO 8601)
 * @param dateString 검증할 날짜 문자열
 * @returns 유효한 날짜 형식인지 여부
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

/**
 * 페이지 번호 검증
 * @param page 페이지 번호
 * @param min 최소값 (기본값: 1)
 * @param max 최대값 (기본값: 1000)
 * @returns 유효한 페이지 번호인지 여부
 */
export function isValidPage(page: number, min: number = 1, max: number = 1000): boolean {
  return Number.isInteger(page) && page >= min && page <= max;
}

/**
 * 태그 배열 검증
 * @param tags 태그 배열
 * @param maxLength 최대 태그 개수 (기본값: 10)
 * @param maxTagLength 최대 태그 길이 (기본값: 50)
 * @returns 유효한 태그 배열인지 여부
 */
export function isValidTags(tags: string[], maxLength: number = 10, maxTagLength: number = 50): boolean {
  if (!Array.isArray(tags)) return false;
  if (tags.length > maxLength) return false;
  return tags.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= maxTagLength);
}

/**
 * 검색어 검증 및 이스케이프
 * @param query 검색어
 * @param maxLength 최대 길이 (기본값: 200)
 * @returns 이스케이프된 검색어 또는 null
 */
export function sanitizeSearchQuery(query: string | null | undefined, maxLength: number = 200): string | null {
  if (!query) return null;
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return null;
  // SQL 특수 문자 이스케이프 (%와 _는 ILIKE에서 와일드카드)
  // PostgREST 필터 구분 문자 제거 (,  .  (  )  " 로 필터 주입 방지)
  return trimmed
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/[,.()"'\\]/g, "");
}

/**
 * 에러 메시지에서 민감한 정보 제거
 * @param error 에러 객체 또는 메시지
 * @returns 안전한 에러 메시지
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    // 데이터베이스 관련 에러 메시지 필터링
    if (message.includes('database') || message.includes('SQL') || message.includes('connection')) {
      return '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    // 인증 관련 에러 메시지 필터링
    if (message.includes('auth') || message.includes('token') || message.includes('session')) {
      return '인증 오류가 발생했습니다. 다시 로그인해주세요.';
    }
    // 기타 기술적인 에러 메시지는 일반적인 메시지로 변환
    return message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 로깅용 안전한 에러 객체 생성
 * @param error 원본 에러
 * @returns 민감한 정보가 제거된 에러 정보
 */
export function sanitizeErrorForLogging(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: sanitizeErrorMessage(error),
      name: error.name,
      // 스택 트레이스는 개발 환경에서만 포함
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
  return {
    message: '알 수 없는 오류가 발생했습니다.',
  };
}

