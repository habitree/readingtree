"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateImageUrl } from "@/lib/utils/image-url-validation";
import { GoogleAuth } from "google-auth-library";
import { requireAdmin } from "./_shared";

/**
 * 월별 OCR 사용량 조회 (최근 6개월)
 * @returns 월별 OCR 처리 횟수 (성공/실패 포함)
 */
export async function getOcrMonthlyUsage() {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();
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

    const supabase = createAdminSupabaseClient();

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
 * OCR API 연결 상태 테스트
 * 실제 OCR 서비스에 연결하여 상태를 확인
 * @returns 연결 상태 정보
 */
export async function testOcrConnection() {
    await requireAdmin();

    const CLOUD_RUN_OCR_URL = process.env.CLOUD_RUN_OCR_URL ||
        "https://extracttextfromimage-236647437750.us-central1.run.app";

    const result = {
        url: CLOUD_RUN_OCR_URL,
        urlConfigured: !!process.env.CLOUD_RUN_OCR_URL,
        tokenGeneration: {
            success: false,
            method: "unknown" as "dynamic" | "static" | "none",
            message: "",
        },
        apiConnection: {
            success: false,
            statusCode: 0,
            message: "",
            latencyMs: 0,
        },
        overallStatus: "unknown" as "connected" | "token_error" | "api_error" | "unknown",
    };

    // 1. 토큰 생성 테스트
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const staticToken = process.env.CLOUD_RUN_OCR_AUTH_TOKEN;

    let authToken: string | null = null;

    if (serviceAccountKey) {
        result.tokenGeneration.method = "dynamic";
        try {
            const credentials = JSON.parse(serviceAccountKey);
            const auth = new GoogleAuth({ credentials });
            const idTokenClient = await auth.getIdTokenClient(CLOUD_RUN_OCR_URL);
            authToken = await idTokenClient.idTokenProvider.fetchIdToken(CLOUD_RUN_OCR_URL);
            result.tokenGeneration.success = true;
            result.tokenGeneration.message = `동적 토큰 생성 성공 (길이: ${authToken.length})`;
        } catch (error) {
            result.tokenGeneration.success = false;
            result.tokenGeneration.message = `동적 토큰 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`;
            result.overallStatus = "token_error";
            return result;
        }
    } else if (staticToken) {
        result.tokenGeneration.method = "static";
        result.tokenGeneration.success = true;
        result.tokenGeneration.message = "정적 토큰 사용 중";
        authToken = staticToken;
    } else {
        result.tokenGeneration.method = "none";
        result.tokenGeneration.success = true;
        result.tokenGeneration.message = "인증 없음 (공개 함수 가정)";
    }

    // 2. API 연결 테스트 (간단한 Health Check)
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const startTime = Date.now();

        // 아주 작은 테스트 이미지 (1x1 투명 PNG)
        const testImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        const response = await fetch(CLOUD_RUN_OCR_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
                image: testImage,
                mimeType: "image/png",
            }),
            signal: AbortSignal.timeout(30000),
        });

        result.apiConnection.latencyMs = Date.now() - startTime;
        result.apiConnection.statusCode = response.status;

        if (response.ok) {
            result.apiConnection.success = true;
            result.apiConnection.message = `연결 성공 (응답 시간: ${result.apiConnection.latencyMs}ms)`;
            result.overallStatus = "connected";
        } else {
            // 403은 인증 문제, 400/500은 API 문제
            const errorText = await response.text().catch(() => "");
            result.apiConnection.success = false;
            result.apiConnection.message = `API 오류: ${response.status} - ${errorText.substring(0, 100)}`;
            result.overallStatus = response.status === 403 ? "token_error" : "api_error";
        }
    } catch (error) {
        result.apiConnection.success = false;
        result.apiConnection.message = `연결 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`;
        result.overallStatus = "api_error";
    }

    return result;
}

/**
 * Transcription 통계 조회 (transcriptions 테이블 기반)
 * @returns 전체 Transcription 처리 현황
 */
