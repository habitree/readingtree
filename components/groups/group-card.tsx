"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe, ShieldCheck, Clock, XCircle } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JoinType } from "@/types/group";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    is_public?: boolean;
    join_type?: JoinType;
    created_at: string;
    users?: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
    group_members?: Array<{
      user_id: string;
      status?: string;
    }>;
  };
  memberCount?: number;
}

function getJoinTypeBadge(
  joinType: JoinType | undefined,
  isPublic: boolean | undefined,
  t: ReturnType<typeof useTranslation>["t"]
) {
  // join_type 우선, 없으면 is_public에서 추론
  const effectiveType = joinType ?? (isPublic ? "open" : "approval");

  switch (effectiveType) {
    case "open":
      return (
        <Badge className="shrink-0 text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0">
          <Globe className="mr-1 h-3 w-3" />
          {t("groups.joinTypeOpen")}
        </Badge>
      );
    case "approval":
      return (
        <Badge className="shrink-0 text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0">
          <ShieldCheck className="mr-1 h-3 w-3" />
          {t("groups.joinTypeApproval")}
        </Badge>
      );
    case "private":
      return (
        <Badge className="shrink-0 text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
          <Lock className="mr-1 h-3 w-3" />
          {t("groups.joinTypePrivate")}
        </Badge>
      );
  }
}

/**
 * 모임 카드 컴포넌트
 * 모임 목록에서 사용
 */
export function GroupCard({ group, memberCount }: GroupCardProps) {
  const { t } = useTranslation();

  // 현재 사용자의 멤버십 상태 (group_members에서 자신의 상태)
  const myStatus = group.group_members?.[0]?.status;

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer h-full hover:border-primary/20 ${
        myStatus === "rejected" ? "border-destructive/30 opacity-75" : ""
      } ${myStatus === "pending" ? "border-amber-300/50" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <CardTitle className="line-clamp-1 text-base sm:text-lg">{group.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                {group.description || t("groups.noDescription")}
              </CardDescription>
            </div>
            {getJoinTypeBadge(group.join_type, group.is_public, t)}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{t("groups.memberCount").replace("{count}", String(memberCount ?? group.group_members?.length ?? 0))}</span>
              </div>
              {group.users && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={group.users.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{group.users.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[80px]">{group.users.name}</span>
                </div>
              )}
            </div>
            <span className="shrink-0">{formatSmartDate(group.created_at)}</span>
          </div>
          {myStatus === "pending" && (
            <Badge className="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
              <Clock className="mr-1 h-3 w-3" />
              {t("groups.pendingApprovalTitle")}
            </Badge>
          )}
          {myStatus === "rejected" && (
            <Badge className="text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-0">
              <XCircle className="mr-1 h-3 w-3" />
              {t("groups.rejectedTitle")}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
