"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Bot, User, Trash2, BookOpen, FileText } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import type { ChatMessage as ChatMessageType } from "@/types/ai";

/** 책 메타데이터 (표지 이미지 표시용) */
export interface BookMetadata {
  id: string;
  title: string;
  cover_image_url: string | null;
}

/**
 * 메시지 내용에서 [[book:id:제목]] 및 [[note:id:타입]] 형식을 파싱하여 링크로 변환
 * bookMetadataMap이 제공되면 책 표지 이미지도 함께 표시
 */
function parseMessageContent(
  content: string,
  bookMetadataMap?: Map<string, BookMetadata>
): React.ReactNode[] {
  // [[book:id:제목]] 또는 [[note:id:타입]] 패턴 매칭
  const regex = /\[\[(book|note):([a-zA-Z0-9-]+):([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    // 링크 전의 일반 텍스트
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [, type, id, label] = match;
    const href = type === "book" ? `/books/${id}` : `/notes/${id}`;
    const bookMeta = type === "book" ? bookMetadataMap?.get(id) : undefined;
    const coverUrl = bookMeta?.cover_image_url;

    if (type === "book" && coverUrl) {
      // 책 표지 이미지가 있는 경우 - 카드 형태로 표시
      parts.push(
        <Link
          key={`link-${keyIndex++}`}
          href={href}
          className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors align-middle"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-6 h-8 rounded-sm overflow-hidden shrink-0 shadow-sm">
            <img
              src={getImageUrl(coverUrl)}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-primary font-medium text-sm">{label}</span>
        </Link>
      );
    } else {
      // 표지 이미지가 없는 경우 - 기존 아이콘 스타일
      const Icon = type === "book" ? BookOpen : FileText;
      parts.push(
        <Link
          key={`link-${keyIndex++}`}
          href={href}
          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // 마지막 일반 텍스트
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

interface ChatMessageProps {
  message: ChatMessageType;
  userAvatar?: string | null;
  userName?: string;
  onDelete?: (messageId: string) => void;
  bookMetadataMap?: Map<string, BookMetadata>;
}

export function ChatMessage({ message, userAvatar, userName, onDelete, bookMetadataMap }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // AI 응답에서만 링크 파싱 (사용자 메시지는 그대로 표시)
  const parsedContent = useMemo(() => {
    if (isUser || !message.content) {
      return message.content;
    }
    return parseMessageContent(message.content, bookMetadataMap);
  }, [message.content, isUser, bookMetadataMap]);

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
              {parsedContent}
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
  bookMetadataMap?: Map<string, BookMetadata>;
}

export function StreamingMessage({ content, isLoading, bookMetadataMap }: StreamingMessageProps) {
  // 스트리밍 완료 후에만 링크 파싱 (스트리밍 중에는 성능을 위해 일반 텍스트로 표시)
  const parsedContent = useMemo(() => {
    if (isLoading || !content) {
      return content;
    }
    return parseMessageContent(content, bookMetadataMap);
  }, [content, isLoading, bookMetadataMap]);

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
          {parsedContent}
          {isLoading && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary" />
          )}
        </div>
      </div>
    </div>
  );
}
