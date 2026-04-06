"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  ArrowUpDown,
  List,
  Clock,
  BookOpen,
  SlidersHorizontal,
  X,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { NotesGroupedView } from "@/components/notes/notes-grouped-view";
import { TagCloud } from "@/components/notes/tag-cloud";
import { DraftBanner } from "@/components/notes/draft-banner";
import { TimelineGroup } from "@/components/timeline/timeline-group";
import { useTranslation } from "@/lib/i18n";
import type { NoteWithBook } from "@/types/note";
import { cn } from "@/lib/utils";

interface TagWithCount {
  tag: string;
  count: number;
}

interface NotesHubClientProps {
  notes: NoteWithBook[];
  tags: TagWithCount[];
  draftCount: number;
  activeTab?: string;
  activeView?: "list" | "timeline" | "book";
  sort?: string;
  searchQuery?: string;
  // 페이지네이션
  total?: number;
  totalPages?: number;
  currentPage?: number;
  // 활성 필터
  activeBookId?: string;
  activeStartDate?: string;
  activeEndDate?: string;
  activeTags?: string[];
}

/**
 * 메인 탭: 전체 | 인박스(N) | 구절 | 생각 | 사진 | 필사 | 진행
 */
const MAIN_TABS = [
  { value: "all", labelKey: "notes.statusAll" },
  { value: "inbox", labelKey: "notes.statusDraft" },
  { value: "quote", labelKey: "notes.typeQuote" },
  { value: "memo", labelKey: "notes.typeMemo" },
  { value: "photo", labelKey: "notes.typePhoto" },
  { value: "transcription", labelKey: "notes.typeTranscription" },
  { value: "progress", labelKey: "notes.progressRecord" },
] as const;

const VIEW_MODES = [
  { value: "list", icon: List, labelKey: "notes.viewList" },
  { value: "timeline", icon: Clock, labelKey: "notes.viewTimeline" },
  { value: "book", icon: BookOpen, labelKey: "notes.viewBook" },
] as const;

/**
 * 통합 기록 허브 클라이언트
 * 내기록 + 검색 + 타임라인을 하나로 통합
 */
