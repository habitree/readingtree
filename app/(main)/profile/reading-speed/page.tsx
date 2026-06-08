import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCachedCurrentUser } from "@/lib/cached";
import { getPaceSessions } from "@/app/actions/progress";
import { ReadingSpeedDetail } from "@/components/profile/reading-speed-detail";
import type { PaceSessionsResult } from "@/types/progress";

export const metadata: Metadata = {
  title: "내 독서 속도",
  description: "페이지당 독서 속도를 확인하고 기록을 관리하세요",
};

/**
 * 독서 속도 상세 페이지 (/profile/reading-speed)
 * 프로필의 "내 독서 속도" 카드에서 진입. 페이스 기여 세션 조회·수정·삭제.
 */
export default async function ReadingSpeedPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  let data: PaceSessionsResult;
  try {
    data = await getPaceSessions();
  } catch {
    data = { paced: [], timeOnly: [] };
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/profile"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          프로필
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">내 독서 속도</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          페이지당 독서 속도와 계산에 쓰인 기록을 확인하고, 잘못된 기록은 수정·삭제할 수 있어요.
        </p>
      </div>

      <ReadingSpeedDetail initialPaced={data.paced} initialTimeOnly={data.timeOnly} />
    </div>
  );
}
