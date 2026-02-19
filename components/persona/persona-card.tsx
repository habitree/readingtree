"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  FileText,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeAndSavePersona } from "@/app/actions/persona";
import { useTranslation } from "@/lib/i18n";
import type { UserPersona } from "@/types/persona";
import {
  ReadingPaceLabels,
  NoteStyleLabels,
  ActivityPatternLabels,
  GroupEngagementLabels,
} from "@/types/persona";

interface PersonaCardProps {
  persona: UserPersona | null;
  needsAnalysis: boolean;
  analysisAge: number;
  onRefresh?: () => void;
}

export function PersonaCard({
  persona,
  needsAnalysis,
  analysisAge,
  onRefresh,
}: PersonaCardProps) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeAndSavePersona();
      toast.success(t("persona.analysisComplete"));
      // 서버 컴포넌트 새로고침
      router.refresh();
      onRefresh?.();
    } catch (error) {
      console.error("페르소나 분석 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("persona.analysisFailed")
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 분석 결과가 없는 경우
  if (!persona) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("persona.myReadingPersona")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>{t("persona.noPersonaYet")}</p>
            <p className="text-sm">{t("persona.noPersonaDesc")}</p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("persona.analyzing")}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("persona.analyzePersona")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("persona.myReadingPersona")}</CardTitle>
        <div className="flex items-center gap-2">
          {needsAnalysis && (
            <Badge variant="outline" className="text-xs">
              {t("persona.updateRecommended")}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 페르소나 요약 */}
        {persona.persona_summary && (
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm leading-relaxed">{persona.persona_summary}</p>
          </div>
        )}

        {/* 성향 배지 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 독서 속도 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("persona.readingPaceLabel")}</p>
              <p className="font-medium">
                {persona.reading_pace
                  ? ReadingPaceLabels[persona.reading_pace as keyof typeof ReadingPaceLabels]
                  : t("persona.needsAnalysis")}
              </p>
            </div>
          </div>

          {/* 기록 스타일 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("persona.noteStyleLabel")}</p>
              <p className="font-medium">
                {persona.note_style
                  ? NoteStyleLabels[persona.note_style as keyof typeof NoteStyleLabels]
                  : t("persona.needsAnalysis")}
              </p>
            </div>
          </div>

          {/* 활동 시간 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("persona.activityTime")}</p>
              <p className="font-medium">
                {persona.activity_pattern
                  ? ActivityPatternLabels[persona.activity_pattern as keyof typeof ActivityPatternLabels]
                  : t("persona.needsAnalysis")}
              </p>
            </div>
          </div>

          {/* 그룹 참여 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("persona.groupStyle")}</p>
              <p className="font-medium">
                {persona.group_engagement
                  ? GroupEngagementLabels[persona.group_engagement as keyof typeof GroupEngagementLabels]
                  : t("persona.needsAnalysis")}
              </p>
            </div>
          </div>
        </div>

        {/* 마지막 분석 시간 */}
        <p className="text-xs text-muted-foreground">
          {t("persona.lastAnalysis", { hours: String(analysisAge) })}
        </p>
      </CardContent>
    </Card>
  );
}

export function PersonaCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
