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
import {
  Bot, Menu, X, MoreVertical, Trash2, Plus, RefreshCw,
  MessageCircle, MessagesSquare, BookMarked, Target, BrainCircuit,
} from "lucide-react";
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
import {
  ONBOARDING_WELCOME,
  ONBOARDING_QUESTIONS,
  generateQuickActions,
  getFeatureLevel,
  getAvailableModes,
} from "@/lib/ai/prompts/chat-prompts";
import { CHAT_MODE_INFO } from "@/types/ai/chat";
import type { ChatSession, ChatMessage as ChatMessageType, ChatContext, ChatMode } from "@/types/ai";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";

interface ChatInterfaceProps {
  userId: string;
  userAvatar?: string | null;
  userName?: string;
}

export function ChatInterface({ userId, userAvatar, userName }: ChatInterfaceProps) {
  const { t } = useTranslation();
  const { showUpgradeModal } = useUpgradeModal();
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
  const [chatMode, setChatMode] = useState<ChatMode>("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 점진적 기능 공개 수준
  const featureLevel = useMemo(() => getFeatureLevel(sessions.length), [sessions.length]);
  const availableModes = useMemo(() => getAvailableModes(featureLevel), [featureLevel]);
  const isFirstUser = sessions.length === 0 && messages.length === 0 && !currentSession;

  // 동적 퀵 액션
  const quickActions = useMemo(
    () => isFirstUser
      ? ONBOARDING_QUESTIONS
      : generateQuickActions(context, chatMode, sessions.length),
    [context, chatMode, sessions.length, isFirstUser]
  );

  // 모드 아이콘 맵
  const modeIcons: Record<string, React.ReactNode> = {
    MessageCircle: <MessageCircle className="h-3.5 w-3.5" />,
    MessagesSquare: <MessagesSquare className="h-3.5 w-3.5" />,
    BookMarked: <BookMarked className="h-3.5 w-3.5" />,
    Target: <Target className="h-3.5 w-3.5" />,
    BrainCircuit: <BrainCircuit className="h-3.5 w-3.5" />,
  };

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
      toast.error(t("chat.newSessionFailed"));
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
      toast.error(t("chat.loadSessionFailed"));
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
      toast.success(t("chat.chatDeleted"));
    } catch (error) {
      toast.error(t("chat.chatDeleteFailed"));
    }
  };

  // 모든 세션 삭제
  const handleDeleteAllSessions = async () => {
    try {
      const result = await deleteAllChatSessions();
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
      toast.success(t("chat.chatsDeletedCount").replace("{count}", String(result.deletedCount)));
    } catch (error) {
      toast.error(t("chat.chatDeleteFailed"));
    }
  };

  // 개별 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success(t("chat.messageDeleted"));
    } catch (error) {
      toast.error(t("chat.messageDeleteFailed"));
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
        toast.error(t("chat.newSessionFailed"));
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
      feedback: null,
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
          mode: chatMode,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            const errorMsg = errorData.error || "접근이 제한되었습니다.";
            if (isUpgradeLimitError(errorMsg)) {
              showUpgradeModal({ feature: "AI 채팅", message: errorMsg });
              setIsLoading(false);
              setIsTyping(false);
              setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
              return;
            }
          } catch {
            // JSON 파싱 실패 시 기본 에러로 폴백
          }
        }
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
                  feedback: null,
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
      toast.error(t("chat.sendFailed"));
      setStreamingContent("");
      setIsTyping(false);
      setLastFailedMessage(message);
      // 실패한 사용자 메시지 제거
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
    } finally {
      setIsLoading(false);
    }
  };

  // 피드백 핸들러
  const handleFeedback = async (messageId: string, feedback: "positive" | "negative" | null) => {
    try {
      const { updateMessageFeedback } = await import("@/app/actions/ai/chat");
      await updateMessageFeedback(messageId, feedback);
    } catch {
      // 피드백 저장 실패는 무시 (UX 방해하지 않음)
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
              {currentSession?.title || t("chat.readingFriend")}
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
                    {t("chat.deleteCurrentChat")}
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
                  {t("chat.deleteAllChatsCount").replace("{count}", String(sessions.length))}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {currentSession || messages.length > 0 ? (
          <>
            {/* 모드 선택 칩 (대화 중) */}
            {availableModes.length > 1 && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur-sm overflow-x-auto">
                {availableModes.map((mode) => {
                  const info = CHAT_MODE_INFO[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => setChatMode(mode)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                        chatMode === mode
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {modeIcons[info.icon]}
                      {info.label}
                    </button>
                  );
                })}
              </div>
            )}

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
                    onFeedback={handleFeedback}
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
                      {t("common.retry")}
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
                <h2 className="mb-2 text-xl font-bold sm:text-2xl">{t("chat.readingFriend")}</h2>
                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground sm:mb-8 sm:text-base whitespace-pre-line">
                  {isFirstUser ? ONBOARDING_WELCOME : `책 이야기를 나누고, 맞춤 추천을 받고, 독서 목표를 관리해보세요.`}
                </p>

                {/* 모드 선택 칩 (첫 사용자가 아닌 경우) */}
                {!isFirstUser && availableModes.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {availableModes.map((mode) => {
                      const info = CHAT_MODE_INFO[mode];
                      return (
                        <button
                          key={mode}
                          onClick={() => setChatMode(mode)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            chatMode === mode
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {modeIcons[info.icon]}
                          {info.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 동적 퀵 액션 */}
                <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2 px-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto whitespace-normal px-3 py-2.5 text-left text-sm sm:px-4 sm:py-3"
                      onClick={() => handleExampleClick(action.message)}
                    >
                      {action.label}
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
            <AlertDialogTitle>{t("chat.deleteChat")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteCurrentChatConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (currentSession) {
                  handleDeleteSession(currentSession.id);
                }
                setShowDeleteDialog(false);
              }}
              variant="destructive"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모든 대화 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteAllChats")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteAllChatsConfirmLong").replace("{count}", String(sessions.length))}
              <br />
              {t("chat.cannotRecover")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteAllSessions();
                setShowDeleteAllDialog(false);
              }}
              variant="destructive"
            >
              {t("chat.deleteAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
