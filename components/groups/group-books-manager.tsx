"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookSearch } from "@/components/books/book-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupBookCardEnhanced } from "./group-book-card-enhanced";
import {
  addGroupBook,
  getGroupBooksWithUserStatus,
  addGroupBookToMyLibrary,
  removeGroupBook,
  getGroupBookNoteCounts,
  getGroupBookBundles,
  deleteGroupBookBundle,
} from "@/app/actions/groups";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Trash2,
  Library,
  ListPlus,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Grid3x3,
  List,
  Search,
  BookMarked,
  CheckCircle2,
  BookX,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { BatchAddBooksDialog } from "./batch-add-books-dialog";
import { BulkGroupBookRegister } from "./bulk-group-book-register";
import { GroupBookEditDialog } from "./group-book-edit-dialog";
import { BundleManageDialog } from "./bundle-manage-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GroupBookBundle, GroupBookLink } from "@/types/group";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatAuthor } from "@/lib/utils/book";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import type { ReadingStatus } from "@/types/book";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { typography, spacing, grids } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type GroupReadingPhase = "before" | "reading" | "completed";

/** 개인 ReadingStatus → 독서모임 3단계 매핑 */
function toGroupPhase(myStatus: string | null, isInMyLibrary: boolean): GroupReadingPhase {
  if (!isInMyLibrary || !myStatus || myStatus === "not_started") return "before";
  if (myStatus === "completed") return "completed";
  return "reading"; // reading, rereading, paused 모두 "읽는 중"
}

interface GroupBooksManagerProps {
  groupId: string;
  groupName: string;
  isLeader: boolean;
}

