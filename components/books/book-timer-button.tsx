"use client";

import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { useMusicPlayer } from "@/hooks/use-music-player";

interface BookTimerButtonProps {
  userBookId: string;
  bookId: string;
  title: string;
  coverUrl: string | null;
  className?: string;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "ghost";
}

export function BookTimerButton({
  userBookId,
  bookId,
  title,
  coverUrl,
  className,
  size = "sm",
  variant = "outline",
}: BookTimerButtonProps) {
  const { setActiveBook, openTimerSheet, timerStatus } = useMusicPlayer();

  const handleClick = () => {
    setActiveBook({ userBookId, bookId, title, coverUrl });
    openTimerSheet();
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Timer className="mr-2 h-4 w-4" />
      {timerStatus === "running" ? "타이머 진행 중" : "독서 타이머"}
    </Button>
  );
}
