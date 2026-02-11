export interface ApiIntegrationInfoProps {
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

export interface ServiceNodeConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
  category: "auth" | "search" | "ocr" | "pageCount" | "deploy";
  externalUrl?: string;
  scrollTarget?: string;
}
