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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("groups.sharedLibrary")}</h3>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t("groups.noSharedLibrary")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sharedBooks.map((sharedBook) => {
            const userBook = sharedBook.user_books;
            if (!userBook || !userBook.books) return null;

            const book = userBook.books;
            const user = userBook.users;
            const isMyBook = userBook.user_id === user?.id;

            return (
              <Card key={sharedBook.id} className="overflow-hidden">
                <div className="relative aspect-[3/4] w-full bg-muted">
                  {isValidImageUrl(book.cover_image_url) ? (
                    <Image
                      src={getImageUrl(book.cover_image_url)}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                    {book.author && (
                      <p className="text-sm text-muted-foreground">
                        {book.author}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {user?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {user?.name || t("groups.unknownUser")}
                      </span>
                    </div>

                    {userBook.status && (
                      <BookStatusBadge status={userBook.status} />
                    )}

                    {isMyBook && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setUnsharingBookId(userBook.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {t("groups.unshareBook")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
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

