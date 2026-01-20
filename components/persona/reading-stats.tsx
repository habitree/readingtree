"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  BookCheck,
  FileText,
  Quote,
  Pencil,
  Camera,
  FileSignature,
} from "lucide-react";
import type { UserPersona } from "@/types/persona";
import type { ReadingStats as ReadingStatsType, CategoryPreference } from "@/types/persona";

interface ReadingStatsProps {
  persona: UserPersona | null;
}

export function ReadingStats({ persona }: ReadingStatsProps) {
  if (!persona) {
    return null;
  }

  const stats = persona.reading_stats as ReadingStatsType | null;
  const categories = persona.category_preferences as CategoryPreference[] | null;

  if (!stats) {
    return null;
  }

  const totalNoteTypes =
    stats.noteTypeDistribution.quote +
    stats.noteTypeDistribution.memo +
    stats.noteTypeDistribution.photo +
    stats.noteTypeDistribution.transcription;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 독서 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">독서 통계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
                <p className="text-xs text-muted-foreground">총 책</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                <BookCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedBooks}</p>
                <p className="text-xs text-muted-foreground">완독</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalNotes}</p>
                <p className="text-xs text-muted-foreground">총 기록</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.averageReadingDays || "-"}
                </p>
                <p className="text-xs text-muted-foreground">평균 독서일</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기록 유형 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기록 유형 분포</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {totalNoteTypes > 0 ? (
            <>
              {/* 인용구 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-muted-foreground" />
                    <span>인용구</span>
                  </div>
                  <span className="text-muted-foreground">
                    {stats.noteTypeDistribution.quote}개
                  </span>
                </div>
                <Progress
                  value={(stats.noteTypeDistribution.quote / totalNoteTypes) * 100}
                  className="h-2"
                />
              </div>

              {/* 메모 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                    <span>메모</span>
                  </div>
                  <span className="text-muted-foreground">
                    {stats.noteTypeDistribution.memo}개
                  </span>
                </div>
                <Progress
                  value={(stats.noteTypeDistribution.memo / totalNoteTypes) * 100}
                  className="h-2"
                />
              </div>

              {/* 사진 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>사진</span>
                  </div>
                  <span className="text-muted-foreground">
                    {stats.noteTypeDistribution.photo}개
                  </span>
                </div>
                <Progress
                  value={(stats.noteTypeDistribution.photo / totalNoteTypes) * 100}
                  className="h-2"
                />
              </div>

              {/* 필사 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-muted-foreground" />
                    <span>필사</span>
                  </div>
                  <span className="text-muted-foreground">
                    {stats.noteTypeDistribution.transcription}개
                  </span>
                </div>
                <Progress
                  value={(stats.noteTypeDistribution.transcription / totalNoteTypes) * 100}
                  className="h-2"
                />
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              기록이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 선호 카테고리 */}
      {categories && categories.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">선호 카테고리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, index) => (
                <Badge
                  key={cat.category}
                  variant={index === 0 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {cat.category} ({cat.count}권, {cat.percentage}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ReadingStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
