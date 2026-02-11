"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  Settings,
  Search,
  Key,
  Globe,
  ExternalLink,
  BookOpen,
  Library,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionStructureDiagram } from "./connection-structure-diagram";
import { ConnectionDocsLinks } from "./connection-docs-links";

interface ApiIntegrationInfoProps {
  apiInfo: {
    // 인증
    supabase: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      authMethods: {
        oauth: {
          kakao: string;
          google: string;
        };
        email: string;
      };
      urlStatus: string;
      anonKeyStatus: string;
      serviceRoleKeyStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };
    kakaoSdk: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      keyStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };

    // 검색
    naver: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      clientIdStatus: string;
      clientSecretStatus: string;
      apiReference: string;
      features: string[];
      notes: string;
    };

    // OCR
    cloudRunOcr: {
      provider: string;
      enabled: boolean;
      configured: boolean;
      url: string;
      urlStatus: string;
      authMethod: string;
      authStatus: string;
      description: string;
      apiReference: string;
      features: string[];
      notes: string;
      pricing?: {
        freeTier: string;
        costPerRequest: string;
        pricingLink: string;
      };
    };

    // 기타
    app: {
      appUrl: string;
      notes: string;
    };

    // 페이지 수 조회 API
    pageCountApis: {
      nlSeoji: {
        provider: string;
        enabled: boolean;
        configured: boolean;
        keyStatus: string;
        apiReference: string;
        features: string[];
        notes: string;
        priority: number;
      };
      aladin: {
        provider: string;
        enabled: boolean;
        configured: boolean;
        keyStatus: string;
        apiReference: string;
        features: string[];
        notes: string;
        priority: number;
      };
      googleBooks: {
        provider: string;
        enabled: boolean;
        configured: boolean;
        keyStatus: string;
        apiReference: string;
        features: string[];
        notes: string;
        priority: number;
      };
      summary: {
        totalApis: number;
        enabledApis: number;
        configuredApis: number;
        fallbackChain: string;
      };
    };

    // 권장 사항
    recommendations: Array<{
      type: string;
      message: string;
      action: string;
      priority: string;
      category: string;
    }>;

    // 요약
    summary: {
      totalApis: number;
      enabledApis: number;
      criticalApis: number;
      criticalEnabled: boolean;
      status: string;
    };
  };
  ocrMonthlyUsage?: Array<{
    month: string;
    year: number;
    fullDate: string;
    total: number;
    success: number;
    failure: number;
  }>;
  ocrTotalStats?: {
    total: number;
    success: number;
    failure: number;
    thisMonth: number;
    successRate: number;
  };
  ocrConnectionTest?: {
    url: string;
    urlConfigured: boolean;
    tokenGeneration: {
      success: boolean;
      method: "dynamic" | "static" | "none" | "unknown";
      message: string;
    };
    apiConnection: {
      success: boolean;
      statusCode: number;
      message: string;
      latencyMs: number;
    };
    overallStatus: "connected" | "token_error" | "api_error" | "unknown";
  };
  transcriptionStats?: {
    totalImageNotes: number;
    totalTranscriptions: number;
    completed: number;
    processing: number;
    failed: number;
    needingOcr: number;
    completionRate: number;
  };
}

