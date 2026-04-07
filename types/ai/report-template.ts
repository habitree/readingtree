/**
 * AI 리포트 템플릿 타입 정의
 */

/** 리포트 섹션 타입 */
export type SectionType =
  | "overview"
  | "insights"
  | "quotes"
  | "thoughts"
  | "journey"
  | "summary"
  | "discussion"
  | "action_items"
  | "comparison"
  | "growth"
  | "social_snippet"
  | "concept_map";

/** 템플릿 톤 */
export type TemplateTone = "formal" | "casual" | "academic" | "friendly";

/** 템플릿 길이 */
export type TargetLength = "short" | "medium" | "long";

/** 템플릿 스타일 (레이아웃/서술 방식) */
export type TemplateStyle = "editorial" | "timeline" | "conversational" | "card-summary" | "immersive";

/** 스타일 레이블 */
export const STYLE_LABELS: Record<TemplateStyle, string> = {
  editorial: "에디토리얼",
  timeline: "타임라인",
  conversational: "대화형",
  "card-summary": "카드 요약",
  immersive: "몰입형",
};

/** 스타일 설명 */
export const STYLE_DESCRIPTIONS: Record<TemplateStyle, string> = {
  editorial: "매거진 서평 스타일. 기록 원문 중심, 넉넉한 여백, 질문으로 마무리",
  timeline: "독서 여정을 시간축으로 풀어냄. 기록을 날짜 노드로 시각화",
  conversational: "친구에게 추천하듯 Q&A 형식. 자연스러운 대화 톤",
  "card-summary": "핵심만 카드로 정리. 숫자 데이터 강조, 독립적 카드 구성",
  immersive: "책의 분위기를 시각적으로 전달. 큰 타이포, 여운 중심",
};

/** 스타일별 프롬프트 가이드 (AI에 전달) */
export const STYLE_PROMPT_GUIDES: Record<TemplateStyle, string> = {
  editorial: `매거진 서평 스타일로 작성하세요.
- 독자의 기록 원문을 그대로 인용하고, 그 기록이 왜 의미 있는지 맥락을 짧게 설명
- 과도한 분석보다 관찰과 질문 중심
- 마지막은 답이 아닌 질문으로 마무리
- Bold 사용 최소화, 리스트 나열 지양`,
  timeline: `독서 여정을 시간 순서대로 풀어쓰세요.
- 각 기록의 날짜와 맥락을 연결
- 기록 사이의 공백 기간도 의미 있게 해석
- 시작 → 중간 → 완독 → 현재 순서로 서술
- 감정의 변화 흐름이 드러나도록`,
  conversational: `친구에게 책을 소개하듯 대화체로 작성하세요.
- "이 책 뭔데?" "읽어볼 만해?" 같은 자연스러운 질문-답변 구조
- 존댓말과 반말이 섞이지 않게 일관된 톤 유지
- 독자의 기록을 자연스럽게 대화 속에 녹여서 인용`,
  "card-summary": `핵심 정보를 짧고 명확한 단위로 정리하세요.
- 각 항목이 독립적으로 이해 가능하도록 작성
- 숫자 데이터 (독서 기간, 기록 수, 페이지 등) 활용
- 첫 기록과 마지막 기록의 변화를 대비
- 한 항목당 2~3문장 이내`,
  immersive: `책의 분위기와 독자의 감정을 시각적 글로 전달하세요.
- 독자의 기록 원문을 큰 비중으로 배치
- 설명은 최소화하고 원문이 스스로 말하게
- 섹션 사이에 충분한 호흡
- 마지막은 여운이 남는 문장으로 마무리`,
};

/** 템플릿 섹션 설정 */
export interface ReportTemplateSectionConfig {
  key: SectionType;
  title: string;
  promptInstruction: string;
  maxLength: number | null;
  required: boolean;
  sortOrder: number;
  config?: Record<string, unknown>;
}

/** 리포트 템플릿 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  style: TemplateStyle;
  tone: TemplateTone;
  targetLength: TargetLength;
  includeStats: boolean;
  multiReadAware: boolean;
  isDefault: boolean;
  isSystem: boolean;
  sortOrder: number;
  sections: ReportTemplateSectionConfig[];
  createdAt: string;
  updatedAt: string;
}

/** 템플릿 생성/수정 폼 데이터 */
export interface ReportTemplateFormData {
  name: string;
  description: string | null;
  slug: string;
  style: TemplateStyle;
  sections: ReportTemplateSectionConfig[];
  tone: TemplateTone;
  targetLength: TargetLength;
  includeStats: boolean;
  multiReadAware: boolean;
}

/** 톤 레이블 */
export const TONE_LABELS: Record<TemplateTone, string> = {
  formal: "격식체",
  casual: "친근체",
  academic: "학술체",
  friendly: "따뜻한",
};

/** 길이 레이블 */
export const LENGTH_LABELS: Record<TargetLength, string> = {
  short: "짧게",
  medium: "보통",
  long: "자세히",
};

