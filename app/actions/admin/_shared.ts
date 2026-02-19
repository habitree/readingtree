import { isAdmin } from "@/app/actions/auth";

/**
 * 관리자 권한 확인 및 예외 발생
 */
export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("관리자 권한이 필요합니다.");
    }
}
