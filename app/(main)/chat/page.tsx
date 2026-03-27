import type { Metadata } from "next";
import { getCachedCurrentUser, getCachedCurrentUserProfile } from "@/lib/cached";
import { ChatInterface } from "@/components/chat/chat-interface";
import { GuestChatPlaceholder } from "./guest-chat-placeholder";

export const metadata: Metadata = {
  title: "AI 도우미",
  description: "AI 독서 파트너와 대화하며 읽고 있는 책에 대해 이야기하세요",
};

/**
 * AI 독서 도우미 채팅 페이지
 */
export default async function ChatPage() {
  const user = await getCachedCurrentUser();

  // 게스트 사용자: 빈 채팅 UI 표시, 입력 시 로그인 유도
  if (!user) {
    return (
      <div className="-mx-4 sm:-mx-6 min-h-0">
        <GuestChatPlaceholder />
      </div>
    );
  }

  // 캐시된 프로필 조회 (root layout과 공유)
  const profile = await getCachedCurrentUserProfile();

  return (
    <div className="-mx-4 sm:-mx-6 min-h-0">
      <ChatInterface
        userId={user.id}
        userAvatar={profile?.avatar_url}
        userName={profile?.name}
      />
    </div>
  );
}
