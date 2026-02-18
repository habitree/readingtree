import type { Metadata } from "next";
import { getCurrentUser } from "@/app/actions/auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GuestChatPlaceholder } from "./guest-chat-placeholder";

export const metadata: Metadata = {
  title: "AI 도우미",
  description: "AI 독서 파트너와 대화하며 읽고 있는 책에 대해 이야기하세요",
};

/**
 * AI 독서 도우미 채팅 페이지
 */
export default async function ChatPage() {
  const user = await getCurrentUser();

  // 게스트 사용자: 빈 채팅 UI 표시, 입력 시 로그인 유도
  if (!user) {
    return (
      <div className="-m-4 sm:-m-6">
        <GuestChatPlaceholder />
      </div>
    );
  }

  // 사용자 프로필 조회
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="-m-4 sm:-m-6">
      <ChatInterface
        userId={user.id}
        userAvatar={profile?.avatar_url}
        userName={profile?.name}
      />
    </div>
  );
}
