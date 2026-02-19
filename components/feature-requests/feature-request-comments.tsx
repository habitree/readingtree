"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/app/actions/feature-requests";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FeatureRequestCommentWithUser } from "@/types/feature-request";

interface FeatureRequestCommentsProps {
  featureRequestId: string;
  comments: FeatureRequestCommentWithUser[];
}

/**
 * 기능 요청 댓글 섹션
 */
export function FeatureRequestComments({
  featureRequestId,
  comments,
}: FeatureRequestCommentsProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.info(t("featureRequests.loginRequiredComment"), {
        action: {
          label: t("featureRequests.loginAction"),
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await createComment(featureRequestId, {
        content: newComment,
      });

      if (result.success) {
        setNewComment("");
        toast.success(t("featureRequests.commentSuccess"));
      } else {
        toast.error(result.error || t("featureRequests.commentFailed"));
      }
    });
  };

  const handleEdit = (comment: FeatureRequestCommentWithUser) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      const result = await updateComment(commentId, editContent);

      if (result.success) {
        setEditingId(null);
        toast.success(t("featureRequests.commentEditSuccess"));
      } else {
        toast.error(result.error || t("featureRequests.commentEditFailed"));
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (!confirm(t("featureRequests.commentDeleteConfirm"))) return;

    startTransition(async () => {
      const result = await deleteComment(commentId);

      if (result.success) {
        toast.success(t("featureRequests.commentDeleteSuccess"));
      } else {
        toast.error(result.error || t("featureRequests.commentDeleteFailed"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          {t("featureRequests.comments")} {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 댓글 작성 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              user
                ? t("featureRequests.commentPlaceholder")
                : t("featureRequests.commentLoginPlaceholder")
            }
            rows={3}
            disabled={!user || isPending}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!user || !newComment.trim() || isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t("featureRequests.commentSubmit")}
            </Button>
          </div>
        </form>

        {/* 댓글 목록 */}
        {comments.length > 0 ? (
          <div className="space-y-4 pt-4 border-t">
            {comments.map((comment) => {
              const userName = comment.users?.name || t("featureRequests.anonymous");
              const userInitial = userName.charAt(0).toUpperCase();
              const isOwner = user?.id === comment.user_id;
              const isAdminComment =
                comment.is_admin_comment || comment.users?.is_admin;

              return (
                <div
                  key={comment.id}
                  className={cn(
                    "flex gap-3",
                    isAdminComment && "bg-primary/5 -mx-4 px-4 py-3 rounded-lg"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={comment.users?.avatar_url || undefined}
                      alt={userName}
                    />
                    <AvatarFallback className="text-xs">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{userName}</span>
                      {isAdminComment && (
                        <Badge variant="secondary" className="text-[10px]">
                          {t("featureRequests.adminBadge")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>

                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(comment)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              {t("featureRequests.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("featureRequests.deleteAction")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            {t("featureRequests.cancel")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("featureRequests.save")
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("featureRequests.noComments")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
