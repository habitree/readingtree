"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/app/actions/auth";

/**
 * 관리자 권한 확인 및 예외 발생
 */
async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("관리자 권한이 필요합니다.");
    }
}

/**
 * 관리자용 전체 시스템 통계 조회
 */
export async function getAdminStats() {
    await requireAdmin();
    
    const supabase = await createServerSupabaseClient();

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
    
    const supabase = await createServerSupabaseClient();
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
    
    const supabase = await createServerSupabaseClient();

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
 * 월별 OCR 사용량 조회 (최근 6개월)
 * @returns 월별 OCR 처리 횟수 (성공/실패 포함)
 */
export async function getOcrMonthlyUsage() {
    await requireAdmin();
    
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        // 해당 월의 전체 OCR 처리 횟수
        const { count: totalCount } = await supabase
            .from("ocr_logs")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        // 해당 월의 성공한 OCR 처리 횟수
        const { count: successCount } = await supabase
            .from("ocr_logs")
            .select("*", { count: "exact", head: true })
            .eq("status", "success")
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        // 해당 월의 실패한 OCR 처리 횟수
        const { count: failureCount } = await supabase
            .from("ocr_logs")
            .select("*", { count: "exact", head: true })
            .eq("status", "failed")
            .gte("created_at", startOfMonth.toISOString())
            .lte("created_at", endOfMonth.toISOString());

        monthlyData.push({
            month: `${startOfMonth.getMonth() + 1}월`,
            year: startOfMonth.getFullYear(),
            fullDate: startOfMonth.toISOString(),
            total: totalCount || 0,
            success: successCount || 0,
            failure: failureCount || 0,
        });
    }

    return monthlyData;
}

/**
 * OCR 전체 통계 조회
 * @returns 전체 OCR 처리 통계 (총 처리 횟수, 성공/실패 횟수 등)
 */
