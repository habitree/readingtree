"use client";

import { useTranslation } from "@/lib/i18n";

/**
 * 푸터 컴포넌트
 */
export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>{t("footer.copyright").replace("{year}", String(currentYear))}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground transition-colors">
                {t("footer.termsOfService")}
              </a>
              <a href="/privacy" className="hover:text-foreground transition-colors">
                {t("footer.privacyPolicy")}
              </a>
              <a href="/refund" className="hover:text-foreground transition-colors">
                환불정책
              </a>
              <a href="mailto:cdhrich@naver.com" className="hover:text-foreground transition-colors">
                {t("footer.contact")}
              </a>
              <a
                href="https://open.kakao.com/o/gGXr3Zji"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                readtree 커뮤니티
              </a>
            </div>
          </div>
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p>상호명: 해빗트리(habitree) | 대표: 최동혁</p>
            <p>사업자등록번호: 171-56-00503 | 통신판매업신고번호: 준비중</p>
            <p>연락처: 010-9988-4810 | 이메일: cdhrich@naver.com</p>
            <p>주소: 서울특별시 광진구 동일로20길 44</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
