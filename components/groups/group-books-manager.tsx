"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { BookOpen, Plus, Trash2, CheckCircle2, X, Library, ListPlus, FolderPlus, ChevronDown, ChevronRight, MoreHorizontal, Pencil } from "lucide-react";
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
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
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
  const [myBookIds, setMyBookIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    loadGroupBooks();
    loadMyBooks();
    loadNoteCounts();
    loadBundles();
  }, [groupId]);

  const loadMyBooks = async () => {
    try {
      const { books } = await getUserBooksWithNotes();
      const bookIds = new Set(books.map((b) => b.books?.id).filter(Boolean));
      setMyBookIds(bookIds);
    } catch (error) {
      console.error("내 서재 조회 오류:", error);
    }
  };

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
      console.error("묶음 조회 오류:", error);
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
      toast.error(
        error instanceof Error ? error.message : t("errors.loadError")
      );
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
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
      );
    }
  };

  const handleAddToMyLibrary = async (bookId: string) => {
    try {
      await addGroupBookToMyLibrary(groupId, bookId, "reading");
      toast.success(t("groups.addedToMyLibrary"));
      loadGroupBooks();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
      );
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    try {
      await removeGroupBook(groupId, bookId);
      toast.success(t("groups.designatedBookRemoved"));
      setDeletingBookId(null);
      loadGroupBooks();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
      );
    }
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={typography.sectionTitle}>{t("groups.designatedBook")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("groups.searchAndAddBook")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {groupBooks.length > 0 &&
            groupBooks.some((gb) => !gb.isInMyLibrary) && (
              <Button
                variant="outline"
                onClick={() => setShowBatchDialog(true)}
                className="shrink-0"
              >
                <Library className="mr-2 h-4 w-4" />
                {t("groups.batchAddToLibrary")}
              </Button>
            )}
          {isLeader && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingBundle(null);
                  setShowBundleDialog(true);
                }}
                className="shrink-0"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                {t("groups.createBundle")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkRegister(true)}
                className="shrink-0"
              >
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

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{t("groups.addDesignatedBook")}</CardTitle>
            <CardDescription>{t("groups.searchAndAddBook")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BookSearch
              onSelectBook={(result) => {
                if (result.bookId) {
                  handleAddBook(result.bookId);
                }
              }}
            />
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setIsAdding(false)}
            >
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
            <BulkGroupBookRegister
              groupId={groupId}
              onComplete={() => {
                loadGroupBooks();
              }}
              onCancel={() => setShowBulkRegister(false)}
            />
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setShowBulkRegister(false)}
            >
              {t("common.cancel")}
            </Button>
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
                  <Plus className="mr-2 h-4 w-4" />
                  {t("groups.addBook")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <BundledBookGrid
          groupBooks={groupBooks}
          bundles={bundles}
          collapsedBundles={collapsedBundles}
          noteCounts={noteCounts}
          groupId={groupId}
          isLeader={isLeader}
          onToggleCollapse={toggleBundleCollapse}
          onAddToLibrary={handleAddToMyLibrary}
          onDelete={(bookId) => setDeletingBookId(bookId)}
          onEditBook={(gb) => {
            const book = gb.books;
            if (!book) return;
            setEditingBook({
              bookId: book.id,
              bookTitle: book.title,
              description: gb.description || null,
              links: Array.isArray(gb.links) ? gb.links : [],
              bundleId: gb.bundle_id || null,
            });
          }}
          onEditBundle={(bundle) => {
            setEditingBundle(bundle);
            setShowBundleDialog(true);
          }}
          onDeleteBundle={handleDeleteBundle}
          t={t}
        />
      )}

      <AlertDialog
        open={deletingBookId !== null}
        onOpenChange={(open) => !open && setDeletingBookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.deleteDesignatedBookConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.deleteDesignatedBookConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBookId && handleRemoveBook(deletingBookId)}
              variant="destructive"
            >
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
        onComplete={() => {
          loadGroupBooks();
          router.refresh();
        }}
      />

      {/* 묶음 생성/수정 다이얼로그 */}
      <BundleManageDialog
        open={showBundleDialog}
        onOpenChange={setShowBundleDialog}
        groupId={groupId}
        bundle={editingBundle}
        onSuccess={reloadAll}
      />

      {/* 도서 편집 다이얼로그 */}
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

