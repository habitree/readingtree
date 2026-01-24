"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText } from "lucide-react";
import Link from "next/link";

interface ConsentStepProps {
  onNext: (data: { termsAgreed: boolean; privacyAgreed: boolean }) => void;
  isLoading?: boolean;
}

/**
 * 약관 동의 스텝
 * 이용약관과 개인정보처리방침 동의를 받는 단계
 */
export function ConsentStep({ onNext, isLoading }: ConsentStepProps) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const handleAllAgree = () => {
    const newValue = !(termsAgreed && privacyAgreed);
    setTermsAgreed(newValue);
    setPrivacyAgreed(newValue);
  };

  const handleSubmit = () => {
    if (termsAgreed && privacyAgreed) {
      onNext({ termsAgreed, privacyAgreed });
    }
  };

  return (
    <div className="space-y-6">
      {/* 아이콘 및 설명 */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">서비스 이용 동의</h2>
          <p className="text-sm text-muted-foreground mt-1">
            안전한 서비스 이용을 위해 약관에 동의해주세요
          </p>
        </div>
      </div>

      {/* 약관 동의 영역 */}
      <div className="space-y-4">
        {/* 전체 동의 */}
        <div
          className="p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleAllAgree}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={termsAgreed && privacyAgreed}
              onCheckedChange={handleAllAgree}
              disabled={isLoading}
              className="h-5 w-5"
            />
            <span className="font-medium">전체 동의하기</span>
          </div>
        </div>

        <div className="border rounded-lg divide-y">
          {/* 이용약관 */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">이용약관</span>
                    <span className="text-xs text-destructive">(필수)</span>
                  </div>
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    보기
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  서비스 이용 조건 및 회원 권리/의무에 관한 내용
                </p>
              </div>
            </div>
          </div>

          {/* 개인정보처리방침 */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={privacyAgreed}
                onCheckedChange={(checked) => setPrivacyAgreed(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">개인정보처리방침</span>
                    <span className="text-xs text-destructive">(필수)</span>
                  </div>
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    보기
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  개인정보 수집/이용 및 보호에 관한 내용
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={!termsAgreed || !privacyAgreed || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? "처리 중..." : "동의하고 계속하기"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        약관에 동의하지 않으시면 서비스를 이용하실 수 없습니다.
      </p>
    </div>
  );
}
