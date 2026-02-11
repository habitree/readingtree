"use client";

import { motion } from "framer-motion";
import { ConnectionGraph } from "./connection-graph";
import { StatusOverviewBar } from "./status-overview-bar";
import { BentoGrid } from "./bento-grid";
import { RecommendationsAccordion } from "./recommendations-accordion";
import { DocsLinksBar } from "./docs-links-bar";
import type { ApiIntegrationInfoProps, ServiceNodeConfig } from "./types";

function buildServiceNodes(
  apiInfo: ApiIntegrationInfoProps["apiInfo"]
): ServiceNodeConfig[] {
  return [
    {
      id: "supabase-auth",
      name: "Supabase Auth",
      description: "인증 및 데이터베이스",
      enabled: apiInfo.supabase.enabled,
      icon: "shield",
      category: "auth",
      externalUrl: "https://supabase.com/dashboard",
      scrollTarget: "service-auth",
    },
    {
      id: "kakao-sdk",
      name: "Kakao SDK",
      description: "소셜 로그인 보조",
      enabled: apiInfo.kakaoSdk.enabled,
      icon: "key",
      category: "auth",
      externalUrl: "https://developers.kakao.com/console/app",
    },
    {
      id: "naver-search",
      name: "Naver 검색",
      description: "도서 검색 API",
      enabled: apiInfo.naver.enabled,
      icon: "search",
      category: "search",
      externalUrl: "https://developers.naver.com/",
      scrollTarget: "service-search",
    },
    {
      id: "cloud-run-ocr",
      name: "Cloud Run OCR",
      description: "이미지 텍스트 인식",
      enabled: apiInfo.cloudRunOcr.enabled,
      icon: "zap",
      category: "ocr",
      scrollTarget: "service-ocr",
    },
    {
      id: "nl-seoji",
      name: "국립중앙도서관",
      description: "서지정보 1순위",
      enabled: apiInfo.pageCountApis.nlSeoji.enabled,
      icon: "library",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "aladin",
      name: "알라딘",
      description: "도서정보 2순위",
      enabled: apiInfo.pageCountApis.aladin.enabled,
      icon: "bookOpen",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "google-books",
      name: "Google Books",
      description: "글로벌 도서 3순위",
      enabled: apiInfo.pageCountApis.googleBooks.enabled,
      icon: "globe",
      category: "pageCount",
      scrollTarget: "service-pageCount",
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "배포 플랫폼",
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
  const serviceNodes = buildServiceNodes(apiInfo);
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
        <h1 className="text-2xl font-bold tracking-tight">API 연동 정보</h1>
        <p className="text-sm text-muted-foreground">
          서비스 연결 구조와 각 API의 상태를 한눈에 확인합니다
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
