import { Metadata } from "next";
import { Stamp as StampIcon } from "lucide-react";
import { getReadingStamps } from "@/app/actions/progress";
import { getCachedCurrentUser } from "@/lib/cached";
import { StampCollectionGrid } from "@/components/stamps/stamp-collection-grid";
import { redirect } from "next/navigation";
import type { ReadingStamp } from "@/types/progress";

export const metadata: Metadata = {
  title: "내 스탬프 | ReadTree",
  description: "사진과 함께 남긴 독서 스탬프 컬렉션",
};

/**
 * /stamps — 사용자의 모든 스탬프 컬렉션 페이지.
 * 사진이 있는 reading_logs (image_url IS NOT NULL) 만 노출.
 */
export default async function StampsPage() {
  const user = await getCachedCurrentUser();
  if (!user) {
    redirect("/login?next=/stamps");
  }

  let initialStamps: ReadingStamp[] = [];
  let initialCursor: string | null = null;
  try {
    const result = await getReadingStamps({ limit: 30 }, user);
    initialStamps = result.stamps;
    initialCursor = result.nextCursor;
  } catch {
    initialStamps = [];
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-2 py-4 sm:px-4 sm:py-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <StampIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            내 스탬프
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            사진과 함께 남긴 독서 스탬프 {initialStamps.length}개
          </p>
        </div>
      </header>

      <StampCollectionGrid
        initialStamps={initialStamps}
        initialNextCursor={initialCursor}
        showBookInfo
        showCaptureCTA
      />
    </div>
  );
}
