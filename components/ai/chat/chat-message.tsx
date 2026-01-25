"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Bot, User, Trash2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/ai";

interface ChatMessageProps {
  message: ChatMessageType;
  userAvatar?: string | null;
  userName?: string;
  onDelete?: (messageId: string) => void;
}

export function ChatMessage({ message, userAvatar, userName, onDelete }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "group flex gap-3 p-4",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* 아바타 */}
        <Avatar className="h-8 w-8 shrink-0">
          {isUser ? (
            <>
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback>
                {userName?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </AvatarFallback>
          )}
        </Avatar>

        {/* 메시지 내용 */}
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            <div
              className={cn(
                "mt-1 text-xs opacity-60",
                isUser ? "text-right" : "text-left"
              )}
            >
              {new Date(message.created_at).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          
          {/* 삭제 버튼 - 호버 시 표시 */}
          {onDelete && !message.id.startsWith('temp-') && (
            <div className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "self-end" : "self-start"
            )}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메시지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 메시지를 삭제하시겠습니까? 삭제된 메시지는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface StreamingMessageProps {
  content: string;
  isLoading?: boolean;
}

export function StreamingMessage({ content, isLoading }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 p-4">
      {/* AI 아바타 */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>

      {/* 메시지 내용 */}
      <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
          {isLoading && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary" />
          )}
        </div>
      </div>
    </div>
  );
}
