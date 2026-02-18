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
import { createBookshelf } from "@/app/actions/bookshelves";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function CreateBookshelfDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("서재 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBookshelf({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("서재가 만들어졌어요");
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (error) {
      console.error("서재 생성 오류:", error);
      const errorMessage = error instanceof Error ? error.message : "서재 생성에 실패했습니다.";
      toast.error(errorMessage);
      // 최대 개수 제한 오류인 경우 다이얼로그를 닫지 않음
      if (errorMessage.includes("최대 5개")) {
        setIsSubmitting(false);
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 서재 만들기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 서재 만들기</DialogTitle>
            <DialogDescription>
              책을 분류하여 관리할 수 있는 서재를 만들어보세요. (최대 5개까지 등록 가능)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "만드는 중..." : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
