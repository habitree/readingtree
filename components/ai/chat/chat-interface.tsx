"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChatMessage, StreamingMessage } from "./chat-message";
import type { BookMetadata } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { TypingIndicator } from "./typing-indicator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Bot, Menu, X, MoreVertical, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  createChatSession,
  getChatSessions,
  getChatSession,
  deleteChatSession,
  deleteAllChatSessions,
  deleteChatMessage,
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // context에서 책 메타데이터 맵 생성 (표지 이미지 표시용)
  const bookMetadataMap = useMemo(() => {
    const map = new Map<string, BookMetadata>();
    if (context.recentBooks) {
      context.recentBooks.forEach((book) => {
        map.set(book.id, {
          id: book.id,
          title: book.title,
          cover_image_url: book.cover_image_url || null,
        });
      });
    }
    if (context.recentNotes) {
      context.recentNotes.forEach((note) => {
        if (note.book_id && !map.has(note.book_id)) {
          map.set(note.book_id, {
            id: note.book_id,
            title: note.book_title,
            cover_image_url: note.book_cover_image_url || null,
          });
        }
      });
    }
    return map;
  }, [context]);

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

  // 모든 세션 삭제
  const handleDeleteAllSessions = async () => {
    try {
      const result = await deleteAllChatSessions();
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
      toast.success(`${result.deletedCount}개의 대화가 삭제되었습니다.`);
    } catch (error) {
      toast.error("대화 삭제에 실패했습니다.");
    }
  };

  // 개별 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("메시지가 삭제되었습니다.");
    } catch (error) {
      toast.error("메시지 삭제에 실패했습니다.");
    }
  };

  // 메시지 전송
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // 에러 상태 초기화
    setLastFailedMessage(null);

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
        setLastFailedMessage(message);
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
    setIsTyping(true);
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
                // 첫 콘텐츠 수신 시 타이핑 인디케이터 숨김
                if (!fullContent) {
                  setIsTyping(false);
                }
                fullContent += data.content;
                setStreamingContent(fullContent);
              } else if (data.type === "done") {
                // 스트리밍 완료 - AI 메시지 추가
                // processedContent가 있으면 사용 (추천 책 링크 치환된 버전)
                const assistantMessage: ChatMessageType = {
                  id: data.messageId || `assistant-${Date.now()}`,
                  session_id: sessionId!,
                  role: "assistant",
                  content: data.processedContent || fullContent,
                  context_books: null,
                  context_notes: null,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
                setIsTyping(false);

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
      toast.error("메시지 전송에 실패했습니다. 재시도해 주세요.");
      setStreamingContent("");
      setIsTyping(false);
      setLastFailedMessage(message);
      // 실패한 사용자 메시지 제거
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
    } finally {
      setIsLoading(false);
    }
  };

  // 재시도 핸들러
  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
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
          onDeleteAllSessions={handleDeleteAllSessions}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* 모바일 헤더 - 상단 고정 */}
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 backdrop-blur-sm p-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-medium">
              {currentSession?.title || "독서친구"}
            </span>
          </div>
          {/* 새 대화 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={handleNewSession}
          >
            <Plus className="h-5 w-5" />
          </Button>
          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentSession && (
                <>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    현재 대화 삭제
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {sessions.length > 0 && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteAllDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  모든 대화 삭제 ({sessions.length}개)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {currentSession || messages.length > 0 ? (
          <>
            {/* 메시지 목록 - 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
              <div className="min-h-full">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    userAvatar={userAvatar}
                    userName={userName}
                    onDelete={handleDeleteMessage}
                    bookMetadataMap={bookMetadataMap}
                  />
                ))}
                {/* 타이핑 인디케이터 - 응답 시작 전 표시 */}
                {isTyping && !streamingContent && (
                  <TypingIndicator />
                )}
                {streamingContent && (
                  <StreamingMessage content={streamingContent} isLoading={true} bookMetadataMap={bookMetadataMap} />
                )}
                {/* 에러 재시도 버튼 */}
                {lastFailedMessage && !isLoading && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      다시 시도
                    </Button>
                  </div>
                )}
                {/* 스크롤 타겟 - 입력창 높이만큼 여백 */}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* 입력 영역 - 하단 고정 */}
            <div className="shrink-0 border-t bg-background">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </>
        ) : (
          /* 시작 화면 */
          <div className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 sm:mb-8 sm:h-16 sm:w-16">
                  <Bot className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
                </div>
                <h2 className="mb-2 text-xl font-bold sm:text-2xl">독서친구</h2>
                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground sm:mb-8 sm:text-base">
                  {WELCOME_MESSAGE}
                </p>

                {/* 예시 질문 */}
                <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2 px-2">
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
            </div>

            {/* 입력 영역 - 하단 고정 */}
            <div className="shrink-0 border-t bg-background">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* 현재 대화 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              현재 대화를 삭제하시겠습니까? 삭제된 대화는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (currentSession) {
                  handleDeleteSession(currentSession.id);
                }
                setShowDeleteDialog(false);
              }}
              variant="destructive"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모든 대화 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모든 대화 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 모든 대화 기록({sessions.length}개)을 삭제하시겠습니까?
              <br />
              삭제된 대화는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteAllSessions();
                setShowDeleteAllDialog(false);
              }}
              variant="destructive"
            >
              모두 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
