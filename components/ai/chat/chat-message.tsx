"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { Bot, User, Trash2, BookOpen, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import type { ChatMessage as ChatMessageType } from "@/types/ai";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

/** 책 메타데이터 (표지 이미지 표시용) */
export interface BookMetadata {
  id: string;
  title: string;
  cover_image_url: string | null;
}

/** 메시지에서 참조된 책 정보 */
interface ReferencedBook {
  id: string;
  label: string;
  coverUrl: string | null;
}

/**
 * 메시지 내용에서 [[book:id:제목]], [[note:id:타입]], [[recommend:제목:저자]] 형식을 파싱하여 변환
 * 인라인에서는 텍스트 링크로만 표시하고, 표지 카드는 하단에 별도 표시
 */
function parseMessageContent(
  content: string,
  bookMetadataMap?: Map<string, BookMetadata>
): React.ReactNode[] {
  const regex = /\[\[(book|note|recommend):([^\]]+?):([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [, type, idOrTitle, label] = match;

    if (type === "recommend") {
      // [[recommend:「제목」:저자]] fallback: 링크 없이 스타일링된 텍스트로 표시
      parts.push(
        <span
          key={`recommend-${keyIndex++}`}
          className="inline-flex items-center gap-1 font-medium text-muted-foreground"
        >
          <BookOpen className="h-3 w-3" />
          <span>{idOrTitle} ({label})</span>
        </span>
      );
    } else {
      const id = idOrTitle;
      const href = type === "book" ? `/books/${id}` : `/notes/${id}`;
      const Icon = type === "book" ? BookOpen : FileText;

      // 인라인에서는 항상 텍스트 링크로 표시 (표지는 하단 카드에서)
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

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

/**
 * 메시지에서 참조된 모든 책 정보를 추출 (표지 카드 표시용)
 */
function extractReferencedBooks(
  content: string,
  bookMetadataMap?: Map<string, BookMetadata>
): ReferencedBook[] {
  const regex = /\[\[book:([a-zA-Z0-9-]+):([^\]]+)\]\]/g;
  const books: ReferencedBook[] = [];
  const seen = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const [, id, label] = match;
    if (seen.has(id)) continue;
    seen.add(id);

    const meta = bookMetadataMap?.get(id);
    books.push({
      id,
      label,
      coverUrl: meta?.cover_image_url || null,
    });
  }

  return books;
}

/**
 * 스트리밍 중 [[book:...]] / [[note:...]] / [[recommend:...]] 패턴을 깔끔한 텍스트로 치환
 */
function cleanStreamingContent(content: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  return content
    .replace(
      /\[\[(book|note):([a-zA-Z0-9-]+):([^\]]+)\]\]/g,
      (_, type, _id, label) => {
        return type === "book" ? `${label}` : `${label}`;
      }
    )
    .replace(
      /\[\[recommend:([^\]]+):([^\]]+)\]\]/g,
      (_, title, author) => t("chat.recommendedBy", { title, author })
    );
}

interface ChatMessageProps {
  message: ChatMessageType;
  userAvatar?: string | null;
  userName?: string;
  onDelete?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: "positive" | "negative" | null) => void;
  bookMetadataMap?: Map<string, BookMetadata>;
}

export function ChatMessage({ message, userAvatar, userName, onDelete, onFeedback, bookMetadataMap }: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(
    (message.feedback as "positive" | "negative" | null) ?? null
  );

  // AI 응답에서만 링크 파싱 (사용자 메시지는 그대로 표시)
  const parsedContent = useMemo(() => {
    if (isUser || !message.content) {
      return message.content;
    }
    return parseMessageContent(message.content, bookMetadataMap);
  }, [message.content, isUser, bookMetadataMap]);

  // 완료된 AI 메시지에서 참조된 책 추출 (표지 카드용)
  const referencedBooks = useMemo(() => {
    if (isUser || !message.content) return [];
    return extractReferencedBooks(message.content, bookMetadataMap);
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
        <div className="flex flex-col gap-1 max-w-[80%]">
          <div
            className={cn(
              "rounded-2xl px-4 py-2",
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

          {/* 참고한 책 표지 카드 (AI 메시지 완료 후 표시) */}
          {!isUser && referencedBooks.length > 0 && (
            <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
              {referencedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex-shrink-0 group/card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-16 rounded-lg overflow-hidden border border-border/50 hover:border-primary/40 transition-all hover:shadow-md">
                    {book.coverUrl ? (
                      <div className="w-16 h-22 aspect-[2/3]">
                        <img
                          src={getImageUrl(book.coverUrl)}
                          alt={book.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 aspect-[2/3] bg-muted flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="px-1 py-1">
                      <p className="text-[10px] leading-tight text-muted-foreground group-hover/card:text-primary line-clamp-2 transition-colors">
                        {book.label.replace(/[「」]/g, "")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* AI 메시지 피드백 + 삭제 버튼 */}
          {!message.id.startsWith('temp-') && (
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "self-end" : "self-start"
            )}>
              {/* 피드백 버튼 (AI 메시지만) */}
              {!isUser && onFeedback && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0",
                      feedback === "positive"
                        ? "text-primary opacity-100"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={() => {
                      const newFeedback = feedback === "positive" ? null : "positive";
                      setFeedback(newFeedback);
                      onFeedback(message.id, newFeedback);
                    }}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0",
                      feedback === "negative"
                        ? "text-destructive opacity-100"
                        : "text-muted-foreground hover:text-destructive"
                    )}
                    onClick={() => {
                      const newFeedback = feedback === "negative" ? null : "negative";
                      setFeedback(newFeedback);
                      onFeedback(message.id, newFeedback);
                    }}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </>
              )}
              {/* 삭제 버튼 */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t("common.delete")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteMessage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteMessageConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
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
  const { t } = useTranslation();
  // 스트리밍 중: [[book:...]] 패턴을 깔끔한 텍스트로 치환
  // 스트리밍 완료 후: 링크로 파싱
  const displayContent = useMemo(() => {
    if (!content) return content;
    if (isLoading) {
      return cleanStreamingContent(content, t);
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
      <div className="max-w-[80%] flex flex-col gap-1.5">
        <div className="rounded-2xl bg-muted px-4 py-2">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {displayContent}
            {isLoading && (
              <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary rounded-sm" />
            )}
          </div>
        </div>

        {/* 스트리밍 진행중 표시 */}
        {isLoading && (
          <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80" />
            </span>
            <span>{t("chat.writingResponse")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
