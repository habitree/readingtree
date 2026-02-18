"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

interface LoginPromptOptions {
  title?: string;
  description?: string;
}

interface UseLoginPromptReturn {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 열림/닫힘 제어 */
  setIsOpen: (open: boolean) => void;
  /** 모달에 표시할 제목 */
  title: string;
  /** 모달에 표시할 설명 */
  description: string;
  /**
   * 로그인 필요 기능 호출 시 사용
   * 게스트면 모달을 열고 true 반환, 로그인 상태면 false 반환
   */
  requireLogin: (options?: LoginPromptOptions) => boolean;
}

/**
 * 로그인 유도 모달을 제어하는 훅
 *
 * @example
 * ```tsx
 * const { isOpen, setIsOpen, title, description, requireLogin } = useLoginPrompt();
 *
 * const handleAction = () => {
 *   if (requireLogin({ title: "기록을 작성하려면", description: "로그인 후 독서 기록을 작성할 수 있어요." })) return;
 *   // 로그인된 사용자만 도달
 *   doSomething();
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleAction}>기록 작성</Button>
 *     <LoginPromptModal open={isOpen} onOpenChange={setIsOpen} title={title} description={description} />
 *   </>
 * );
 * ```
 */
export function useLoginPrompt(): UseLoginPromptReturn {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("로그인이 필요해요");
  const [description, setDescription] = useState(
    "이 기능을 사용하려면 로그인해주세요."
  );

  const requireLogin = useCallback(
    (options?: LoginPromptOptions): boolean => {
      if (user) return false;

      if (options?.title) setTitle(options.title);
      if (options?.description) setDescription(options.description);
      setIsOpen(true);
      return true;
    },
    [user]
  );

  return { isOpen, setIsOpen, title, description, requireLogin };
}
