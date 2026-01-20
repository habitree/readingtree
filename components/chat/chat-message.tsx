"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  userAvatar?: string | null;
  userName?: string;
}

export function ChatMessage({ message, userAvatar, userName }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
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
    </div>
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
