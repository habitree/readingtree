"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Globe } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";

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
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="line-clamp-1">{group.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {group.description || t("groups.noDescription")}
              </CardDescription>
            </div>
            <Badge
              variant={group.is_public ? "default" : "secondary"}
              className="shrink-0"
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {memberCount !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t("groups.memberCount").replace("{count}", String(memberCount))}</span>
                </div>
              )}
              {group.users && (
                <span>{t("groups.leader")}: {group.users.name}</span>
              )}
            </div>
            <span>{formatSmartDate(group.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

