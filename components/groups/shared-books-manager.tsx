"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSharedBooks, shareUserBookToGroup, unshareUserBookFromGroup } from "@/app/actions/groups";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { toast } from "sonner";
import { BookOpen, Share2, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const router = useRouter();
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
        error instanceof Error ? error.message : "공유 서재 조회에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBook = async (userBookId: string) => {
    try {
      setIsSharing(true);
      await shareUserBookToGroup(groupId, userBookId);
      toast.success("공유됨");
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "서재 공유 실패"
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshareBook = async (userBookId: string) => {
    try {
      await unshareUserBookFromGroup(groupId, userBookId);
      toast.success("공유가 해제되었습니다.");
      setUnsharingBookId(null);
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "공유 해제 실패"
      );
    }
  };

  // 이미 공유된 책 ID 목록
  const sharedBookIds = new Set(
    sharedBooks.map((sb) => sb.user_book_id)
  );

  // 공유 가능한 내 책 목록
  const shareableBooks = myBooks.filter(
    (book) => !sharedBookIds.has(book.id)
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
          <h3 className="text-lg font-semibold">공유 서재</h3>
          <p className="text-sm text-muted-foreground">
            모임 멤버들이 공유한 개인 서재입니다
          </p>
        </div>
        {shareableBooks.length > 0 && (
          <Select
            onValueChange={(value) => handleShareBook(value)}
            disabled={isSharing}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="내 서재 공유하기" />
            </SelectTrigger>
            <SelectContent>
              {shareableBooks.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.books?.title || "알 수 없음"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {sharedBooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                공유된 서재가 없습니다.
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
                        {user?.name || "알 수 없음"}
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
                        공유 해제
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
            <AlertDialogTitle>공유 해제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 서재의 공유를 해제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unsharingBookId && handleUnshareBook(unsharingBookId)}
            >
              공유 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

