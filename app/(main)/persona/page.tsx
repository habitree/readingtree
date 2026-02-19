import { Suspense } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { getPersonaDashboardData } from "@/app/actions/persona";
import { PersonaCard, PersonaCardSkeleton } from "@/components/persona/persona-card";
import { ReadingStats, ReadingStatsSkeleton } from "@/components/persona/reading-stats";
import { PersonaAICard } from "@/components/persona/persona-ai-card";
import { PageHeader } from "@/components/layout/page-header";
import { getSamplePersonaDashboardData } from "@/app/actions/sample";

/**
 * 독서 성향 대시보드 페이지
 */
export default async function PersonaPage() {
  const user = await getCurrentUser();
  const isGuest = !user;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="persona.pageTitle" descriptionKey="persona.pageDesc" />

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
      <PersonaAICard />
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

      <PersonaAICard />
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
