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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeAndSavePersona();
      toast.success("페르소나 분석이 완료되었습니다!");
      // 서버 컴포넌트 새로고침
      router.refresh();
      onRefresh?.();
    } catch (error) {
      console.error("페르소나 분석 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "분석에 실패했습니다. 다시 시도해주세요."
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
          <CardTitle>내 독서 페르소나</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>아직 분석된 페르소나가 없습니다.</p>
            <p className="text-sm">독서 기록을 분석하여 나만의 페르소나를 만들어보세요!</p>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                페르소나 분석하기
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
        <CardTitle>내 독서 페르소나</CardTitle>
        <div className="flex items-center gap-2">
          {needsAnalysis && (
            <Badge variant="outline" className="text-xs">
              업데이트 권장
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
              <p className="text-xs text-muted-foreground">독서 속도</p>
              <p className="font-medium">
                {persona.reading_pace
                  ? ReadingPaceLabels[persona.reading_pace as keyof typeof ReadingPaceLabels]
                  : "분석 필요"}
              </p>
            </div>
          </div>

          {/* 기록 스타일 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">기록 스타일</p>
              <p className="font-medium">
                {persona.note_style
                  ? NoteStyleLabels[persona.note_style as keyof typeof NoteStyleLabels]
                  : "분석 필요"}
              </p>
            </div>
          </div>

          {/* 활동 시간 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">활동 시간</p>
              <p className="font-medium">
                {persona.activity_pattern
                  ? ActivityPatternLabels[persona.activity_pattern as keyof typeof ActivityPatternLabels]
                  : "분석 필요"}
              </p>
            </div>
          </div>

          {/* 그룹 참여 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">모임 스타일</p>
              <p className="font-medium">
                {persona.group_engagement
                  ? GroupEngagementLabels[persona.group_engagement as keyof typeof GroupEngagementLabels]
                  : "분석 필요"}
              </p>
            </div>
          </div>
        </div>

        {/* 마지막 분석 시간 */}
        <p className="text-xs text-muted-foreground">
          마지막 분석: {analysisAge}시간 전
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
