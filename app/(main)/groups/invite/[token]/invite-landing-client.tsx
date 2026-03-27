"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Loader2 } from "lucide-react";
import { joinByToken } from "@/app/actions/groups";
import { toast } from "sonner";

interface InviteLandingClientProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    is_public?: boolean;
    join_type?: string;
    max_members: number | null;
  };
  memberCount: number;
  token: string;
  isLoggedIn: boolean;
}

export function InviteLandingClient({
  group,
  memberCount,
  token,
  isLoggedIn,
}: InviteLandingClientProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/groups/invite/${token}`);
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinByToken(token);
      if (result.alreadyMember) {
        toast.info("이미 가입된 모임입니다.");
      } else {
        toast.success("모임에 가입했습니다!");
      }
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "가입에 실패했습니다.");
      setIsJoining(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full p-6 sm:p-8 text-center space-y-6">
        {/* 아이콘 */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-forest-600 dark:text-forest-400" />
        </div>

        {/* 모임 정보 */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {group.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-1 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>{memberCount}명 참여 중</span>
          </div>
        </div>

        {/* 가입 버튼 */}
        <Button
          onClick={handleJoin}
          disabled={isJoining}
          size="lg"
          className="w-full rounded-full h-12 text-sm font-bold"
        >
          {isJoining ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isLoggedIn ? "모임 참여하기" : "로그인하고 참여하기"}
        </Button>

        <p className="text-xs text-slate-400">
          ReadTree 독서모임에 초대되었습니다
        </p>
      </Card>
    </div>
  );
}
