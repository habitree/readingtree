"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2 } from "lucide-react";
import { toggleVote } from "@/app/actions/feature-requests";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FeatureRequestVoteButtonProps {
  featureRequestId: string;
  voteCount: number;
  hasVoted?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

/**
 * 기능 요청 투표 버튼 (Optimistic UI)
 */
export function FeatureRequestVoteButton({
  featureRequestId,
  voteCount: initialVoteCount,
  hasVoted: initialHasVoted = false,
  size = "md",
  showCount = true,
  className,
}: FeatureRequestVoteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(initialVoteCount);
  const [optimisticHasVoted, setOptimisticHasVoted] = useState(initialHasVoted);

  const handleClick = () => {
    if (!user) {
      toast.info("로그인이 필요합니다", {
        description: "투표하려면 로그인해주세요.",
        action: {
          label: "로그인",
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    // Optimistic update
    const newHasVoted = !optimisticHasVoted;
    const newVoteCount = newHasVoted
      ? optimisticVoteCount + 1
      : optimisticVoteCount - 1;

    setOptimisticHasVoted(newHasVoted);
    setOptimisticVoteCount(newVoteCount);

    startTransition(async () => {
      const result = await toggleVote(featureRequestId);

      if (!result.success) {
        // Rollback on error
        setOptimisticHasVoted(!newHasVoted);
        setOptimisticVoteCount(
          !newHasVoted ? newVoteCount + 1 : newVoteCount - 1
        );
        toast.error(result.error || "투표에 실패했습니다");
      }
    });
  };

  return (
    <Button
      variant={optimisticHasVoted ? "default" : "outline"}
      size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "gap-1.5 transition-all",
        optimisticHasVoted && "bg-primary hover:bg-primary/90",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ThumbsUp
          className={cn(
            "h-4 w-4",
            optimisticHasVoted && "fill-current"
          )}
        />
      )}
      {showCount && (
        <span className="tabular-nums">{optimisticVoteCount}</span>
      )}
    </Button>
  );
}
