/**
 * AI 리포트 마크다운 → 섹션 파서
 * ## 헤딩 기준으로 분리 → 키워드 매칭으로 섹션 ID/아이콘/색상 결정
 */

import type { ReportSection } from "@/types/ai/report";
import type { ReportTemplateSectionConfig } from "@/types/ai/report-template";
import { SECTION_TYPE_REGISTRY, inferSectionType } from "@/lib/ai/report-section-registry";

/** 어스 톤 컬러 정의 */
export const EARTH_TONE_COLORS: Record<
  string,
  { bg: string; border: string; iconBg: string; iconColor: string }
> = {
  stone: {
    bg: "bg-stone-50/80 dark:bg-stone-900/30",
    border: "border-stone-200/60 dark:border-stone-700/40",
    iconBg: "bg-stone-100 dark:bg-stone-800",
    iconColor: "text-stone-600 dark:text-stone-300",
  },
  amber: {
    bg: "bg-amber-50/80 dark:bg-amber-900/20",
    border: "border-amber-200/60 dark:border-amber-700/40",
    iconBg: "bg-amber-100 dark:bg-amber-800",
    iconColor: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    bg: "bg-emerald-50/80 dark:bg-emerald-900/20",
    border: "border-emerald-200/60 dark:border-emerald-700/40",
    iconBg: "bg-emerald-100 dark:bg-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-300",
  },
  orange: {
    bg: "bg-orange-50/80 dark:bg-orange-900/20",
    border: "border-orange-200/60 dark:border-orange-700/40",
    iconBg: "bg-orange-100 dark:bg-orange-800",
    iconColor: "text-orange-600 dark:text-orange-300",
  },
  rose: {
    bg: "bg-rose-50/80 dark:bg-rose-900/20",
    border: "border-rose-200/60 dark:border-rose-700/40",
    iconBg: "bg-rose-100 dark:bg-rose-800",
    iconColor: "text-rose-600 dark:text-rose-300",
  },
  green: {
    bg: "bg-green-50/80 dark:bg-green-900/20",
    border: "border-green-200/60 dark:border-green-700/40",
    iconBg: "bg-green-100 dark:bg-green-800",
    iconColor: "text-green-600 dark:text-green-300",
  },
  violet: {
    bg: "bg-violet-50/80 dark:bg-violet-900/20",
    border: "border-violet-200/60 dark:border-violet-700/40",
    iconBg: "bg-violet-100 dark:bg-violet-800",
    iconColor: "text-violet-600 dark:text-violet-300",
  },
  blue: {
    bg: "bg-blue-50/80 dark:bg-blue-900/20",
    border: "border-blue-200/60 dark:border-blue-700/40",
    iconBg: "bg-blue-100 dark:bg-blue-800",
    iconColor: "text-blue-600 dark:text-blue-300",
  },
  indigo: {
    bg: "bg-indigo-50/80 dark:bg-indigo-900/20",
    border: "border-indigo-200/60 dark:border-indigo-700/40",
    iconBg: "bg-indigo-100 dark:bg-indigo-800",
    iconColor: "text-indigo-600 dark:text-indigo-300",
  },
  teal: {
    bg: "bg-teal-50/80 dark:bg-teal-900/20",
    border: "border-teal-200/60 dark:border-teal-700/40",
    iconBg: "bg-teal-100 dark:bg-teal-800",
    iconColor: "text-teal-600 dark:text-teal-300",
  },
  pink: {
    bg: "bg-pink-50/80 dark:bg-pink-900/20",
    border: "border-pink-200/60 dark:border-pink-700/40",
    iconBg: "bg-pink-100 dark:bg-pink-800",
    iconColor: "text-pink-600 dark:text-pink-300",
  },
  cyan: {
    bg: "bg-cyan-50/80 dark:bg-cyan-900/20",
    border: "border-cyan-200/60 dark:border-cyan-700/40",
    iconBg: "bg-cyan-100 dark:bg-cyan-800",
    iconColor: "text-cyan-600 dark:text-cyan-300",
  },
};

