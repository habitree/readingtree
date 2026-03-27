"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types/ai";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteAllSessions?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onDeleteAllSessions,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
}: ChatSidebarProps) {
  const { t } = useTranslation();
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const handleDeleteConfirm = () => {
    if (deleteSessionId) {
      onDeleteSession(deleteSessionId);
      setDeleteSessionId(null);
    }
  };

  const handleDeleteAllConfirm = () => {
    if (onDeleteAllSessions) {
      onDeleteAllSessions();
      setShowDeleteAllDialog(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r bg-background py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewSession}
          className="mb-4"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mt-auto"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-background">
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 pb-3 pt-4 sm:pt-5">
          <h2 className="font-semibold leading-tight">{t("chat.chatHistory")}</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onNewSession}>
              <Plus className="h-5 w-5" />
            </Button>
            {onToggleCollapse && (
              <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="hidden md:flex">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* 세션 목록 */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("chat.noChats")}
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg p-2 hover:bg-muted",
                    currentSessionId === session.id && "bg-muted"
                  )}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {session.title || t("chat.newChat")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.last_message_at
                          ? new Date(session.last_message_at).toLocaleDateString("ko-KR")
                          : t("chat.noDate")}
                      </div>
                    </div>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDeleteSessionId(session.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 모든 대화 삭제 버튼 */}
        {sessions.length > 0 && onDeleteAllSessions && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteAllDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("chat.deleteAllChats")}
            </Button>
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteChat")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteChatConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모든 대화 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteAllChats")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteAllChatsConfirm", { count: sessions.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              variant="destructive"
            >
              {t("chat.deleteAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
