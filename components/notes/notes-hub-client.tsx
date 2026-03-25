"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Search, LayoutGrid, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { NotesGroupedView } from "@/components/notes/notes-grouped-view";
import { TagCloud } from "@/components/notes/tag-cloud";
import { DraftBanner } from "@/components/notes/draft-banner";
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
  isGrouped?: boolean;
  sort?: string;
}

/**
 * 메인 탭: 전체 | 인박스(N) | 구절 | 생각 | 사진 | 필사 | 진행
 * - "인박스" = status=draft (모든 type)
 * - 나머지 = type 필터 (status=all)
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

/**
 * 기록 허브 클라이언트 (통합 기록 목록)
 * /notes 페이지의 메인 컴포넌트
 * 1줄 메인 탭 + 보조 도구(그룹/정렬) + 검색 + 태그
 */
export function NotesHubClient({
  notes,
  tags,
  draftCount,
  activeTab = "all",
  isGrouped = false,
  sort = "latest",
}: NotesHubClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | undefined>();

  // URL 파라미터 업데이트 헬퍼
  const updateUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const current = {
      tab: activeTab,
      group: isGrouped ? "book" : undefined,
      sort: sort !== "latest" ? sort : undefined,
      ...updates,
    };
    Object.entries(current).forEach(([key, val]) => {
      if (val && val !== "all" && val !== "undefined") {
        params.set(key, val);
      }
    });
    const qs = params.toString();
    router.push(qs ? `/notes?${qs}` : "/notes");
  };

  // 클라이언트 검색 + 태그 필터
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeTag) {
      result = result.filter((note) => note.tags?.includes(activeTag));
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((note) => {
      const content = note.content?.toLowerCase() ?? "";
      const title = note.title?.toLowerCase() ?? "";
      return content.includes(q) || title.includes(q);
    });
  }, [notes, searchQuery, activeTag]);

  return (
    <div className="space-y-4">
      {/* Draft 배너 (인박스 탭이 아닐 때만) */}
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

      {/* 검색바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="notes-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("common.search")}
          className="pl-9"
        />
      </div>

      {/* 1단: 메인 탭 */}
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

      {/* 2단: 보조 도구 (그룹 토글 + 정렬) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateUrl({ group: isGrouped ? undefined : "book" })}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            isGrouped
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <LayoutGrid className="w-3 h-3" />
          책별 그룹
        </button>
        <button
          type="button"
          onClick={() => updateUrl({ sort: sort === "latest" ? "oldest" : "latest" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sort === "latest" ? "최신순" : "오래된순"}
        </button>
      </div>

      {/* 태그 클라우드 */}
      {tags.length > 0 && (
        <TagCloud
          tags={tags}
          activeTag={activeTag}
          onTagClick={setActiveTag}
          onClear={() => setActiveTag(undefined)}
        />
      )}

      {/* 기록 개수 */}
      {filteredNotes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("notes.noteCount").replace("{count}", String(filteredNotes.length))}
          {activeTag && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              — #{activeTag}
            </span>
          )}
        </p>
      )}

      {/* 기록 목록 */}
      {filteredNotes.length > 0 ? (
        isGrouped ? (
          <NotesGroupedView notes={filteredNotes} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} showDeleteButton />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          variant="encouraging"
          title={activeTab === "inbox" ? "인박스가 비어있어요" : "기록이 없어요"}
          description="독서하며 떠오른 생각을 기록해보세요"
          action={{
            label: t("notes.freeNotesWrite"),
            href: "/notes/new",
          }}
        />
      )}
    </div>
  );
}
