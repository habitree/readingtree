"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Library, PenTool, Search, Share2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStepProps {
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const tutorialSlides = [
  {
    icon: Library,
    title: "책 추가",
    description: "검색으로 책 추가",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: PenTool,
    title: "기록 작성",
    description: "문장, 사진을 기록",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    icon: Search,
    title: "기록 검색",
    description: "저장한 기록을 검색",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    icon: Share2,
    title: "기록 공유",
    description: "카드뉴스로 공유",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

/**
 * 튜토리얼 스텝
 * 서비스 주요 기능을 소개하는 단계
 */
export function TutorialStep({ onComplete, onBack, isLoading }: TutorialStepProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === tutorialSlides.length - 1;
  const slide = tutorialSlides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 0) {
      onBack();
    } else {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">ReadTree 시작하기</h2>
        </div>
      </div>

      {/* 슬라이드 영역 */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {tutorialSlides.map((s, index) => {
            const SlideIcon = s.icon;
            return (
              <div
                key={index}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="flex flex-col items-center text-center py-8 space-y-6">
                  <div className={cn("w-24 h-24 rounded-full flex items-center justify-center", s.bgColor)}>
                    <SlideIcon className={cn("w-12 h-12", s.color)} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{s.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="flex justify-center gap-2">
        {tutorialSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            disabled={isLoading}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentSlide
                ? "w-6 bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={isLoading}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            "완료 중..."
          ) : isLastSlide ? (
            <>
              시작하기
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* 건너뛰기 */}
      {!isLastSlide && (
        <Button
          type="button"
          variant="ghost"
          onClick={onComplete}
          disabled={isLoading}
          className="w-full text-muted-foreground"
        >
          건너뛰기
        </Button>
      )}
    </div>
  );
}
