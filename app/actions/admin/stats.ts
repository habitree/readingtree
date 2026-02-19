"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./_shared";

/**
 * 관리자용 전체 시스템 통계 조회
 */
export async function getAdminStats() {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    // 전체 사용자 수
    const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

    // 전체 도서 수
    const { count: totalBooks } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

    // 전체 기록 수
    const { count: totalNotes } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true });

    // 전체 그룹 수
    const { count: totalGroups } = await supabase
        .from("groups")
        .select("*", { count: "exact", head: true });

    // 최근 24시간 내 생성된 데이터
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const yesterdayISO = yesterday.toISOString();

    const { count: newUsersToday } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayISO);

    const { count: newNotesToday } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayISO);

    return {
        summary: {
            users: totalUsers || 0,
            books: totalBooks || 0,
            notes: totalNotes || 0,
            groups: totalGroups || 0,
        },
        today: {
            newUsers: newUsersToday || 0,
            newNotes: newNotesToday || 0,
        }
    };
}

/**
 * 월별 사용자 성장 데이터 조회 (최근 6개월)
 */
export async function getUserGrowthData() {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();
    const now = new Date();
    const growthData = [];

    for (let i = 5; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        growthData.push({
            month: `${startOfMonth.getMonth() + 1}월`,
            count: count || 0,
            fullDate: startOfMonth.toISOString(),
        });
    }

    return growthData;
}

/**
 * 최근 시스템 활동 조회 (최근 가입자 및 최근 기록)
 */
