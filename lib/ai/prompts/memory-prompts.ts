/**
 * AI 장기 기억 관련 프롬프트
 *
 * 대화에서 기억할 정보를 추출하고,
 * 다음 대화에 주입할 메모리 섹션을 생성합니다.
 */

/**
 * 메모리 추출 프롬프트
 * AI 응답 완료 후 대화쌍을 분석하여 기억할 정보를 JSON으로 추출
 */
export const MEMORY_EXTRACTION_PROMPT = `아래 대화를 분석하여 사용자에 대해 기억해야 할 중요한 정보를 추출하세요.

## 추출 대상 메모리 유형
- reading_preference: 독서 취향 (선호 장르, 작가, 스타일)
- interest: 관심 분야 (독서 외 취미, 직업, 관심사)
- goal: 독서 목표 (올해 목표, 읽고 싶은 책, 도전 계획)
- emotion: 감정 상태 (독서에 대한 감정, 최근 기분)
- context: 상황 정보 (학생/직장인, 읽는 시간대, 환경)

## 규칙
- 대화에서 명확히 드러난 정보만 추출하세요 (추측 금지)
- 이미 알고 있는 기존 기억과 중복되면 추출하지 마세요
- confidence 0.7 이상인 정보만 포함하세요
- 최대 3개까지만 추출하세요

## 기존 기억
{existing_memories}

## 대화 내용
{conversation}

## 응답 형식 (JSON 배열)
[
  {
    "memory_type": "reading_preference",
    "content": "SF와 판타지 장르를 좋아함",
    "confidence": 0.9
  }
]

기억할 정보가 없으면 빈 배열 []을 반환하세요.`;

/**
 * 메모리 유형별 라벨
 */
export const MEMORY_TYPE_LABELS: Record<string, string> = {
  reading_preference: "독서 취향",
  interest: "관심 분야",
  goal: "독서 목표",
  emotion: "감정 상태",
  context: "상황 정보",
};
