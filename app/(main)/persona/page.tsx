import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { PersonaCard, PersonaCardSkeleton } from "@/components/persona/persona-card";
import { ReadingStats, ReadingStatsSkeleton } from "@/components/persona/reading-stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, User } from "lucide-react";
import Link from "next/link";

/**
 * 페르소나 대시보드 페이지
 */
export default async function PersonaPage() {
  const user = await getCurrentUser();

  // 게스트 사용자는 로그인 유도
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">내 독서 페르소나</h1>
          <p className="max-w-md text-muted-foreground">
            나의 독서 성향을 분석하고 개인화된 독서 프로필을 만들어보세요.
          </p>
        </div>
        <Card className="w-full max-w-md border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                페르소나 분석을 이용하려면 로그인이 필요합니다.
              </p>
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인하고 시작하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          내 독서 페르소나
        </h1>
        <p className="text-muted-foreground">
          독서 기록을 분석하여 나만의 독서 성향을 파악해보세요.
        </p>
      </div>

      <Suspense fallback={<PersonaContentSkeleton />}>
        <PersonaContent />
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
              페르소나를 바탕으로 맞춤 추천을 받아보세요.
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
