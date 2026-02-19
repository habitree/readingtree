"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeatureRequestStatusBadge } from "./feature-request-status-badge";
import { FeatureRequestVoteButton } from "./feature-request-vote-button";
import { Pin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { FeatureRequestWithUser } from "@/types/feature-request";
import { useTranslation } from "@/lib/i18n";

interface FeatureRequestCardProps {
  request: FeatureRequestWithUser;
  hasVoted?: boolean;
  commentCount?: number;
  compact?: boolean;
  className?: string;
}

/**
 * 기능 요청 카드
 */
export function FeatureRequestCard({
  request,
  hasVoted = false,
  commentCount = 0,
  compact = false,
  className,
}: FeatureRequestCardProps) {
  const { t } = useTranslation();
  const userName = request.users?.name || t("featureRequests.anonymous");
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200",
        request.is_pinned && "border-primary/50 bg-primary/5",
        className
      )}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex gap-3">
          {/* 투표 버튼 */}
          <div className="flex flex-col items-center shrink-0">
            <FeatureRequestVoteButton
              featureRequestId={request.id}
              voteCount={request.vote_count}
              hasVoted={hasVoted}
              size="sm"
              className="w-12"
            />
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              {request.is_pinned && (
                <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              )}
              <Link
                href={`/feature-requests/${request.id}`}
                className="flex-1 min-w-0"
              >
                <h3
                  className={cn(
                    "font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {request.title}
                </h3>
              </Link>
              <FeatureRequestStatusBadge
                status={request.status}
                size="sm"
                className="shrink-0"
              />
            </div>

            {!compact && (
              <Link
                href={`/feature-requests/${request.id}`}
                className="block"
              >
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {request.description}
                </p>
              </Link>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage
                    src={request.users?.avatar_url || undefined}
                    alt={userName}
                  />
                  <AvatarFallback className="text-[8px]">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span>{userName}</span>
              </div>

              <span>
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>

              {commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{commentCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
