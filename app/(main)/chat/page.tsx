import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Bot } from "lucide-react";
import Link from "next/link";

/**
 * AI 독서 도우미 채팅 페이지
 */
export default async function ChatPage() {
  const user = await getCurrentUser();

  // 게스트 사용자는 로그인 유도
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">AI 독서 도우미</h1>
          <p className="max-w-md text-muted-foreground">
            나의 독서 성향을 이해하는 AI와 대화하며
            책 추천, 독서 조언을 받아보세요.
          </p>
        </div>
        <Card className="w-full max-w-md border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                AI 독서 도우미를 이용하려면 로그인이 필요합니다.
              </p>
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인하고 시작하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
