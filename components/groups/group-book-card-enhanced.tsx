"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageSquare,
  Plus,
  Trash2,
  PenLine,
  BookMarked,
  CheckCircle2,
  BookX,
} from "lucide-react";
import { formatAuthor } from "@/lib/utils/book";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type { GroupBookLink } from "@/types/group";

/** 독서모임 3단계 상태 */
type GroupPhase = "before" | "reading" | "completed";

function toPhase(myStatus: string | null, isInMyLibrary: boolean): GroupPhase {
  if (!isInMyLibrary || !myStatus || myStatus === "not_started") return "before";
  if (myStatus === "completed") return "completed";
  return "reading";
}

const PHASE_STYLE = {
  before: { icon: BookX, label: "읽기 전", bg: "bg-slate-500/10", text: "text-slate-500", dot: "bg-slate-400" },
  reading: { icon: BookMarked, label: "읽는 중", bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
  completed: { icon: CheckCircle2, label: "완독", bg: "bg-violet-500/10", text: "text-violet-600", dot: "bg-violet-500" },
} as const;

interface GroupBookCardEnhancedProps {
  groupId: string;
  groupBook: {
    id: string;
    book_id: string;
    description?: string | null;
    links?: GroupBookLink[] | null;
    books: {
      id: string;
      title: string;
      author: string | null;
      cover_image_url: string | null;
      description_summary?: string | null;
    };
    isInMyLibrary?: boolean;
    myStatus?: string | null;
    recentContributors?: { id: string; name: string; avatar_url: string | null }[];
  };
  noteCount: number;
  onAddToLibrary?: (bookId: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isLeader?: boolean;
}

export function GroupBookCardEnhanced({
  groupId,
  groupBook,
  noteCount,
  onAddToLibrary,
  onDelete,
  onEdit,
  isLeader,
}: GroupBookCardEnhancedProps) {
  const { t } = useTranslation();
  const book = groupBook.books;
  const [imgError, setImgError] = useState(false);
  if (!book) return null;

  const hasValidImage = isValidImageUrl(book.cover_image_url) && !imgError;
  const phase = toPhase(groupBook.myStatus || null, !!groupBook.isInMyLibrary);
  const phaseStyle = PHASE_STYLE[phase];

  return (
    <div className="relative group">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <Link href={`/groups/${groupId}/books/${book.id}`}>
          <div className="relative aspect-[3/4] w-full bg-muted">
            {hasValidImage ? (
              <Image
                src={getImageUrl(book.cover_image_url)}
                alt={book.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground text-center line-clamp-2">{book.title}</span>
              </div>
            )}

            {/* 기록 수 배지 */}
            {noteCount > 0 && (
              <div className="absolute top-1 right-1">
                <Badge className="flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-5 shadow-sm">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {noteCount}
                </Badge>
              </div>
            )}

            {/* 최근 기록자 아바타 */}
            {groupBook.recentContributors && groupBook.recentContributors.length > 0 && (
              <div className="absolute bottom-1 left-1 flex -space-x-1">
                {groupBook.recentContributors.map((contributor) => (
                  <Avatar key={contributor.id} className="h-5 w-5 ring-1 ring-background">
                    <AvatarImage src={contributor.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{contributor.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}

            {/* 상태 도트 (우하단) */}
            <div className="absolute bottom-1.5 right-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-background", phaseStyle.dot)} />
            </div>
          </div>
        </Link>

        <div className="p-2 sm:p-3">
          <Link href={`/groups/${groupId}/books/${book.id}`}>
            <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight hover:text-primary transition-colors">
              {book.title}
            </h4>
          </Link>
          {book.author && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {formatAuthor(book.author)}
            </p>
          )}

          {/* 리더 소개글 */}
          {groupBook.description && (
            <p className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5 italic">
              {groupBook.description}
            </p>
          )}

          {/* 상태 영역 */}
          <div className="mt-1.5">
            {groupBook.isInMyLibrary ? (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 gap-1 border-0", phaseStyle.bg, phaseStyle.text)}>
                <phaseStyle.icon className="h-2.5 w-2.5" />
                {phaseStyle.label}
              </Badge>
            ) : (
              onAddToLibrary ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[10px] sm:text-xs h-6 sm:h-7"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToLibrary(book.id);
                  }}
                >
                  <Plus className="mr-0.5 h-3 w-3" />
                  {t("groups.addToMyLibrary")}
                </Button>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-0 bg-slate-500/10 text-slate-500">
                  <BookX className="h-2.5 w-2.5" />
                  읽기 전
                </Badge>
              )
            )}
          </div>
        </div>
      </Card>

      {/* 리더 액션 (호버) */}
      {isLeader && (
        <div className="absolute top-0.5 left-0.5 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              className="p-1 rounded-full bg-primary/80 text-primary-foreground shadow-sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
              title={t("groups.editBookInfo")}
            >
              <PenLine className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              className="p-1 rounded-full bg-destructive/80 text-destructive-foreground shadow-sm"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              title={t("groups.deleteDesignatedBook")}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
