"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Quote,
  Camera,
  FileText,
  ScanText,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
    };
  };
  sharedAt: string;
  currentUserId?: string;
  onUnshare?: (noteId: string) => void;
}

const noteTypeConfigBase = {
  quote: {
    icon: Quote,
    labelKey: "groups.noteTypeQuote" as const,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-l-amber-400",
  },
  photo: {
    icon: Camera,
    labelKey: "groups.noteTypePhoto" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-l-blue-400",
  },
  memo: {
    icon: FileText,
    labelKey: "groups.noteTypeMemo" as const,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-l-green-400",
  },
  transcription: {
    icon: ScanText,
    labelKey: "groups.noteTypeTranscription" as const,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-l-purple-400",
  },
};

const CONTENT_PREVIEW_LENGTH = 200;

export function GroupNoteCard({
  note,
  sharedAt,
  currentUserId,
  onUnshare,
}: GroupNoteCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUnshareDialog, setShowUnshareDialog] = useState(false);

  const config = noteTypeConfigBase[note.type];
  const TypeIcon = config.icon;
  const isOwner = currentUserId === note.user_id;

  const shouldTruncate =
    note.content && note.content.length > CONTENT_PREVIEW_LENGTH;
  const displayContent =
    shouldTruncate && !isExpanded
      ? note.content?.slice(0, CONTENT_PREVIEW_LENGTH) + "..."
      : note.content;

  const handleUnshare = () => {
    onUnshare?.(note.id);
    setShowUnshareDialog(false);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/profile/${note.users.id}`}>
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background hover:ring-primary/20 transition-all">
                  <AvatarImage src={note.users.avatar_url || undefined} />
                  <AvatarFallback className="text-sm">
                    {note.users.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/profile/${note.users.id}`}
                  className="font-medium hover:underline truncate block"
                >
                  {note.users.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t("groups.sharedAt").replace("{date}", formatSmartDate(sharedAt))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className={`${config.bgColor} ${config.color} border-0`}
              >
                <TypeIcon className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">{t(config.labelKey)}</span>
              </Badge>
              {isOwner && onUnshare && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
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
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {note.title && (
            <h4 className="font-semibold text-base">{note.title}</h4>
          )}

          {note.image_url && isValidImageUrl(note.image_url) && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <Image
                src={getImageUrl(note.image_url)}
                alt={t("notes.noteContent")}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              />
            </div>
          )}

          {note.content && (
            <div
              className={`${
                note.type === "quote"
                  ? `border-l-4 ${config.borderColor} pl-4 italic ${config.bgColor} py-3 pr-3 rounded-r-lg`
                  : ""
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {displayContent}
              </p>
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 h-auto py-1 px-2 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      {t("common.showLess")}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      {t("common.seeMore")}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-2 border-t">
            {note.page_number && (
              <Badge variant="outline" className="text-xs font-normal">
                p.{note.page_number}
              </Badge>
            )}
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {note.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    #{tag}
                  </Badge>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-xs">+{note.tags.length - 3}</span>
                )}
              </div>
            )}
            <span className="ml-auto">
              {t("groups.writtenAtDate").replace("{date}", formatSmartDate(note.created_at))}
            </span>
          </div>
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
