import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FeatureRequestStatusBadge,
  FeatureRequestVoteButton,
  FeatureRequestComments,
} from "@/components/feature-requests";
import {
  getFeatureRequestById,
  getComments,
  deleteFeatureRequest,
} from "@/app/actions/feature-requests";
import { getCurrentUser } from "@/app/actions/auth";
import { ArrowLeft, Pin, Pencil, Trash2, MessageCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const request = await getFeatureRequestById(id);

  if (!request) {
    return {
      title: "기능 요청을 찾을 수 없습니다 | Habitree Reading Hub",
    };
  }

  return {
    title: `${request.title} | 기능 요청 | Habitree Reading Hub`,
    description: request.description.slice(0, 160),
  };
}

export default async function FeatureRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [request, comments, currentUser] = await Promise.all([
    getFeatureRequestById(id),
    getComments(id),
    getCurrentUser(),
  ]);

  if (!request) {
    notFound();
  }

  const userName = request.users?.name || "익명";
  const userInitial = userName.charAt(0).toUpperCase();
  const isOwner = currentUser?.id === request.user_id;

  async function handleDelete() {
    "use server";
    const result = await deleteFeatureRequest(id);
    if (result.success) {
      redirect("/feature-requests");
    }
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/feature-requests" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </Button>

      {/* 메인 카드 */}
      <Card
        className={cn(
          request.is_pinned && "border-primary/50 bg-primary/5"
        )}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* 투표 버튼 */}
            <div className="shrink-0">
              <FeatureRequestVoteButton
                featureRequestId={request.id}
                voteCount={request.vote_count}
                hasVoted={request.hasVoted}
                size="lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {request.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    고정됨
                  </Badge>
                )}
                <FeatureRequestStatusBadge status={request.status} size="md" />
              </div>

              <CardTitle className="text-xl mb-3">{request.title}</CardTitle>

              {/* 작성자 정보 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={request.users?.avatar_url || undefined}
                    alt={userName}
                  />
                  <AvatarFallback className="text-[10px]">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span>{userName}</span>
                <span>•</span>
                <span>
                  {format(new Date(request.created_at), "yyyy.MM.dd HH:mm", {
                    locale: ko,
                  })}
                </span>
                {request.updated_at !== request.created_at && (
                  <>
                    <span>•</span>
                    <span>
                      수정됨{" "}
                      {formatDistanceToNow(new Date(request.updated_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 수정/삭제 버튼 */}
            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/feature-requests/${id}/edit`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    수정
                  </Link>
                </Button>
                <form action={handleDelete}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </form>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 본문 */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* 관리자 응답 */}
          {request.admin_response && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">관리자 응답</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {request.admin_response}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <FeatureRequestComments
        featureRequestId={request.id}
        comments={comments}
      />
    </div>
  );
}