/** 섹션 타입 레이블 */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  overview: "책 개요",
  insights: "핵심 인사이트",
  quotes: "인상깊은 구절",
  thoughts: "나의 생각 정리",
  journey: "독서 여정",
  summary: "종합 요약",
  discussion: "토론 질문",
  action_items: "실천 항목",
  comparison: "회독별 비교",
  growth: "독서 성장 분석",
  social_snippet: "SNS 한줄평",
  concept_map: "핵심 개념 관계도",
};

/** 섹션별 AI 설정 (config 필드에 저장) */
export interface SectionAIConfig {
  toneOverride: TemplateTone | "inherit";
  lengthControl: TargetLength | "inherit";
  minWordCount: number | null;
  maxWordCount: number | null;
  modelOverride: string | null;
  temperatureOverride: number | null;
  exampleOutput: string;
  gridLayout: "full" | "half" | "tall";
}

/** SectionAIConfig 기본값 */
export const DEFAULT_SECTION_AI_CONFIG: SectionAIConfig = {
  toneOverride: "inherit",
  lengthControl: "inherit",
  minWordCount: null,
  maxWordCount: null,
  modelOverride: null,
  temperatureOverride: null,
  exampleOutput: "",
  gridLayout: "half",
};

/** config 필드에서 SectionAIConfig 추출 */
export function getSectionAIConfig(config?: Record<string, unknown>): SectionAIConfig {
  if (!config) return { ...DEFAULT_SECTION_AI_CONFIG };
  return {
    toneOverride: (config.toneOverride as SectionAIConfig["toneOverride"]) ?? "inherit",
    lengthControl: (config.lengthControl as SectionAIConfig["lengthControl"]) ?? "inherit",
    minWordCount: (config.minWordCount as number) ?? null,
    maxWordCount: (config.maxWordCount as number) ?? null,
    modelOverride: (config.modelOverride as string) ?? null,
    temperatureOverride: (config.temperatureOverride as number) ?? null,
    exampleOutput: (config.exampleOutput as string) ?? "",
    gridLayout: (config.gridLayout as SectionAIConfig["gridLayout"]) ?? "half",
  };
}

/** SectionAIConfig를 config 필드에 병합 */
export function setSectionAIConfig(
  existing: Record<string, unknown> | undefined,
  aiConfig: Partial<SectionAIConfig>
): Record<string, unknown> {
  return { ...(existing || {}), ...aiConfig };
}

/** 그리드 레이아웃 → CSS 클래스 매핑 */
export const GRID_LAYOUT_CLASSES: Record<SectionAIConfig["gridLayout"], string> = {
  full: "sm:col-span-2",
  half: "",
  tall: "sm:row-span-2",
};

/** 그리드 레이아웃 레이블 */
export const GRID_LAYOUT_LABELS: Record<SectionAIConfig["gridLayout"], string> = {
  full: "전체 너비",
  half: "반 너비",
  tall: "세로 확장",
};

/** 섹션 타입 설명 (라이브러리 패널용) */
export const SECTION_TYPE_DESCRIPTIONS: Record<SectionType, string> = {
  overview: "책의 기본 정보와 독서 기간 정리",
  insights: "노트에서 추출한 핵심 주제 분석",
  quotes: "인상깊은 구절 선별 및 인용",
  thoughts: "사용자의 메모와 감상 원문 정리",
  journey: "시간순 독서 진행 과정 요약",
  summary: "핵심 가치를 압축 정리",
  discussion: "독서 모임용 토론 질문 생성",
  action_items: "실천 가능한 행동 계획 제안",
  comparison: "회독별 노트/관점 비교 분석",
  growth: "다회독을 통한 독서 성장 분석",
  social_snippet: "SNS 공유용 짧은 서평",
  concept_map: "핵심 개념 간 관계 구조화",
};

/** 노트 유형 가중치 */
export interface NoteTypeWeights {
  quote: number;
  memo: number;
  transcription: number;
  progress: number;
  photo: number;
}

/** 확장된 리포트 설정 */
export interface AIReportSettingsExtended {
  id: string;
  provider: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  minNotesThreshold: number;
  maxNotesForAnalysis: number;
  enableMultiReading: boolean;
  noteTypeWeights: NoteTypeWeights;
  defaultTemplateId: string | null;
}

/** 리포트 사용 통계 */
export interface ReportUsageStats {
  totalReports: number;
  monthlyReports: number;
  avgGenerationTimeMs: number | null;
  templatePopularity: { templateId: string; templateName: string; count: number }[];
  topUsers: { userId: string; count: number }[];
}

/** 다회독 컨텍스트 */
export interface MultiReadingContext {
  totalReads: number;
  currentReadNumber: number;
  readingCycles: ReadingCycle[];
}

/** 회독 사이클 */
export interface ReadingCycle {
  readingNumber: number;
  startDate: string | null;
  endDate: string | null;
  noteCount: number;
}
