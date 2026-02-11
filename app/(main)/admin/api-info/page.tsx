import { getApiIntegrationInfo, getOcrMonthlyUsage, getOcrTotalStats, testOcrConnection, getTranscriptionStats } from "@/app/actions/admin";
import { ApiInfoDashboard } from "@/components/admin/api-info/api-info-dashboard";
import { Metadata } from "next";
import { isAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "API 연동 정보 | 관리자 | ReadingTree",
    description: "ReadingTree 서비스의 모든 외부 API 연동 현황 및 설정 정보",
};

export default async function ApiInfoPage() {
    // 관리자 권한 확인
    const admin = await isAdmin();

    if (!admin) {
        // 관리자가 아닌 경우 홈으로 리다이렉트
        redirect("/");
    }

    // API 연동 정보 및 OCR 사용량 조회
    const [apiInfo, ocrMonthlyUsage, ocrTotalStats, ocrConnectionTest, transcriptionStats] = await Promise.all([
        getApiIntegrationInfo(),
        getOcrMonthlyUsage(),
        getOcrTotalStats(),
        testOcrConnection(),
        getTranscriptionStats(),
    ]);

    return (
        <div className="container py-8 max-w-7xl mx-auto">
            <ApiInfoDashboard
                apiInfo={apiInfo}
                ocrMonthlyUsage={ocrMonthlyUsage}
                ocrTotalStats={ocrTotalStats}
                ocrConnectionTest={ocrConnectionTest}
                transcriptionStats={transcriptionStats}
            />
        </div>
    );
}
