"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText } from "lucide-react";

interface OcrTextViewerProps {
  /** 보정된 텍스트 (기본 표시) */
  correctedText: string;
  /** 원본 OCR 텍스트 (보정 전) */
  rawText?: string | null;
}

/**
 * OCR 텍스트 뷰어 컴포넌트
 * - 기본: AI 보정된 텍스트 표시
 * - 토글: 추출원문(원본) 보기 가능
 */
export function OcrTextViewer({ correctedText, rawText }: OcrTextViewerProps) {
  const [showRaw, setShowRaw] = useState(false);

  // 원본과 보정본이 같으면 토글 버튼 숨김
  const hasRawText = rawText && rawText !== correctedText;
  const displayText = showRaw && rawText ? rawText : correctedText;

  return (
    <Card className="border border-primary/10 bg-gradient-to-br from-primary/5 via-slate-50 to-slate-100/30 dark:from-primary/10 dark:via-slate-900/50 dark:to-slate-800/30 overflow-hidden relative">
      {/* 장식 요소 */}
      <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl -z-10" />

      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI 텍스트 분석
          </CardTitle>

          {/* 토글 버튼 - 원본이 있을 때만 표시 */}
          {hasRawText && (
            <Button
              variant={showRaw ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {showRaw ? "AI 보정" : "추출원문"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 sm:px-6">
        <div className="space-y-2.5">
          <h4 className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {showRaw ? "추출된 원문" : "AI 보정 텍스트"}
          </h4>
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {displayText}
            </p>
          </div>

          {/* 안내 문구 */}
          {hasRawText && (
            <p className="text-xs text-muted-foreground text-right">
              {showRaw
                ? "OCR로 추출된 원본 텍스트입니다"
                : "AI가 맞춤법과 띄어쓰기를 보정한 텍스트입니다"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
