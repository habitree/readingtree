/**
 * AI 독서 리포트 프롬프트 템플릿
 *
 * 사용자의 독서 노트를 분석하여 구조화된 리포트를 생성하는 프롬프트
 */

import type { NoteWithBook } from "@/types/note";

interface BookInfo {
  title: string;
  author: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  readingReason: string | null;
  currentPage: number | null;
  totalPages: number | null;
}

/** 노트 유형 한국어 레이블 */
const NOTE_TYPE_LABELS: Record<string, string> = {
  quote: "인용",
  memo: "메모",
  transcription: "필사",
  progress: "독서 여정",
  photo: "사진",
};

/** 노트 타입 표시 순서 (필사 → 사진 → 인용 → 메모 → 독서 여정) */
const NOTE_TYPE_ORDER: string[] = ["transcription", "photo", "quote", "memo", "progress"];

/** 노트 content JSON 파싱 */
function parseNoteContent(content: string | null): { quote?: string; memo?: string; text?: string } {
  if (!content) return {};
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {
    // JSON이 아닌 경우 원문 그대로
  }
  return { text: content };
}

/** 노트를 유형별로 분류하여 텍스트로 포맷팅 */
function formatNotesByType(notes: NoteWithBook[]): string {
  const grouped: Record<string, NoteWithBook[]> = {};

  for (const note of notes) {
    const type = note.type || "memo";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(note);
  }

  const sections: string[] = [];

  const sortedEntries = Object.entries(grouped).sort(
    ([a], [b]) => (NOTE_TYPE_ORDER.indexOf(a) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(a)) - (NOTE_TYPE_ORDER.indexOf(b) === -1 ? 999 : NOTE_TYPE_ORDER.indexOf(b))
  );

  for (const [type, typeNotes] of sortedEntries) {
    const label = NOTE_TYPE_LABELS[type] || type;
    const items = typeNotes.map((note, i) => {
      const parsed = parseNoteContent(note.content);
      const parts: string[] = [];

      if (parsed.quote) parts.push(`인용: "${parsed.quote}"`);
      if (parsed.memo) parts.push(`메모: ${parsed.memo}`);
      if (parsed.text) parts.push(parsed.text);
      if (note.title) parts.push(`제목: ${note.title}`);
      if (note.page_number) parts.push(`(p.${note.page_number})`);
      if (note.tags && note.tags.length > 0) parts.push(`태그: ${note.tags.join(", ")}`);

      return `  ${i + 1}. ${parts.join(" | ")}`;
    });

    sections.push(`### ${label} (${typeNotes.length}개)\n${items.join("\n")}`);
  }

  return sections.join("\n\n");
}

/** 모든 태그 취합 */
function collectTags(notes: NoteWithBook[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    if (note.tags) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet);
}

/** 독서 상태 한국어 */
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    reading: "읽는 중",
    completed: "완독",
    paused: "중단",
    not_started: "읽을 예정",
    rereading: "재독 중",
  };
  return map[status] || status;
}

/**
 * 리포트 생성 프롬프트 조합
 * @param book 책 정보
 * @param notes 노트 목록 (최대 50개로 제한)
 * @param customSystemPrompt 사용자 정의 시스템 프롬프트 (있을 경우)
 */
export function generateReportPrompt(
  book: BookInfo,
  notes: NoteWithBook[],
  customSystemPrompt?: string
): string {
  // 토큰 절약: 최근 50개 노트로 제한
  const limitedNotes = notes.length > 50
    ? notes.slice(-50)
    : notes;

  const tags = collectTags(limitedNotes);

  // 진행률 계산 (완독 시 100% 표시)
  let progressStr: string;
  if (book.status === "completed") {
    progressStr = book.totalPages
      ? `${book.totalPages}/${book.totalPages}쪽 (100% 완독)`
      : "100% 완독";
  } else if (book.totalPages && book.currentPage) {
    progressStr = `${book.currentPage}/${book.totalPages}쪽 (${Math.round((book.currentPage / book.totalPages) * 100)}%)`;
  } else {
    progressStr = "정보 없음";
  }

  const systemPart = customSystemPrompt || "";

  return `${systemPart}

아래 독서 데이터를 분석하여 마크다운 형식의 독서 리포트를 작성해주세요.

---

## 책 정보
- **제목**: ${book.title}
- **저자**: ${book.author || "미상"}
- **독서 상태**: ${statusLabel(book.status)}
- **시작일**: ${book.startedAt || "미기록"}
- **완독일**: ${book.completedAt || "미완독"}
- **진행률**: ${progressStr}
${book.readingReason ? `- **읽는 이유**: ${book.readingReason}` : ""}

## 독서 노트 (총 ${notes.length}개${notes.length > 50 ? `, 최근 50개 분석` : ""})

${formatNotesByType(limitedNotes)}

${tags.length > 0 ? `## 사용된 태그\n${tags.join(", ")}` : ""}

---

## 리포트 작성 지침

다음 6개 섹션으로 구성된 리포트를 작성해주세요:

### 1. 책 개요
- 책의 기본 정보와 독서 기간을 정리

### 2. 핵심 인사이트
- 노트에서 추출한 3~5개의 핵심 주제를 도출
- 각 주제에 대한 간단한 설명 포함

### 3. 인상깊은 구절
- 인용(quote) 노트에서 핵심 구절을 선별
- 마크다운 인용문 블록(>) 형식 사용
- 페이지 번호가 있으면 포함

### 4. 나의 생각 정리
- 사용자가 작성한 메모/감상의 **원문 표현과 어투를 최대한 살려서** 정리
- 원문의 핵심 문장은 그대로 인용하고, 자연스러운 흐름으로 연결
- 사용자 고유의 감정과 표현이 드러나도록 과도한 요약·재해석·의역을 지양
- 메모가 여러 개인 경우 주제별로 자연스럽게 묶되, 각 메모의 핵심 내용은 생략하지 않음

### 5. 독서 여정
- 시간순으로 독서 진행 과정 요약
- 독서 패턴이나 특이사항 언급
- 완독한 경우 시작일~완독일 기간, 완독 성과를 강조

### 6. 종합 요약
- 이 책이 독자에게 준 핵심 가치를 2~3문장으로 정리

각 섹션은 ## 헤딩으로 시작하세요. 마크다운 형식을 활용하되 읽기 쉽게 작성하세요.`;
}