export function NotesHubClient({
  notes,
  tags,
  draftCount,
  activeTab = "all",
  activeView = "list",
  sort = "latest",
  searchQuery = "",
  total = 0,
  totalPages = 0,
  currentPage = 1,
  activeBookId,
  activeStartDate,
  activeEndDate,
  activeTags,
}: NotesHubClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL 동기화
  useEffect(() => {
    setLocalQuery(searchQuery || "");
  }, [searchQuery]);

  // URL 파라미터 업데이트 헬퍼
  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      // 업데이트 적용
      Object.entries(updates).forEach(([key, val]) => {
        if (val && val !== "all" && val !== "list" && val !== "latest") {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });

      // 필터/탭 변경 시 page 리셋
      if ("tab" in updates || "q" in updates || "bookId" in updates || "tags" in updates) {
        params.delete("page");
      }

      const qs = params.toString();
      router.push(qs ? `/notes?${qs}` : "/notes");
    },
    [router, searchParams]
  );

  // 검색 디바운스
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateUrl({ q: value || undefined });
      }, 300);
    },
    [updateUrl]
  );

  // 정렬 순환: latest → oldest → (book — 타임라인/책별 뷰에서만)
  const handleSortToggle = () => {
    const sortOptions = activeView === "timeline" || activeView === "book"
      ? ["latest", "oldest", "book"]
      : ["latest", "oldest"];
    const currentIdx = sortOptions.indexOf(sort);
    const nextSort = sortOptions[(currentIdx + 1) % sortOptions.length];
    updateUrl({ sort: nextSort });
  };

  const sortLabel =
    sort === "oldest"
      ? t("notes.sortOldest" as Parameters<typeof t>[0])
      : sort === "book"
        ? t("notes.viewBook" as Parameters<typeof t>[0])
        : t("notes.sortLatest" as Parameters<typeof t>[0]);

  // 활성 필터 칩
  const hasActiveFilters = !!(activeBookId || activeStartDate || activeEndDate || (activeTags && activeTags.length > 0));

  // 월별 그룹화 (타임라인 뷰)
  const groupByMonth = (items: NoteWithBook[]) => {
    const groups: Record<string, NoteWithBook[]> = {};
    for (const note of items) {
      const date = new Date(note.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    }
    // 월 정렬 (최신순/오래된순)
    const sorted = Object.entries(groups).sort(([a], [b]) =>
      sort === "oldest" ? a.localeCompare(b) : b.localeCompare(a)
    );
    return sorted;
  };

  return (
    <div className="space-y-4">
      {/* Draft 배너 */}
      {activeTab !== "inbox" && <DraftBanner draftCount={draftCount} />}

      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h1 className="text-xl font-bold">{t("notes.myNotes")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("notes.hubDescription")}
            </p>
          </div>
        </div>
        <Link href="/notes/new">
          <Button size="sm" className="shrink-0 gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("notes.freeNotesWrite")}</span>
          </Button>
        </Link>
      </div>

      {/* 검색바 (서버 검색) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="notes-search"
          value={localQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("notes.unifiedSearchPlaceholder" as Parameters<typeof t>[0])}
          className="pl-9 pr-9"
        />
        {localQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 타입 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateUrl({ tab: tab.value })}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
            {tab.value === "inbox" && draftCount > 0 && (
              <span className="ml-1 text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full">
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 뷰 컨트롤 바 */}
      <div className="flex items-center justify-between gap-2">
        {/* 뷰 모드 전환 */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                onClick={() => updateUrl({ view: mode.value })}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activeView === mode.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {t(mode.labelKey as Parameters<typeof t>[0])}
                </span>
              </button>
            );
          })}
        </div>

        {/* 정렬 + 필터 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSortToggle}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortLabel}
          </button>
          <NotesFilterButton
            updateUrl={updateUrl}
            activeBookId={activeBookId}
            activeStartDate={activeStartDate}
            activeEndDate={activeEndDate}
            activeTags={activeTags}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>

      {/* 활성 필터 칩 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeBookId && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <BookOpen className="h-3 w-3" />
              {t("notes.filterBook" as Parameters<typeof t>[0])}
              <button onClick={() => updateUrl({ bookId: undefined })} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(activeStartDate || activeEndDate) && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {activeStartDate || "..."} ~ {activeEndDate || "..."}
              <button onClick={() => updateUrl({ startDate: undefined, endDate: undefined })} className="ml-0.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeTags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              <Tag className="h-3 w-3" />
              #{tag}
              <button
                onClick={() => {
                  const newTags = activeTags.filter((t) => t !== tag);
                  updateUrl({ tags: newTags.length > 0 ? newTags.join(",") : undefined });
                }}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={() =>
              updateUrl({
                bookId: undefined,
                startDate: undefined,
                endDate: undefined,
                tags: undefined,
              })
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("notes.clearFilters" as Parameters<typeof t>[0])}
          </button>
        </div>
      )}

      {/* 태그 클라우드 */}
      {tags.length > 0 && !hasActiveFilters && (
        <TagCloud
          tags={tags}
          activeTag={undefined}
          onTagClick={(tag) => updateUrl({ tags: tag })}
          onClear={() => {}}
        />
      )}

      {/* 결과 수 */}
      {total > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("notes.totalResults" as Parameters<typeof t>[0]).replace("{count}", String(total))}
          {searchQuery && (
            <span className="ml-1 text-primary">
              &quot;{searchQuery}&quot;
            </span>
          )}
        </p>
      )}

      {/* 뷰 모드별 렌더링 */}
      {notes.length > 0 ? (
        <>
          {activeView === "timeline" ? (
            <div className="space-y-6">
              {groupByMonth(notes).map(([month, items]) => (
                <TimelineGroup key={month} month={month} notes={items} />
              ))}
            </div>
          ) : activeView === "book" ? (
            <NotesGroupedView notes={notes} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} showDeleteButton />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <NotesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              updateUrl={updateUrl}
            />
          )}
        </>
      ) : (
        <EmptyState
          variant="encouraging"
          title={
            searchQuery
              ? t("notes.noResultsFound" as Parameters<typeof t>[0])
              : activeTab === "inbox"
                ? t("notes.emptyInbox" as Parameters<typeof t>[0])
                : t("notes.emptyNotes" as Parameters<typeof t>[0])
          }
          description={
            searchQuery
              ? t("notes.tryDifferentSearch" as Parameters<typeof t>[0])
              : t("notes.emptyNotesDesc" as Parameters<typeof t>[0])
          }
          action={
            searchQuery
              ? { label: t("notes.clearFilters" as Parameters<typeof t>[0]), onClick: () => handleSearchChange("") }
              : { label: t("notes.freeNotesWrite"), href: "/notes/new" }
          }
        />
      )}
    </div>
  );
}

// --- 필터 버튼 (Popover 스타일) ---

function NotesFilterButton({
  updateUrl,
  activeBookId,
  activeStartDate,
  activeEndDate,
  activeTags,
  hasActiveFilters,
}: {
  updateUrl: (updates: Record<string, string | undefined>) => void;
  activeBookId?: string;
  activeStartDate?: string;
  activeEndDate?: string;
  activeTags?: string[];
  hasActiveFilters: boolean;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(activeStartDate || "");
  const [endDate, setEndDate] = useState(activeEndDate || "");

  const applyDateFilter = () => {
    updateUrl({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
          hasActiveFilters
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <SlidersHorizontal className="w-3 h-3" />
        {t("notes.filterPanel" as Parameters<typeof t>[0])}
        {hasActiveFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-popover border rounded-lg shadow-lg p-4 space-y-4 z-50">
            <h4 className="text-sm font-semibold">{t("notes.filterPanel" as Parameters<typeof t>[0])}</h4>

            {/* 날짜 범위 */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                {t("notes.filterDate" as Parameters<typeof t>[0])}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-8"
                />
                <span className="text-xs text-muted-foreground">~</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={applyDateFilter}>
                {t("common.apply" as Parameters<typeof t>[0])}
              </Button>
            </div>

            {/* 필터 초기화 */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs h-7 text-destructive"
                onClick={() => {
                  updateUrl({
                    bookId: undefined,
                    startDate: undefined,
                    endDate: undefined,
                    tags: undefined,
                  });
                  setStartDate("");
                  setEndDate("");
                  setIsOpen(false);
                }}
              >
                {t("notes.clearFilters" as Parameters<typeof t>[0])}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- 페이지네이션 ---

function NotesPagination({
  currentPage,
  totalPages,
  updateUrl,
}: {
  currentPage: number;
  totalPages: number;
  updateUrl: (updates: Record<string, string | undefined>) => void;
}) {
  const { t } = useTranslation();

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateUrl({ page: page > 1 ? String(page) : undefined });
  };

  return (
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="pagination">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
