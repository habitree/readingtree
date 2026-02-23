/**
 * AI 리포트 마크다운 → 섹션 파서
 * ## 헤딩 기준으로 분리 → 키워드 매칭으로 섹션 ID/아이콘/색상 결정
 */

import type { ReportSection } from "@/types/ai/report";

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