// --- 묶음별 책 그리드 ---

interface BundledBookGridProps {
  groupBooks: any[];
  bundles: GroupBookBundle[];
  collapsedBundles: Set<string>;
  noteCounts: Record<string, number>;
  groupId: string;
  isLeader: boolean;
  onToggleCollapse: (id: string) => void;
  onAddToLibrary: (bookId: string) => void;
  onDelete: (bookId: string) => void;
  onEditBook: (gb: any) => void;
  onEditBundle: (bundle: GroupBookBundle) => void;
  onDeleteBundle: (bundleId: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function BundledBookGrid({
  groupBooks,
  bundles,
  collapsedBundles,
  noteCounts,
  groupId,
  isLeader,
  onToggleCollapse,
  onAddToLibrary,
  onDelete,
  onEditBook,
  onEditBundle,
  onDeleteBundle,
  t,
}: BundledBookGridProps) {
  // 묶음이 없으면 기존 그리드 그대로
  if (bundles.length === 0) {
    return (
      <div className={grids.groupBookGrid}>
        {groupBooks.map((gb) => {
          const book = gb.books;
          if (!book) return null;
          return (
            <GroupBookCardEnhanced
              key={gb.id}
              groupId={groupId}
              groupBook={gb}
              noteCount={noteCounts[book.id] || 0}
              onAddToLibrary={!gb.isInMyLibrary ? () => onAddToLibrary(book.id) : undefined}
              onDelete={isLeader ? () => onDelete(book.id) : undefined}
              onEdit={isLeader ? () => onEditBook(gb) : undefined}
              isLeader={isLeader}
            />
          );
        })}
      </div>
    );
  }

  // 묶음별 그룹화
  const bundledBooks = new Map<string | null, any[]>();
  for (const gb of groupBooks) {
    const key = gb.bundle_id || null;
    if (!bundledBooks.has(key)) bundledBooks.set(key, []);
    bundledBooks.get(key)!.push(gb);
  }

  // 묶음 순서대로 + 미분류 마지막
  const sections: { bundle: GroupBookBundle | null; books: any[] }[] = [];
  for (const bundle of bundles) {
    sections.push({ bundle, books: bundledBooks.get(bundle.id) || [] });
  }
  const unbundled = bundledBooks.get(null) || [];
  if (unbundled.length > 0) {
    sections.push({ bundle: null, books: unbundled });
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionId = section.bundle?.id || "_unbundled";
        const isCollapsed = collapsedBundles.has(sectionId);
        const bookCount = section.books.length;

        return (
          <Card key={sectionId} className="overflow-hidden">
            {/* 묶음 헤더 */}
            <div
              className="flex items-center gap-2 p-3 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onToggleCollapse(sectionId)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">
                    {section.bundle?.name || t("groups.unbundled")}
                  </h4>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {bookCount}
                  </Badge>
                </div>
                {section.bundle?.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {section.bundle.description}
                  </p>
                )}
              </div>

              {/* 묶음 관리 메뉴 (리더만) */}
              {isLeader && section.bundle && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBundle(section.bundle!);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      {t("groups.editBundle")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBundle(section.bundle!.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      {t("groups.deleteBundle")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* 책 그리드 */}
            {!isCollapsed && bookCount > 0 && (
              <div className={`p-3 ${grids.groupBookGrid}`}>
                {section.books.map((gb: any) => {
                  const book = gb.books;
                  if (!book) return null;
                  return (
                    <GroupBookCardEnhanced
                      key={gb.id}
                      groupId={groupId}
                      groupBook={gb}
                      noteCount={noteCounts[book.id] || 0}
                      onAddToLibrary={!gb.isInMyLibrary ? () => onAddToLibrary(book.id) : undefined}
                      onDelete={isLeader ? () => onDelete(book.id) : undefined}
                      onEdit={isLeader ? () => onEditBook(gb) : undefined}
                      isLeader={isLeader}
                    />
                  );
                })}
              </div>
            )}

            {!isCollapsed && bookCount === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                이 묶음에 도서가 없습니다.
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