export async function getOcrTotalStats() {
    await requireAdmin();
    
    const supabase = await createServerSupabaseClient();

    // 전체 OCR 처리 횟수
    const { count: totalCount } = await supabase
        .from("ocr_logs")
        .select("*", { count: "exact", head: true });

    // 성공한 OCR 처리 횟수
    const { count: successCount } = await supabase
        .from("ocr_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "success");

    // 실패한 OCR 처리 횟수
    const { count: failureCount } = await supabase
        .from("ocr_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

    // 이번 달 OCR 처리 횟수
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: thisMonthCount } = await supabase
        .from("ocr_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

    return {
        total: totalCount || 0,
        success: successCount || 0,
        failure: failureCount || 0,
        thisMonth: thisMonthCount || 0,
        successRate: totalCount && totalCount > 0 
            ? Math.round((successCount || 0) / totalCount * 100) 
            : 0,
    };
}

/**
 * OCR 배치 처리
 * 이미지가 있지만 OCR 처리가 안 된 모든 기록을 일괄 처리
 * 관리자만 실행 가능
 * @param batchSize 한 번에 처리할 최대 기록 수 (기본값: 10)
 * @returns 처리 결과
 */
export async function batchProcessOCR(batchSize: number = 10) {
    await requireAdmin();
    
    const supabase = await createServerSupabaseClient();

    // OCR 처리가 필요한 기록 조회
    // 1. image_url이 있는 기록
    // 2. type이 'photo' 또는 'transcription'인 기록
    // 3. transcriptions 테이블에 없거나 status가 'failed'인 기록
    const { data: notesNeedingOCR, error: queryError } = await supabase
        .from("notes")
        .select(`
            id,
            image_url,
            type,
            user_id
        `)
        .not("image_url", "is", null)
        .in("type", ["photo", "transcription"])
        .limit(batchSize);

    if (queryError) {
        console.error("OCR 배치 처리 - 기록 조회 오류:", queryError);
        throw new Error(`기록 조회 실패: ${queryError.message}`);
    }

    if (!notesNeedingOCR || notesNeedingOCR.length === 0) {
        return {
            success: true,
            processedCount: 0,
            failedCount: 0,
            totalFound: 0,
            totalNeedingOCR: 0,
            items: [],
            message: "OCR 처리가 필요한 기록이 없습니다.",
        };
    }

    // 각 기록에 대해 transcription 존재 여부 확인
    const noteIds = notesNeedingOCR.map(note => note.id);
    const { data: existingTranscriptions } = await supabase
        .from("transcriptions")
        .select("note_id, status")
        .in("note_id", noteIds);

    const transcriptionMap = new Map<string, string>();
    if (existingTranscriptions) {
        existingTranscriptions.forEach(t => {
            transcriptionMap.set(t.note_id, t.status);
        });
    }

    // OCR 처리가 필요한 기록만 필터링
    const notesToProcess = notesNeedingOCR.filter(note => {
        const status = transcriptionMap.get(note.id);
        // transcription이 없거나 status가 'failed'인 경우만 처리
        return !status || status === "failed";
    });

    if (notesToProcess.length === 0) {
        return {
            success: true,
            processedCount: 0,
            failedCount: 0,
            totalFound: notesNeedingOCR.length,
            totalNeedingOCR: 0,
            items: [],
            message: "모든 기록이 이미 OCR 처리되었거나 처리 중입니다.",
        };
    }

    // OCR 처리 로직 직접 호출 (Server Action에서 직접 처리)
    const { extractTextFromImage } = await import("@/lib/api/ocr");
    const { createTranscriptionInitial, createOrUpdateTranscription, updateTranscriptionStatus } = await import("@/app/actions/notes");
    const { recordOcrSuccess, recordOcrFailure } = await import("@/app/actions/ocr");
    const { validateImageUrl } = await import("@/lib/utils/image-url-validation");
    
    // OCR 처리를 비동기로 실행 (Promise.allSettled 사용)
    const processPromises = notesToProcess.map(async (note) => {
        const startTime = Date.now();
        try {
            // 0. 이미지 URL 유효성 검증 (OCR 처리 전)
            // 만료된 URL이나 접근 불가능한 이미지는 사전에 필터링하여 불필요한 OCR 처리 방지
            const validation = await validateImageUrl(note.image_url || "", 10000);
            
            if (!validation.valid) {
                // 이미지 URL이 유효하지 않으면 OCR 처리하지 않고 실패로 기록
                const errorMessage = validation.error || "이미지 URL이 유효하지 않습니다.";
                console.warn(`[OCR 배치 처리] 이미지 URL 유효성 검증 실패 - noteId: ${note.id}`, {
                    error: errorMessage,
                    status: validation.status,
                    imageUrl: note.image_url?.substring(0, 100) + "...",
                });
                
                // 실패 시 transcription 상태를 "failed"로 업데이트
                try {
                    await updateTranscriptionStatus(note.id, "failed");
                } catch (statusError) {
                    console.error(`Transcription 상태 업데이트 실패: noteId=${note.id}`, statusError);
                }
                
                // 실패 통계 기록
                try {
                    await recordOcrFailure(note.user_id, note.id, errorMessage, 0);
                } catch (statsError) {
                    console.error(`OCR 실패 통계 기록 실패: noteId=${note.id}`, statsError);
                }
                
                return {
                    noteId: note.id,
                    success: false,
                    error: errorMessage,
                    duration: 0,
                };
            }
            
            // 1. OCR 처리 (이미지에서 텍스트 추출)
            const extractedText = await extractTextFromImage(note.image_url);
            
            // 2. Transcription 저장
            await createOrUpdateTranscription(note.id, extractedText);
            
            // 3. 상태 확인 및 업데이트
            const { data: transcription } = await supabase
                .from("transcriptions")
                .select("id, status")
                .eq("note_id", note.id)
                .maybeSingle();
            
            if (transcription && transcription.status !== "completed") {
                await updateTranscriptionStatus(note.id, "completed");
            }
            
            // 4. 성공 통계 기록
            const duration = Date.now() - startTime;
            try {
                await recordOcrSuccess(note.user_id, note.id, duration);
            } catch (statsError) {
                console.error(`OCR 통계 기록 실패 (계속 진행): noteId=${note.id}`, statsError);
            }
            
            return {
                noteId: note.id,
                success: true,
                duration,
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            let errorMessage = error instanceof Error ? error.message : String(error);
            
            // 오류 메시지 개선 (사용자 친화적으로)
            if (errorMessage.includes("404") || errorMessage.includes("만료") || errorMessage.includes("유효하지 않")) {
                // 이미지 URL 만료/유효하지 않음
                errorMessage = "이미지 파일을 찾을 수 없습니다. 이미지 URL이 만료되었거나 삭제되었을 수 있습니다.";
            } else if (errorMessage.includes("403") || errorMessage.includes("401") || errorMessage.includes("접근")) {
                errorMessage = "이미지 접근 불가: 이미지에 접근할 수 없습니다. 권한이 없거나 파일이 삭제되었을 수 있습니다.";
            } else if (errorMessage.includes("timeout") || errorMessage.includes("타임아웃")) {
                errorMessage = "이미지 다운로드 타임아웃: 이미지 서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";
            }
            
            console.error(`OCR 처리 실패 - noteId: ${note.id}`, {
                error: errorMessage,
                originalError: error instanceof Error ? error.message : String(error),
                imageUrl: note.image_url?.substring(0, 100) + "...",
            });
            
            // 실패 시 transcription 상태를 "failed"로 업데이트
            try {
                await updateTranscriptionStatus(note.id, "failed");
            } catch (statusError) {
                console.error(`Transcription 상태 업데이트 실패: noteId=${note.id}`, statusError);
            }
            
            // 실패 통계 기록
            try {
                await recordOcrFailure(note.user_id, note.id, errorMessage, duration);
            } catch (statsError) {
                console.error(`OCR 실패 통계 기록 실패: noteId=${note.id}`, statsError);
            }
            
            return {
                noteId: note.id,
                success: false,
                error: errorMessage,
                duration,
            };
        }
    });

    // 모든 OCR 처리 요청 실행
    const results = await Promise.allSettled(processPromises);
    
    // 개별 항목 결과 추출
    const items: Array<{
        noteId: string;
        success: boolean;
        error?: string;
        duration?: number;
    }> = [];
    
    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            items.push({
                noteId: result.value.noteId,
                success: result.value.success,
                error: result.value.error,
                duration: result.value.duration,
            });
        } else {
            // Promise 자체가 실패한 경우
            const note = notesToProcess[index];
            items.push({
                noteId: note?.id || "unknown",
                success: false,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            });
        }
    });
    
    const successful = items.filter(item => item.success).length;
    const failed = items.filter(item => !item.success).length;

    return {
        success: true,
        processedCount: successful,
        failedCount: failed,
        totalFound: notesNeedingOCR.length,
        totalNeedingOCR: notesToProcess.length,
        items, // 개별 항목 상세 정보 추가
        message: `${successful}개의 기록에 대해 OCR 처리를 완료했습니다. ${failed}개 실패.`,
    };
}

