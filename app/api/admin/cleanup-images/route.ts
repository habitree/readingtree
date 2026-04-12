import { NextRequest, NextResponse } from "next/server";
import { getInvalidImageNotes, cleanupInvalidImageNotes } from "@/app/actions/admin";
import { isAdmin } from "@/app/actions/auth";

/**
 * GET: 비정상 이미지 데이터 조회
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "100", 10);
        const checkStorage = searchParams.get("checkStorage") !== "false";

        const result = await getInvalidImageNotes(limit, checkStorage);

        return NextResponse.json(result);
    } catch (error) {
        console.error("비정상 이미지 데이터 조회 오류:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "알 수 없는 오류",
            },
            { status: error instanceof Error && error.message.includes("관리자") ? 403 : 500 }
        );
    }
}

/**
 * POST: 비정상 이미지 데이터 삭제
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await isAdmin();
        if (!admin) {
            return NextResponse.json({ success: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const noteIds = body.noteIds as string[] | undefined;
        const deleteStorage = body.deleteStorage !== false;

        const result = await cleanupInvalidImageNotes(noteIds, deleteStorage);

        return NextResponse.json(result);
    } catch (error) {
        console.error("비정상 이미지 데이터 삭제 오류:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "알 수 없는 오류",
            },
            { status: error instanceof Error && error.message.includes("관리자") ? 403 : 500 }
        );
    }
}
