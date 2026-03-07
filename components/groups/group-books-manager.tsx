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
  getGroupBookNoteCounts
} from "@/app/actions/groups";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, CheckCircle2, X } from "lucide-react";
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
  isLeader: boolean;
}

export function GroupBooksManager({ groupId, isLeader }: GroupBooksManagerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [groupBooks, setGroupBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [myBookIds, setMyBookIds] = useState<Set<string>>(new Set());
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadGroupBooks();
    loadMyBooks();
    loadNoteCounts();
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
        {isLeader && (
          <Button onClick={() => setIsAdding(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t("groups.addBook")}
          </Button>
        )}
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
        <div className={grids.threeCol}>
          {groupBooks.map((groupBook) => {
            const book = groupBook.books;
            if (!book) return null;

            return (
              <GroupBookCardEnhanced
                key={groupBook.id}
                groupId={groupId}
                groupBook={groupBook}
                noteCount={noteCounts[book.id] || 0}
                onAddToLibrary={!groupBook.isInMyLibrary ? handleAddToMyLibrary : undefined}
                onDelete={isLeader ? () => setDeletingBookId(book.id) : undefined}
              />
            );
          })}
        </div>
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
    </div>
  );
}

