"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, Library, BookOpen, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { getBookshelves, updateBookshelfOrder } from "@/app/actions/bookshelves";
import { Bookshelf } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/lib/i18n";

/**
 * 드래그 가능한 서재 아이템 컴포넌트
 */
function SortableBookshelfItem({
  bookshelf,
  pathname,
  isActive,
}: {
  bookshelf: Bookshelf;
  pathname: string;
  isActive: boolean;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookshelf.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Link
        href={`/bookshelves/${bookshelf.id}`}
        aria-label={bookshelf.name}
        aria-current={isActive ? "page" : undefined}
        className="block"
        onClick={(e) => {
          // 드래그 중일 때는 링크 클릭 방지
          if (isDragging) {
            e.preventDefault();
          }
        }}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2 h-8 px-2 text-xs group",
            isActive && "bg-secondary font-medium",
            isDragging && "cursor-grabbing"
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
            aria-label={t("bookshelves.reorderLabel")}
            onClick={(e) => {
              // 드래그 핸들 클릭 시 링크 이동 방지
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <BookOpen className="h-3 w-3" />
          <span className="flex-1 text-left truncate">{bookshelf.name}</span>
        </Button>
      </Link>
    </div>
  );
}

export function BookshelfTree() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookshelves();
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const mainBookshelf = bookshelves.find((b) => b.is_main);
    const subBookshelves = bookshelves.filter((b) => !b.is_main);

    const oldIndex = subBookshelves.findIndex((b) => b.id === active.id);
    const newIndex = subBookshelves.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
    const reordered = arrayMove(subBookshelves, oldIndex, newIndex);
    const newOrdered = reordered.map((b, index) => ({
      ...b,
      order: index,
    }));

    const updatedBookshelves = mainBookshelf
      ? [mainBookshelf, ...newOrdered]
      : newOrdered;

    setBookshelves(updatedBookshelves);
    setIsUpdating(true);

    try {
      // DB에 순서 업데이트
      await updateBookshelfOrder(
        newOrdered.map((b, index) => ({
          id: b.id,
          order: index,
        }))
      );
    } catch (error) {
      console.error("서재 순서 변경 오류:", error);
      // 오류 발생 시 원래 상태로 복구
      const data = await getBookshelves();
      setBookshelves(data);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-1 px-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full ml-4" />
        <Skeleton className="h-8 w-full ml-4" />
      </div>
    );
  }

  const mainBookshelf = bookshelves.find((b) => b.is_main);
  const subBookshelves = bookshelves.filter((b) => !b.is_main);

  if (bookshelves.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 px-3">
      {/* 메인 서재 */}
      {mainBookshelf && (
        <Link
          href="/books"
          aria-label={t("bookshelves.myLibraryIntegrated")}
          aria-current={pathname === "/books" ? "page" : undefined}
        >
          <Button
            variant={pathname === "/books" ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-9",
              pathname === "/books" && "bg-secondary font-medium"
            )}
          >
            <Library className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">{mainBookshelf.name}</span>
          </Button>
        </Link>
      )}

      {/* 하위 서재 트리 */}
      {subBookshelves.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>{t("bookshelves.bookshelvesCount").replace("{count}", String(subBookshelves.length))}</span>
          </Button>
          {isExpanded && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subBookshelves.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="ml-4 space-y-1">
                  {subBookshelves.map((bookshelf) => {
                    const isActive =
                      pathname === `/bookshelves/${bookshelf.id}` ||
                      pathname.startsWith(`/bookshelves/${bookshelf.id}/`);

                    return (
                      <SortableBookshelfItem
                        key={bookshelf.id}
                        bookshelf={bookshelf}
                        pathname={pathname}
                        isActive={isActive}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}
