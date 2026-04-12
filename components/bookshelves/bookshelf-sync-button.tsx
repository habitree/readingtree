"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2, Check } from "lucide-react";
import { syncMyGroupBookshelf } from "@/app/actions/groups";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BookshelfSyncButtonProps {
  groupId: string;
}

export function BookshelfSyncButton({ groupId }: BookshelfSyncButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await syncMyGroupBookshelf(groupId);
      if (result.added > 0) {
        toast.success(`${result.added}권이 동기화되었습니다.`);
      } else {
        toast.info("모든 지정도서가 이미 동기화되어 있습니다.");
      }
      setIsDone(true);
      router.refresh();
      setTimeout(() => setIsDone(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "동기화 실패");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="h-8 text-xs gap-1.5"
    >
      {isSyncing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isDone ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <RefreshCcw className="h-3.5 w-3.5" />
      )}
      동기화
    </Button>
  );
}
