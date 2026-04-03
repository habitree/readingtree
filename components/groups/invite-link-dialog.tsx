"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, Loader2, Trash2 } from "lucide-react";
import { createInviteToken, revokeInviteToken, getInviteTokens } from "@/app/actions/groups";
import { toast } from "sonner";

interface InviteLinkDialogProps {
  groupId: string;
}

interface InviteToken {
  id: string;
  token: string;
  use_count: number;
  max_uses: number | null;
  expires_at: string;
  created_at: string;
}

export function InviteLinkDialog({ groupId }: InviteLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const data = await getInviteTokens(groupId);
      setTokens(data as InviteToken[]);
    } catch {
      toast.error("초대 링크 목록을 불러올 수 없습니다.");
    }
    setIsLoading(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadTokens();
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createInviteToken(groupId);
      toast.success("초대 링크가 생성되었습니다.");
      await loadTokens();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "생성 실패");
    }
    setIsCreating(false);
  };

  const handleCopy = async (token: string, tokenId: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}/groups/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(tokenId);
    toast.success("초대 링크가 복사되었습니다.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (tokenId: string) => {
    try {
      await revokeInviteToken(tokenId);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      toast.success("초대 링크가 비활성화되었습니다.");
    } catch {
      toast.error("비활성화에 실패했습니다.");
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "만료됨";
    if (days === 1) return "1일 남음";
    return `${days}일 남음`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link2 className="h-4 w-4" />
          초대 링크 관리
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>초대 링크 관리</DialogTitle>
          <DialogDescription>
            토큰 기반 초대 링크를 생성하여 멤버를 초대하세요.
            초대 링크로 가입하면 자동 승인됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            size="sm"
            className="w-full"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            새 초대 링크 생성 (7일 유효)
          </Button>

          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              활성 초대 링크가 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                >
                  <Input
                    readOnly
                    value={`/groups/invite/${token.token.slice(0, 8)}...`}
                    className="h-8 text-xs flex-1"
                  />
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {token.use_count}회 사용 | {formatExpiry(token.expires_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleCopy(token.token, token.id)}
                  >
                    {copiedId === token.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(token.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
