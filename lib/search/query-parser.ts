/**
 * 노트 검색 문법 파서.
 *
 * 지원 문법:
 *   태그:성장          — 태그에 "성장" 포함
 *   책:김영하          — 연결된 책 제목/저자에 "김영하" 포함
 *   before:2024-06     — 작성일이 2024-06-01 이전
 *   after:2024-01      — 작성일이 2024-01-01 이후 (또는 2024-01-31?  → "포함하여" 규칙: 월만 주면 해당 월 1일)
 *   type:quote         — 노트 유형 (quote | memo | photo | transcription | progress)
 *   그 외 단어는 자유 검색어(free text)로 수집됨.
 *
 * 쿼리 해석은 AND 결합. 같은 필드가 여러 번 나오면 OR로 결합.
 *
 *   parseNoteSearchQuery("성장 태그:자기계발 책:김영하 before:2024-06")
 *   → { text: "성장", tags: ["자기계발"], books: ["김영하"], before: Date(2024-06-01), ... }
 */

export type NoteSearchType =
  | "quote"
  | "memo"
  | "photo"
  | "transcription"
  | "progress";

const VALID_TYPES: NoteSearchType[] = [
  "quote",
  "memo",
  "photo",
  "transcription",
  "progress",
];

export interface ParsedNoteQuery {
  /** 자유 검색어 (필드 키워드 제외) */
  text: string;
  tags: string[];
  books: string[];
  types: NoteSearchType[];
  before?: Date;
  after?: Date;
}

// 필드 키워드는 한국어와 영어 모두 받는다.
const FIELD_ALIASES: Record<string, keyof ParsedNoteQuery | "type"> = {
  "태그": "tags",
  tag: "tags",
  "책": "books",
  book: "books",
  type: "type",
  "유형": "type",
  before: "before",
  "이전": "before",
  after: "after",
  "이후": "after",
};

function parseDateLoose(value: string): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const yearOnly = /^\d{4}$/;
  const yearMonth = /^\d{4}-\d{1,2}$/;
  const full = /^\d{4}-\d{1,2}-\d{1,2}$/;

  if (yearOnly.test(trimmed)) {
    return new Date(`${trimmed}-01-01T00:00:00Z`);
  }
  if (yearMonth.test(trimmed)) {
    const [y, m] = trimmed.split("-");
    const mm = m.padStart(2, "0");
    return new Date(`${y}-${mm}-01T00:00:00Z`);
  }
  if (full.test(trimmed)) {
    const [y, m, d] = trimmed.split("-");
    const mm = m.padStart(2, "0");
    const dd = d.padStart(2, "0");
    return new Date(`${y}-${mm}-${dd}T00:00:00Z`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * 검색 문자열을 구조화된 필터로 파싱.
 * 공백 단위로 토큰화하되, 따옴표로 묶인 값은 공백 포함 가능.
 */
export function parseNoteSearchQuery(input: string): ParsedNoteQuery {
  const result: ParsedNoteQuery = {
    text: "",
    tags: [],
    books: [],
    types: [],
  };

  if (!input || !input.trim()) return result;

  const tokens: string[] = [];
  const regex = /"([^"]*)"|\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1] ?? match[0]);
  }

  const textTokens: string[] = [];

  for (const token of tokens) {
    const colonIdx = token.indexOf(":");
    if (colonIdx <= 0) {
      textTokens.push(token);
      continue;
    }

    const rawKey = token.slice(0, colonIdx).toLowerCase();
    const rawValue = token.slice(colonIdx + 1);

    const mapped = FIELD_ALIASES[rawKey];
    if (!mapped) {
      textTokens.push(token);
      continue;
    }

    const value = rawValue.replace(/^"|"$/g, "").trim();
    if (!value) continue;

    switch (mapped) {
      case "tags":
        result.tags.push(value);
        break;
      case "books":
        result.books.push(value);
        break;
      case "type":
        if ((VALID_TYPES as string[]).includes(value)) {
          result.types.push(value as NoteSearchType);
        }
        break;
      case "before": {
        const d = parseDateLoose(value);
        if (d) result.before = d;
        break;
      }
      case "after": {
        const d = parseDateLoose(value);
        if (d) result.after = d;
        break;
      }
    }
  }

  result.text = textTokens.join(" ").trim();
  return result;
}

/**
 * 파싱된 쿼리가 아무 필터도 없는지 여부.
 */
export function isEmptyParsedQuery(query: ParsedNoteQuery): boolean {
  return (
    !query.text &&
    query.tags.length === 0 &&
    query.books.length === 0 &&
    query.types.length === 0 &&
    !query.before &&
    !query.after
  );
}

/**
 * 검색 문법 도움말에 표시할 예시 쿼리들.
 */
export const SEARCH_SYNTAX_EXAMPLES: { query: string; description: string }[] = [
  { query: "태그:자기계발", description: "'자기계발' 태그가 달린 기록" },
  { query: "책:김영하", description: "김영하 저자(또는 제목에 포함)의 책 기록" },
  { query: "type:quote", description: "인상깊은 구절만" },
  { query: "before:2024-06", description: "2024년 6월 이전 기록" },
  { query: "성장 태그:독서", description: "여러 조건 조합" },
];
