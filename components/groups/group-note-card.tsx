"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Heart,
  Lightbulb,
  HandHeart,
} from "lucide-react";
import { NOTE_TYPE_STYLES } from "@/lib/constants/note-type-styles";
import type { NoteStyleType } from "@/lib/constants/note-type-styles";
import { formatSmartDate } from "@/lib/utils/date";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { NoteType } from "@/types/group";
import { useTranslation } from "@/lib/i18n";
import { toggleNoteReaction } from "@/app/actions/groups";
import { parseNoteContentFields } from "@/lib/utils/note";
import type { ReactionType } from "@/app/actions/groups";
import { NoteComments } from "./note-comments";
import { MessageCircle } from "lucide-react";

interface ReactionData {
  like: { count: number; hasReacted: boolean };
  insightful: { count: number; hasReacted: boolean };
  empathy: { count: number; hasReacted: boolean };
}

interface GroupNoteCardProps {
  note: {
    id: string;
    user_id: string;
    title: string | null;
    type: NoteType;
    content: string | null;
    image_url: string | null;
    page_number: number | null;
    tags: string[] | null;
    created_at: string;
    users: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
  };
  groupNoteId?: string;
  sharedAt: string;
  currentUserId?: string;
  reactions?: ReactionData;
  commentCount?: number;
  onUnshare?: (noteId: string) => void;
}

const CONTENT_PREVIEW_LENGTH = 150;

const REACTION_CONFIG: {
  type: ReactionType;
  icon: typeof Heart;
  labelKey: string;
  activeColor: string;
  activeBg: string;
}[] = [
  { type: "like", icon: Heart, labelKey: "groups.reactionLike", activeColor: "text-rose-500", activeBg: "bg-rose-50 dark:bg-rose-950/30" },
  { type: "insightful", icon: Lightbulb, labelKey: "groups.reactionInsightful", activeColor: "text-amber-500", activeBg: "bg-amber-50 dark:bg-amber-950/30" },
  { type: "empathy", icon: HandHeart, labelKey: "groups.reactionEmpathy", activeColor: "text-blue-500", activeBg: "bg-blue-50 dark:bg-blue-950/30" },
];

export function GroupNoteCard({
  note,
  groupNoteId,
  sharedAt,
  currentUserId,
  reactions: initialReactions,
  commentCount: initialCommentCount = 0,
  onUnshare,
}: GroupNoteCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUnshareDialog, setShowUnshareDialog] = useState(false);
  const [reactions, setReactions] = useState<ReactionData>(
    initialReactions || {
      like: { count: 0, hasReacted: false },
      insightful: { count: 0, hasReacted: false },
      empathy: { count: 0, hasReacted: false },
    }
  );
  const [isReacting, setIsReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const styleType = (note.type in NOTE_TYPE_STYLES ? note.type : "memo") as NoteStyleType;
  const config = NOTE_TYPE_STYLES[styleType];
  const TypeIcon = config.icon;
  const isOwner = currentUserId === note.user_id;

  const { quote: parsedQuote, memo: parsedMemo } = parseNoteContentFields(note.content);
  const readableContent = [parsedQuote, parsedMemo].filter(Boolean).join("\n\n") || note.content;
  const shouldTruncate =
    readableContent && readableContent.length > CONTENT_PREVIEW_LENGTH;
  const displayContent =
    shouldTruncate && !isExpanded
      ? readableContent?.slice(0, CONTENT_PREVIEW_LENGTH) + "..."
      : readableContent;

  const hasImage = note.image_url && isValidImageUrl(note.image_url);

  const handleUnshare = () => {
    onUnshare?.(note.id);
    setShowUnshareDialog(false);
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (!groupNoteId || isReacting) return;
    setIsReacting(true);

    const prev = reactions[reactionType];
    setReactions((r) => ({
      ...r,
      [reactionType]: {
        count: prev.hasReacted ? prev.count - 1 : prev.count + 1,
        hasReacted: !prev.hasReacted,
      },
    }));

    try {
      await toggleNoteReaction(groupNoteId, reactionType);
    } catch {
      setReactions((r) => ({
        ...r,
        [reactionType]: prev,
      }));
    } finally {
      setIsReacting(false);
    }
  };

  const totalReactions = REACTION_CONFIG.reduce((sum, rc) => sum + reactions[rc.type].count, 0);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-sm transition-shadow">
        <CardContent className="p-3 sm:p-4">
          {/* 상단: 아바타 + 이름 + 타입 + 메뉴 */}
          <div className="flex items-center gap-2 mb-2">
            <Link href={note.users ? `/profile/${note.users.id}` : "#"}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={note.users?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {note.users?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link
              href={note.users ? `/profile/${note.users.id}` : "#"}
              className="text-sm font-medium hover:underline truncate"
            >
              {note.users?.name || t("groups.unknownUser")}
            </Link>
            <span className="text-[10px] text-muted-foreground shrink-0" suppressHydrationWarning>
              {formatSmartDate(sharedAt)}
            </span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <Badge
                variant="secondary"
                className={`${config.bgColor} ${config.color} border-0 text-[10px] px-1.5 py-0`}
              >
                <TypeIcon className="mr-0.5 h-2.5 w-2.5" />
                <span className="hidden sm:inline">{t(config.labelKey as Parameters<typeof t>[0])}</span>
              </Badge>
              {isOwner && onUnshare && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/notes/${note.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {t("groups.viewNote")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowUnshareDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("groups.unshare")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 본문: 텍스트 + 이미지 썸네일 */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              {note.title && (
                <p className="font-semibold text-sm mb-1 line-clamp-1">{note.title}</p>
              )}

              {note.content && (
                <div
                  className={`${
                    note.type === "quote"
                      ? `border-l-2 ${config.borderColor} pl-3 italic ${config.bgColor} py-2 pr-2 rounded-r-md`
                      : ""
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {displayContent}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      {isExpanded ? t("common.showLess") : t("common.seeMore")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 이미지 썸네일 (우측 작게) */}
            {hasImage && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getImageUrl(note.image_url)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
          </div>

          {/* 하단: 페이지 + 태그 + 리액션 */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
            {note.page_number && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                p.{note.page_number}
              </span>
            )}
            {note.tags && note.tags.length > 0 && (
              <>
                {note.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{note.tags.length - 2}</span>
                )}
              </>
            )}

            {/* 리액션 + 댓글 (우측 정렬) */}
            {groupNoteId && (
              <div className="ml-auto flex items-center gap-0.5">
                {REACTION_CONFIG.map((rc) => {
                  const data = reactions[rc.type];
                  const Icon = rc.icon;
                  return (
                    <button
                      key={rc.type}
                      onClick={() => handleReaction(rc.type)}
                      disabled={isReacting}
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-colors ${
                        data.hasReacted
                          ? `${rc.activeBg} ${rc.activeColor} font-medium`
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      title={t(rc.labelKey as Parameters<typeof t>[0])}
                    >
                      <Icon className={`h-3 w-3 ${data.hasReacted ? "fill-current" : ""}`} />
                      {data.count > 0 && <span>{data.count}</span>}
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-colors ${
                    showComments
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <MessageCircle className="h-3 w-3" />
                  {initialCommentCount > 0 && <span>{initialCommentCount}</span>}
                </button>
              </div>
            )}
          </div>

          {/* 댓글 영역 */}
          {showComments && groupNoteId && (
            <div className="mt-2">
              <NoteComments
                groupNoteId={groupNoteId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showUnshareDialog} onOpenChange={setShowUnshareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.unshareConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.unshareConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnshare}
              variant="destructive"
            >
              {t("groups.unshare")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
