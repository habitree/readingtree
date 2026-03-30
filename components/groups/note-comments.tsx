"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  MoreVertical,
  Trash2,
  Pencil,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { addComment, getComments, updateComment, deleteComment } from "@/app/actions/groups";
import { formatSmartDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface NoteCommentsProps {
  groupNoteId: string;
  currentUserId?: string;
}

interface CommentData {
  id: string;
  content: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  users: { id: string; name: string; avatar_url: string | null };
  replies: CommentData[];
}

export function NoteComments({ groupNoteId, currentUserId }: NoteCommentsProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [groupNoteId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await getComments(groupNoteId);
      setComments(data);
    } catch {
      // 조용히 처리
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment(groupNoteId, newComment);
      setNewComment("");
      loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addComment(groupNoteId, replyContent, parentId);
      setReplyTo(null);
      setReplyContent("");
      loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateComment(commentId, editContent);
      setEditingId(null);
      setEditContent("");
      loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      loadComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.saveError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                isEditing={editingId === comment.id}
                editContent={editContent}
                onEditStart={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                onEditChange={setEditContent}
                onEditSubmit={() => handleUpdate(comment.id)}
                onEditCancel={() => { setEditingId(null); setEditContent(""); }}
                onDelete={() => handleDelete(comment.id)}
                onReplyClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent(""); }}
                isSubmitting={isSubmitting}
              />

              {/* 대댓글 */}
              {comment.replies.length > 0 && (
                <div className="ml-8 mt-2 space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      isEditing={editingId === reply.id}
                      editContent={editContent}
                      onEditStart={() => { setEditingId(reply.id); setEditContent(reply.content); }}
                      onEditChange={setEditContent}
                      onEditSubmit={() => handleUpdate(reply.id)}
                      onEditCancel={() => { setEditingId(null); setEditContent(""); }}
                      onDelete={() => handleDelete(reply.id)}
                      isReply
                      isSubmitting={isSubmitting}
                    />
                  ))}
                </div>
              )}

              {/* 답글 입력 */}
              {replyTo === comment.id && (
                <div className="ml-8 mt-2 flex gap-2">
                  <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={t("groups.commentReplyPlaceholder")}
                      className="min-h-[40px] max-h-[80px] text-sm resize-none"
                      maxLength={1000}
                    />
                    <Button
                      size="icon"
                      className="shrink-0 h-10 w-10"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 댓글 입력 */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t("groups.commentPlaceholder")}
          className="min-h-[40px] max-h-[80px] text-sm resize-none"
          maxLength={1000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          className="shrink-0 h-10 w-10"
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// --- 개별 댓글 아이템 ---

function CommentItem({
  comment,
  currentUserId,
  isEditing,
  editContent,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDelete,
  onReplyClick,
  isReply,
  isSubmitting,
}: {
  comment: CommentData;
  currentUserId?: string;
  isEditing: boolean;
  editContent: string;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onReplyClick?: () => void;
  isReply?: boolean;
  isSubmitting?: boolean;
}) {
  const { t } = useTranslation();
  const isOwner = currentUserId === comment.user_id;

  return (
    <div className="flex gap-2">
      <Avatar className={isReply ? "h-5 w-5" : "h-6 w-6"}>
        <AvatarImage src={comment.users?.avatar_url || undefined} />
        <AvatarFallback className="text-[8px]">{comment.users?.name?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{comment.users?.name}</span>
          <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>{formatSmartDate(comment.created_at)}</span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-[10px] text-muted-foreground">({t("groups.commentEdited")})</span>
          )}
          {(isOwner) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5 rounded hover:bg-muted">
                  <MoreVertical className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={onEditStart}>
                  <Pencil className="mr-2 h-3 w-3" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1 flex gap-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              className="min-h-[36px] max-h-[80px] text-sm resize-none"
              maxLength={1000}
            />
            <div className="flex flex-col gap-1">
              <Button size="sm" className="h-7 text-xs" onClick={onEditSubmit} disabled={isSubmitting}>
                {t("common.save")}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onEditCancel}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap mt-0.5">{comment.content}</p>
            {!isReply && onReplyClick && (
              <button
                onClick={onReplyClick}
                className="text-[10px] text-muted-foreground hover:text-foreground mt-1"
              >
                {t("groups.commentReply")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
