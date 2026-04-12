"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderPlus, BookOpen, Search, Plus, Trash2, ExternalLink } from "lucide-react";
import {
  createGroupBookBundle,
  updateGroupBookBundle,
  getGroupBooksWithUserStatus,
  assignBooksToBundle,
} from "@/app/actions/groups";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatAuthor } from "@/lib/utils/book";
import { cn } from "@/lib/utils";
import type { GroupBookBundle } from "@/types/group";

interface BundleManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  bundle?: GroupBookBundle | null;
  onSuccess?: () => void;
}

export function BundleManageDialog({
  open,
  onOpenChange,
  groupId,
  bundle,
  onSuccess,
}: BundleManageDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!bundle;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);

  // 도서 선택
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [bookSearch, setBookSearch] = useState("");

  useEffect(() => {
    if (open) {
      setName(bundle?.name || "");
      setDescription(bundle?.description || "");
      setLinks(bundle?.links?.length ? [...bundle.links] : []);
      setBookSearch("");
      loadBooks();
    }
  }, [open, bundle, groupId]);

  const loadBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const books = await getGroupBooksWithUserStatus(groupId);
      setAllBooks(books);
      // 편집 모드: 현재 컬렉션에 속한 책들을 선택 상태로
      if (bundle) {
        const currentIds = new Set(
          books.filter((gb: any) => gb.bundle_id === bundle.id).map((gb: any) => gb.book_id)
        );
        setSelectedBookIds(currentIds);
      } else {
        setSelectedBookIds(new Set());
      }
    } catch {
      // 조용히 처리
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return allBooks;
    const q = bookSearch.toLowerCase();
    return allBooks.filter((gb: any) => {
      const book = gb.books;
      return book?.title?.toLowerCase().includes(q) || book?.author?.toLowerCase().includes(q);
    });
  }, [allBooks, bookSearch]);

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const toggleAll = () => {
    const visibleIds = filteredBooks.map((gb: any) => gb.book_id);
    const allSelected = visibleIds.every((id: string) => selectedBookIds.has(id));
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id: string) => next.delete(id));
      } else {
        visibleIds.forEach((id: string) => next.add(id));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("컬렉션 이름을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);

      let bundleId: string;

      const validLinks = links.filter((l) => l.title.trim() && l.url.trim());

      if (isEdit && bundle) {
        await updateGroupBookBundle(bundle.id, {
          name: name.trim(),
          description: description.trim() || null,
          links: validLinks.length > 0 ? validLinks : null,
        });
        bundleId = bundle.id;
      } else {
        const created = await createGroupBookBundle(
          groupId,
          name.trim(),
          description.trim() || undefined
        );
        bundleId = created.id;
      }

      // 도서 배정: 기존 배정 해제 + 새 배정
      // 1) 이 컬렉션에서 해제된 책들 (기존에 있었지만 선택 해제된 책)
      const previousIds = allBooks
        .filter((gb: any) => gb.bundle_id === (bundle?.id || bundleId))
        .map((gb: any) => gb.book_id);
      const removedIds = previousIds.filter((id: string) => !selectedBookIds.has(id));
      if (removedIds.length > 0) {
        await assignBooksToBundle(groupId, removedIds, null);
      }

      // 2) 새로 배정할 책들
      const newIds = Array.from(selectedBookIds).filter(
        (id) => !previousIds.includes(id)
      );
      if (newIds.length > 0) {
        await assignBooksToBundle(groupId, newIds, bundleId);
      }

      toast.success(isEdit ? t("groups.bundleUpdated") : t("groups.bundleCreated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            {isEdit ? t("groups.editBundle") : t("groups.createBundle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label>{t("groups.bundleName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groups.bundleNamePlaceholder")}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label>{t("groups.bundleDescription")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("groups.bundleDescPlaceholder")}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* 참고 링크 */}
          <div className="space-y-1.5">
            <Label>{t("groups.customLinks")}</Label>
            {links.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    value={link.title}
                    onChange={(e) => {
                      const next = [...links];
                      next[index] = { ...next[index], title: e.target.value };
                      setLinks(next);
                    }}
                    placeholder={t("groups.linkTitlePlaceholder")}
                    className="h-7 text-sm"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...links];
                      next[index] = { ...next[index], url: e.target.value };
                      setLinks(next);
                    }}
                    placeholder={t("groups.linkUrlPlaceholder")}
                    className="h-7 text-sm"
                    type="url"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinks((prev) => [...prev, { title: "", url: "" }])}
              className="w-full h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              {t("groups.addLink")}
            </Button>
          </div>

          {/* 도서 선택 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>도서 선택</Label>
              <span className="text-xs text-muted-foreground">
                {selectedBookIds.size}/{allBooks.length}권 선택
              </span>
            </div>

            {/* 도서 검색 */}
            {allBooks.length > 5 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="도서 검색..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            )}

            {isLoadingBooks ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* 전체 선택 */}
                <label className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={filteredBooks.length > 0 && filteredBooks.every((gb: any) => selectedBookIds.has(gb.book_id))}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-xs font-medium">전체 선택</span>
                </label>

                {/* 도서 목록 */}
                <div className="max-h-[240px] overflow-y-auto divide-y divide-border/30">
                  {filteredBooks.map((gb: any) => {
                    const book = gb.books;
                    if (!book) return null;
                    const isSelected = selectedBookIds.has(gb.book_id);
                    const currentBundle = gb.bundle_id;
                    const isInOtherBundle = currentBundle && currentBundle !== bundle?.id;

                    return (
                      <label
                        key={gb.id}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleBook(gb.book_id)}
                        />
                        {/* 표지 */}
                        <div className="relative w-8 h-11 rounded-sm overflow-hidden bg-muted shrink-0">
                          {isValidImageUrl(book.cover_image_url) ? (
                            <Image
                              src={getImageUrl(book.cover_image_url)}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          {book.author && (
                            <p className="text-[11px] text-muted-foreground truncate">{formatAuthor(book.author)}</p>
                          )}
                        </div>
                        {isInOtherBundle && (
                          <Badge variant="outline" className="text-[9px] px-1.5 shrink-0">
                            다른 컬렉션
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "저장 중..." : isEdit ? "수정" : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
