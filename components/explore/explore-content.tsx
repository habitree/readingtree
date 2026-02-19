"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Loader2, BookOpen, Quote, MessageSquare, User } from "lucide-react";
import { getPublicNotes, toggleNoteLike, getExploreTags } from "@/app/actions/explore";
import type { ExploreNote } from "@/app/actions/explore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";

interface ExploreContentProps {
  initialNotes: ExploreNote[];
  initialHasMore: boolean;
}

export function ExploreContent({ initialNotes, initialHasMore }: ExploreContentProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<ExploreNote[]>(initialNotes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    getExploreTags(15).then(setPopularTags).catch(() => {});
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(false);
    try {
      const nextPage = page + 1;
      const result = await getPublicNotes({ sortBy, page: nextPage, tags: selectedTags.length > 0 ? selectedTags : undefined });
      setNotes((prev) => [...prev, ...result.notes]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch {
      setLoadError(true);
      toast.error(t("explore.loadFailed"));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [page, sortBy, selectedTags, t]);

  // IntersectionObserver 무한 스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current && !loadError) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadError]);

  const handleSortChange = useCallback(
    async (newSort: string) => {
      const sort = newSort as "recent" | "popular";
      setSortBy(sort);
      setIsLoading(true);
      try {
        const result = await getPublicNotes({ sortBy: sort, page: 1, tags: selectedTags.length > 0 ? selectedTags : undefined });
        setNotes(result.notes);
        setHasMore(result.hasMore);
        setPage(1);
      } catch {
        toast.error(t("explore.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [t, selectedTags]
  );

  const handleTagToggle = useCallback(
    async (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      setSelectedTags(newTags);
      setIsLoading(true);
      try {
        const result = await getPublicNotes({ sortBy, page: 1, tags: newTags.length > 0 ? newTags : undefined });
        setNotes(result.notes);
        setHasMore(result.hasMore);
        setPage(1);
      } catch {
        toast.error(t("explore.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy, selectedTags, t]
  );

  const handleClearTags = useCallback(
    async () => {
      setSelectedTags([]);
      setIsLoading(true);
      try {
        const result = await getPublicNotes({ sortBy, page: 1 });
        setNotes(result.notes);
        setHasMore(result.hasMore);
        setPage(1);
      } catch {
        toast.error(t("explore.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy, t]
  );

  const handleLike = useCallback(
    async (noteId: string) => {
      try {
        const result = await toggleNoteLike(noteId);
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? { ...note, is_liked: result.liked, like_count: result.likeCount }
              : note
          )
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("explore.likeFailed")
        );
      }
    },
    [t]
  );

  return (
    <div className="space-y-4">
      {/* 정렬 탭 */}
      <Tabs value={sortBy} onValueChange={handleSortChange}>
        <TabsList className="grid w-full max-w-[240px] grid-cols-2">
          <TabsTrigger value="recent">{t("explore.sortRecent")}</TabsTrigger>
          <TabsTrigger value="popular">{t("explore.sortPopular")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 태그 필터 (다중 선택) */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleClearTags}
            className={cn(
              "px-3 py-1 min-h-[44px] rounded-full text-xs font-medium transition-colors",
              selectedTags.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {t("explore.allTags")}
          </button>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={cn(
                "px-3 py-1 min-h-[44px] rounded-full text-xs font-medium transition-colors",
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 카드 그리드 */}
      {isLoading && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-xl p-4 bg-card space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <ExploreNoteCard key={note.id} note={note} onLike={handleLike} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t("explore.emptyState")}
          </p>
        </div>
      )}

      {/* 무한 스크롤 sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center pt-4">
          {isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
          {loadError && !isLoading && (
            <Button variant="outline" onClick={loadMore}>
              {t("explore.loadMore")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// 노트 콘텐츠 파싱
function parseContent(note: ExploreNote) {
  let quoteText = "";
  let memoText = "";
  try {
    const parsed = JSON.parse(note.content || "{}");
    quoteText = parsed.quote || "";
    memoText = parsed.memo || "";
  } catch {
    memoText = note.content || "";
  }
  return { quoteText, memoText };
}

// 개별 노트 카드 (React.memo로 좋아요 외 불필요한 리렌더링 방지)
const ExploreNoteCard = memo(function ExploreNoteCard({
  note,
  onLike,
}: {
  note: ExploreNote;
  onLike: (noteId: string) => void;
}) {
  const { t } = useTranslation();
  const { quoteText, memoText } = parseContent(note);

  return (
    <div className="group border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
      {/* 작성자 정보 */}
      <div className="flex items-center gap-2 mb-3">
        {note.author?.id ? (
          <Link href={`/profile/${note.author.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {note.author.avatar_url ? (
                <Image
                  src={note.author.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {note.author.display_name || t("explore.anonymous")}
            </span>
          </Link>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">
              {t("explore.anonymous")}
            </span>
          </>
        )}
        {note.book && (
          <>
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {note.book.title}
            </span>
          </>
        )}
      </div>

      {/* 콘텐츠 */}
      <Link href={`/share/notes/${note.id}`}>
        <div className="space-y-2 mb-3">
          {quoteText && (
            <div className="flex gap-2">
              <Quote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 line-clamp-3 italic">
                {quoteText}
              </p>
            </div>
          )}
          {memoText && (
            <div className="flex gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/70 line-clamp-2">
                {memoText}
              </p>
            </div>
          )}
          {note.image_url && !quoteText && !memoText && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={getImageUrl(note.image_url)}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </Link>

      {/* 태그 + 좋아요 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              #{tag}
            </Badge>
          ))}
        </div>
        <button
          onClick={() => onLike(note.id)}
          aria-label={note.is_liked ? t("explore.unlikeAria") : t("explore.likeAria")}
          aria-pressed={note.is_liked}
          className={cn(
            "flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded-full min-h-[44px] min-w-[44px] justify-center",
            note.is_liked
              ? "text-red-500 bg-red-50 dark:bg-red-950/30"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          )}
        >
          <Heart
            className={cn("w-3.5 h-3.5", note.is_liked && "fill-current")}
          />
          {note.like_count > 0 && <span>{note.like_count}</span>}
        </button>
      </div>
    </div>
  );
});
