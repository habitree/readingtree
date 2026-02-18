import { Suspense } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { PersonaCard, PersonaCardSkeleton } from "@/components/persona/persona-card";
import { ReadingStats, ReadingStatsSkeleton } from "@/components/persona/reading-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSamplePersonaDashboardData } from "@/app/actions/sample";

/**
 * 독서 성향 대시보드 페이지
 */
export default async function PersonaPage() {
  const user = await getCurrentUser();
  const isGuest = !user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          독서 성향
        </h1>
        <p className="text-muted-foreground">
          독서 기록을 분석하여 나만의 독서 성향을 파악해보세요.
        </p>
      </div>

      <Suspense fallback={<PersonaContentSkeleton />}>
        {isGuest ? <GuestPersonaContent /> : <PersonaContent />}
      </Suspense>
    </div>
  );
}

async function PersonaContent() {
  const data = await getPersonaDashboardData();

  return (
    <div className="space-y-6">
      <PersonaCard
        persona={data.persona}
        needsAnalysis={data.needsAnalysis}
        analysisAge={data.analysisAge}
      />
      <ReadingStats persona={data.persona} />

      {/* AI 챗봇 바로가기 */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium">AI 독서 도우미와 대화하기</h3>
            <p className="text-sm text-muted-foreground">
              독서 성향을 바탕으로 맞춤 추천을 받아보세요.
            </p>
          </div>
          <Button asChild>
            <Link href="/chat">대화 시작</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

async function GuestPersonaContent() {
  const data = await getSamplePersonaDashboardData();

  return (
    <div className="space-y-6">
      <PersonaCard
        persona={data.persona}
        needsAnalysis={false}
        analysisAge={0}
      />
      <ReadingStats persona={data.persona} />

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-medium">AI 독서 도우미와 대화하기</h3>
            <p className="text-sm text-muted-foreground">
              독서 성향을 바탕으로 맞춤 추천을 받아보세요.
            </p>
          </div>
          <Button asChild>
            <Link href="/chat">대화 시작</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonaContentSkeleton() {
  return (
    <div className="space-y-6">
      <PersonaCardSkeleton />
      <ReadingStatsSkeleton />
    </div>
  );
}
