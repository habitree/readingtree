import Link from "next/link";
import { Gauge, BookOpenCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getUserReadingTimeStats } from "@/app/actions/progress";
import { formatPacePerPage } from "@/lib/reading/pace";
import { formatDuration } from "@/lib/utils/duration";

/**
 * 프로필 "내 독서 속도" 카드 (서버 컴포넌트).
 *
 * 전체 페이지당 평균 속도를 보여준다. 적격 세션(페이지+시간 기록)이 없으면
 * 렌더하지 않는다(신규 계정 빈 상태 회피).
 * 카드를 누르면 상세(/profile/reading-speed)로 이동해 기록 확인·수정·삭제.
 */
export async function ReadingSpeedCard() {
  let stats;
  try {
    stats = await getUserReadingTimeStats();
  } catch {
    return null;
  }

  if (stats.pacePerPageSeconds == null || stats.pacePerPageSeconds <= 0) {
    return null;
  }

  return (
    <Link href="/profile/reading-speed" aria-label="내 독서 속도 상세 보기" className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-xl bg-rose-50 p-2.5 dark:bg-rose-950/30">
            <Gauge className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">내 독서 속도</p>
            <p className="text-xl font-bold tabular-nums">
              페이지당 {formatPacePerPage(stats.pacePerPageSeconds)}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <p className="flex items-center justify-end gap-1">
              <BookOpenCheck className="h-3.5 w-3.5" />
              {stats.totalPagesRead.toLocaleString()}p
            </p>
            <p className="mt-0.5">{formatDuration(stats.totalSeconds)}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </CardContent>
      </Card>
    </Link>
  );
}
