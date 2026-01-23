"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, PenTool, Search, Share2, ArrowRight, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

/**
 * 튜토리얼 데이터
 */
const tutorialSteps = [
  {
    icon: Library,
    title: "책 추가하기",
    description: "네이버 검색 API로 책을 검색하고 내 서재에 추가할 수 있습니다.",
  },
  {
    icon: PenTool,
    title: "기록 작성하기",
    description: "인상 깊은 문장을 필사하거나, 사진을 찍어 기록으로 저장할 수 있습니다.",
  },
  {
    icon: Search,
    title: "기록 검색하기",
    description: "저장한 모든 문장을 검색하여 언제든 다시 찾아볼 수 있습니다.",
  },
  {
    icon: Share2,
    title: "기록 공유하기",
    description: "인상 깊은 문장을 카드뉴스로 만들어 SNS에 공유할 수 있습니다.",
  },
];

/**
 * 온보딩 튜토리얼 페이지
 * US-004: 온보딩 튜토리얼
 */
export default function TutorialPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = () => {
    // 로컬 스토리지에 튜토리얼 완료 여부 저장
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_tutorial_completed", "true");
    }
    router.push("/");
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            ReadTree 사용법
          </CardTitle>
          <CardDescription className="text-center">
            주요 기능을 간단히 소개합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={50}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
            className="pb-12"
          >
            {tutorialSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <SwiperSlide key={index}>
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <div className="rounded-full bg-primary/10 p-6">
                      <Icon className="h-16 w-16 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      <p className="text-muted-foreground max-w-md">{step.description}</p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          <div className="flex justify-center gap-4 mt-6">
            {currentIndex === tutorialSteps.length - 1 ? (
              <Button onClick={handleComplete} size="lg" className="w-full max-w-xs">
                시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSkip} className="w-full max-w-xs">
                건너뛰기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

