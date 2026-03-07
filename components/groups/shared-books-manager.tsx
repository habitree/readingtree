"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSharedBooks, shareUserBookToGroup, unshareUserBookFromGroup } from "@/app/actions/groups";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { toast } from "sonner";
import { BookOpen, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserBookSelectDialog } from "@/components/books/user-book-select-dialog";
import { useTranslation } from "@/lib/i18n";
import { typography, spacing } from "@/lib/design-tokens";
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

interface SharedBooksManagerProps {
  groupId: string;
}

export function SharedBooksManager({ groupId }: SharedBooksManagerProps) {
  const { t } = useTranslation();
  const [sharedBooks, setSharedBooks] = useState<any[]>([]);
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [unsharingBookId, setUnsharingBookId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [shared, my] = await Promise.all([
        getSharedBooks(groupId),
        getUserBooksWithNotes(),
      ]);
      setSharedBooks(shared);
      setMyBooks(my.books || []);
    } catch (error) {
      console.error("공유 서재 조회 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.loadError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBook = async (userBook: any) => {
    try {
      setIsSharing(true);
      await shareUserBookToGroup(groupId, userBook.id);
      toast.success(t("groups.bookSharedSuccess").replace("{title}", userBook.books?.title || ""));
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshareBook = async (userBookId: string) => {
    try {
      await unshareUserBookFromGroup(groupId, userBookId);
      toast.success(t("groups.unshareSuccess"));
      setUnsharingBookId(null);
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
      );
    }
  };

  // 이미 공유된 책 ID 목록
  const sharedBookIds = new Set(
    sharedBooks.map((sb) => sb.user_book_id)
  );

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
          <h3 className={typography.sectionTitle}>{t("groups.sharedLibrary")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("groups.sharedLibraryDesc")}
          </p>
        </div>
        <UserBookSelectDialog
          books={myBooks}
          excludeBookIds={sharedBookIds}
          onSelect={handleShareBook}
          isSelecting={isSharing}
          title={t("groups.shareFromMyLibrary")}
          description={t("groups.selectBookToShare")}
          selectButtonText={t("groups.shareButton")}
        />
      </div>

      {sharedBooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">{t("groups.noSharedLibrary")}</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("groups.sharedLibraryDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {sharedBooks.map((sharedBook) => {
            const userBook = sharedBook.user_books;
            if (!userBook || !userBook.books) return null;

            const book = userBook.books;
            const user = userBook.users;
            const isMyBook = userBook.user_id === user?.id;

            return (
              <div key={sharedBook.id} className="relative group">
                <Card className="overflow-hidden h-full">
                  <div className="relative aspect-[3/4] w-full bg-muted">
                    {isValidImageUrl(book.cover_image_url) ? (
                      <Image
                        src={getImageUrl(book.cover_image_url)}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* 공유자 아바타 오버레이 */}
                    <div className="absolute bottom-1 left-1">
                      <Avatar className="h-5 w-5 ring-1 ring-background">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {user?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2">
                    <h4 className="font-semibold text-[10px] sm:text-xs line-clamp-2 leading-tight">{book.title}</h4>
                    {book.author && (
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {book.author}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {userBook.status && (
                        <BookStatusBadge status={userBook.status} className="scale-[0.7] origin-left" />
                      )}
                    </div>
                  </div>
                </Card>
                {isMyBook && (
                  <button
                    className="absolute top-0.5 right-0.5 z-10 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setUnsharingBookId(userBook.id)}
                    title={t("groups.unshareBook")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={unsharingBookId !== null}
        onOpenChange={(open) => !open && setUnsharingBookId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.unshareBookConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.unshareBookConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unsharingBookId && handleUnshareBook(unsharingBookId)}
            >
              {t("groups.unshareBook")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