export function GroupBooksManager({ groupId, groupName, isLeader }: GroupBooksManagerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [groupBooks, setGroupBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showBulkRegister, setShowBulkRegister] = useState(false);
  const [bundles, setBundles] = useState<GroupBookBundle[]>([]);
  const [collapsedBundles, setCollapsedBundles] = useState<Set<string>>(new Set());
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [editingBundle, setEditingBundle] = useState<GroupBookBundle | null>(null);
  const [editingBook, setEditingBook] = useState<{
    bookId: string;
    bookTitle: string;
    description: string | null;
    links: GroupBookLink[];
    bundleId: string | null;
  } | null>(null);

  // 뷰 모드 & 필터
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GroupReadingPhase | null>(null);
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null); // null = 전체

  useEffect(() => {
    loadGroupBooks();
    loadNoteCounts();
    loadBundles();
  }, [groupId]);

  const loadNoteCounts = async () => {
    try {
      const counts = await getGroupBookNoteCounts(groupId);
      setNoteCounts(counts);
    } catch (error) {
      console.error("기록 수 조회 오류:", error);
    }
  };

  const loadBundles = async () => {
    try {
      const data = await getGroupBookBundles(groupId);
      setBundles(data);
    } catch (error) {
      console.error("서재 조회 오류:", error);
    }
  };

  const toggleBundleCollapse = (bundleId: string) => {
    setCollapsedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(bundleId)) next.delete(bundleId);
      else next.add(bundleId);
      return next;
    });
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      await deleteGroupBookBundle(bundleId);
      toast.success(t("groups.bundleDeleted"));
      loadBundles();
      loadGroupBooks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제 실패");
    }
  };

  const reloadAll = () => {
    loadGroupBooks();
    loadBundles();
    loadNoteCounts();
  };

  const loadGroupBooks = async () => {
    try {
      setIsLoading(true);
      const books = await getGroupBooksWithUserStatus(groupId);
      setGroupBooks(books);
    } catch (error) {
      console.error("지정도서 조회 오류:", error);
      toast.error(error instanceof Error ? error.message : t("errors.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (bookId: string) => {
    try {
      await addGroupBook(groupId, bookId);
      toast.success(t("groups.designatedBookAdded"));
      setIsAdding(false);
      loadGroupBooks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    }
  };

  const handleAddToMyLibrary = async (bookId: string) => {
    try {
      await addGroupBookToMyLibrary(groupId, bookId, "reading");
      toast.success(t("groups.addedToMyLibrary"));
      loadGroupBooks();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    try {
      await removeGroupBook(groupId, bookId);
      toast.success(t("groups.designatedBookRemoved"));
      setDeletingBookId(null);
      loadGroupBooks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    }
  };

  // --- 독서모임 3단계 통계 ---
  const stats = useMemo(() => {
    const result = { total: groupBooks.length, before: 0, reading: 0, completed: 0 };
    for (const gb of groupBooks) {
      const phase = toGroupPhase(gb.myStatus, gb.isInMyLibrary);
      result[phase]++;
    }
    return result;
  }, [groupBooks]);

  // --- 필터링 ---
  const filteredBooks = useMemo(() => {
    let filtered = groupBooks;

    // 서재(번들) 필터
    if (activeBundleId !== null) {
      filtered = filtered.filter((gb) => (gb.bundle_id || null) === (activeBundleId || null));
    }

    // 상태 필터 (독서모임 3단계)
    if (statusFilter) {
      filtered = filtered.filter((gb) => toGroupPhase(gb.myStatus, gb.isInMyLibrary) === statusFilter);
    }

    // 검색
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((gb) => {
        const book = gb.books;
        if (!book) return false;
        return (
          book.title?.toLowerCase().includes(q) ||
          book.author?.toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [groupBooks, activeBundleId, statusFilter, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={spacing.pageSection}>
      {/* 헤더 + 액션 버튼 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={typography.sectionTitle}>{t("groups.designatedBook")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("groups.searchAndAddBook")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {groupBooks.length > 0 && groupBooks.some((gb) => !gb.isInMyLibrary) && (
            <Button variant="outline" onClick={() => setShowBatchDialog(true)} className="shrink-0">
              <Library className="mr-2 h-4 w-4" />
              {t("groups.batchAddToLibrary")}
            </Button>
          )}
          {isLeader && (
            <>
              <Button
                variant="outline"
                onClick={() => { setEditingBundle(null); setShowBundleDialog(true); }}
                className="shrink-0"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                {t("groups.createBundle")}
              </Button>
              <Button variant="outline" onClick={() => setShowBulkRegister(true)} className="shrink-0">
                <ListPlus className="mr-2 h-4 w-4" />
                {t("groups.bulkDesignatedAdd")}
              </Button>
              <Button onClick={() => setIsAdding(true)} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                {t("groups.addBook")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 도서 추가 / 일괄 등록 영역 */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{t("groups.addDesignatedBook")}</CardTitle>
            <CardDescription>{t("groups.searchAndAddBook")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BookSearch onSelectBook={(result) => { if (result.bookId) handleAddBook(result.bookId); }} />
            <Button variant="ghost" className="mt-4 w-full" onClick={() => setIsAdding(false)}>
              {t("common.cancel")}
            </Button>
          </CardContent>
        </Card>
      )}
      {showBulkRegister && (
        <Card>
          <CardHeader>
            <CardTitle>{t("groups.bulkDesignatedAdd")}</CardTitle>
            <CardDescription>{t("groups.bulkDesignatedDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BulkGroupBookRegister groupId={groupId} onComplete={() => loadGroupBooks()} onCancel={() => setShowBulkRegister(false)} />
            <Button variant="ghost" className="mt-4 w-full" onClick={() => setShowBulkRegister(false)}>{t("common.cancel")}</Button>
          </CardContent>
        </Card>
      )}

      {groupBooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold mb-2">{t("groups.noDesignatedBooks")}</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isLeader ? t("groups.addBookHint") : t("groups.searchAndAddBook")}
              </p>
              {isLeader && (
                <Button onClick={() => setIsAdding(true)} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />{t("groups.addBook")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 컬렉션 선택기 */}
          {bundles.length > 0 && (
            <CollectionSelector
              bundles={bundles}
              groupBooks={groupBooks}
              activeBundleId={activeBundleId}
              onSelect={setActiveBundleId}
              isLeader={isLeader}
              onEditBundle={(bundle) => { setEditingBundle(bundle); setShowBundleDialog(true); }}
              onDeleteBundle={handleDeleteBundle}
              t={t}
            />
          )}

          {/* 검색 + 뷰 토글 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목이나 저자로 검색"
                className="pl-9 h-9"
              />
            </div>
            <div className="inline-flex items-center rounded-full bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "inline-flex items-center justify-center rounded-full h-7 w-7 transition-all",
                  viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex items-center justify-center rounded-full h-7 w-7 transition-all",
                  viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 상태 필터 칩 */}
          <ReadingPhaseChips
            stats={stats}
            activePhase={statusFilter}
            onPhaseClick={(phase) => setStatusFilter(statusFilter === phase ? null : phase)}
          />

          {/* 책 목록 */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className={grids.groupBookGrid}>
              {filteredBooks.map((gb) => {
                const book = gb.books;
                if (!book) return null;
                return (
                  <GroupBookCardEnhanced
                    key={gb.id}
                    groupId={groupId}
                    groupBook={gb}
                    noteCount={noteCounts[book.id] || 0}
                    onAddToLibrary={!gb.isInMyLibrary ? () => handleAddToMyLibrary(book.id) : undefined}
                    onDelete={isLeader ? () => setDeletingBookId(book.id) : undefined}
                    onEdit={isLeader ? () => {
                      setEditingBook({
                        bookId: book.id,
                        bookTitle: book.title,
                        description: gb.description || null,
                        links: Array.isArray(gb.links) ? gb.links : [],
                        bundleId: gb.bundle_id || null,
                      });
                    } : undefined}
                    isLeader={isLeader}
                  />
                );
              })}
            </div>
          ) : (
            <GroupBookListView
              books={filteredBooks}
              noteCounts={noteCounts}
              groupId={groupId}
            />
          )}
        </>
      )}

      {/* 다이얼로그들 */}
      <AlertDialog open={deletingBookId !== null} onOpenChange={(open) => !open && setDeletingBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.deleteDesignatedBookConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("groups.deleteDesignatedBookConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingBookId && handleRemoveBook(deletingBookId)} variant="destructive">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchAddBooksDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        groupId={groupId}
        groupName={groupName}
        totalBooks={groupBooks.length}
        booksNotInLibrary={groupBooks.filter((gb) => !gb.isInMyLibrary).length}
        onComplete={() => { loadGroupBooks(); router.refresh(); }}
      />

      <BundleManageDialog
        open={showBundleDialog}
        onOpenChange={setShowBundleDialog}
        groupId={groupId}
        bundle={editingBundle}
        onSuccess={reloadAll}
      />

      {editingBook && (
        <GroupBookEditDialog
          open={!!editingBook}
          onOpenChange={(open) => !open && setEditingBook(null)}
          groupId={groupId}
          bookId={editingBook.bookId}
          bookTitle={editingBook.bookTitle}
          currentDescription={editingBook.description}
          currentLinks={editingBook.links}
          currentBundleId={editingBook.bundleId}
          bundles={bundles}
          onSuccess={reloadAll}
        />
      )}
    </div>
  );
}

// --- 독서모임 진행 현황 (3단계: 읽기 전 / 읽는 중 / 완독) ---

const PHASE_CONFIG = {
  before: {
    icon: BookX,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    barColor: "bg-slate-400",
    ring: "ring-slate-400",
  },
  reading: {
    icon: BookMarked,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    barColor: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    barColor: "bg-violet-500",
    ring: "ring-violet-500",
  },
} as const;


// --- 상태 필터 칩 (심플) ---

interface ReadingPhaseChipsProps {
  stats: { total: number; before: number; reading: number; completed: number };
  activePhase: GroupReadingPhase | null;
  onPhaseClick: (phase: GroupReadingPhase | null) => void;
}

function ReadingPhaseChips({ stats, activePhase, onPhaseClick }: ReadingPhaseChipsProps) {
  const { t } = useTranslation();

  const chips: { key: GroupReadingPhase | null; label: string; value: number; dot: string }[] = [
    { key: null, label: t("groups.groupStatAll"), value: stats.total, dot: "bg-foreground/40" },
    { key: "before", label: t("groups.groupStatBeforeRead"), value: stats.before, dot: PHASE_CONFIG.before.barColor },
    { key: "reading", label: t("groups.groupStatReading"), value: stats.reading, dot: PHASE_CONFIG.reading.barColor },
    { key: "completed", label: t("groups.groupStatCompleted"), value: stats.completed, dot: PHASE_CONFIG.completed.barColor },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {chips.map((chip) => {
        const isActive = activePhase === chip.key;
        return (
          <button
            key={chip.label}
            onClick={() => onPhaseClick(chip.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all",
              isActive
                ? "bg-foreground text-background font-semibold"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isActive ? "bg-background" : chip.dot)} />
            {chip.label}
            <span className={cn("font-semibold", isActive ? "text-background" : "text-foreground")}>{chip.value}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- 독서모임 진행 상태 배지 ---

function GroupPhaseBadge({ phase }: { phase: GroupReadingPhase }) {
  const { t } = useTranslation();
  const config = PHASE_CONFIG[phase];
  const labels: Record<GroupReadingPhase, string> = {
    before: t("groups.groupStatBeforeRead"),
    reading: t("groups.groupStatReading"),
    completed: t("groups.groupStatCompleted"),
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 gap-1 border-0", config.bg, config.color)}>
      <config.icon className="h-2.5 w-2.5" />
      {labels[phase]}
    </Badge>
  );
}

// --- 컬렉션 선택기 ---

const COLLECTION_COLORS = [
  { border: "border-l-blue-500", bg: "bg-blue-500/5", dot: "bg-blue-500" },
  { border: "border-l-emerald-500", bg: "bg-emerald-500/5", dot: "bg-emerald-500" },
  { border: "border-l-violet-500", bg: "bg-violet-500/5", dot: "bg-violet-500" },
  { border: "border-l-amber-500", bg: "bg-amber-500/5", dot: "bg-amber-500" },
  { border: "border-l-rose-500", bg: "bg-rose-500/5", dot: "bg-rose-500" },
  { border: "border-l-cyan-500", bg: "bg-cyan-500/5", dot: "bg-cyan-500" },
  { border: "border-l-orange-500", bg: "bg-orange-500/5", dot: "bg-orange-500" },
  { border: "border-l-pink-500", bg: "bg-pink-500/5", dot: "bg-pink-500" },
];

interface CollectionSelectorProps {
  bundles: GroupBookBundle[];
  groupBooks: any[];
  activeBundleId: string | null;
  onSelect: (id: string | null) => void;
  isLeader: boolean;
  onEditBundle: (bundle: GroupBookBundle) => void;
  onDeleteBundle: (id: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function CollectionSelector({
  bundles,
  groupBooks,
  activeBundleId,
  onSelect,
  isLeader,
  onEditBundle,
  onDeleteBundle,
  t,
}: CollectionSelectorProps) {
  const unbundledCount = groupBooks.filter((gb) => !gb.bundle_id).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">컬렉션</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* 전체 */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "text-left p-3 rounded-lg border transition-all duration-150",
            "hover:shadow-sm active:scale-[0.98]",
            activeBundleId === null
              ? "ring-2 ring-primary ring-offset-1 border-transparent bg-primary/5"
              : "border-border/50 hover:border-border bg-background"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-sm font-semibold truncate">{t("groups.groupStatAll")}</span>
          </div>
          <span className="text-2xl font-bold">{groupBooks.length}</span>
          <span className="text-xs text-muted-foreground ml-1">권</span>
        </button>

        {/* 각 컬렉션 */}
        {bundles.map((bundle, index) => {
          const colorSet = COLLECTION_COLORS[index % COLLECTION_COLORS.length];
          const count = groupBooks.filter((gb) => gb.bundle_id === bundle.id).length;
          const isActive = activeBundleId === bundle.id;

          return (
            <div key={bundle.id} className="relative group/col">
              <button
                onClick={() => onSelect(isActive ? null : bundle.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-l-4 border transition-all duration-150",
                  "hover:shadow-sm active:scale-[0.98]",
                  colorSet.border,
                  isActive
                    ? "ring-2 ring-primary ring-offset-1 border-r-transparent border-t-transparent border-b-transparent " + colorSet.bg
                    : "border-r-border/50 border-t-border/50 border-b-border/50 hover:border-r-border bg-background"
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", colorSet.dot)} />
                  <span className="text-sm font-semibold truncate">{bundle.name}</span>
                </div>
                {bundle.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1 leading-snug">
                    {bundle.description}
                  </p>
                )}
                <span className="text-2xl font-bold">{count}</span>
                <span className="text-xs text-muted-foreground ml-1">권</span>
              </button>

              {/* 리더 관리 메뉴 */}
              {isLeader && (
                <div className="absolute top-1 right-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditBundle(bundle)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />{t("groups.editBundle")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteBundle(bundle.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />{t("groups.deleteBundle")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}

        {/* 미분류 */}
        {unbundledCount > 0 && (
          <button
            onClick={() => onSelect(activeBundleId === "_none" ? null : "_none")}
            className={cn(
              "text-left p-3 rounded-lg border border-dashed transition-all duration-150",
              "hover:shadow-sm active:scale-[0.98]",
              activeBundleId === "_none"
                ? "ring-2 ring-primary ring-offset-1 border-transparent bg-muted/50"
                : "border-border/50 hover:border-border bg-background"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
              <span className="text-sm font-semibold truncate text-muted-foreground">{t("groups.unbundled")}</span>
            </div>
            <span className="text-2xl font-bold text-muted-foreground">{unbundledCount}</span>
            <span className="text-xs text-muted-foreground ml-1">권</span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- 리스트 뷰 ---

function GroupBookListView({
  books,
  noteCounts,
  groupId,
}: {
  books: any[];
  noteCounts: Record<string, number>;
  groupId: string;
}) {
  return (
    <div className="space-y-2">
      {books.map((gb) => {
        const book = gb.books;
        if (!book) return null;
        const hasValidImage = isValidImageUrl(book.cover_image_url);
        const noteCount = noteCounts[book.id] || 0;
        const phase = toGroupPhase(gb.myStatus, gb.isInMyLibrary);
        const phaseConfig = PHASE_CONFIG[phase];
        const contributors = gb.recentContributors || [];

        return (
          <Link key={gb.id} href={`/groups/${groupId}/books/${book.id}`} className="block">
            <div className={cn(
              "flex items-center gap-3 p-3 border rounded-lg",
              "bg-background hover:bg-muted/50 transition-colors active:bg-muted/70"
            )}>
              {/* 표지 + 상태 도트 */}
              <div className="relative w-11 h-[60px] flex-shrink-0 rounded-md overflow-hidden bg-muted shadow-sm">
                {hasValidImage ? (
                  <Image src={getImageUrl(book.cover_image_url)} alt={book.title} fill className="object-cover" sizes="44px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
                <div className={cn("absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-background", phaseConfig.barColor)} />
              </div>

              {/* 제목 + 저자 + 메타 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                {book.author && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{formatAuthor(book.author)}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {/* 기록 수 */}
                  {noteCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {noteCount}
                    </span>
                  )}
                  {/* 참여 멤버 */}
                  {contributors.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      <div className="flex -space-x-1">
                        {contributors.slice(0, 3).map((c: any) => (
                          <Avatar key={c.id} className="h-4 w-4 ring-1 ring-background">
                            <AvatarImage src={c.avatar_url || undefined} />
                            <AvatarFallback className="text-[7px]">{c.name?.[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 상태 배지 */}
              <GroupPhaseBadge phase={phase} />
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
