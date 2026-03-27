"use client";

import { useState, useCallback } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { useTranslation } from "@/lib/i18n";

/**
 * 게스트 사용자용 채팅 플레이스홀더
 * 빈 ChatInterface UI를 보여주고, 입력 시 로그인 유도
 */
export function GuestChatPlaceholder() {
  const { t } = useTranslation();
  const [loginOpen, setLoginOpen] = useState(false);

  const EXAMPLE_QUESTIONS = [
    t("guestChat.exampleQ1"),
    t("guestChat.exampleQ2"),
    t("guestChat.exampleQ3"),
  ];

  const handleInteraction = useCallback(() => {
    setLoginOpen(true);
  }, []);

  return (
    <>
      <div className="flex h-[calc(100dvh-9rem)] max-h-[calc(100dvh-9rem)] flex-col overflow-hidden md:h-[calc(100dvh-7rem)] md:max-h-[calc(100dvh-7rem)]">
        {/* 헤더 */}
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">{t("guestChat.heading")}</h1>
            <p className="text-xs text-muted-foreground">{t("guestChat.subheading")}</p>
          </div>
        </div>

        {/* 빈 채팅 영역 */}
        <div className="min-h-0 flex-1 flex flex-col items-center justify-center overflow-y-auto p-6 pt-8 space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-lg font-semibold">{t("guestChat.welcomeTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("guestChat.welcomeDesc")}
            </p>
          </div>

          {/* 예시 질문 */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {EXAMPLE_QUESTIONS.map((question) => (
              <button
                key={question}
                onClick={handleInteraction}
                className="rounded-full border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 영역 (비활성) */}
        <div className="border-t px-4 py-3">
          <div
            onClick={handleInteraction}
            className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 cursor-pointer hover:border-primary/30 transition-colors"
          >
            <span className="flex-1 text-sm text-muted-foreground">
              {t("guestChat.placeholder")}
            </span>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
              <Send className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <LoginPromptModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        title={t("guestChat.loginTitle")}
        description={t("guestChat.loginDesc")}
      />
    </>
  );
}