/**
 * OCR 처리 대기 중인 기록 수 조회
 * 관리자만 실행 가능
 * @returns OCR 처리가 필요한 기록 수
 */
export async function getPendingOCRCount() {
    await requireAdmin();
    
    const supabase = await createServerSupabaseClient();

    // OCR 처리가 필요한 기록 수 조회
    const { count, error } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .not("image_url", "is", null)
        .in("type", ["photo", "transcription"]);

    if (error) {
        console.error("OCR 대기 기록 수 조회 오류:", error);
        throw new Error(`조회 실패: ${error.message}`);
    }

    // transcription이 없거나 failed인 기록 수 계산
    const { data: notesWithImages } = await supabase
        .from("notes")
        .select("id")
        .not("image_url", "is", null)
        .in("type", ["photo", "transcription"])
        .limit(1000); // 최대 1000개만 확인

    if (!notesWithImages || notesWithImages.length === 0) {
        return {
            total: 0,
            needingOCR: 0,
        };
    }

    const noteIds = notesWithImages.map(note => note.id);
    const { data: transcriptions } = await supabase
        .from("transcriptions")
        .select("note_id, status")
        .in("note_id", noteIds);

    const transcriptionMap = new Map<string, string>();
    if (transcriptions) {
        transcriptions.forEach(t => {
            transcriptionMap.set(t.note_id, t.status);
        });
    }

    const needingOCR = notesWithImages.filter(note => {
        const status = transcriptionMap.get(note.id);
        return !status || status === "failed";
    }).length;

    return {
        total: count || 0,
        needingOCR,
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
    
    // ========== 4. 기타 설정 ==========
    const appInfo = {
        appUrl: appUrl || "미설정",
        notes: "앱 기본 URL (OAuth 리다이렉트 등에 사용)",
    };
    
    // ========== 권장 설정 ==========
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
    
    // ========== 요약 통계 ==========
    const allApis = [
        { name: "Supabase Auth", enabled: supabaseInfo.enabled },
        { name: "Kakao SDK", enabled: kakaoSdkInfo.enabled },
        { name: "Naver Search", enabled: naverInfo.enabled },
        { name: "Cloud Run OCR", enabled: cloudRunOcrInfo.enabled },
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