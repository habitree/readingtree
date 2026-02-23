"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HighlightCardDownloadProps {
  shareId: string;
  bookTitle: string;
}

type DownloadingRatio = "square" | "portrait" | null;

async function downloadCard(
  shareId: string,
  ratio: "square" | "portrait",
  bookTitle: string
): Promise<void> {
  const res = await fetch(`/api/share/reports/${shareId}/card?ratio=${ratio}`);
  if (!res.ok) throw new Error("카드 생성에 실패했습니다.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `readtree-${bookTitle.slice(0, 20)}-${ratio}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function HighlightCardDownload({
  shareId,
  bookTitle,
}: HighlightCardDownloadProps) {
  const [downloading, setDownloading] = useState<DownloadingRatio>(null);

  const handleDownload = async (ratio: "square" | "portrait") => {
    if (downloading) return;
    setDownloading(ratio);
    try {
      await downloadCard(shareId, ratio, bookTitle);
    } catch {
      // 에러 무시 (브라우저 기본 에러 처리)
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={downloading !== null}
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          카드 다운로드
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          인스타그램 공유용 이미지 카드
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDownload("square")}
          disabled={downloading !== null}
          className="gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm">1:1 정사각형</span>
            <span className="text-xs text-muted-foreground">1080 × 1080 · 피드용</span>
          </div>
          {downloading === "square" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDownload("portrait")}
          disabled={downloading !== null}
          className="gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm">4:5 세로형</span>
            <span className="text-xs text-muted-foreground">1080 × 1350 · 포트레이트</span>
          </div>
          {downloading === "portrait" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin ml-auto" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