export async function getTranscriptionStats() {
    await requireAdmin();

    // 서비스 역할 키를 사용하여 모든 사용자의 기록에 접근 (RLS 우회)
    const supabase = createAdminSupabaseClient();

    // 이미지가 있는 notes 수 (photo, transcription 타입)
    const { count: totalImageNotes } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .not("image_url", "is", null)
        .in("type", ["photo", "transcription"]);

    // 전체 transcription 수
    const { count: totalTranscriptions } = await supabase
        .from("transcriptions")
        .select("*", { count: "exact", head: true });

    // 상태별 transcription 수
    const { count: completedCount } = await supabase
        .from("transcriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

    const { count: processingCount } = await supabase
        .from("transcriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "processing");

    const { count: failedCount } = await supabase
        .from("transcriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

    // OCR 처리가 필요한 기록 수 계산
    const { data: notesWithImages } = await supabase
        .from("notes")
        .select("id")
        .not("image_url", "is", null)
        .in("type", ["photo", "transcription"])
        .limit(2000);

    let needingOcrCount = 0;
    if (notesWithImages && notesWithImages.length > 0) {
        const noteIds = notesWithImages.map(n => n.id);
        const { data: transcriptions } = await supabase
            .from("transcriptions")
            .select("note_id, status")
            .in("note_id", noteIds);

        const transcriptionMap = new Map<string, string>();
        transcriptions?.forEach(t => {
            transcriptionMap.set(t.note_id, t.status);
        });

        needingOcrCount = notesWithImages.filter(note => {
            const status = transcriptionMap.get(note.id);
            return !status || status === "failed";
        }).length;
    }

    return {
        totalImageNotes: totalImageNotes || 0,
        totalTranscriptions: totalTranscriptions || 0,
        completed: completedCount || 0,
        processing: processingCount || 0,
        failed: failedCount || 0,
        needingOcr: needingOcrCount,
        completionRate: (totalImageNotes && totalImageNotes > 0)
            ? Math.round(((completedCount || 0) / totalImageNotes) * 100)
            : 0,
    };
}

/**
 * OCR 배치 처리
 * 이미지가 있지만 OCR 처리가 안 된 모든 기록을 일괄 처리
 * 관리자만 실행 가능
 * @param batchSize 한 번에 처리할 최대 기록 수 (기본값: 50)
 * @returns 처리 결과
 */
export async function batchProcessOCR(batchSize: number = 50) {
    await requireAdmin();

    // 서비스 역할 키를 사용하여 RLS 우회 (모든 사용자의 기록에 접근 가능)
    const supabase = createAdminSupabaseClient();

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

    // OCR 처리 로직 직접 호출
    const { extractTextFromImage } = await import("@/lib/api/ocr");
    const { recordOcrSuccess, recordOcrFailure } = await import("@/app/actions/ocr");

    // 헬퍼 함수: Transcription 생성 또는 업데이트 (서비스 역할 키 사용, RLS 우회)
    const createOrUpdateTranscriptionAdmin = async (noteId: string, extractedText: string) => {
        const { data: existing } = await supabase
            .from("transcriptions")
            .select("id")
            .eq("note_id", noteId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from("transcriptions")
                .update({
                    extracted_text: extractedText.trim(),
                    status: "completed",
                })
                .eq("id", existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("transcriptions")
                .insert({
                    note_id: noteId,
                    extracted_text: extractedText.trim(),
                    quote_content: null,
                    memo_content: null,
                    status: "completed",
                });
            if (error) throw error;
        }
    };

    // 헬퍼 함수: Transcription 상태 업데이트 (서비스 역할 키 사용, RLS 우회)
    const updateTranscriptionStatusAdmin = async (noteId: string, status: "processing" | "completed" | "failed") => {
        // 기존 transcription이 있으면 업데이트, 없으면 생성
        const { data: existing } = await supabase
            .from("transcriptions")
            .select("id")
            .eq("note_id", noteId)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("transcriptions")
                .update({ status })
                .eq("id", existing.id);
        } else {
            await supabase
                .from("transcriptions")
                .insert({
                    note_id: noteId,
                    status,
                    extracted_text: null,
                });
        }
    };

    // OCR 처리를 비동기로 실행 (Promise.allSettled 사용)
    const processPromises = notesToProcess.map(async (note) => {
        const startTime = Date.now();
        try {
            // 0. 이미지 URL 유효성 검증 (OCR 처리 전)
            const validation = await validateImageUrl(note.image_url || "", 10000);

            if (!validation.valid) {
                const errorMessage = validation.error || "이미지 URL이 유효하지 않습니다.";
                console.warn(`[OCR 배치 처리] 이미지 URL 유효성 검증 실패 - noteId: ${note.id}`, {
                    error: errorMessage,
                    status: validation.status,
                });

                // 실패 시 transcription 상태를 "failed"로 업데이트 (서비스 역할 키 사용)
                try {
                    await updateTranscriptionStatusAdmin(note.id, "failed");
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

            // 2. Transcription 저장 (서비스 역할 키 사용, RLS 우회)
            await createOrUpdateTranscriptionAdmin(note.id, extractedText);

            // 3. 성공 통계 기록
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

            // 실패 시 transcription 상태를 "failed"로 업데이트 (서비스 역할 키 사용, RLS 우회)
            try {
                await updateTranscriptionStatusAdmin(note.id, "failed");
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

    // 서비스 역할 키를 사용하여 모든 사용자의 기록에 접근 (RLS 우회)
    const supabase = createAdminSupabaseClient();

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
 * 비정상 이미지 데이터 타입 정의
 */
export type InvalidImageReason =
    | "empty_url"           // image_url이 null이거나 빈 문자열
    | "invalid_url_format"  // URL 형식이 잘못됨
    | "file_not_found"      // 실제 파일이 존재하지 않음 (404)
    | "access_denied"       // 접근 거부 (403/401)
    | "not_image"           // 이미지 파일이 아님
    | "timeout"             // 타임아웃
    | "other_error";        // 기타 오류

export interface InvalidImageNote {
    id: string;
    user_id: string;
    book_id: string;
    type: string;
    image_url: string | null;
    created_at: string;
    reason: InvalidImageReason;
    error_message: string;
}

/**
 * 비정상 이미지 데이터 조회
 * 관리자만 실행 가능
 * @param limit 조회할 최대 레코드 수 (기본값: 100)
 * @param checkStorage Storage에 실제 파일 존재 여부 확인 (기본값: true)
 * @returns 비정상 이미지 데이터 목록
 */
export async function getInvalidImageNotes(
    limit: number = 100,
    checkStorage: boolean = true
): Promise<{
    success: boolean;
    data: InvalidImageNote[];
    summary: {
        total: number;
        emptyUrl: number;
        invalidFormat: number;
        fileNotFound: number;
        accessDenied: number;
        notImage: number;
        timeout: number;
        otherError: number;
    };
    message: string;
}> {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();
    const invalidNotes: InvalidImageNote[] = [];

    // 1. type이 photo/transcription인 기록 조회
    const { data: photoNotes, error: queryError } = await supabase
        .from("notes")
        .select("id, user_id, book_id, type, image_url, created_at")
        .in("type", ["photo", "transcription"])
        .order("created_at", { ascending: false })
        .limit(limit);

    if (queryError) {
        console.error("비정상 이미지 데이터 조회 오류:", queryError);
        throw new Error(`조회 실패: ${queryError.message}`);
    }

    if (!photoNotes || photoNotes.length === 0) {
        return {
            success: true,
            data: [],
            summary: {
                total: 0,
                emptyUrl: 0,
                invalidFormat: 0,
                fileNotFound: 0,
                accessDenied: 0,
                notImage: 0,
                timeout: 0,
                otherError: 0,
            },
            message: "photo/transcription 타입의 기록이 없습니다.",
        };
    }

    // 2. 각 기록에 대해 이미지 URL 검증
    for (const note of photoNotes) {
        // 2-1. image_url이 없는 경우
        if (!note.image_url || note.image_url.trim() === "") {
            invalidNotes.push({
                ...note,
                reason: "empty_url",
                error_message: "이미지 URL이 비어있습니다.",
            });
            continue;
        }

        // 2-2. URL 형식 검증
        try {
            new URL(note.image_url);
        } catch {
            invalidNotes.push({
                ...note,
                reason: "invalid_url_format",
                error_message: "유효하지 않은 URL 형식입니다.",
            });
            continue;
        }

        // 2-3. Storage에 실제 파일 존재 여부 확인 (선택적)
        if (checkStorage) {
            const validation = await validateImageUrl(note.image_url, 10000);

            if (!validation.valid) {
                let reason: InvalidImageReason = "other_error";

                if (validation.status === 404) {
                    reason = "file_not_found";
                } else if (validation.status === 403 || validation.status === 401) {
                    reason = "access_denied";
                } else if (validation.error?.includes("이미지 파일이 아닙니다")) {
                    reason = "not_image";
                } else if (validation.error?.includes("타임아웃")) {
                    reason = "timeout";
                }

                invalidNotes.push({
                    ...note,
                    reason,
                    error_message: validation.error || "알 수 없는 오류",
                });
            }
        }
    }

    // 3. 요약 통계 계산
    const summary = {
        total: invalidNotes.length,
        emptyUrl: invalidNotes.filter(n => n.reason === "empty_url").length,
        invalidFormat: invalidNotes.filter(n => n.reason === "invalid_url_format").length,
        fileNotFound: invalidNotes.filter(n => n.reason === "file_not_found").length,
        accessDenied: invalidNotes.filter(n => n.reason === "access_denied").length,
        notImage: invalidNotes.filter(n => n.reason === "not_image").length,
        timeout: invalidNotes.filter(n => n.reason === "timeout").length,
        otherError: invalidNotes.filter(n => n.reason === "other_error").length,
    };

    return {
        success: true,
        data: invalidNotes,
        summary,
        message: `${photoNotes.length}개의 기록 중 ${invalidNotes.length}개의 비정상 데이터를 발견했습니다.`,
    };
}

/**
 * 비정상 이미지 데이터 삭제
 * 관리자만 실행 가능
 * @param noteIds 삭제할 기록 ID 배열 (비어있으면 모든 비정상 데이터 삭제)
 * @param deleteStorage Storage에서 파일도 삭제할지 여부 (기본값: true)
 * @returns 삭제 결과
 */
export async function cleanupInvalidImageNotes(
    noteIds?: string[],
    deleteStorage: boolean = true
): Promise<{
    success: boolean;
    deletedCount: number;
    failedCount: number;
    details: Array<{
        noteId: string;
        success: boolean;
        error?: string;
    }>;
    message: string;
}> {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    // noteIds가 없으면 비정상 데이터 조회
    let targetNoteIds = noteIds;
    if (!targetNoteIds || targetNoteIds.length === 0) {
        const invalidResult = await getInvalidImageNotes(500, true);
        targetNoteIds = invalidResult.data.map(n => n.id);
    }

    if (targetNoteIds.length === 0) {
        return {
            success: true,
            deletedCount: 0,
            failedCount: 0,
            details: [],
            message: "삭제할 비정상 데이터가 없습니다.",
        };
    }

    const details: Array<{
        noteId: string;
        success: boolean;
        error?: string;
    }> = [];

    // 각 기록 삭제
    for (const noteId of targetNoteIds) {
        try {
            // 기록 조회 (Storage 삭제용)
            const { data: note, error: fetchError } = await supabase
                .from("notes")
                .select("id, image_url")
                .eq("id", noteId)
                .maybeSingle();

            if (fetchError) {
                details.push({
                    noteId,
                    success: false,
                    error: `조회 실패: ${fetchError.message}`,
                });
                continue;
            }

            if (!note) {
                details.push({
                    noteId,
                    success: false,
                    error: "기록을 찾을 수 없습니다.",
                });
                continue;
            }

            // Storage에서 파일 삭제 (선택적)
            if (deleteStorage && note.image_url) {
                try {
                    const url = new URL(note.image_url);
                    const pathParts = url.pathname.split("/storage/v1/object/public/");

                    if (pathParts.length === 2) {
                        const fullPath = pathParts[1];
                        const pathSegments = fullPath.split("/");

                        if (pathSegments.length >= 2) {
                            const bucket = pathSegments[0];
                            const filePath = pathSegments.slice(1).join("/");

                            await supabase.storage
                                .from(bucket)
                                .remove([filePath]);
                        }
                    }
                } catch (storageError) {
                    // Storage 삭제 실패해도 기록은 삭제 진행
                    console.warn(`Storage 파일 삭제 실패 (계속 진행): ${noteId}`, storageError);
                }
            }

            // 데이터베이스에서 기록 삭제
            const { error: deleteError } = await supabase
                .from("notes")
                .delete()
                .eq("id", noteId);

            if (deleteError) {
                details.push({
                    noteId,
                    success: false,
                    error: `삭제 실패: ${deleteError.message}`,
                });
                continue;
            }

            details.push({
                noteId,
                success: true,
            });
        } catch (error) {
            details.push({
                noteId,
                success: false,
                error: error instanceof Error ? error.message : "알 수 없는 오류",
            });
        }
    }

    const deletedCount = details.filter(d => d.success).length;
    const failedCount = details.filter(d => !d.success).length;

    return {
        success: true,
        deletedCount,
        failedCount,
        details,
        message: `${deletedCount}개의 기록을 삭제했습니다. ${failedCount}개 실패.`,
    };
}
