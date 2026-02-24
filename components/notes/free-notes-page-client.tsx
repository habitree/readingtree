"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StickyNote, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { useTranslation } from "@/lib/i18n";
import type { NoteWithBook, NoteType, SourceType } from "@/types/note";
import { cn } from "@/lib/utils";

interface FreeNotesPageClientProps {
  initialNotes: NoteWithBook[];
  activeType?: NoteType;
  activeSource?: SourceType;
}

const NOTE_TYPE_TABS: Array<{ value: NoteType | "all"; labelKey: string }> = [
  { value: "all", labelKey: "notes.sourceAll" },
  { value: "quote", labelKey: "notes.typeQuote" },
  { value: "memo", labelKey: "notes.typeMemo" },
  { value: "photo", labelKey: "notes.typePhoto" },
  { value: "transcription", labelKey: "notes.typeTranscription" },
];

const SOURCE_TYPE_TABS: Array<{ value: SourceType | "all"; labelKey: string }> = [
  { value: "all", labelKey: "notes.sourceAll" },
  { value: "youtube", labelKey: "notes.sourceYoutube" },
  { value: "article", labelKey: "notes.sourceArticle" },
  { value: "instagram", labelKey: "notes.sourceInstagram" },
  { value: "other", labelKey: "notes.sourceOther" },
];

/**
 * 자유 기록 전용 페이지 클라이언트 컴포넌트
 */
export function FreeNotesPageClient({
  initialNotes,
  activeType,
  activeSource,
}: FreeNotesPageClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return initialNotes;
    const q = searchQuery.toLowerCase();
    return initialNotes.filter((note) => {
      const content = note.content?.toLowerCase() ?? "";
      const title = note.title?.toLowerCase() ?? "";
      return content.includes(q) || title.includes(q);
    });
  }, [initialNotes, searchQuery]);

  const handleTypeChange = (type: NoteType | "all") => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (activeSource && activeSource !== "book") params.set("source", activeSource);
    router.push(`/notes/free?${params.toString()}`);
  };

  const handleSourceChange = (source: SourceType | "all") => {
    const params = new URLSearchParams();
    if (activeType) params.set("type", activeType);
    if (source !== "all") params.set("source", source);
    router.push(`/notes/free?${params.toString()}`);
  };

  const currentType = activeType ?? "all";
  const currentSource = activeSource ?? "all";

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t("notes.freeNotesPageTitle")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("notes.freeNotesPageDesc")}
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("common.search")}
          className="pl-9"
        />
      </div>

      {/* 타입 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {NOTE_TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTypeChange(tab.value as NoteType | "all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              currentType === tab.value
                ? "bg-amber-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* 출처 탭 */}
      <div className="flex gap-1.5 flex-wrap">
        {SOURCE_TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleSourceChange(tab.value as SourceType | "all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              currentSource === tab.value
                ? "bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* 기록 개수 */}
      {filteredNotes.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("notes.noteCount").replace("{count}", String(filteredNotes.length))}
        </p>
      )}

      {/* 기록 목록 */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} showDeleteButton />
          ))}
        </div>
      ) : (
        <EmptyState
          variant="encouraging"
          title={t("dashboard.freeNotesEmpty")}
          description={t("notes.freeNotesPageDesc")}
          action={{
            label: t("notes.freeNotesWrite"),
            href: "/notes/new",
          }}
        />
      )}
    </div>
  );
}
