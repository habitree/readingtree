import { describe, it, expect } from "vitest";
import {
  generateReportPrompt,
  REPORT_QUALITY_GUIDELINES,
} from "@/lib/ai/prompts/report-prompts";
import type { NoteWithBook } from "@/types/note";
import type { ReportTemplate } from "@/types/ai/report-template";

const notes = [
  {
    id: "n1",
    type: "memo",
    title: "테스트 메모",
    content: JSON.stringify({ quote: "인용 원문", memo: "메모 원문" }),
    page_number: "103",
    tags: [],
    created_at: "2026-04-15T00:00:00Z",
  },
] as unknown as NoteWithBook[];

const completedHistoryBook = {
  title: "테스트 책",
  author: "저자",
  status: "rereading",
  startedAt: "2026-04-08",
  completedAt: "2026-04-15",
  readingReason: "추천",
  currentPage: 53,
  totalPages: 252,
  completedDates: ["2026-04-15"],
};

const readingBook = {
  ...completedHistoryBook,
  status: "reading",
  completedAt: null,
  completedDates: [],
};

const template: ReportTemplate = {
  id: "tpl-1",
  name: "기본 리포트",
  description: null,
  slug: "standard",
  style: "card-summary",
  tone: "friendly",
  targetLength: "medium",
  includeStats: true,
  multiReadAware: false,
  isDefault: true,
  isSystem: true,
  sortOrder: 1,
  sections: [
    {
      key: "overview",
      title: "책 개요",
      promptInstruction: "책 정보 정리",
      maxLength: null,
      required: true,
      sortOrder: 1,
    },
  ],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("generateReportPrompt — 진행률 표기", () => {
  it("완독 이력이 있으면(재독 중 포함) 잔여 페이지 기반 %를 표기하지 않는다", () => {
    const prompt = generateReportPrompt(completedHistoryBook, notes);
    expect(prompt).toContain("252쪽 완독 (재독 중)");
    expect(prompt).not.toContain("21%");
    expect(prompt).not.toContain("53/252");
  });

  it("읽는 중이면 현재 페이지 기반 진행률을 표기한다", () => {
    const prompt = generateReportPrompt(readingBook, notes);
    expect(prompt).toContain("53/252쪽 (21%)");
  });
});

describe("generateReportPrompt — 본문 품질 규칙", () => {
  it("레거시(템플릿 없음) 경로에 품질 규칙 블록이 포함된다", () => {
    const prompt = generateReportPrompt(completedHistoryBook, notes);
    expect(prompt).toContain("## 본문 품질 규칙");
    expect(prompt).toContain("(p.쪽수)");
    expect(prompt).toContain("공유하고 싶어질 한 문장");
  });

  it("템플릿 경로에도 품질 규칙 블록이 포함된다", () => {
    const prompt = generateReportPrompt(completedHistoryBook, notes, { template });
    expect(prompt).toContain(REPORT_QUALITY_GUIDELINES);
  });

  it("여정 섹션에 진행률 % 언급 금지 지시가 들어간다", () => {
    const prompt = generateReportPrompt(completedHistoryBook, notes);
    expect(prompt).toContain("진행률 퍼센트(%) 수치는 언급하지 않");
  });
});
