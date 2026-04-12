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
  Pause,
  BookX,
  RotateCcw,
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
          {/* 독서모임 진행 현황 */}
          <GroupReadingProgress
            stats={stats}
            activePhase={statusFilter}
            onPhaseClick={(phase) => setStatusFilter(statusFilter === phase ? null : phase)}
          />

          {/* 컬렉션 탭 */}
          {bundles.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <Button
                variant={activeBundleId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveBundleId(null)}
                className="shrink-0 h-8 text-xs"
              >
                전체 ({groupBooks.length})
              </Button>
              {bundles.map((bundle) => {
                const count = groupBooks.filter((gb) => gb.bundle_id === bundle.id).length;
                return (
                  <Button
                    key={bundle.id}
                    variant={activeBundleId === bundle.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveBundleId(activeBundleId === bundle.id ? null : bundle.id)}
                    className="shrink-0 h-8 text-xs"
                  >
                    {bundle.name} ({count})
                  </Button>
                );
              })}
              {/* 미분류 */}
              {groupBooks.some((gb) => !gb.bundle_id) && (
                <Button
                  variant={activeBundleId === "_none" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveBundleId(activeBundleId === "_none" ? null : "_none")}
                  className="shrink-0 h-8 text-xs"
                >
                  {t("groups.unbundled")} ({groupBooks.filter((gb) => !gb.bundle_id).length})
                </Button>
              )}

              {/* 서재 관리 메뉴 (리더) */}
              {isLeader && activeBundleId && activeBundleId !== "_none" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const bundle = bundles.find((b) => b.id === activeBundleId);
                      if (bundle) { setEditingBundle(bundle); setShowBundleDialog(true); }
                    }}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />{t("groups.editBundle")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => activeBundleId && handleDeleteBundle(activeBundleId)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />{t("groups.deleteBundle")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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

          {/* 필터 결과 카운트 */}
          <p className="text-xs text-muted-foreground">
            {filteredBooks.length === groupBooks.length
              ? `전체 ${groupBooks.length}권`
              : `${filteredBooks.length}/${groupBooks.length}권`}
          </p>

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

interface GroupReadingProgressProps {
  stats: { total: number; before: number; reading: number; completed: number };
  activePhase: GroupReadingPhase | null;
  onPhaseClick: (phase: GroupReadingPhase | null) => void;
}

function GroupReadingProgress({ stats, activePhase, onPhaseClick }: GroupReadingProgressProps) {
  const { t } = useTranslation();

  const phases: { key: GroupReadingPhase | null; label: string; value: number; config: { icon: typeof BookOpen; color: string; bg: string; barColor: string; ring: string } }[] = [
    { key: null, label: t("groups.groupStatAll"), value: stats.total, config: { icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10", barColor: "bg-blue-500", ring: "ring-blue-500" } },
    { key: "before", label: t("groups.groupStatBeforeRead"), value: stats.before, config: PHASE_CONFIG.before },
    { key: "reading", label: t("groups.groupStatReading"), value: stats.reading, config: PHASE_CONFIG.reading },
    { key: "completed", label: t("groups.groupStatCompleted"), value: stats.completed, config: PHASE_CONFIG.completed },
  ];

  // 진행률 바 계산
  const total = stats.total || 1;
  const completedPct = (stats.completed / total) * 100;
  const readingPct = (stats.reading / total) * 100;

  return (
    <div className="space-y-3">
      {/* 진행률 바 */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${completedPct}%` }} />
        <div className="absolute inset-y-0 bg-emerald-500 rounded-full transition-all duration-500" style={{ left: `${completedPct}%`, width: `${readingPct}%` }} />
      </div>

      {/* 4칸 통계 */}
      <div className="grid grid-cols-4 gap-2">
        {phases.map((phase) => {
          const Icon = phase.config.icon;
          const isActive = activePhase === phase.key;

          return (
            <button
              key={phase.label}
              onClick={() => onPhaseClick(phase.key)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150",
                "hover:shadow-sm active:scale-[0.97] cursor-pointer",
                isActive
                  ? `ring-2 ${phase.config.ring} ring-offset-2 shadow-md border-transparent`
                  : "border-border/50 hover:border-border"
              )}
            >
              <div className={cn("rounded-full p-2", phase.config.bg)}>
                <Icon className={cn("h-4 w-4", phase.config.color)} />
              </div>
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">{phase.value}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{phase.label}</span>
            </button>
          );
        })}
      </div>
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

        return (
          <Link key={gb.id} href={`/groups/${groupId}/books/${book.id}`} className="block">
            <div className={cn(
              "flex items-center gap-3 p-3 border rounded-lg",
              "bg-background hover:bg-muted/50 transition-colors active:bg-muted/70"
            )}>
              {/* 표지 */}
              <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                {hasValidImage ? (
                  <Image src={getImageUrl(book.cover_image_url)} alt={book.title} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* 제목 + 저자 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
                {book.author && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{formatAuthor(book.author)}</p>
                )}
                {gb.description && (
                  <p className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5 italic">{gb.description}</p>
                )}
              </div>

              {/* 기록 수 */}
              {noteCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                  <MessageSquare className="mr-0.5 h-2.5 w-2.5" />{noteCount}
                </Badge>
              )}

              {/* 독서 진행 상태 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <GroupPhaseBadge phase={toGroupPhase(gb.myStatus, gb.isInMyLibrary)} />
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
