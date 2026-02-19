"use client";

import { motion } from "framer-motion";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { ConnectionGraph } from "./connection-graph";
import { StatusOverviewBar } from "./status-overview-bar";
import { BentoGrid } from "./bento-grid";
import { RecommendationsAccordion } from "./recommendations-accordion";
import { DocsLinksBar } from "./docs-links-bar";
import type { ApiIntegrationInfoProps, ServiceNodeConfig } from "./types";

function buildServiceNodes(
  apiInfo: ApiIntegrationInfoProps["apiInfo"],
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): ServiceNodeConfig[] {
  return [
    {
      id: "supabase-auth",
      name: "Supabase Auth",
      description: t("admin.apiInfo.descSupabaseAuth"),
      enabled: apiInfo.supabase.enabled,
      icon: "shield",
      category: "auth",
      externalUrl: "https://supabase.com/dashboard",
      scrollTarget: "service-auth",
    },
    {
      id: "kakao-sdk",
      name: "Kakao SDK",
      description: t("admin.apiInfo.descKakaoSdk"),
      enabled: apiInfo.kakaoSdk.enabled,
      icon: "key",
      category: "auth",
      externalUrl: "https://developers.kakao.com/console/app",
    },
    {
      id: "naver-search",
      name: t("admin.apiInfo.naverSearchName"),
      description: t("admin.apiInfo.descNaverSearch"),
      enabled: apiInfo.naver.enabled,
      icon: "search",
      category: "search",
      externalUrl: "https://developers.naver.com/",
      scrollTarget: "service-search",
    },
    {
      id: "cloud-run-ocr",
      name: "Cloud Run OCR",
      description: t("admin.apiInfo.descCloudRunOcr"),
      enabled: apiInfo.cloudRunOcr.enabled,
      icon: "zap",
      category: "ocr",
      scrollTarget: "service-ocr",
    },
    {
      id: "nl-seoji",
      name: t("admin.apiInfo.nlSeojiName"),
      description: t("admin.apiInfo.descNlSeoji"),
      enabled: apiInfo.pageCountApis.nlSeoji.enabled,
      icon: "library",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "aladin",
      name: t("admin.apiInfo.aladinName"),
      description: t("admin.apiInfo.descAladin"),
      enabled: apiInfo.pageCountApis.aladin.enabled,
      icon: "bookOpen",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "google-books",
      name: "Google Books",
      description: t("admin.apiInfo.descGoogleBooks"),
      enabled: apiInfo.pageCountApis.googleBooks.enabled,
      icon: "globe",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "ai-chatbot",
      name: t("admin.apiInfo.aiChatbotName"),
      description: t("admin.apiInfo.descAiChatbot"),
      enabled: apiInfo.aiServices.enabled,
      icon: "bot",
      category: "ai",
      scrollTarget: "service-ai",
    },
    {
      id: "vercel",
      name: "Vercel",
      description: t("admin.apiInfo.descVercel"),
      enabled: true,
      icon: "cloud",
      category: "deploy",
      externalUrl: "https://vercel.com/dashboard",
    },
  ];
}

export function ApiInfoDashboard({
  apiInfo,
  ocrMonthlyUsage,
  ocrTotalStats,
  ocrConnectionTest,
  transcriptionStats,
}: ApiIntegrationInfoProps) {
  const { t } = useTranslation();
  const serviceNodes = buildServiceNodes(apiInfo, t);
  const statusItems = serviceNodes.map((s) => ({
    name: s.name,
    enabled: s.enabled,
  }));

  return (
    <div className="space-y-6 pb-10">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.apiInfo.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.apiInfo.subtitle")}
        </p>
      </motion.div>

      {/* 상태 개요 바 */}
      <StatusOverviewBar services={statusItems} />

      {/* 연결 그래프 */}
      <ConnectionGraph services={serviceNodes} />

      {/* 문서/링크 바 */}
      <DocsLinksBar />

      {/* Bento Grid 서비스 카드들 */}
      <BentoGrid
        apiInfo={apiInfo}
        ocrMonthlyUsage={ocrMonthlyUsage}
        ocrTotalStats={ocrTotalStats}
        ocrConnectionTest={ocrConnectionTest}
        transcriptionStats={transcriptionStats}
      />

      {/* 권장 사항 */}
      <RecommendationsAccordion recommendations={apiInfo.recommendations} />
    </div>
  );
}
