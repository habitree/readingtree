"use client";

import { useState, useCallback } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";

const EXAMPLE_QUESTIONS = [
  "이번 달에 읽을 책을 추천해주세요",
  "지금 읽고 있는 책과 비슷한 책이 있나요?",
  "독서 습관을 만들려면 어떻게 해야 하나요?",
];

/**
 * 게스트 사용자용 채팅 플레이스홀더
 * 빈 ChatInterface UI를 보여주고, 입력 시 로그인 유도
 */
export function GuestChatPlaceholder() {
  const [loginOpen, setLoginOpen] = useState(false);

  const handleInteraction = useCallback(() => {
    setLoginOpen(true);
  }, []);

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">AI 독서 도우미</h1>
            <p className="text-xs text-muted-foreground">나만의 독서 파트너</p>
          </div>
        </div>

        {/* 빈 채팅 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-lg font-semibold">AI 독서 도우미와 대화해보세요</h2>
            <p className="text-sm text-muted-foreground">
              나의 독서 성향을 이해하는 AI와 대화하며 책 추천, 독서 조언을 받을 수 있어요.
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
              메시지를 입력하세요...
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
        title="AI 채팅을 사용하려면"
        description="로그인 후 AI 독서 파트너와 대화할 수 있어요."
      />
    </>
  );
}