export function ApiIntegrationInfo({ apiInfo, ocrMonthlyUsage, ocrTotalStats, ocrConnectionTest, transcriptionStats }: ApiIntegrationInfoProps) {
  const {
    supabase,
    kakaoSdk,
    naver,
    cloudRunOcr,
    pageCountApis,
    app,
    recommendations,
    summary
  } = apiInfo;

  // 카테고리별 권장 사항 분류
  const recommendationsByCategory = {
    인증: recommendations.filter(r => r.category === "인증"),
    검색: recommendations.filter(r => r.category === "검색"),
    OCR: recommendations.filter(r => r.category === "OCR"),
    페이지수: recommendations.filter(r => r.category === "페이지수"),
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 헤더 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">API 연동 정보</h1>
        <p className="text-muted-foreground">
          ReadingTree 서비스의 모든 외부 API 연동 현황 및 설정 정보
        </p>
      </div>

      {/* 연결 구조: 도식 + 요약 + 문서 링크 */}
      <div className="space-y-4">
        <ConnectionStructureDiagram />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              연결 요약
            </CardTitle>
            <CardDescription>현재 앱 기준 URL 및 인증·데이터·API 설정 상태</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">앱 기준 URL: </span>
              <span className="font-mono text-xs break-all">{app.appUrl}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={supabase.enabled ? "default" : "secondary"} className="text-xs">
                Supabase {supabase.enabled ? "활성" : "미설정"}
              </Badge>
              <Badge variant={kakaoSdk.enabled ? "default" : "secondary"} className="text-xs">
                Kakao SDK {kakaoSdk.enabled ? "활성" : "미설정"}
              </Badge>
              <Badge variant={naver.enabled ? "default" : "secondary"} className="text-xs">
                Naver 검색 {naver.enabled ? "활성" : "미설정"}
              </Badge>
              <Badge variant={cloudRunOcr.enabled ? "default" : "secondary"} className="text-xs">
                OCR {cloudRunOcr.enabled ? "활성" : "미설정"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <ConnectionDocsLinks />
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 API 수</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalApis}개</div>
            <p className="text-xs text-muted-foreground">현재 연동 가능한 외부 API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성화된 API</CardTitle>
            {summary.enabledApis > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.enabledApis}개</div>
            <p className="text-xs text-muted-foreground">현재 사용 중인 API</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">필수 API 상태</CardTitle>
            {summary.criticalEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.criticalEnabled ? "정상" : "누락"}
            </div>
            <p className="text-xs text-muted-foreground">
              필수 API {summary.criticalApis}개 중 {summary.criticalEnabled ? "모두" : "일부"} 설정됨
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 상태</CardTitle>
            <Badge 
              variant={summary.status === "완벽" ? "default" : summary.status === "정상" ? "default" : "destructive"}
              className="text-xs"
            >
              {summary.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{summary.status}</div>
            <p className="text-xs text-muted-foreground">전체 API 연동 상태</p>
          </CardContent>
        </Card>
      </div>

      {/* 긴급 권장 사항 */}
      {recommendationsByCategory.인증.some(r => r.type === "error") && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>긴급: 필수 API 설정 누락</AlertTitle>
          <AlertDescription>
            {recommendationsByCategory.인증
              .filter(r => r.type === "error")
              .map(r => r.message)
              .join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* 권장 사항 (카테고리별) */}
      {Object.entries(recommendationsByCategory).map(([category, recs]) => 
        recs.length > 0 && (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">
                {category} 관련 권장 사항
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.map((rec, index) => (
                <Alert 
                  key={index}
                  variant={
                    rec.type === "error" ? "destructive" :
                    rec.type === "warning" ? "default" :
                    rec.type === "success" ? "default" : "default"
                  }
                  className={cn(
                    rec.type === "success" && "border-green-500 bg-green-500/10"
                  )}
                >
                  {rec.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {rec.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  {rec.type === "error" && <XCircle className="h-4 w-4" />}
                  {rec.type === "info" && <Info className="h-4 w-4" />}
                  <AlertTitle className="flex items-center gap-2">
                    {rec.message}
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>{rec.action}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )
      )}

      {/* ========== 1. 인증 API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          인증 API
        </h2>

        {/* Supabase Auth */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className={cn("h-5 w-5", supabase.enabled ? "text-green-500" : "text-red-500")} />
                  {supabase.provider}
                </CardTitle>
                <CardDescription className="mt-2">
                  모든 인증 기능의 핵심 인프라
                </CardDescription>
              </div>
              <Badge variant={supabase.enabled ? "default" : "destructive"}>
                {supabase.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">Project URL</div>
                <div className="font-mono text-xs break-all">{supabase.urlStatus}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">Anon Key</div>
                <div className="font-mono text-xs break-all">{supabase.anonKeyStatus}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">Service Role Key</div>
                <div className="font-mono text-xs">{supabase.serviceRoleKeyStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">지원하는 인증 방법</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.oauth.kakao}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.oauth.google}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{supabase.authMethods.email}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {supabase.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={supabase.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Kakao SDK (선택사항) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className={cn("h-5 w-5", kakaoSdk.enabled ? "text-green-500" : "text-muted-foreground")} />
                  {kakaoSdk.provider}
                  <Badge variant="outline" className="text-xs">선택사항</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {kakaoSdk.notes}
                </CardDescription>
              </div>
              <Badge variant={kakaoSdk.enabled ? "default" : "secondary"}>
                {kakaoSdk.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium text-muted-foreground mb-1">App Key 상태</div>
              <div className="font-mono text-xs">{kakaoSdk.keyStatus}</div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {kakaoSdk.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={kakaoSdk.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 2. 검색 API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          검색 API
        </h2>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className={cn("h-5 w-5", naver.enabled ? "text-green-500" : "text-red-500")} />
                  {naver.provider}
                </CardTitle>
                <CardDescription className="mt-2">
                  {naver.notes}
                </CardDescription>
              </div>
              <Badge variant={naver.enabled ? "default" : "destructive"}>
                {naver.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground mb-1">Client ID</div>
                <div className="font-mono text-xs break-all">{naver.clientIdStatus}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">Client Secret</div>
                <div className="font-mono text-xs">{naver.clientSecretStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {naver.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a 
                href={naver.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 3. OCR API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          OCR API
        </h2>

        {/* Cloud Run OCR */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className={cn("h-5 w-5", cloudRunOcr.enabled ? "text-green-500" : "text-red-500")} />
                  {cloudRunOcr.provider}
                </CardTitle>
                <CardDescription className="mt-2">{cloudRunOcr.description}</CardDescription>
              </div>
              <Badge variant={cloudRunOcr.enabled ? "default" : "destructive"}>
                {cloudRunOcr.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">서비스 URL</div>
                <div className="font-mono text-xs break-all">{cloudRunOcr.url}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">URL 상태</div>
                <div className="font-mono text-xs">{cloudRunOcr.urlStatus}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground mb-1">인증 방법</div>
                <div className="font-mono text-xs">{cloudRunOcr.authMethod}</div>
              </div>
              <div className="col-span-2">
                <div className="font-medium text-muted-foreground mb-1">인증 상태</div>
                <div className="font-mono text-xs">{cloudRunOcr.authStatus}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {cloudRunOcr.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {cloudRunOcr.pricing && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium mb-2 text-sm">비용 정보</div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">무료 등급:</span> {cloudRunOcr.pricing.freeTier}
                  </div>
                  <div>
                    <span className="font-medium">유료 요금:</span> {cloudRunOcr.pricing.costPerRequest}
                  </div>
                  <a
                    href={cloudRunOcr.pricing.pricingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                  >
                    가격 책정 상세 보기 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* OCR 실시간 연결 테스트 결과 */}
            {ocrConnectionTest && (
              <div className={cn(
                "p-3 rounded-lg border",
                ocrConnectionTest.overallStatus === "connected"
                  ? "bg-green-500/10 border-green-500/30"
                  : ocrConnectionTest.overallStatus === "token_error"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              )}>
                <div className="font-medium mb-3 text-sm flex items-center gap-2">
                  {ocrConnectionTest.overallStatus === "connected" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : ocrConnectionTest.overallStatus === "token_error" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  실시간 연결 테스트
                  <Badge
                    variant={ocrConnectionTest.overallStatus === "connected" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {ocrConnectionTest.overallStatus === "connected"
                      ? "연결됨"
                      : ocrConnectionTest.overallStatus === "token_error"
                      ? "토큰 오류"
                      : "연결 실패"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">토큰 생성</div>
                    <div className="flex items-center gap-1">
                      {ocrConnectionTest.tokenGeneration.success ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">
                        {ocrConnectionTest.tokenGeneration.method === "dynamic"
                          ? "동적 토큰"
                          : ocrConnectionTest.tokenGeneration.method === "static"
                          ? "정적 토큰"
                          : "인증 없음"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">API 연결</div>
                    <div className="flex items-center gap-1">
                      {ocrConnectionTest.apiConnection.success ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs">
                        {ocrConnectionTest.apiConnection.success
                          ? `${ocrConnectionTest.apiConnection.latencyMs}ms`
                          : `오류 (${ocrConnectionTest.apiConnection.statusCode})`}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs mb-1">상세 메시지</div>
                    <div className="text-xs font-mono bg-background/50 p-2 rounded">
                      {ocrConnectionTest.apiConnection.message || ocrConnectionTest.tokenGeneration.message}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcription 처리 현황 */}
            {transcriptionStats && (
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="font-medium mb-3 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  OCR 처리 현황 (Transcription)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">전체 이미지 기록</div>
                    <div className="text-lg font-bold">{transcriptionStats.totalImageNotes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">처리 완료</div>
                    <div className="text-lg font-bold text-green-600">{transcriptionStats.completed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">처리 대기</div>
                    <div className="text-lg font-bold text-yellow-600">{transcriptionStats.needingOcr.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">실패</div>
                    <div className="text-lg font-bold text-red-600">{transcriptionStats.failed.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">처리 완료율</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${transcriptionStats.completionRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-purple-600">{transcriptionStats.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OCR 사용량 통계 */}
            {ocrTotalStats && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="font-medium mb-3 text-sm">실제 사용량 통계</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">전체 처리</div>
                    <div className="text-lg font-bold">{ocrTotalStats.total.toLocaleString()}건</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">이번 달</div>
                    <div className="text-lg font-bold text-blue-600">{ocrTotalStats.thisMonth.toLocaleString()}건</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">성공률</div>
                    <div className="text-lg font-bold text-green-600">{ocrTotalStats.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">성공/실패</div>
                    <div className="text-xs">
                      <span className="text-green-600">{ocrTotalStats.success.toLocaleString()}</span>
                      {" / "}
                      <span className="text-red-600">{ocrTotalStats.failure.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 월별 사용량 차트 */}
            {ocrMonthlyUsage && ocrMonthlyUsage.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="font-medium mb-3 text-sm">월별 사용량 추이 (최근 6개월)</div>
                <div className="h-[200px] flex items-end justify-between gap-2">
                  {ocrMonthlyUsage.map((item, i) => {
                    const maxUsage = Math.max(...ocrMonthlyUsage.map(m => m.total), 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className="w-full bg-blue-500/30 hover:bg-blue-500/50 transition-all rounded-t-md relative flex items-end justify-center border border-blue-500/20"
                          style={{ height: `${Math.max((item.total / maxUsage) * 150, 10)}px` }}
                        >
                          <span className="absolute -top-12 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-2 py-1 rounded border shadow-sm z-10">
                            {item.month}<br />
                            총 {item.total}건<br />
                            성공 {item.success}건<br />
                            실패 {item.failure}건
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <a 
                href={cloudRunOcr.apiReference} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 4. 도서 페이지 수 조회 API ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          도서 페이지 수 조회 API
        </h2>

        {/* 요약 카드 */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              API 폴백 체인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">조회 순서:</span>
                <code className="bg-white dark:bg-gray-900 px-2 py-1 rounded text-xs border">
                  {pageCountApis.summary.fallbackChain}
                </code>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">설정된 API:</span>{" "}
                  <span className="font-bold text-green-600">{pageCountApis.summary.enabledApis}</span>
                  <span className="text-muted-foreground">/{pageCountApis.summary.totalApis}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">구성 완료:</span>{" "}
                  <span className="font-bold">{pageCountApis.summary.configuredApis}</span>
                  <span className="text-muted-foreground">/{pageCountApis.summary.totalApis}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 국립중앙도서관 API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Library className={cn("h-5 w-5", pageCountApis.nlSeoji.enabled ? "text-green-500" : "text-red-500")} />
                  {pageCountApis.nlSeoji.provider}
                  <Badge variant="outline" className="text-xs">1순위</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {pageCountApis.nlSeoji.notes}
                </CardDescription>
              </div>
              <Badge variant={pageCountApis.nlSeoji.enabled ? "default" : "destructive"}>
                {pageCountApis.nlSeoji.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium text-muted-foreground mb-1">인증 키 상태</div>
              <div className="font-mono text-xs">{pageCountApis.nlSeoji.keyStatus}</div>
            </div>

            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {pageCountApis.nlSeoji.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a
                href={pageCountApis.nlSeoji.apiReference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* 알라딘 API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className={cn("h-5 w-5", pageCountApis.aladin.enabled ? "text-green-500" : "text-muted-foreground")} />
                  {pageCountApis.aladin.provider}
                  <Badge variant="outline" className="text-xs">2순위</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {pageCountApis.aladin.notes}
                </CardDescription>
              </div>
              <Badge variant={pageCountApis.aladin.enabled ? "default" : "secondary"}>
                {pageCountApis.aladin.enabled ? "활성화됨" : "비활성화됨"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium text-muted-foreground mb-1">인증 키 상태</div>
              <div className="font-mono text-xs">{pageCountApis.aladin.keyStatus}</div>
            </div>

            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {pageCountApis.aladin.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a
                href={pageCountApis.aladin.apiReference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Google Books API */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className={cn("h-5 w-5", pageCountApis.googleBooks.enabled ? "text-green-500" : "text-muted-foreground")} />
                  {pageCountApis.googleBooks.provider}
                  <Badge variant="outline" className="text-xs">3순위</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {pageCountApis.googleBooks.notes}
                </CardDescription>
              </div>
              <Badge variant={pageCountApis.googleBooks.enabled ? "default" : "secondary"}>
                {pageCountApis.googleBooks.configured ? "키 설정됨" : "키 없이 작동"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="font-medium text-muted-foreground mb-1">API 키 상태</div>
              <div className="font-mono text-xs">{pageCountApis.googleBooks.keyStatus}</div>
            </div>

            <div>
              <div className="font-medium mb-2">주요 기능</div>
              <ul className="space-y-1 text-sm">
                {pageCountApis.googleBooks.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <a
                href={pageCountApis.googleBooks.apiReference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                공식 문서 보기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 5. 기타 설정 ========== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            기타 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="font-medium text-muted-foreground mb-1">앱 기본 URL</div>
            <div className="font-mono text-xs break-all">{app.appUrl}</div>
            <p className="text-xs text-muted-foreground mt-2">{app.notes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
