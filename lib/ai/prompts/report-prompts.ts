/**
 * AI 독서 리포트 프롬프트 템플릿
 *
 * 사용자의 독서 노트를 분석하여 구조화된 리포트를 생성하는 프롬프트
 */

import type { NoteWithBook } from "@/types/note";
import type {
  ReportTemplate,
  MultiReadingContext,
  TemplateTone,
  TargetLength,
  SectionAIConfig,
} from "@/types/ai/report-template";
import { getSectionAIConfig } from "@/types/ai/report-template";

interface BookInfo {
  title: string;
  author: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  readingReason: string | null;
  currentPage: number | null;
  totalPages: number | null;
  completedDates?: string[];
}

/** 프롬프트 생성 옵션 */
export interface ReportPromptOptions {
  customSystemPrompt?: string;
  template?: ReportTemplate;
  multiReadingContext?: MultiReadingContext;
  maxNotes?: number;
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

/** 독서 상태 한국어 (다회독 번호 포함) */
function statusLabel(status: string, multiReadContext?: MultiReadingContext): string {
  if (status === "rereading" && multiReadContext) {
    return `${multiReadContext.currentReadNumber}회독 중`;
  }
  if (status === "completed" && multiReadContext && multiReadContext.totalReads > 1) {
    return `${multiReadContext.totalReads}회독 완독`;
  }
  const map: Record<string, string> = {
    reading: "읽는 중",
    completed: "완독",
    paused: "중단",
    not_started: "읽을 예정",
    rereading: "재독 중",
  };
  return map[status] || status;
}

/** 톤별 지시문 */
function toneInstruction(tone: TemplateTone): string {
  const map: Record<TemplateTone, string> = {
    formal: "격식 있고 정중한 어조로 작성하세요.",
    casual: "친근하고 가벼운 말투로 작성하세요. 이모지 사용 가능.",
    academic: "학술 분석 형식으로 근거를 들어 체계적으로 작성하세요.",
    friendly: "따뜻하고 공감가는 어투로 작성하세요.",
  };
  return map[tone] || "";
}

/** 길이별 지시문 */
function lengthInstruction(length: TargetLength): string {
  const map: Record<TargetLength, string> = {
    short: "각 섹션을 간결하게 3~5문장 이내로 작성하세요.",
    medium: "",
    long: "각 섹션을 풍부하고 상세하게 작성하세요.",
  };
  return map[length] || "";
}

/** 다회독 노트를 회독별로 포맷팅 */
function formatNotesByReading(
  notesByReading: Map<number, NoteWithBook[]>
): string {
  const sections: string[] = [];

  for (const [readingNum, notes] of notesByReading) {
    if (notes.length === 0) continue;
    sections.push(`### ${readingNum}회독 기록 (${notes.length}개)`);
    sections.push(formatNotesByType(notes));
  }

  return sections.join("\n\n");
}

/** 다회독 메타데이터 블록 생성 */
function formatMultiReadingInfo(context: MultiReadingContext): string {
  const lines = [
    `## 다회독 정보`,
    `- **총 회독 수**: ${context.totalReads}회`,
    `- **현재**: ${context.currentReadNumber}회독`,
  ];

  for (const cycle of context.readingCycles) {
    const start = cycle.startDate || "미기록";
    const end = cycle.endDate || "진행 중";
    lines.push(`- **${cycle.readingNumber}회독**: ${start} ~ ${end} (기록 ${cycle.noteCount}개)`);
  }

  return lines.join("\n");
}

/**
 * 리포트 생성 프롬프트 조합 (레거시 호환)
 * @param book 책 정보
 * @param notes 노트 목록
 * @param options 시스템 프롬프트 문자열 또는 옵션 객체
 */
export function generateReportPrompt(
  book: BookInfo,
  notes: NoteWithBook[],
  options?: string | ReportPromptOptions
): string {
  // 레거시 호환: string이면 customSystemPrompt로 처리
  const opts: ReportPromptOptions =
    typeof options === "string" ? { customSystemPrompt: options } : options || {};

  // 템플릿이 있으면 템플릿 기반 생성
  if (opts.template) {
    return generateReportPromptFromTemplate(book, notes, opts);
  }

  const maxNotes = opts.maxNotes || 50;
  const limitedNotes = notes.length > maxNotes ? notes.slice(-maxNotes) : notes;
  const tags = collectTags(limitedNotes);
  const progressStr = formatProgress(book);
  const systemPart = opts.customSystemPrompt || "";
  const multiCtx = opts.multiReadingContext;

  // 다회독 추가 섹션
  const multiReadingSections = multiCtx && multiCtx.totalReads > 1 ? `

### 7. 독서 성장 분석
- 1회독과 최근 회독을 비교하여 독서 관점의 변화 분석
- 주목하는 주제, 감정적 반응, 이해 깊이의 변화 관찰
- 재독을 통해 얻은 새로운 인사이트

### 8. 회독별 비교
- 각 회독에서 주로 기록한 노트 유형과 주제 비교
- 시간 경과에 따른 독자의 성장 포인트
- 동일 구절에 대한 다른 반응이 있다면 강조` : "";

  const sectionCount = multiCtx && multiCtx.totalReads > 1 ? 8 : 6;

  return `${systemPart}

아래 독서 데이터를 분석하여 마크다운 형식의 독서 리포트를 작성해주세요.

---

## 책 정보
- **제목**: ${book.title}
- **저자**: ${book.author || "미상"}
- **독서 상태**: ${statusLabel(book.status, multiCtx)}
- **시작일**: ${book.startedAt || "미기록"}
- **완독일**: ${book.completedAt || "미완독"}
- **진행률**: ${progressStr}
${book.readingReason ? `- **읽는 이유**: ${book.readingReason}` : ""}

${multiCtx && multiCtx.totalReads > 1 ? formatMultiReadingInfo(multiCtx) : ""}

## 독서 노트 (총 ${notes.length}개${notes.length > maxNotes ? `, 최근 ${maxNotes}개 분석` : ""})

${formatNotesByType(limitedNotes)}

${tags.length > 0 ? `## 사용된 태그\n${tags.join(", ")}` : ""}

---

## 리포트 작성 지침

다음 ${sectionCount}개 섹션으로 구성된 리포트를 작성해주세요:

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
${multiReadingSections}

각 섹션은 ## 헤딩으로 시작하세요. 마크다운 형식을 활용하되 읽기 쉽게 작성하세요.`;
}

/** 진행률 문자열 생성 */
function formatProgress(book: BookInfo): string {
  if (book.status === "completed") {
    return book.totalPages
      ? `${book.totalPages}/${book.totalPages}쪽 (100% 완독)`
      : "100% 완독";
  }
  if (book.totalPages && book.currentPage) {
    return `${book.currentPage}/${book.totalPages}쪽 (${Math.round((book.currentPage / book.totalPages) * 100)}%)`;
  }
  return "정보 없음";
}

/**
 * 템플릿 기반 리포트 프롬프트 생성
 */
export function generateReportPromptFromTemplate(
  book: BookInfo,
  notes: NoteWithBook[],
  opts: ReportPromptOptions
): string {
  const template = opts.template!;
  const multiCtx = opts.multiReadingContext;
  const maxNotes = opts.maxNotes || 50;

  const limitedNotes = notes.length > maxNotes ? notes.slice(-maxNotes) : notes;
  const tags = collectTags(limitedNotes);
  const progressStr = formatProgress(book);
  const systemPart = opts.customSystemPrompt || "";

  // 활성 섹션만 정렬
  const activeSections = template.sections
    .filter((s) => s.required || true) // 모든 섹션 포함, AI가 판단
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // 섹션 지시문 생성 (섹션별 AI 설정 반영)
  const sectionInstructions = activeSections
    .map((s, i) => {
      const aiConfig = getSectionAIConfig(s.config);
      const lengthHint = s.maxLength ? ` (${s.maxLength}자 이내)` : "";
      const requiredHint = s.required ? "" : "\n- 노트 내용에 따라 포함 여부를 판단하세요";

      // 섹션별 톤 오버라이드
      const sectionTone =
        aiConfig.toneOverride !== "inherit"
          ? `\n- 이 섹션은 ${toneInstruction(aiConfig.toneOverride)}`
          : "";

      // 섹션별 길이 오버라이드
      const sectionLength =
        aiConfig.lengthControl !== "inherit"
          ? `\n- 이 섹션은 ${lengthInstruction(aiConfig.lengthControl)}`
          : "";

      // 단어 수 범위
      const wordRange =
        aiConfig.minWordCount || aiConfig.maxWordCount
          ? `\n- 분량: ${aiConfig.minWordCount ? `최소 ${aiConfig.minWordCount}단어` : ""}${aiConfig.minWordCount && aiConfig.maxWordCount ? " ~ " : ""}${aiConfig.maxWordCount ? `최대 ${aiConfig.maxWordCount}단어` : ""}`
          : "";

      // 예시 출력 참고
      const exampleHint =
        aiConfig.exampleOutput
          ? `\n- 다음 예시를 참고하되 그대로 복사하지 마세요:\n  "${aiConfig.exampleOutput.slice(0, 200)}${aiConfig.exampleOutput.length > 200 ? "..." : ""}"`
          : "";

      return `### ${i + 1}. ${s.title}${lengthHint}
- ${s.promptInstruction}${requiredHint}${sectionTone}${sectionLength}${wordRange}${exampleHint}`;
    })
    .join("\n\n");

  // 톤/길이 지시문
  const toneStr = toneInstruction(template.tone);
  const lengthStr = lengthInstruction(template.targetLength);
  const styleInstructions = [toneStr, lengthStr].filter(Boolean).join("\n");

  return `${systemPart}

아래 독서 데이터를 분석하여 마크다운 형식의 독서 리포트를 작성해주세요.
${styleInstructions ? `\n**작성 스타일**: ${styleInstructions}` : ""}

---

## 책 정보
- **제목**: ${book.title}
- **저자**: ${book.author || "미상"}
- **독서 상태**: ${statusLabel(book.status, multiCtx)}
- **시작일**: ${book.startedAt || "미기록"}
- **완독일**: ${book.completedAt || "미완독"}
- **진행률**: ${progressStr}
${book.readingReason ? `- **읽는 이유**: ${book.readingReason}` : ""}

${multiCtx && multiCtx.totalReads > 1 ? formatMultiReadingInfo(multiCtx) : ""}

## 독서 노트 (총 ${notes.length}개${notes.length > maxNotes ? `, 최근 ${maxNotes}개 분석` : ""})

${formatNotesByType(limitedNotes)}

${tags.length > 0 ? `## 사용된 태그\n${tags.join(", ")}` : ""}

---

## 리포트 작성 지침

다음 ${activeSections.length}개 섹션으로 구성된 리포트를 작성해주세요:

${sectionInstructions}

각 섹션은 ## 헤딩으로 시작하세요. 마크다운 형식을 활용하되 읽기 쉽게 작성하세요.`;
}