export async function getRecentSystemActivity() {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    // 최근 가입한 사용자 5명
    const { data: recentUsers } = await supabase
        .from("users")
        .select("id, name, email, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    // 최근 작성된 기록 5개
    const { data: recentNotes } = await supabase
        .from("notes")
        .select(`
      id,
      content,
      type,
      created_at,
      user_id,
      users (name),
      books (title)
    `)
        .order("created_at", { ascending: false })
        .limit(10);

    return {
        recentUsers: recentUsers || [],
        recentNotes: recentNotes || [],
    };
}

/**
 * API 연동 정보 조회
 * 현재 설정된 모든 외부 API 정보 및 상태 확인
 */
export async function getApiIntegrationInfo() {
    await requireAdmin();

    // ========== 환경 변수 확인 ==========
    // 인증 관련
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

    // 검색 관련
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    // 기타
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // ========== 1. 인증 API (Supabase Auth) ==========
    const supabaseInfo = {
        provider: "Supabase Authentication",
        enabled: !!(supabaseUrl && supabaseAnonKey),
        configured: !!(supabaseUrl && supabaseAnonKey),
        authMethods: {
            oauth: {
                kakao: "카카오 OAuth 로그인",
                google: "구글 OAuth 로그인",
            },
            email: "이메일/비밀번호 로그인",
        },
        urlStatus: supabaseUrl
            ? `설정됨 (${supabaseUrl.substring(0, 30)}...)`
            : "미설정",
        anonKeyStatus: supabaseAnonKey
            ? `설정됨 (${supabaseAnonKey.substring(0, 20)}...)`
            : "미설정",
        serviceRoleKeyStatus: supabaseServiceRoleKey
            ? "설정됨 (현재 미사용)"
            : "미설정 (선택사항)",
        apiReference: "https://supabase.com/docs/guides/auth",
        features: [
            "OAuth 소셜 로그인 (카카오, 구글)",
            "이메일/비밀번호 인증",
            "세션 관리 (쿠키 기반)",
            "Row Level Security (RLS) 지원",
        ],
        notes: "모든 인증 기능의 핵심 인프라",
    };

    // 카카오 JavaScript SDK (선택사항)
    const kakaoSdkInfo = {
        provider: "Kakao JavaScript SDK",
        enabled: !!kakaoAppKey,
        configured: !!kakaoAppKey,
        keyStatus: kakaoAppKey
            ? `설정됨 (${kakaoAppKey.substring(0, 10)}...)`
            : "미설정",
        apiReference: "https://developers.kakao.com/docs",
        features: [
            "카카오톡 공유 기능 (선택사항)",
            "카카오 로그인 (Supabase OAuth 사용 시 불필요)",
        ],
        notes: "선택사항. Supabase OAuth만으로도 카카오 로그인 가능",
    };

    // ========== 2. 검색 API (Naver Book Search) ==========
    const naverInfo = {
        provider: "Naver Book Search API",
        enabled: !!(naverClientId && naverClientSecret),
        configured: !!(naverClientId && naverClientSecret),
        clientIdStatus: naverClientId
            ? `설정됨 (${naverClientId.substring(0, 10)}...)`
            : "미설정",
        clientSecretStatus: naverClientSecret
            ? "설정됨"
            : "미설정",
        apiReference: "https://developers.naver.com/docs/search/book/",
        features: [
            "책 검색 기능",
            "책 정보 자동 수집 (제목, 저자, 출판사, ISBN 등)",
            "책 표지 이미지 제공",
            "Rate Limit: 분당 60회",
        ],
        notes: "책 검색 기능에 필수",
    };

    // ========== 3. OCR API (Cloud Run OCR) ==========
    const cloudRunOcrUrl = process.env.CLOUD_RUN_OCR_URL ||
      "https://us-central1-habitree-f49e1.cloudfunctions.net/extractTextFromImage";

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const staticAuthToken = process.env.CLOUD_RUN_OCR_AUTH_TOKEN;

    const cloudRunOcrInfo = {
        provider: "Google Cloud Run OCR",
        enabled: true, // 기본 URL이 있으므로 항상 활성화
        configured: !!process.env.CLOUD_RUN_OCR_URL,
        url: cloudRunOcrUrl,
        urlStatus: process.env.CLOUD_RUN_OCR_URL
            ? `설정됨 (${process.env.CLOUD_RUN_OCR_URL.substring(0, 50)}...)`
            : "기본값 사용",
        authMethod: serviceAccountKey
            ? "동적 토큰 생성 (서비스 계정 키)"
            : staticAuthToken
            ? "정적 토큰 (환경 변수)"
            : "인증 없음 (공개 함수)",
        authStatus: serviceAccountKey
            ? "동적 토큰 생성 (자동 갱신)"
            : staticAuthToken
            ? "정적 토큰 설정됨 (1시간마다 수동 갱신 필요)"
            : "미설정 (공개 함수 가정)",
        description: "Google Cloud Run OCR 서비스를 사용한 OCR 처리",
        apiReference: "https://cloud.google.com/run",
        features: [
            "서버리스 자동 확장",
            "매월 200만 건 무료 요청",
            "매월 1,000개 이미지 무료",
            "1회 처리(3매)당 약 7원 (무료 한도 초과 시)",
            "이미지 최대 크기: 10MB",
            "동적 토큰 자동 갱신 (권장)",
        ],
        notes: "OCR 처리의 단일 제공자 (가장 경제적이고 안정적)",
        pricing: {
            freeTier: "매월 200만 건 요청 무료, 매월 1,000개 이미지 무료",
            costPerRequest: "1회 처리(3매)당 약 7원 (무료 한도 초과 시)",
            pricingLink: "https://cloud.google.com/run/pricing?hl=ko",
        },
    };

    // ========== 4. AI 서비스 ==========
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // DB에서 활성 AI 설정 조회
    const supabase = createAdminSupabaseClient();
    const { data: activeAISetting } = await supabase
        .from("ai_settings")
        .select("provider, model_id")
        .eq("is_active", true)
        .maybeSingle();

    const aiServicesInfo = {
        activeProvider: activeAISetting?.provider || "미설정",
        activeModel: activeAISetting?.model_id || "미설정",
        providers: {
            openai: {
                provider: "OpenAI",
                enabled: !!openaiKey,
                keyStatus: openaiKey
                    ? `설정됨 (${openaiKey.substring(0, 10)}...)`
                    : "미설정",
                models: ["GPT-4o", "GPT-4o Mini", "GPT-4 Turbo", "GPT-3.5 Turbo"],
                apiReference: "https://platform.openai.com/docs",
            },
            google: {
                provider: "Google AI (Gemini)",
                enabled: !!geminiKey,
                keyStatus: geminiKey
                    ? `설정됨 (${geminiKey.substring(0, 10)}...)`
                    : "미설정",
                models: ["Gemini 2.0 Flash", "Gemini 1.5 Pro", "Gemini 2.0 Flash Thinking"],
                apiReference: "https://ai.google.dev/docs",
            },
            anthropic: {
                provider: "Anthropic (Claude)",
                enabled: !!anthropicKey,
                keyStatus: anthropicKey
                    ? `설정됨 (${anthropicKey.substring(0, 10)}...)`
                    : "미설정",
                models: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"],
                apiReference: "https://docs.anthropic.com",
            },
        },
        features: [
            "독서 AI 어시스턴트 (챗봇)",
            "책 추천 및 독서 코칭",
            "독서 기록 분석 및 인사이트",
            "멀티 프로바이더 지원 (폴백)",
            "스트리밍 응답 (SSE)",
        ],
        notes: "독서친구 AI 챗봇 서비스. 3개 프로바이더 중 1개 이상 설정 필요",
        enabled: !!(openaiKey || geminiKey || anthropicKey),
    };

    // ========== 5. 도서 페이지 수 조회 API ==========
    const nlSeojiKey = process.env.NL_SEOJI_CERT_KEY;
    const aladinKey = process.env.ALADIN_TTB_KEY;
    const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY;

    const nlSeojiInfo = {
        provider: "국립중앙도서관 ISBN서지정보 API",
        enabled: !!nlSeojiKey,
        configured: !!nlSeojiKey,
        keyStatus: nlSeojiKey
            ? `설정됨 (${nlSeojiKey.substring(0, 15)}...)`
            : "미설정",
        apiReference: "https://www.nl.go.kr/NL/contents/N31101030500.do",
        features: [
            "한국 도서 공식 서지정보",
            "ISBN 기반 도서 검색",
            "페이지 수, 발행일 등 상세 정보",
            "높은 정확도 (한국 도서 86%+)",
        ],
        notes: "한국 도서 페이지 수 조회 1순위",
        priority: 1,
    };

    const aladinInfo = {
        provider: "알라딘 Open API",
        enabled: !!aladinKey,
        configured: !!aladinKey,
        keyStatus: aladinKey
            ? `설정됨 (${aladinKey.substring(0, 15)}...)`
            : "미설정",
        apiReference: "https://docs.aladin.co.kr/",
        features: [
            "한국 최대 온라인 서점 데이터",
            "ISBN 기반 도서 검색",
            "페이지 수, 가격, 평점 정보",
            "국립중앙도서관 미등록 도서 보완",
        ],
        notes: "한국 도서 페이지 수 조회 2순위 (폴백)",
        priority: 2,
    };

    const googleBooksInfo = {
        provider: "Google Books API",
        enabled: true, // 키 없이도 작동
        configured: !!googleBooksKey,
        keyStatus: googleBooksKey
            ? `설정됨 (${googleBooksKey.substring(0, 15)}...)`
            : "미설정 (키 없이 작동)",
        apiReference: "https://developers.google.com/books",
        features: [
            "전 세계 도서 데이터베이스",
            "ISBN 기반 도서 검색",
            "해외 도서 페이지 수 조회",
            "키 없이 일일 ~1,000회 무료",
        ],
        notes: "해외 도서 및 최종 폴백 (3순위)",
        priority: 3,
    };

    // 페이지 수 API 요약
    const pageCountApiSummary = {
        totalApis: 3,
        enabledApis: [nlSeojiInfo.enabled, aladinInfo.enabled, googleBooksInfo.enabled].filter(Boolean).length,
        configuredApis: [nlSeojiInfo.configured, aladinInfo.configured, googleBooksInfo.configured].filter(Boolean).length,
        fallbackChain: "국립중앙도서관 → 알라딘 → Google Books",
    };

    // ========== 6. 기타 설정 ==========
    const appInfo = {
        appUrl: appUrl || "미설정",
        notes: "앱 기본 URL (OAuth 리다이렉트 등에 사용)",
    };

    // ========== 7. 권장 설정 ==========
    const recommendations = [];

    // 인증 관련
    if (!supabaseInfo.enabled) {
        recommendations.push({
            type: "error",
            message: "Supabase 인증 설정이 누락되었습니다!",
            action: "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
            priority: "긴급",
            category: "인증",
        });
    }

    // 검색 관련
    if (!naverInfo.enabled) {
        recommendations.push({
            type: "warning",
            message: "네이버 책 검색 API가 설정되지 않았습니다.",
            action: "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정하세요.",
            priority: "높음",
            category: "검색",
        });
    }

    // OCR 관련
    if (!cloudRunOcrInfo.enabled) {
        recommendations.push({
            type: "error",
            message: "Cloud Run OCR이 비활성화되었습니다!",
            action: "CLOUD_RUN_OCR_URL 환경 변수를 확인하세요.",
            priority: "긴급",
            category: "OCR",
        });
    } else if (!serviceAccountKey && !staticAuthToken) {
        recommendations.push({
            type: "warning",
            message: "Cloud Run OCR 인증 토큰이 설정되지 않았습니다.",
            action: "비공개 함수인 경우 GOOGLE_SERVICE_ACCOUNT_KEY 또는 CLOUD_RUN_OCR_AUTH_TOKEN을 설정하세요.",
            priority: "높음",
            category: "OCR",
        });
    } else if (serviceAccountKey) {
        recommendations.push({
            type: "success",
            message: "Cloud Run OCR이 정상적으로 설정되었습니다! (동적 토큰 생성)",
            action: "자동 토큰 갱신으로 안정적인 OCR 서비스를 제공합니다.",
            priority: "정상",
            category: "OCR",
        });
    } else {
        recommendations.push({
            type: "info",
            message: "Cloud Run OCR이 정상적으로 설정되었습니다! (정적 토큰)",
            action: "토큰 만료 시 수동 갱신이 필요합니다. GOOGLE_SERVICE_ACCOUNT_KEY 사용을 권장합니다.",
            priority: "정상",
            category: "OCR",
        });
    }

    // 페이지 수 조회 API 관련
    if (nlSeojiInfo.enabled && aladinInfo.enabled) {
        recommendations.push({
            type: "success",
            message: "도서 페이지 수 API가 모두 설정되었습니다!",
            action: `폴백 체인: ${pageCountApiSummary.fallbackChain}`,
            priority: "정상",
            category: "페이지수",
        });
    } else if (nlSeojiInfo.enabled || aladinInfo.enabled) {
        recommendations.push({
            type: "info",
            message: `도서 페이지 수 API 일부 설정됨 (${pageCountApiSummary.enabledApis}/3)`,
            action: "국립중앙도서관(NL_SEOJI_CERT_KEY)과 알라딘(ALADIN_TTB_KEY) 설정을 권장합니다.",
            priority: "보통",
            category: "페이지수",
        });
    } else {
        recommendations.push({
            type: "warning",
            message: "도서 페이지 수 조회 API가 설정되지 않았습니다.",
            action: "NL_SEOJI_CERT_KEY, ALADIN_TTB_KEY 환경 변수를 설정하세요. Google Books는 키 없이 작동합니다.",
            priority: "보통",
            category: "페이지수",
        });
    }

    // AI 서비스 관련
    const aiKeyCount = [!!openaiKey, !!geminiKey, !!anthropicKey].filter(Boolean).length;
    if (aiKeyCount === 0) {
        recommendations.push({
            type: "warning",
            message: "AI 챗봇 API 키가 설정되지 않았습니다.",
            action: "OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY 중 하나 이상을 설정하세요.",
            priority: "보통",
            category: "AI",
        });
    } else if (aiKeyCount < 3) {
        recommendations.push({
            type: "info",
            message: `AI 프로바이더 일부 설정됨 (${aiKeyCount}/3)`,
            action: `현재 활성: ${aiServicesInfo.activeProvider}. 폴백을 위해 추가 프로바이더 설정을 권장합니다.`,
            priority: "보통",
            category: "AI",
        });
    } else {
        recommendations.push({
            type: "success",
            message: "AI 챗봇 프로바이더가 모두 설정되었습니다!",
            action: `현재 활성: ${aiServicesInfo.activeProvider} (${aiServicesInfo.activeModel})`,
            priority: "정상",
            category: "AI",
        });
    }

    // ========== 요약 통계 ==========
    const allApis = [
        { name: "Supabase Auth", enabled: supabaseInfo.enabled },
        { name: "Kakao SDK", enabled: kakaoSdkInfo.enabled },
        { name: "Naver Search", enabled: naverInfo.enabled },
        { name: "Cloud Run OCR", enabled: cloudRunOcrInfo.enabled },
        { name: "국립중앙도서관", enabled: nlSeojiInfo.enabled },
        { name: "알라딘", enabled: aladinInfo.enabled },
        { name: "Google Books", enabled: googleBooksInfo.enabled },
        { name: "AI 챗봇", enabled: aiServicesInfo.enabled },
    ];

    const enabledApis = allApis.filter(api => api.enabled).length;
    const criticalApis = [
        supabaseInfo.enabled, // 필수
        naverInfo.enabled, // 필수
    ];
    const allCriticalEnabled = criticalApis.every(Boolean);

    return {
        // 인증
        supabase: supabaseInfo,
        kakaoSdk: kakaoSdkInfo,

        // 검색
        naver: naverInfo,

        // OCR
        cloudRunOcr: cloudRunOcrInfo,

        // AI 서비스
        aiServices: aiServicesInfo,

        // 페이지 수 조회 API
        pageCountApis: {
            nlSeoji: nlSeojiInfo,
            aladin: aladinInfo,
            googleBooks: googleBooksInfo,
            summary: pageCountApiSummary,
        },

        // 기타
        app: appInfo,

        // 권장 사항
        recommendations,

        // 요약
        summary: {
            totalApis: allApis.length,
            enabledApis,
            criticalApis: criticalApis.length,
            criticalEnabled: allCriticalEnabled,
            status: allCriticalEnabled
                ? (enabledApis === allApis.length ? "완벽" : "정상")
                : "설정 필요",
        },
    };
}
