"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimelineGroup } from "./timeline-group";
import { getTimeline, type TimelineSortBy } from "@/app/actions/stats";
import type { NoteWithBook } from "@/types/note";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

/**
 * 타임라인 컨텐츠 컴포넌트
 * 정렬 옵션 및 월별 그룹화 제공
 */
export function TimelineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<TimelineSortBy>(
    (searchParams.get("sort") as TimelineSortBy) || "latest"
  );
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [sortBy, page]);

  const loadTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await getTimeline(sortBy, page);
      setNotes(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("타임라인 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (value: TimelineSortBy) => {
    setSortBy(value);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1");
    router.push(`/timeline?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/timeline?${params.toString()}`);
  };

  // 월별 그룹화
  const groupedNotes = notes.reduce((acc, note) => {
    const month = format(new Date(note.created_at), "yyyy-MM");
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(note);
    return acc;
  }, {} as Record<string, NoteWithBook[]>);

  const sortedMonths = Object.keys(groupedNotes).sort((a, b) => {
    if (sortBy === "oldest") {
      return a.localeCompare(b);
    }
    return b.localeCompare(a);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 정렬 옵션 */}
      <div className="flex items-center justify-between">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t("timeline.latestFirst")}</SelectItem>
            <SelectItem value="oldest">{t("timeline.oldestFirst")}</SelectItem>
            <SelectItem value="book">{t("timeline.byBook")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 타임라인 */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("timeline.noNotes")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map((month) => (
            <TimelineGroup
              key={month}
              month={month}
              notes={groupedNotes[month]}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            {t("common.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </div>
  );
}