/** 섹션 매칭 규칙 */
const SECTION_MATCHERS: {
  keywords: string[];
  id: string;
  icon: string;
  colorTheme: string;
  gridClass: string;
}[] = [
  {
    keywords: ["개요", "overview", "소개", "about"],
    id: "book-overview",
    icon: "BookOpen",
    colorTheme: "stone",
    gridClass: "sm:col-span-2",
  },
  {
    keywords: ["인사이트", "insight", "핵심", "key", "교훈", "lesson"],
    id: "key-insights",
    icon: "Lightbulb",
    colorTheme: "amber",
    gridClass: "sm:row-span-2",
  },
  {
    keywords: ["구절", "quote", "인용", "인상깊은", "memorable"],
    id: "memorable-quotes",
    icon: "Quote",
    colorTheme: "emerald",
    gridClass: "",
  },
  {
    keywords: ["생각", "thought", "나의", "my", "느낀", "감상"],
    id: "my-thoughts",
    icon: "PenLine",
    colorTheme: "orange",
    gridClass: "sm:col-span-2",
  },
  {
    keywords: ["여정", "journey", "독서", "reading", "과정", "변화"],
    id: "reading-journey",
    icon: "Route",
    colorTheme: "rose",
    gridClass: "",
  },
  {
    keywords: ["요약", "summary", "종합", "결론", "마무리", "총평"],
    id: "summary",
    icon: "Sparkles",
    colorTheme: "green",
    gridClass: "",
  },
  {
    keywords: ["토론", "질문", "discussion", "debate"],
    id: "discussion",
    icon: "MessageSquare",
    colorTheme: "violet",
    gridClass: "sm:col-span-2",
  },
  {
    keywords: ["실천", "action", "항목", "계획"],
    id: "action-items",
    icon: "CheckSquare",
    colorTheme: "blue",
    gridClass: "",
  },
  {
    keywords: ["비교", "comparison", "회독", "차이"],
    id: "per-read-comparison",
    icon: "GitCompare",
    colorTheme: "indigo",
    gridClass: "sm:col-span-2",
  },
  {
    keywords: ["성장", "growth", "변화", "발전"],
    id: "reading-growth",
    icon: "TrendingUp",
    colorTheme: "teal",
    gridClass: "",
  },
  {
    keywords: ["SNS", "한줄", "공유", "서평"],
    id: "social-snippet",
    icon: "Share2",
    colorTheme: "pink",
    gridClass: "",
  },
  {
    keywords: ["개념", "concept", "관계", "구조"],
    id: "concept-map",
    icon: "Network",
    colorTheme: "cyan",
    gridClass: "sm:col-span-2",
  },
];

/** 섹션 grid 클래스 조회 */
export function getSectionGridClass(sectionId: string): string {
  const matcher = SECTION_MATCHERS.find((m) => m.id === sectionId);
  return matcher?.gridClass || "";
}

/**
 * 마크다운을 ## 헤딩 기준으로 섹션 배열로 파싱
 */
export function parseReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split("\n");
  const sections: ReportSection[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];
  let usedIds = new Set<string>();

  const flushSection = () => {
    if (!currentTitle) return;
    const content = currentContent.join("\n").trim();
    if (!content) return;

    const titleLower = currentTitle.toLowerCase();
    let matched = SECTION_MATCHERS.find((m) =>
      m.keywords.some((kw) => titleLower.includes(kw))
    );

    // 매칭 안 되면 순서 기반 fallback
    if (!matched || usedIds.has(matched.id)) {
      const unused = SECTION_MATCHERS.find((m) => !usedIds.has(m.id));
      if (unused) matched = unused;
    }

    if (matched) {
      usedIds.add(matched.id);
      sections.push({
        id: matched.id,
        title: currentTitle,
        content,
        icon: matched.icon,
        colorTheme: matched.colorTheme,
      });
    } else {
      // 모든 슬롯 사용됨 → generic 추가
      sections.push({
        id: `section-${sections.length}`,
        title: currentTitle,
        content,
        icon: "FileText",
        colorTheme: "stone",
      });
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // 마지막 섹션 flush
  flushSection();

  return sections;
}

/**
 * 템플릿 기반 마크다운 파싱
 * 템플릿의 섹션 정보를 활용하여 더 정확한 매칭
 */
export function parseReportSectionsWithTemplate(
  markdown: string,
  templateSections: ReportTemplateSectionConfig[]
): ReportSection[] {
  const lines = markdown.split("\n");
  const sections: ReportSection[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];
  const usedKeys = new Set<string>();

  const flushSection = () => {
    if (!currentTitle) return;
    const content = currentContent.join("\n").trim();
    if (!content) return;

    const titleLower = currentTitle.toLowerCase();

    // 1차: 템플릿 섹션 타이틀 매칭
    let matchedConfig: ReportTemplateSectionConfig | undefined;
    for (const sec of templateSections) {
      if (!usedKeys.has(sec.key) && titleLower.includes(sec.title.toLowerCase())) {
        matchedConfig = sec;
        break;
      }
    }

    // 2차: 레지스트리 키워드로 추론
    if (!matchedConfig) {
      const inferred = inferSectionType(currentTitle);
      if (inferred && !usedKeys.has(inferred)) {
        matchedConfig = templateSections.find((s) => s.key === inferred && !usedKeys.has(s.key));
      }
    }

    // 3차: 순서 기반 fallback
    if (!matchedConfig) {
      matchedConfig = templateSections.find((s) => !usedKeys.has(s.key));
    }

    if (matchedConfig) {
      usedKeys.add(matchedConfig.key);
      const display = SECTION_TYPE_REGISTRY[matchedConfig.key];
      sections.push({
        id: matchedConfig.key,
        title: currentTitle,
        content,
        icon: display?.icon || "FileText",
        colorTheme: display?.colorTheme || "stone",
      });
    } else {
      sections.push({
        id: `section-${sections.length}`,
        title: currentTitle,
        content,
        icon: "FileText",
        colorTheme: "stone",
      });
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  flushSection();
  return sections;
}
