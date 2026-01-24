"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, StreamingMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X } from "lucide-react";
import { toast } from "sonner";
import {
  createChatSession,
  getChatSessions,
  getChatSession,
  deleteChatSession,
  getChatContext,
  generateSessionTitle,
} from "@/app/actions/ai";
import { WELCOME_MESSAGE, EXAMPLE_QUESTIONS } from "@/lib/api/chat-prompts";
import type { ChatSession, ChatMessage as ChatMessageType, ChatContext } from "@/types/ai";

interface ChatInterfaceProps {
  userId: string;
  userAvatar?: string | null;
  userName?: string;
}

export function ChatInterface({ userId, userAvatar, userName }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [context, setContext] = useState<ChatContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 화면 크기에 따라 사이드바 상태 초기화
  useEffect(() => {
    const handleResize = () => {
      // md breakpoint (768px) 이상에서만 사이드바 기본 열림
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 세션 목록 로드
  const loadSessions = useCallback(async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (error) {
      console.error("세션 목록 로드 실패:", error);
    }
  }, []);

  // 컨텍스트 로드
  const loadContext = useCallback(async () => {
    try {
      const data = await getChatContext();
      setContext(data);
    } catch (error) {
      console.error("컨텍스트 로드 실패:", error);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadSessions();
    loadContext();
  }, [loadSessions, loadContext]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // 새 세션 생성
  const handleNewSession = async () => {
    try {
      const session = await createChatSession();
      setSessions((prev) => [session, ...prev]);
      setCurrentSession(session);
      setMessages([]);
    } catch (error) {
      toast.error("새 대화 생성에 실패했습니다.");
    }
  };

  // 세션 선택
  const handleSelectSession = async (sessionId: string) => {
    try {
      const data = await getChatSession(sessionId);
      if (data) {
        setCurrentSession(data.session);
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error("대화를 불러오는데 실패했습니다.");
    }
  };

  // 세션 삭제
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      toast.success("대화가 삭제되었습니다.");
    } catch (error) {
      toast.error("대화 삭제에 실패했습니다.");
    }
  };

  // 메시지 전송
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    let sessionId = currentSession?.id;

    // 세션이 없으면 새로 생성
    if (!sessionId) {
      try {
        const session = await createChatSession();
        setSessions((prev) => [session, ...prev]);
        setCurrentSession(session);
        sessionId = session.id;

        // 첫 메시지로 제목 생성
        await generateSessionTitle(sessionId, message);
      } catch (error) {
        toast.error("새 대화 생성에 실패했습니다.");
        return;
      }
    }

    // 사용자 메시지 UI에 추가
    const userMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: message,
      context_books: null,
      context_notes: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setStreamingContent("");

    try {
      // SSE로 스트리밍 응답 받기
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error("채팅 요청 실패");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "content") {
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.type === "done") {
                // 스트리밍 완료 - AI 메시지 추가
                const assistantMessage: ChatMessageType = {
                  id: data.messageId || `assistant-${Date.now()}`,
                  session_id: sessionId!,
                  role: "assistant",
                  content: fullContent,
                  context_books: null,
                  context_notes: null,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");

                // 세션 목록 새로고침
                loadSessions();
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseError) {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      toast.error("메시지 전송에 실패했습니다.");
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  // 예시 질문 클릭
  const handleExampleClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="relative flex h-[calc(100dvh-8rem)] overflow-hidden md:h-[calc(100dvh-4rem)]">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`absolute inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          onNewSession={() => {
            handleNewSession();
            // 모바일에서 새 세션 생성 시 사이드바 닫기
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          onSelectSession={(sessionId) => {
            handleSelectSession(sessionId);
            // 모바일에서 세션 선택 시 사이드바 닫기
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          onDeleteSession={handleDeleteSession}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex flex-1 flex-col">
        {/* 모바일 헤더 */}
        <div className="flex items-center gap-2 border-b p-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="truncate text-sm font-medium">
            {currentSession?.title || "독서친구"}
          </span>
        </div>

        {currentSession || messages.length > 0 ? (
          <>
            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userAvatar={userAvatar}
                  userName={userName}
                />
              ))}
              {streamingContent && (
                <StreamingMessage content={streamingContent} isLoading={true} />
              )}
              {/* 스크롤 타겟 - 키보드 높이만큼 여백 추가 */}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* 입력 영역 - 하단 고정 */}
            <div className="sticky bottom-0 left-0 right-0">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </>
        ) : (
          /* 시작 화면 */
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 sm:mb-8 sm:h-16 sm:w-16">
                <Bot className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
              </div>
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">독서친구</h2>
              <p className="mb-6 max-w-md text-center text-sm text-muted-foreground sm:mb-8 sm:text-base">
                {WELCOME_MESSAGE}
              </p>

              {/* 예시 질문 */}
              <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto whitespace-normal px-3 py-2.5 text-left text-sm sm:px-4 sm:py-3"
                    onClick={() => handleExampleClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* 입력 영역 - 하단 고정 */}
            <div className="sticky bottom-0 left-0 right-0">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
