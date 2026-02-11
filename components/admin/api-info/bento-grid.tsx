"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceCard, ServiceDetail, FeatureList } from "./service-card";
import { OcrStatsPanel } from "./ocr-stats-panel";
import type { ApiIntegrationInfoProps } from "./types";

type BentoGridProps = ApiIntegrationInfoProps;

export function BentoGrid({
  apiInfo,
  ocrMonthlyUsage,
  ocrTotalStats,
  ocrConnectionTest,
  transcriptionStats,
}: BentoGridProps) {
  const { supabase, kakaoSdk, naver, cloudRunOcr, pageCountApis } = apiInfo;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Supabase Auth - 대형 */}
      <ServiceCard
        id="service-auth"
        icon="shield"
        provider={supabase.provider}
        enabled={supabase.enabled}
        category="auth"
        previewBadges={["OAuth", "Email", "RLS"]}
        apiReference={supabase.apiReference}
        className="md:col-span-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ServiceDetail label="Project URL" value={supabase.urlStatus} />
          <ServiceDetail label="Anon Key" value={supabase.anonKeyStatus} />
          <ServiceDetail
            label="Service Role Key"
            value={supabase.serviceRoleKeyStatus}
          />
        </div>
        <div className="pt-2">
          <div className="text-xs font-medium mb-1.5">인증 방법</div>
          <div className="space-y-1 text-xs">
            <div>{supabase.authMethods.oauth.kakao}</div>
            <div>{supabase.authMethods.oauth.google}</div>
            <div>{supabase.authMethods.email}</div>
          </div>
        </div>
        <div className="pt-2">
          <div className="text-xs font-medium mb-1.5">주요 기능</div>
          <FeatureList features={supabase.features} />
        </div>
      </ServiceCard>

      {/* Naver 검색 - 중형 */}
      <ServiceCard
        id="service-search"
        icon="search"
        provider={naver.provider}
        enabled={naver.enabled}
        category="search"
        previewBadges={naver.features.slice(0, 2)}
        apiReference={naver.apiReference}
      >
        <div className="grid grid-cols-2 gap-3">
          <ServiceDetail label="Client ID" value={naver.clientIdStatus} />
          <ServiceDetail
            label="Client Secret"
            value={naver.clientSecretStatus}
          />
        </div>
        <div className="pt-2">
          <div className="text-xs font-medium mb-1.5">주요 기능</div>
          <FeatureList features={naver.features} />
        </div>
      </ServiceCard>

      {/* Cloud Run OCR - 대형 (통계 포함) */}
      <div id="service-ocr" className="md:col-span-2 space-y-3 scroll-mt-20">
        <ServiceCard
          icon="zap"
          provider={cloudRunOcr.provider}
          enabled={cloudRunOcr.enabled}
          category="ocr"
          previewBadges={cloudRunOcr.features.slice(0, 2)}
          apiReference={cloudRunOcr.apiReference}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceDetail label="서비스 URL" value={cloudRunOcr.url} />
            <ServiceDetail label="URL 상태" value={cloudRunOcr.urlStatus} />
            <ServiceDetail label="인증 방법" value={cloudRunOcr.authMethod} />
            <ServiceDetail label="인증 상태" value={cloudRunOcr.authStatus} />
          </div>
          <div className="pt-2">
            <div className="text-xs font-medium mb-1.5">주요 기능</div>
            <FeatureList features={cloudRunOcr.features} />
          </div>
          {cloudRunOcr.pricing && (
            <div className="pt-2 p-2.5 bg-muted/50 rounded-lg text-xs">
              <div className="font-medium mb-1">비용 정보</div>
              <div>
                <span className="font-medium">무료:</span>{" "}
                {cloudRunOcr.pricing.freeTier}
              </div>
              <div>
                <span className="font-medium">유료:</span>{" "}
                {cloudRunOcr.pricing.costPerRequest}
              </div>
            </div>
          )}
        </ServiceCard>
        <OcrStatsPanel
          ocrConnectionTest={ocrConnectionTest}
          ocrTotalStats={ocrTotalStats}
          ocrMonthlyUsage={ocrMonthlyUsage}
          transcriptionStats={transcriptionStats}
        />
      </div>

      {/* Kakao SDK - 소형 */}
      <ServiceCard
        icon="key"
        provider={kakaoSdk.provider}
        enabled={kakaoSdk.enabled}
        category="auth"
        previewBadges={kakaoSdk.features.slice(0, 2)}
        apiReference={kakaoSdk.apiReference}
      >
        <ServiceDetail label="App Key 상태" value={kakaoSdk.keyStatus} />
        <div className="pt-2">
          <div className="text-xs font-medium mb-1.5">주요 기능</div>
          <FeatureList features={kakaoSdk.features} />
        </div>
        <div className="text-xs text-muted-foreground italic pt-1">
          {kakaoSdk.notes}
        </div>
      </ServiceCard>

      {/* 페이지 수 API - 풀 행 */}
      <div
        id="service-pageCount"
        className="md:col-span-2 lg:col-span-3 scroll-mt-20"
      >
        <Card variant="glass" className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <CardContent className="p-4 space-y-4">
            {/* 폴백 체인 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              <div className="text-sm font-semibold">
                도서 페이지 수 API 폴백 체인
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {pageCountApis.summary.enabledApis}/
                  {pageCountApis.summary.totalApis}
                </span>{" "}
                활성 &middot;{" "}
                <span className="font-medium">
                  {pageCountApis.summary.configuredApis}/
                  {pageCountApis.summary.totalApis}
                </span>{" "}
                구성 완료
              </div>
            </div>

            {/* 폴백 체인 시각화 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {[
                {
                  api: pageCountApis.nlSeoji,
                  label: "1순위",
                },
                {
                  api: pageCountApis.aladin,
                  label: "2순위",
                },
                {
                  api: pageCountApis.googleBooks,
                  label: "3순위",
                },
              ].map((item, i) => (
                <div key={item.api.provider} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 p-3 rounded-lg border bg-gradient-to-b from-amber-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {item.label}
                      </Badge>
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            item.api.enabled
                              ? "animate-ping bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${
                            item.api.enabled ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </span>
                    </div>
                    <div className="text-xs font-semibold mb-0.5">
                      {item.api.provider}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      키: {item.api.keyStatus}
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1.5">
                      {item.api.features.slice(0, 2).map((f) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className="text-[9px] px-1 py-0"
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {i < 2 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>

            {/* 폴백 체인 코드 */}
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">조회 순서: </span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {pageCountApis.summary.fallbackChain}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
