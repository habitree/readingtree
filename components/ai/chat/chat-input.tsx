"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("chat.typePlaceholder");
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // 모바일 키보드 대응: 포커스 시 스크롤
  const scrollToInput = useCallback(() => {
    if (containerRef.current) {
      // 약간의 딜레이 후 스크롤 (키보드 애니메이션 대기)
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 300);
    }
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    scrollToInput();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        // 전송 후 포커스 유지
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키로 전송 (Shift+Enter는 줄바꿈) - 모바일에서는 Enter로 줄바꿈
    // 데스크톱에서만 Enter로 전송
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );

    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-end gap-2 border-t bg-background p-3 sm:p-4",
        // iPhone 노치 대응
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))]",
        // 포커스 시 시각적 피드백
        isFocused && "bg-muted/30"
      )}
    >
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className={cn(
          "min-h-[44px] max-h-[200px] resize-none",
          // 모바일에서 터치 영역 확보
          "text-base leading-relaxed"
        )}
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        size="icon"
        className={cn(
          "h-11 w-11 shrink-0 transition-all",
          // 전송 가능할 때 강조
          message.trim() && !disabled && "bg-primary shadow-md"
        )}
      >
        {disabled ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
