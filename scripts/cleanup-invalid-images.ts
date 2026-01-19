/**
 * 비정상 이미지 데이터 정리 스크립트
 * 사용법: npx tsx scripts/cleanup-invalid-images.ts [--dry-run]
 *
 * --dry-run: 삭제하지 않고 비정상 데이터만 조회
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// .env.local 파일 로드
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
    console.error("필요한 환경 변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type InvalidImageReason =
    | "empty_url"
    | "invalid_url_format"
    | "file_not_found"
    | "access_denied"
    | "not_image"
    | "timeout"
    | "other_error";

interface InvalidNote {
    id: string;
    user_id: string;
    book_id: string;
    type: string;
    image_url: string | null;
    created_at: string;
    reason: InvalidImageReason;
    error_message: string;
}

async function validateImageUrl(imageUrl: string, timeout: number = 10000): Promise<{ valid: boolean; error?: string; status?: number }> {
    try {
        try {
            new URL(imageUrl);
        } catch {
            return { valid: false, error: "유효하지 않은 URL 형식입니다." };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(imageUrl, {
                method: "HEAD",
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; ReadingTree/1.0)",
                },
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.startsWith("image/")) {
                    return { valid: true };
                } else {
                    return { valid: false, error: "이미지 파일이 아닙니다.", status: response.status };
                }
            }

            if (response.status === 404) {
                return { valid: false, error: "이미지 파일을 찾을 수 없습니다 (404).", status: 404 };
            }

            if (response.status === 403 || response.status === 401) {
                return { valid: false, error: `이미지 접근 거부됨 (${response.status}).`, status: response.status };
            }

            return { valid: false, error: `이미지 접근 실패: ${response.status}`, status: response.status };
        } catch (fetchError) {
            clearTimeout(timeoutId);
            const errorMessage = fetchError instanceof Error ? fetchError.message : "알 수 없는 오류";

            if (errorMessage.includes("aborted") || errorMessage.includes("timeout")) {
                return { valid: false, error: "이미지 다운로드 타임아웃" };
            }

            return { valid: false, error: `이미지 접근 실패: ${errorMessage}` };
        }
    } catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
    }
}

async function getInvalidImageNotes(limit: number = 500): Promise<InvalidNote[]> {
    console.log("📋 photo/transcription 타입의 기록을 조회합니다...\n");

    const { data: photoNotes, error: queryError } = await supabase
        .from("notes")
        .select("id, user_id, book_id, type, image_url, created_at")
        .in("type", ["photo", "transcription"])
        .order("created_at", { ascending: false })
        .limit(limit);

    if (queryError) {
        throw new Error(`조회 실패: ${queryError.message}`);
    }

    if (!photoNotes || photoNotes.length === 0) {
        console.log("ℹ️ photo/transcription 타입의 기록이 없습니다.");
        return [];
    }

    console.log(`📊 총 ${photoNotes.length}개의 기록을 조회했습니다.`);
    console.log("🔍 각 이미지 URL의 유효성을 검사합니다...\n");

    const invalidNotes: InvalidNote[] = [];
    let checked = 0;

    for (const note of photoNotes) {
        checked++;
        process.stdout.write(`\r  진행률: ${checked}/${photoNotes.length} (${Math.round(checked / photoNotes.length * 100)}%)`);

        // image_url이 없는 경우
        if (!note.image_url || note.image_url.trim() === "") {
            invalidNotes.push({
                ...note,
                reason: "empty_url",
                error_message: "이미지 URL이 비어있습니다.",
            });
            continue;
        }

        // URL 형식 검증
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

        // Storage에 실제 파일 존재 여부 확인
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

    console.log("\n");
    return invalidNotes;
}

async function deleteNotes(notes: InvalidNote[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const note of notes) {
        try {
            // Storage에서 파일 삭제 시도
            if (note.image_url) {
                try {
                    const url = new URL(note.image_url);
                    const pathParts = url.pathname.split("/storage/v1/object/public/");

                    if (pathParts.length === 2) {
                        const fullPath = pathParts[1];
                        const pathSegments = fullPath.split("/");

                        if (pathSegments.length >= 2) {
                            const bucket = pathSegments[0];
                            const filePath = pathSegments.slice(1).join("/");

                            await supabase.storage.from(bucket).remove([filePath]);
                        }
                    }
                } catch {
                    // Storage 삭제 실패해도 계속 진행
                }
            }

            // 데이터베이스에서 삭제
            const { error: deleteError } = await supabase
                .from("notes")
                .delete()
                .eq("id", note.id);

            if (deleteError) {
                console.error(`  ❌ 삭제 실패 (${note.id}): ${deleteError.message}`);
                failed++;
            } else {
                deleted++;
            }
        } catch (error) {
            console.error(`  ❌ 오류 (${note.id}): ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            failed++;
        }
    }

    return { deleted, failed };
}

async function main() {
    const isDryRun = process.argv.includes("--dry-run");

    console.log("=" .repeat(60));
    console.log("🧹 비정상 이미지 데이터 정리 스크립트");
    console.log("=" .repeat(60));
    console.log(`모드: ${isDryRun ? "🔍 조회만 (dry-run)" : "🗑️ 삭제 실행"}`);
    console.log("");

    try {
        const invalidNotes = await getInvalidImageNotes(500);

        if (invalidNotes.length === 0) {
            console.log("✅ 비정상 이미지 데이터가 없습니다!");
            return;
        }

        // 통계 출력
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

        console.log("📊 비정상 데이터 요약:");
        console.log("-" .repeat(40));
        console.log(`  총 비정상 데이터: ${summary.total}개`);
        if (summary.emptyUrl > 0) console.log(`  - 빈 URL: ${summary.emptyUrl}개`);
        if (summary.invalidFormat > 0) console.log(`  - 잘못된 URL 형식: ${summary.invalidFormat}개`);
        if (summary.fileNotFound > 0) console.log(`  - 파일 없음 (404): ${summary.fileNotFound}개`);
        if (summary.accessDenied > 0) console.log(`  - 접근 거부: ${summary.accessDenied}개`);
        if (summary.notImage > 0) console.log(`  - 이미지 아님: ${summary.notImage}개`);
        if (summary.timeout > 0) console.log(`  - 타임아웃: ${summary.timeout}개`);
        if (summary.otherError > 0) console.log(`  - 기타 오류: ${summary.otherError}개`);
        console.log("");

        // 상세 목록 출력 (최대 20개)
        console.log("📋 비정상 데이터 상세 (최대 20개):");
        console.log("-" .repeat(60));
        invalidNotes.slice(0, 20).forEach((note, index) => {
            console.log(`  ${index + 1}. ID: ${note.id}`);
            console.log(`     타입: ${note.type}, 이유: ${note.reason}`);
            console.log(`     오류: ${note.error_message}`);
            if (note.image_url) {
                console.log(`     URL: ${note.image_url.substring(0, 80)}...`);
            }
            console.log("");
        });

        if (invalidNotes.length > 20) {
            console.log(`  ... 외 ${invalidNotes.length - 20}개 더 있음`);
            console.log("");
        }

        if (isDryRun) {
            console.log("ℹ️ --dry-run 모드입니다. 실제 삭제는 수행되지 않습니다.");
            console.log("   삭제를 실행하려면 --dry-run 옵션 없이 실행하세요.");
            return;
        }

        // 삭제 실행
        console.log("🗑️ 비정상 데이터를 삭제합니다...");
        const { deleted, failed } = await deleteNotes(invalidNotes);

        console.log("");
        console.log("=" .repeat(60));
        console.log("✅ 작업 완료!");
        console.log(`  삭제 성공: ${deleted}개`);
        if (failed > 0) console.log(`  삭제 실패: ${failed}개`);
        console.log("=" .repeat(60));

    } catch (error) {
        console.error("❌ 오류 발생:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
