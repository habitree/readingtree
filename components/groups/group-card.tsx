"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe, Crown } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    users?: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
    group_members?: Array<{
      user_id: string;
    }>;
  };
  memberCount?: number;
}

/**
 * 모임 카드 컴포넌트
 * 모임 목록에서 사용
 */
export function GroupCard({ group, memberCount }: GroupCardProps) {
  const { t } = useTranslation();

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full hover:border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <CardTitle className="line-clamp-1 text-base sm:text-lg">{group.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                {group.description || t("groups.noDescription")}
              </CardDescription>
            </div>
            <Badge
              variant={group.is_public ? "default" : "secondary"}
              className="shrink-0 text-xs"
            >
              {group.is_public ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  {t("groups.public")}
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  {t("groups.private")}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>
    </Link>
  );
}

