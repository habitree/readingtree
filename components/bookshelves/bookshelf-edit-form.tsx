"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBookshelf, deleteBookshelf } from "@/app/actions/bookshelves";
import { BookshelfWithStats } from "@/types/bookshelf";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Trash2, Save } from "lucide-react";

interface BookshelfEditFormProps {
  bookshelf: BookshelfWithStats;
}

export function BookshelfEditForm({ bookshelf }: BookshelfEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(bookshelf.name);
  const [description, setDescription] = useState(bookshelf.description || "");
  const [isPublic, setIsPublic] = useState(bookshelf.is_public);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("서재 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBookshelf(bookshelf.id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      toast.success("저장됨");
      router.push(`/bookshelves/${bookshelf.id}`);
      router.refresh();
    } catch (error) {
      console.error("서재 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 수정에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBookshelf(bookshelf.id);
      toast.success("삭제됨");
      router.push("/bookshelves");
      router.refresh();
    } catch (error) {
      console.error("서재 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "서재 삭제에 실패했습니다."
      );
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>서재 정보</CardTitle>
          <CardDescription>서재 이름과 설명을 수정할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">서재 이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 읽고 싶은 책"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="서재에 대한 설명을 입력하세요."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is-public" className="text-sm font-medium cursor-pointer">서재 공개</Label>
                <p className="text-xs text-muted-foreground">
                  공개하면 링크를 통해 누구나 이 서재를 볼 수 있습니다.
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting || isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    서재 삭제
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>서재 삭제 확인</DialogTitle>
                    <DialogDescription>
                      이 서재를 삭제하시겠습니까? 서재에 속한 모든 책은 메인 서재로 이동됩니다.
                      <br />
                      <strong className="text-destructive">
                        이 작업은 되돌릴 수 없습니다.
                      </strong>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>서재 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">전체</div>
              <div className="text-2xl font-bold">{bookshelf.book_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">읽는 중</div>
              <div className="text-2xl font-bold">{bookshelf.reading_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">완독</div>
              <div className="text-2xl font-bold">{bookshelf.completed_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">일시정지</div>
              <div className="text-2xl font-bold">{bookshelf.paused_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">재독</div>
              <div className="text-2xl font-bold">{bookshelf.rereading_count}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
