/**
 * 리포트 섹션 타입 레지스트리
 * 각 섹션 타입별 아이콘, 컬러, 그리드 클래스, 키워드 매핑
 */

import type { SectionType } from "@/types/ai/report-template";

interface SectionDisplayConfig {
  icon: string;
  colorTheme: string;
  gridClass: string;
  fallbackKeywords: string[];
}

export const SECTION_TYPE_REGISTRY: Record<SectionType, SectionDisplayConfig> = {
  overview: {
    icon: "BookOpen",
    colorTheme: "stone",
    gridClass: "sm:col-span-2",
    fallbackKeywords: ["개요", "overview", "소개", "about"],
  },
  insights: {
    icon: "Lightbulb",
    colorTheme: "amber",
    gridClass: "sm:row-span-2",
    fallbackKeywords: ["인사이트", "insight", "핵심", "key", "교훈", "lesson"],
  },
  quotes: {
    icon: "Quote",
    colorTheme: "emerald",
    gridClass: "",
    fallbackKeywords: ["구절", "quote", "인용", "인상깊은", "memorable"],
  },
  thoughts: {
    icon: "PenLine",
    colorTheme: "orange",
    gridClass: "sm:col-span-2",
    fallbackKeywords: ["생각", "thought", "나의", "my", "느낀", "감상"],
  },
  journey: {
    icon: "Route",
    colorTheme: "rose",
    gridClass: "",
    fallbackKeywords: ["여정", "journey", "독서", "과정"],
  },
  summary: {
    icon: "Sparkles",
    colorTheme: "green",
    gridClass: "",
    fallbackKeywords: ["요약", "summary", "종합", "결론", "마무리", "총평"],
  },
  discussion: {
    icon: "MessageSquare",
    colorTheme: "violet",
    gridClass: "sm:col-span-2",
    fallbackKeywords: ["토론", "질문", "discussion", "debate"],
  },
  action_items: {
    icon: "CheckSquare",
    colorTheme: "blue",
    gridClass: "",
    fallbackKeywords: ["실천", "action", "항목", "계획"],
  },
  comparison: {
    icon: "GitCompare",
    colorTheme: "indigo",
    gridClass: "sm:col-span-2",
    fallbackKeywords: ["비교", "comparison", "회독", "차이"],
  },
  growth: {
    icon: "TrendingUp",
    colorTheme: "teal",
    gridClass: "",
    fallbackKeywords: ["성장", "growth", "변화", "발전"],
  },
  social_snippet: {
    icon: "Share2",
    colorTheme: "pink",
    gridClass: "",
    fallbackKeywords: ["SNS", "한줄", "공유", "서평"],
  },
  concept_map: {
    icon: "Network",
    colorTheme: "cyan",
    gridClass: "sm:col-span-2",
    fallbackKeywords: ["개념", "concept", "관계", "구조"],
  },
};

/** 섹션 타입으로 디스플레이 설정 조회 */
export function getSectionDisplayConfig(sectionType: SectionType): SectionDisplayConfig {
  return SECTION_TYPE_REGISTRY[sectionType];
}

/** 키워드로 섹션 타입 추론 (레거시 파싱용) */
export function inferSectionType(title: string): SectionType | null {
  const lower = title.toLowerCase();
  for (const [type, config] of Object.entries(SECTION_TYPE_REGISTRY)) {
    if (config.fallbackKeywords.some((kw) => lower.includes(kw))) {
      return type as SectionType;
    }
  }
  return null;
}
